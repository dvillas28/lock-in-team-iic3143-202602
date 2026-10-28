# Contrato OpenAPI de AcademiX

El punto de entrada es [`openapi.yaml`](openapi.yaml). El contrato usa OpenAPI
3.1, JSON con propiedades `camelCase`, paths separados por dominio y componentes
reutilizables bajo `components/`.

## Seguridad y contexto institucional

La API usa una identidad global mediante JWT Bearer. El claim `sub` identifica
al User y los permisos se obtienen desde memberships persistidas.

Los endpoints académicos declaran la Institution en el path:

```txt
/api/v1/institution/{institutionSlug}/...
```

El slug solicita un contexto; no autentica ni autoriza. Antes de ejecutar una
operación, el backend resuelve la Institution, valida una
InstitutionMembership activa y luego aplica Enrollment y los
permisos del recurso.

`GET /health`, `GET /ready` y `POST /api/v1/auth/login` son públicos. `GET /api/v1/institutions` requiere autenticación y
retorna únicamente Institutions accesibles para el User. No existe un endpoint
público de provisioning.

Política de errores:

- `401`: JWT ausente, inválido o expirado;
- `404`: Institution inexistente/no visible o recurso inexistente/fuera del
  scope institucional;
- `403`: Institution y recurso visibles, pero falta el rol requerido.

Los bodies académicos no aceptan `institutionId`; el contexto proviene del path
y se valida server-side.

## Visualización y validación local

```bash
pnpm install
pnpm --dir backend install --frozen-lockfile
pnpm docs:api:lint
pnpm docs:api:build
pnpm docs:api
```

Redocly valida y resuelve el contrato. Swagger UI con estilos oficiales y assets
locales abre en `http://localhost:8080/`, sin backend ni CDN; Try it out deshabilitado.
[Generación, revisión y evidencia](../api-catalog.md).

## Identidad implementada

Login admite JSON exacto email/password, máximo 4 KiB. Email se normaliza con
trim/lowercase; índice único `lower(btrim(email))` impide ambigüedad. Una colisión
aborta la migración completa sin borrar, fusionar ni sobrescribir usuarios.
Argon2 verifica hash persistido o dummy de arranque; desconocido/inactivo/password
incorrecta producen el mismo 401. JWT HS256, issuer academix-api,
audience academix-clients, claims sub/iat/exp y vigencia exacta de 900 segundos.
AUTH_JWT_SECRET obligatorio, base64 canónico de ≥32 bytes, nunca NEXT_PUBLIC.

Cada operación revalida User activo en PostgreSQL; listado y /me unen User,
InstitutionMembership e Institution activos. /me conserva CurrentUser y
sectionMemberships contiene Enrollment vigente del actor e isAdmin/isSuperAdmin
son flags institucionales readOnly; no cambia sesión.
Revocación posterior al COMMIT se observa en la siguiente operación; consultas
ya iniciadas no se cancelan. DB inaccesible devuelve 503 sin fallback.
Login y éxitos protegidos usan Cache-Control:no-store; 401 incluye
WWW-Authenticate:Bearer. Errores Problem no reflejan entradas ni secretos.

Throttler admite cinco logins por IP/60000 ms; sexto bloquea 60000 ms desde el
exceso con Retry-After restante. Memoria por instancia, reinicio restablece cuotas;
proxy/NAT puede compartir cuota entre usuarios. No se confía X-Forwarded-For.
Antes de exposición pública/escalado se requiere validar proxy y coordinación.

Persistencia: PostgreSQL 17, migrador y seed idempotente existentes. Comandos,
variables y pruebas en el [quickstart](../../../specs/20261014-234744_identidad-acceso/quickstart.md)
y [evidencia](../../backend/identity-access-validation.md).
Refresh, SSO, UI y administración general de personas quedan fuera.
Object storage y límites de archivos requieren otra misión.

RLS mínima refuerza aislamiento; runtime sin bypass y API central `https://api.dvillasc.me`.
[Runbook demo](../../backend/demo-tenant-bootstrap.md). Altas generales y restore individual quedan fuera.

## Cursos y privilegios implementados

