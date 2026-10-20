# Contrato OpenAPI de AcademiX

El punto de entrada es [`openapi.yaml`](openapi.yaml). El contrato usa OpenAPI
3.1, JSON con propiedades `camelCase`, paths separados por dominio y componentes
reutilizables bajo `components/`.

## Seguridad y contexto institucional

La API usa una identidad global mediante JWT Bearer. El claim `sub` identifica
al User y los permisos se obtienen desde memberships persistidas.

Los endpoints académicos declaran la Institution en el path:

```txt
/api/v1/institutions/{institutionSlug}/...
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
pnpm docs:api
pnpm docs:api:lint
```

Redocly usa `openapi.yaml` y sus referencias relativas. La configuración vive
en `redocly.yaml`.

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

RLS, provisioning dinámico de Institutions, jerarquías institucionales y
restore lógico individual están fuera del MVP.

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
ejecutados de escenarios pendientes; rutas de contenido/quizzes/notas siguen futuras.
