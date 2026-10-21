# Tasks: Demo institucional y aislamiento por contexto

**Input**: `specs/20261020-211552_demo-aislamiento-dominios/`.
**Prerequisites**: [plan](plan.md), [research](research.md), [modelo](data-model.md), [contratos](contracts/http.md), [quickstart](quickstart.md).
**Estado**: 42 tareas completadas con evidencia local; T042/T044 pendientes por requerir operaciones externas.
**Regla**: archivos authored <150 líneas; dividir por responsabilidad y enlazar si crecen.

## Phase 1: Setup

- [X] T001 Verificar alcance/gobernanza aprobados en `.specify/memory/constitution.md` y `docs/adr/institution-context-and-database-isolation.md`; conservar exclusiones de spec (FR-014/017).
- [X] T002 Registrar baseline y matriz de rutas/servicios/fixtures en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`, sin secretos; incluir los 12 tablas tenant-owned y todos los controllers (FR-011/016).

## Phase 2: Foundation

- [X] T003 Separar conexión runtime/operativa en `backend/src/database/config.ts` y documentar variables en `.env.example`; prohibir fallback privilegiado en producción y validar misma DB en tests (FR-011/012).
- [X] T004 Crear `backend/migrations/20261020000100_runtime_and_demo.sql`: rol runtime NOLOGIN sin privilegios elevados, demo_data_runs y allowlist auditada mínima para membership.demoProvisioned; cubrir up/replay en `backend/test/integration/runtime-provision.test.mjs` (FR-004/019).
- [X] T005 Implementar `backend/src/commands/provision-runtime.ts` y pruebas en `backend/test/integration/runtime-provision.test.mjs`: LOGIN/password solo al primer alta, replay verifica sin rotar, grants mínimos y errores sanitizados (FR-011/012).
- [X] T006 Preparar fixtures con TEST_DATABASE_URL operativa/TEST_RUNTIME_DATABASE_URL en `backend/test/integration/helpers.mjs`; impedir ejecutar contra otra DB o con credenciales propietarias en assertions (SC-002/003).
- [X] T007 Extraer límite SQL reutilizable a `backend/src/database/tenant-transaction.ts`, preservando transaction de `backend/src/courses/course-access.ts` para comandos; mismo client, rollback seguro y destrucción de conexión incierta (FR-010/012).
- [X] T008 Cubrir límites de transacción y errores en `backend/test/tenant-transaction.test.mjs`; verificar no BEGIN anidado ni pool.query dentro de callbacks con client (FR-012).

**Checkpoint**: contratos y fixtures listos; no desplegar estas fundaciones solas como servidor RLS terminado.

## Phase 3: US1 - Cuentas demo repetibles (P1)

**Goal**: habilitar 2/10/10 desde vacío sin resetear datos previos.
**Independent Test**: CLI sobre vacía/legacy/poblada, tres replays y concurrencia; no requiere dominios públicos.

- [X] T009 [P] [US1] Añadir `backend/test/integration/demo-migration.test.mjs`: cardinalidad vacía, adopción legacy explícita, colisiones, replay sin secretos, revocados, rollback final y dos ejecuciones (SC-001/006).
- [X] T010 [P] [US1] Fijar manifiesto v1 de diez UUIDs nuevos y emails de data-model.md en `backend/src/data-migrations/demo-manifest.ts`; no cambiar IDs del seed legacy (FR-002/003).
- [X] T011 [US1] Implementar `backend/src/data-migrations/demo-institutions.ts` con una transacción, advisory lock, marker/fingerprint, validación de adopción y secretos solo para faltantes; auditar altas sin resets (FR-001–004/019).
- [X] T012 [US1] Actualizar conexión operativa en `backend/src/data-migrations/operation.ts`, `backend/src/commands/migrate.ts` y `backend/src/seeds/demo.ts`; conservar firmas y semantics del seed/onboarding/set-superadmin (FR-003/012).
- [X] T013 [US1] Implementar secuencia config→schema→provisión runtime→demo opt-in→validación en `backend/src/commands/predeploy.ts`; exponer db:predeploy en `backend/package.json` y probar fail/disabled en `backend/test/integration/predeploy.test.mjs` (FR-001/004).
- [X] T014 [US1] Ajustar `backend/Dockerfile`, `backend/src/main.ts` y `docker-compose.yml`: lifecycle operativo separado, HTTP runtime y eliminación de secretos operativos/demo del proceso; preservar secuencia local (FR-001/011).
- [X] T015 [US1] Alinear predeploy en `backend/railway.json` y probar mismo camino en `.github/workflows/ci.yml`, con credenciales efímeras y carga repetida; no ejecutar además una carga remota desde GitHub (FR-001/004).
- [X] T016 [US1] Ejecutar checks US1 y registrar resultados en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`; demostrar que replay no revierte privilegios ni requiere passwords existentes (SC-001/006).

