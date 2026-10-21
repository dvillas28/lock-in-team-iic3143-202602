# Feature Specification: Demo institucional y aislamiento por contexto

**Feature Branch**: `docs/demo-aislamiento-plan`
**Feature Directory**: `specs/20261020-211552_demo-aislamiento-dominios`
**Created**: 2026-10-20
**Status**: Implementación local validada; despliegue y smoke públicos pendientes (T042/T044).
**Input**: Carga demo automática e idempotente en Railway, delegación institucional y aislamiento centralizado sobre PostgreSQL compartida; frontend por subdominio y API central api.dvillasc.me con institución explícita en el path.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disponer de cuentas demo repetibles (Priority: P1)

Como operador, despliego UC y UTFSM con responsables y miembros conocidos para probar las capacidades actuales.

**Why this priority**: Habilita pruebas autenticadas sin preparar cuentas después de cada despliegue.
**Independent Test**: Ejecutar la carga sobre una base vacía y poblada, repetir tras revocar privilegios; sin cursos ni DNS público.

**Acceptance Scenarios**:

1. Base vacía: dos instituciones, un superadmin distinto y cuatro miembros ordinarios por institución; responsable inicial con ambos flags administrativos y restantes sin ellos.
2. Los miembros se identifican como futuro admin, docente, ayudante y estudiante; las etiquetas no conceden roles, cursos ni matrículas.
3. Repetir conserva IDs, contraseñas, estados, permisos revocados e historial; no duplica datos ni restaura privilegios.
4. UC/UTFSM o identidades preexistentes compatibles se validan y reutilizan explícitamente; una colisión ambigua falla sin adoptar cuentas ni promoverlas silenciosamente.
5. Un fallo no deja cambios parciales de la carga; concurrencia no duplica operaciones y errores bloquean el despliegue.

### User Story 2 - Operar en una institución explícita de la API (Priority: P1)

Como participante, consulto la API central indicando la institución en el path sin poder leer o alterar datos de otra institución.

**Why this priority**: Es la frontera de seguridad del backend académico compartido.
**Independent Test**: Usar fixtures propios de dos instituciones y probar lecturas/escrituras alternadas y concurrentes, sin depender de la carga demo.

**Acceptance Scenarios**:

1. `api.dvillasc.me/api/v1/institution/uc/courses` y `api.dvillasc.me/api/v1/institution/utfsm/courses` resuelven instituciones distintas en el mismo backend y base.
2. Conocer el slug o un ID no concede acceso: identidad, institución y pertenencia deben estar activas.
3. Un ID UTFSM enviado bajo el path UC no permite leer, insertar, modificar, relacionar ni borrar datos UTFSM; se conserva la ocultación de recursos ajenos.
4. Una consulta institucional que omite accidentalmente el filtro sigue aislada por una barrera obligatoria en la persistencia.
5. Error, rollback o reutilización de conexión no transmite contexto de UC a UTFSM ni a una operación sin contexto.
6. Un slug inválido, inexistente o inaccesible no habilita acceso; manipular Host, Origin, cabeceras reenviadas, query o body no reemplaza la institución del path.
7. `localhost:3001/api/v1/institution/uc/...` y el path equivalente UTFSM reproducen el aislamiento local sin DNS ni subdominios de backend.
8. Un navegador desde un origen frontend autorizado completa preflight y solicitudes con Bearer; otro origen no recibe habilitación CORS. El origen y su subdominio no seleccionan institución en backend ni conceden permisos.

### User Story 3 - Delegar y comprobar las capacidades académicas (Priority: P2)

Como superadmin, habilito al futuro admin de mi institución y verifico el recorrido académico con cuentas separadas.

**Why this priority**: Acredita que la carga y el routing preservan las reglas actuales.
**Independent Test**: Usar cuentas/fixtures controlados para delegar y revocar admin en cada institución, sin implementar altas de personas.

**Acceptance Scenarios**:

1. Superadmin lista miembros activos y concede/revoca únicamente `isAdmin` dentro de su institución; HTTP no permite cambiar `isSuperAdmin`.
2. Admin crea curso y primera sección, recibiendo el rol docente inicial; dueño o docente autorizado asigna roles a miembros existentes según sus permisos vigentes.
3. Docente publica material y quiz; estudiante rinde; docente publica notas; estudiante ve solo sus notas publicadas. Ayudante conserva su alcance actual.
4. Revocar admin afecta la siguiente operación, conserva roles docentes independientes y no se revierte al redesplegar.
5. Ningún flag administrativo concede acceso a cursos ajenos ni permisos docentes de evaluación implícitos.

### Edge Cases