Admin institucional puede crear cursos; configurar exige además createdBy=actor.
Dueño único inmutable, sin transferencia ni coadministración.
Teacher conserva gestión de participantes de su sección; assistant solo lectura.
Admin dueño ve todas sus secciones y eventos, incluidos los eventos sin sección.
El flag superadmin solo permite listar miembros y conceder/revocar isAdmin.
No concede docencia, cursos ajenos ni promoción de otros superadmins por HTTP.

La migración nueva preserva identidad/pertenencias pobladas con flags false.
Onboarding PM de tenant nuevo y recuperación de superadmin son artefactos operativos
separados: no hay endpoint de provisioning, invitaciones ni altas generales.
Destinatarios deben tener User/membership activos previamente provisionados por PM.
Repetición de operaciones aplicadas no restaura privilegios ni cambia credenciales.
Seed no promueve; para UC/UTFSM existentes usar set-superadmin explícitamente.
[Operación y evidencia](../../backend/courses-roles-validation.md) distingue checks
ejecutados de escenarios pendientes; quizzes e intentos se detallan abajo; notas/publicación HTTP siguen futuras.

## Módulos y material compartido

Teacher activo de cualquier sección gestiona módulos y markdown del curso.
Assistant/student requieren publicación; material exige también padre publicado.
Flags admin/superadmin sin Enrollment no conceden acceso académico.
Orden completo admite [] solo en curso vacío; posiciones positivas int32 únicas.
Escrituras y snapshots se confirman juntos; no-op no añade eventos.
JSON inerte con no-store/nosniff; no hay renderizador, navegación ni descarga.
RF15 y archivos de RF14 quedan P2: upload/content y variantes file se retiran del
contrato activo y cliente generado. Límite HTTP heredado 4096 bytes; máximo
semántico markdown 10000 caracteres, sujeto además al límite HTTP (413).
[Evidencia](../../backend/modules-material-validation.md).

## Autoría de quizzes

Crear/editar draft, GET authoring y publish exigen teacher vigente en el alcance;
admin dueño amplía al curso completo, sin sustituir Enrollment teacher.
Quiz.sectionId se reasigna solo en draft con permiso sobre origen y destino del
mismo curso/tenant; Quiz.id y Section.id no cambian. Publicado no se edita.
Lista/GET seguro nunca exponen isCorrect; authoring es una ruta explícita.
Publish crea GradeItem único con peso 0 y audit en una tx; retry es no-op incluso
tras congelar el curso. Pauta nunca se almacena en auditoría ni logs.
Marcador de Course protege nuevos ítems; publicación de Grade real y consumo HTTP
del guard estudiantil pertenecen a las siguientes misiones, con contrato obligatorio.
Máximo HTTP heredado 4096 bytes (413); JSON inerte, no-store/nosniff, sin UI nueva.
[Evidencia](../../backend/quiz-authoring-validation.md).

## Intentos y calificación

Start/GET/PUT answers/cancel/submit implementados; ventana [opensAt,closesAt),
NULL ilimitado y reloj DB posterior a locks. Cancelación explícita conserva Grade.
Submit confirma corrección NUMERIC y Grade desde último graded en una transacción;
replay solo con clave original devuelve id/status/submittedAt sin recalcular.
GET usa anyOf student/teacher/assistant: student nunca ve nota/corrección;
assistant ve agregados autorizados sin isCorrect/pointsAwarded. Permisos vigentes
revalidados en cada operación/replay. Errores y respuestas no-store/nosniff.
Publicación/listado académico/pesos/libro quedan en notas; carreras aquí usan SQL.
[Evidencia](../../backend/attempts-grading-validation.md).

Libro de notas: studentIds obligatorio en publicación; clave persistida por
institución/actor, replay autorizado y conflicto si cambia selección o curso.
Pesos de hasta dos decimales requieren teacher activo más admin dueño; primera
publicación congela pesos/ítems. Libro mantiene sección histórica y listado de
intentos admite vistas teacher/assistant por fila. Promedio null con peso cero.
[ADR](../../adr/grade-publication-and-weight-freeze.md) y
[validación](../../backend/gradebook-validation.md).