## Phase 4: US2 - Contexto de ruta y persistencia aislados (P1)

**Goal**: API central, slug explícito y barrera DB obligatoria sobre todos los dominios.
**Independent Test**: fixtures de dos tenants y rol runtime, sin depender de manifiesto demo.

- [X] T017 [P] [US2] Crear `backend/test/tenant-context.test.mjs`: slug válido/inválido/ausente, globales y rechazo de fuentes alternativas Host/Origin/header/query/body (FR-005/008).
- [X] T018 [P] [US2] Crear `backend/test/integration/tenant-isolation.test.mjs`: queries sin filtro, falta de contexto, WITH CHECK, UPDATE/DELETE ajenos, identidad multi-tenant, rechazo de eventos operativos con actor nulo/falso, 100 operaciones y 20 reusos tras error (SC-002/003).
- [X] T019 [P] [US2] Crear `backend/test/integration/cors.test.mjs`: preflight sin JWT, orígenes exactos/denegados, Vary, Authorization/Idempotency-Key, Location y requests reales con/sin Origin (FR-020/SC-007).
- [X] T020 [US2] Crear `backend/migrations/20261020000200_tenant_isolation.sql` con ENABLE/FORCE y USING/WITH CHECK de las 12 tablas, excepción SELECT memberships propias solo sin tenant, AuditEvent con actor real y sin acciones operativas runtime, grants mínimos; probar vacía/poblada (FR-011–013).
- [X] T021 [US2] Implementar TenantRequest en `backend/src/tenancy/tenant-context.ts` y guard en `backend/src/tenancy/tenant.guard.ts` que valida request.params.institutionSlug; registrar en `backend/src/app.module.ts`, sin resolver tenant por Host/Origin (FR-005/008).
- [X] T022 [US2] Configurar CORS una vez y adaptar regex no-store/nosniff/media-type en `backend/src/main.ts`; preservar trust proxy=false y autenticación real después del preflight (FR-006/020).
- [X] T023 [US2] Implementar withInstitution/withIdentity en `backend/src/database/database.service.ts`; adaptar `backend/src/auth/auth.guard.ts` y `backend/src/auth/auth.service.ts` a excepciones globales delimitadas sin pool académico público (FR-007/009–012).
- [X] T024 [US2] Convertir services/controllers de `backend/src/courses/courses.service.ts`, `backend/src/courses/courses.controller.ts`, `backend/src/sections/sections.service.ts`, `backend/src/sections/sections.controller.ts`, `backend/src/enrollments/enrollments.service.ts` y `backend/src/enrollments/enrollments.controller.ts` a contexto/client común, rutas/Location con prefijo singular e institutionSlug y locks vigentes (FR-006/009/015).
- [X] T025 [US2] Adaptar `backend/src/courses/course-access.ts`, `backend/src/institutions/institutions.controller.ts`, `backend/src/institutions/institutions.service.ts` y `backend/src/institutions/membership-admin.controller.ts`/`membership-admin.service.ts`; /institution/{institutionSlug}/me contextual y directorio global propio sin bypass (FR-007/014).
- [X] T026 [US2] Convertir `backend/src/content/content-access.ts`, `backend/src/modules/modules.controller.ts`/`modules.service.ts` y `backend/src/materials/materials.controller.ts`/`materials.service.ts` a context/client y rutas nuevas; conservar publicación y permisos (FR-006/015).
- [X] T027 [US2] Convertir `backend/src/quizzes/quizzes.controller.ts`/`quizzes.service.ts`/`quiz-access.ts` y `backend/src/attempts/attempts.controller.ts`/`attempts.service.ts`/`attempt-access.ts`; mismo client, locks, idempotencia y Location con slug y prefijo singular (FR-006/015).
- [X] T028 [US2] Convertir `backend/src/gradebook/gradebook.controller.ts`/`gradebook.service.ts`, `backend/src/audit/audit.controller.ts`/`audit.service.ts` y `backend/src/gradebook/gradebook-access.ts` conectados a contexto; conservar notas publicadas y auditoría atómica (FR-011/015).
- [X] T029 [US2] Endurecer check en `backend/src/database/database.service.ts` y pruebas `backend/test/integration/readiness.test.mjs`: rol efectivo sin bypass/ownership/membresías privilegiadas y políticas ENABLE/FORCE completas; 503 si falla (FR-011/012).
- [X] T030 [US2] Adaptar prefijo institucional singular/credenciales de `backend/test/integration/helpers.mjs`, `backend/test/integration/course-fixtures.mjs`, `backend/test/integration/content-fixtures.mjs`, `backend/test/integration/quiz-fixtures.mjs` y suites afectadas; probar 404 de rutas sin contexto y del prefijo plural no registrado en `backend/test/integration/tenant-isolation.test.mjs` (SC-002/005).
- [X] T031 [US2] Ejecutar suite US2, revocación concurrente y permisos existentes; completar inventario SQL y evidencia en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`; ningún servicio conserva acceso académico sin contexto (SC-002/003/007).

**Checkpoint**: RLS, runtime seguro y todos los accesos institucionales se promueven juntos; no desplegar una conversión parcial.

## Phase 5: US3 - Delegación y recorrido por dominio (P2)

**Goal**: demostrar las capacidades existentes con cuentas separadas y contrato actualizado.
**Independent Test**: fixtures controlados verifican delegación y revocación; recorrido completo usa demo US1 + contexto US2.

- [X] T032 [P] [US3] Añadir recorrido UC/UTFSM y negativos de roles en `backend/test/integration/demo-workflow.test.mjs`; reutilizar helpers de quizzes/attempts/gradebook y no inventar altas por HTTP (SC-004/006).
- [X] T033 [US3] Actualizar `docs/reference/openapi/openapi.yaml`, paths YAML y `components/parameters.yaml`: conservar InstitutionSlug, prefijo /api/v1/institution/{institutionSlug} y server api.dvillasc.me; /users institucional sigue planificado sin crear controller (FR-016/017).
- [X] T034 [US3] Actualizar URLs/ejemplos en `scripts/api-catalog-render.mjs`, `scripts/api-catalog-init.js` y `scripts/api-catalog.test.mjs` y `docs/reference/api-catalog.md`; cobertura real y descarga sin endpoints antiguos disponibles (SC-005).
- [X] T035 [US3] Regenerar `frontend/src/lib/api/schema.d.ts`, adaptar `frontend/src/lib/api/institutions.ts` y consumidores existentes a getCurrentUser(client, institutionSlug) con argumento conservado; baseUrl solo origen, sin cambio de UI (FR-016).
- [X] T036 [US3] Ajustar `frontend/test/api.test.ts` y probar cliente real contra ambos paths institucionales en API central en `backend/test/integration/course-workflow.test.mjs`; impedir doble /api/v1 y confirmar Problems 400/401/403/404 (FR-016/SC-005).
- [X] T037 [US3] Crear `scripts/postdeploy-demo.mjs` y self-check en `scripts/postdeploy-demo.test.mjs`: salud/versión, login/me institucional y CORS OPTIONS de ambos frontend en API central; --workflow explícito para mutaciones, secretos del operador por entorno, IDs/tokens en memoria y sin reset de secretos o permisos por replay (SC-004/006).
- [X] T038 [US3] Ejecutar pruebas de historia y registrar resultados en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`, incluyendo notas antes/después de publicar y ausencia de acceso ajeno (SC-004/006).