- Slug ausente, malformado, desconocido o institución inactiva: sin tenant por defecto; subdominio frontend, Host y cabeceras no son fuentes alternativas de contexto.
- Identidad inactiva, token vencido, pertenencia revocada y persona miembro de ambas instituciones: el path fija un único contexto, nunca privilegios; cada pertenencia se verifica independientemente.
- Referencias cruzadas y escrituras con institución manipulada, incluso usando las credenciales reales del proceso HTTP y consultas sin filtro explícito.
- Cuenta demo modificada, colisión de email/slug, secretos ausentes al primer alta y dos despliegues simultáneos.
- Login, instituciones accesibles, migraciones y readiness necesitan accesos delimitados; ninguna excepción habilita consultas académicas globales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Proveer una migración de datos versionada, separada del esquema, automática en el predespliegue Railway después del esquema y habilitada explícitamente por entorno; deshabilitarla no impide usar datos existentes.
- **FR-002**: El manifiesto inicial define exactamente dos instituciones, diez identidades distintas y diez pertenencias: un superadmin y cuatro miembros por institución, IDs estables y contraseñas externas al repositorio.
- **FR-003**: La repetición conserva contraseñas, estados, permisos e historial. Registrar versión/operación y origen técnico, sin secretos; nuevas versiones no promueven silenciosamente cuentas existentes.
- **FR-004**: La carga es atómica y segura ante concurrencia; validar y auditar la adopción explícita del seed UC/UTFSM anterior. Conflictos o fallos impiden desplegar y no dejan altas parciales; repetir no repone privilegios.
- **FR-005**: Resolver una institución por operación desde el parámetro institutionSlug de `/api/v1/institution/{institutionSlug}/...`, validándolo centralmente y comprobando institución/pertenencia activas; API pública `https://api.dvillasc.me`.
- **FR-006**: Conservar el contexto explícito en el path, con prefijo canónico singular `/api/v1/institution/{institutionSlug}/...`, incluido `/me` institucional. El código actual usa `institutions` plural: ajustar contrato y consumidores al singular acordado, sin introducir endpoints académicos sin slug ni aliases nuevos.
- **FR-007**: Conservar identidad global y listado autenticado de instituciones accesibles en `/api/v1/auth/login` y `/api/v1/institutions`; `/health` y `/ready` siguen públicos. Ninguna operación global selecciona una institución por defecto.
- **FR-008**: No derivar tenant de Host, Origin, Referer, JWT, cabeceras reenviadas, query o body. El slug solicitado no concede acceso y se resuelve a UUID interno después de validar formato y pertenencia; los permisos nunca se confían al cliente.
- **FR-009**: Verificar identidad y pertenencia activas antes del acceso; separar contexto de delegación, propiedad y roles. Conservar revalidaciones de permisos necesarias ante revocaciones concurrentes.
- **FR-010**: Centralizar resolución y propagación del contexto, reutilizándolo en la operación; no repetir resolvers por dominio ni eliminar revalidaciones necesarias dentro de escrituras.
- **FR-011**: Limitar obligatoriamente toda lectura/escritura tenant-owned en la persistencia aunque se omita el predicado institucional; sin contexto no hay acceso y escribir otra institución falla. Las credenciales HTTP no pueden eludir la barrera.
- **FR-012**: Aislar contexto entre solicitudes y conexiones reutilizadas, incluyendo errores, rollback y concurrencia. Delimitar excepciones globales/operativas; ninguna es un bypass académico invocable por HTTP.
- **FR-013**: Preservar `institution_id`, relaciones compuestas, unicidades e historial. Revisar índices con consultas reales; índices, clusters y particiones no sustituyen aislamiento ni permisos.
- **FR-014**: Mantener delegación existente de `isAdmin` sobre miembros activos del mismo tenant. Asignación y recuperación de `isSuperAdmin` siguen siendo operativas y auditadas.
- **FR-015**: Conservar permisos de admin dueño, teacher, assistant y student; historial inmutable y publicación explícita de notas. El routing no cambia las reglas académicas.
- **FR-016**: Actualizar OpenAPI, catálogo, tipos/cliente generado y consumidores afectados por el cambio de rutas; no diseñar experiencias frontend.
- **FR-017**: Registrar como deuda conocida el alta general de cuentas y pertenencias institucionales; excluir endpoints de altas, invitaciones y autoservicio de superadmin.
- **FR-018**: Documentar configuración, secretos, carga, verificación postdeploy y recorrido autenticado por institución. Backend local usa `http://localhost:3001` con slug en el path; producción usa API central con DNS/TLS propios y subdominios separados para frontend.
- **FR-019**: Auditar altas demo y cambios de privilegios con origen real y datos sanitizados; no atribuir un actor autenticado ficticio ni alterar notas o eventos existentes.
- **FR-020**: Centralizar CORS con una lista explícita de orígenes frontend por entorno, sin comodín en producción ni reflejar orígenes no autorizados. Admitir preflight sin JWT para métodos/cabeceras del contrato, incluido Authorization; mantener autenticación y autorización en la solicitud real. Orígenes no autorizados no reciben habilitación CORS; clientes sin Origin conservan las mismas verificaciones de slug, identidad y pertenencia. Origin nunca determina tenant ni permisos.