## Phase 6: Integration and delivery

- [X] T039 Ejecutar lint/test/coverage, contrato/catálogo, api:check/typecheck y chequeo authored de `.github/scripts/check-doc-length.py`; registrar comandos/resultados en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`.
- [X] T040 Medir EXPLAIN bajo runtime/RLS para cursos, enrollments y gradebook en `backend/test/integration/tenant-isolation.test.mjs`; añadir migración de índice solo si lookup real lo justifica (FR-013).
- [X] T041 Documentar runbook y deuda de altas en `docs/backend/demo-tenant-bootstrap.md`, enlazar desde `docs/backend/README.md`; mantener instrucciones locales y secret handling de `specs/20261020-211552_demo-aislamiento-dominios/quickstart.md` (FR-017/018).
- [ ] T042 Preparar/configurar en la entrega controlada api.dvillasc.me en backend, DNS/TLS, CORS de los frontend UC/UTFSM y predeploy efectivo Railway conforme a `specs/20261020-211552_demo-aislamiento-dominios/contracts/demo-deployment.md`; registrar read-back sin secretos en `docs/backend/demo-tenant-bootstrap.md` (FR-005/018/020).
- [X] T043 Verificar compatibilidad de constitución/ADR/templates y límites <150 líneas de todos los authored modificados; actualizar trazabilidad en `specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md`.
- [ ] T044 Ejecutar smoke HTTPS de API central con ambos slugs y Origin frontend con `scripts/postdeploy-demo.mjs`; registrar commit/versión, rol/RLS, aislamiento y estado real en `docs/backend/demo-tenant-bootstrap.md`; no marcar producción validada con evidencia solo local (SC-002/004/007).

## Dependencies & Execution Order

T001–T008 → US1 (T009–T016) y US2 (T017–T031); fixtures permiten trabajar historias sin DNS.
US1 CLI no depende del routing; US2 usa fixtures propios y no depende del manifiesto público.
T020 depende de T004/005; T023 de T007/020/021; T024–T028 de T023; T030–T031 de conversiones.
US3 depende del contrato de contexto US2; su recorrido completo requiere US1 y US2. Entrega pública: ambas juntas.
T033 → T034/T035 → T036; T032 prepara pruebas, T037 prepara smoke, T038 verifica integración.
T039–T044 cierran entrega; T042 necesita DNS/secretos/orígenes reales suministrados por operadores.

## Parallel Opportunities

- US1: T009 (tests) y T010 (manifiesto) en archivos distintos; ejecución de DB siempre serial.
- US2: T017, T018 y T019 en archivos distintos después de fixtures; conversión de servicios tras T023 puede dividirse con dueño por archivo.
- US3: T032 puede escribirse mientras T033 actualiza contrato; T034 y T035 después de T033 no comparten archivos.
- No ejecutar suites que reinicializan schema contra la misma base en paralelo.

## Implementation Strategy

1. MVP operativo: US1 CLI y manifest; MVP público seguro requiere además US2 completo.
2. Añadir US3 para demostrar flujo académico; preservar todos los permisos/historial actuales.
3. Promover una imagen con RLS+contexto+contrato coherentes, después de pruebas negativas con runtime.
4. Cerrar con evidencia pública; sin nuevos endpoints de personas ni rediseño frontend.