### Key Entities *(include if feature involves data)*

- **Institution**: UUID interno y slug único; tenant lógico de la base compartida.
- **User / InstitutionMembership**: Identidad global y pertenencia con flags independientes por institución.
- **Contexto institucional**: Institución del path y actor autorizado, limitado a la operación y nunca heredado accidentalmente.
- **Manifiesto / ejecución demo**: IDs estables, versión y evidencia; sin contraseñas incluidas.
- **Entidades académicas / AuditEvent**: Conservan institución, permisos, relaciones, publicación e historial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Primera carga vacía: 2 instituciones, 10 usuarios y 10 pertenencias; tres repeticiones y dos ejecuciones concurrentes no duplican datos ni alteran credenciales o revocaciones.
- **SC-002**: Cero accesos o cambios cruzados en todos los dominios institucionales, incluidos accesos sin filtro y referencias manipuladas, usando la identidad real de ejecución del servicio.
- **SC-003**: Cero contextos heredados en al menos 100 operaciones concurrentes alternando UC/UTFSM y 20 reutilizaciones tras errores; sin contexto no se entrega ningún registro institucional.
- **SC-004**: Login, delegación, curso/sección, matrícula, material, quiz, intento y notas se completan en ambas instituciones con cuentas separadas, localmente y mediante la API central pública.
- **SC-005**: El 100 % de rutas institucionales implementadas conserva slug explícito bajo el prefijo singular acordado, con contrato y consumidores coherentes; rutas académicas sin contexto no permiten acceso.
- **SC-006**: Toda carga efectiva y cambio de privilegios confirmado tiene auditoría sanitizada; un fallo conserva el estado previo y ninguna evidencia contiene contraseñas, hashes o tokens.
- **SC-007**: En la API central, ambos orígenes frontend configurados superan preflight y consumo autenticado; orígenes externos no reciben habilitación CORS. Probar que preflight no revela datos y que solicitudes sin Origin o desde un origen permitido no evitan autenticación ni aislamiento.

## Assumptions

- Se conserva PostgreSQL compartida y el stack actual. Usuario autoriza evaluar la mínima RLS necesaria; roles de ejecución/migración, contexto transaccional, consultas e índices se deciden en el plan.
- Esta misión mantiene la selección por path y sustituye la exclusión previa de aislamiento obligatorio en DB. Constitución 1.5.0 y el nuevo ADR reconcilian ese alcance; excluir altas generales de personas sigue vigente.
- `uc.academix.dvillasc.me` y `utfsm.academix.dvillasc.me` son frontend; backend es `api.dvillasc.me`. CORS admite esos dos orígenes HTTPS exactos. El frontend elige slug; backend no confía en esa elección sin validar pertenencia. UI/middleware frontend quedan fuera del alcance.
- Desarrollo usa localhost y el mismo contrato de paths; CORS permite orígenes locales explícitos por entorno. No requiere mapas host→tenant ni DNS local.
- La carga no crea cursos, matrículas ni contenido: se generan mediante endpoints existentes para probarlos. Secretos iniciales se suministran de forma segura sin reseteo posterior.
- Implementación MVP mínima: sin otra base, schema por tenant, sharding, nuevo framework de persistencia ni middleware distinto por dominio.

## Sources & Traceability

- CU-01/02 y validación transversal CU-03–16; RF1–12/25–26 y RNF1–4/6–7/9–10: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- Backlog: PREP-05/08, INF-02, BE-02/03/04/05/09 y CI-12 del [plan de trabajo](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md); issues [#21](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/21), [#52](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/52), [#54](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/54); sin alterar responsables ni presumir estados.
- Dependencias: [persistencia](../20261014-234644_base-persistente/spec.md), [identidad](../20261014-234744_identidad-acceso/spec.md), [cursos/roles](../20261014-234844_cursos-roles/spec.md) y contratos académicos vigentes.
- Gobernanza a reconciliar: [constitución](../../.specify/memory/constitution.md), [base compartida](../../docs/adr/adopt-shared-postgresql-multitenancy.md), [contexto institucional](../../docs/adr/institution-context-and-database-isolation.md) y [onboarding](../20261014-234844_cursos-roles/contracts/onboarding.md); decisión de alcance acordada el 2026-10-20.
- Exclusiones: altas generales, invitaciones, nuevos permisos de negocio, UI, superadmin global, restauración por tenant y aislamiento físico. Crear este spec no ejecuta cargas ni modifica Railway.
