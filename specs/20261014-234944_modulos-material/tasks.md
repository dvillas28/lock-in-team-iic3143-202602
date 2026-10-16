# Tasks: Módulos y material compartido

**Input**: `specs/20261014-234944_modulos-material/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [modelo](data-model.md),
[HTTP](contracts/http.md), [autorización](contracts/authorization.md), [research](research.md).
**Status**: Pendientes; este documento no implementa la feature.
**Organization**: Dos historias P1; conservar responsables BE-21–23 y parte BE-24.
**Format**: checkbox + ID correlativo + [P] opcional + [USn] en historias + ruta exacta.
Pruebas solicitadas explícitamente en spec.md; no cerrar con negativos pendientes.

## Phase 1: Setup

- [ ] T001 Confirmar identidad-acceso y cursos-roles operativos, permisos docentes reconciliados y cobertura CU-14/05/06, RF13–16/25–26, RNF1–4 en specs/20261014-234944_modulos-material/plan.md; registrar bloqueos sin implementar otro spec (FR-003/005).
- [ ] T002 Verificar comandos y nombres de migración contra backend/package.json y backend/migrations/20261016000200_modules_material.sql; actualizar specs/20261014-234944_modulos-material/quickstart.md si difieren, sin dependencias ni binarios nuevos (FR-008).

## Phase 2: Foundation

- [ ] T003 Crear backend/migrations/20261016000200_modules_material.sql con tablas/FK tenant, CHECK, índices y UNIQUE de posición diferible según data-model.md; no modificar migraciones aplicadas (FR-001/002/003).
- [ ] T004 Implementar backend/src/content/content-access.ts reutilizando backend/src/courses/course-access.ts: teacher en cualquier sección, lectores publicados, estados vigentes, 404/403 y locks globales con PoolClient; no ampliar permisos de otros consumidores (FR-003/005).
- [ ] T005 [P] Implementar validación estricta común en backend/src/content/content-validation.ts: claves/tipos, título trim 1–200, cuerpo no blanco ≤10000 caracteres/sin NUL, posiciones int32 positivas y UUID/orden según contrato (FR-001/007).
- [ ] T006 [P] Crear backend/test/integration/content-fixtures.mjs sobre helpers.mjs y course-fixtures.mjs: UC/UTFSM, dos secciones, teacher no admin, admin sin teacher, roles múltiples y contenido SQL para US2 independiente (SC-002/003).
- [ ] T007 Probar FK cruzadas, CHECK, swap con constraint diferible y preservación de tablas previas en backend/test/integration/content-integrity.test.mjs; usar DB exclusiva terminada en _test (FR-001/002/003).

**Checkpoint**: migración y autorización listas; US1/US2 usan fixtures, sin depender
entre sí de endpoints de escritura. No basta que cursos-roles tenga plan.

## Phase 3: US1 — Organizar contenido (P1)

**Goal**: docente de cualquier sección crea, edita, ordena, publica y oculta contenido común.
**Independent Test**: dos módulos y un material; reordenar/publicar/ocultar como
teacher no admin, confirmar mismos IDs desde docente de otra sección y audit atómico.

### Verification

- [ ] T008 [P] [US1] Añadir pruebas HTTP de módulos en backend/test/integration/modules-write.test.mjs: altas, edición, teacher no admin/otra sección, orden completo, negativos de rol/tenant/curso y publicación no-op (FR-001/003/005).
- [ ] T009 [P] [US1] Añadir pruebas HTTP de material en backend/test/integration/materials-write.test.mjs: crear/editar/publicar/ocultar, padre oculto conserva ítems, actor servidor, campos prohibidos y cruce institucional (FR-002/004/005).
- [ ] T010 [P] [US1] Cubrir límites Unicode, whitespace, NUL, tipos/claves y strings con scripts/HTML/URLs como datos inertes en backend/test/content-validation.test.mjs (FR-007).
- [ ] T011 [US1] Extender backend/test/integration/content-integrity.test.mjs con fallo de auditoría/rollback, historial inmutable, no-op, alta vs alta, orden vs orden, alta vs orden, edición concurrente y liberación de conexiones (FR-001/006).

### Implementation

- [ ] T012 [US1] Extender whitelist de snapshots/acciones en backend/src/audit/audit.service.ts para courseModule/material y course module.reordered; guardar before/after permitidos y markdown histórico, sectionId NULL, sin ampliar lectores ni registrar payload HTTP completo (FR-006).
- [ ] T013 [US1] Implementar backend/src/modules/modules.service.ts: alta en posición libre, edición, orden completo con constraint diferida, publicación independiente, locks/permiso vigentes y auditoría en la misma tx; no-op sin eventos (FR-001/003/006).
- [ ] T014 [US1] Exponer escrituras y lectura docente de módulo/lista en backend/src/modules/modules.controller.ts con DTO/Location/Problem, no-store y nosniff; mantener operationId existentes (FR-001/007).
- [ ] T015 [US1] Implementar backend/src/materials/materials.service.ts: markdown solamente, pertenencia por FK, edición que conserva publicación, publish/unpublish, actor del guard, rollback y audit con PoolClient único (FR-002/004/006/008).
- [ ] T016 [US1] Exponer escrituras y lectura docente de material/lista en backend/src/materials/materials.controller.ts; JSON inerte con no-store/nosniff, sin rutas de upload/content ni HTML (FR-002/007/008).
- [ ] T017 [US1] Registrar providers/controllers en backend/src/app.module.ts y verificar columnas nuevas desde backend/src/database/database.service.ts sin duplicar guard/filtro existentes (FR-001/002).
- [ ] T018 [US1] Alinear docs/reference/openapi/paths/sections.yaml, paths/materials.yaml, components/schemas/courses.yaml, components/schemas/materials.yaml, openapi.yaml y README.md: límites/errores/headers, teacher frente a assistant, order vacío válido y binarios fuera del contrato MVP (FR-001/005/007/008).
- [ ] T019 [US1] Regenerar frontend/src/lib/api/schema.d.ts con pnpm --dir frontend api:generate y adaptar frontend/test/api.test.ts a markdown-only sin romper consumidores existentes (FR-008).
- [ ] T020 [US1] Ejecutar pruebas T008–T011, API lint/check y typecheck; registrar resultados US1 en docs/backend/modules-material-validation.md, incluyendo dos secciones y rollback de publicación (FR-001/002/003/006/007).

**Checkpoint**: US1 entregable con foundation y fixtures; no declarar habilitada
lectura assistant/student hasta cerrar US2. No agregar pantallas ni modificar mockups.

## Phase 4: US2 — Consultar material (P1)

**Goal**: assistant/student leen solo contenido publicado autorizado en tiempo de solicitud.
**Independent Test**: insertar contenido con fixtures SQL; cuatro combinaciones de
publicación, dos secciones, enlaces directos y revocación, sin usar endpoints US1.

### Verification

- [ ] T021 [P] [US2] Crear backend/test/integration/content-read.test.mjs para cuatro estados padre/ítem en todos los GET, listas sin filtraciones, mismos IDs en secciones y teacher con borradores frente a assistant/student/admin sin Enrollment (FR-003/004/005; SC-001/002).
- [ ] T022 [P] [US2] Crear backend/test/integration/content-revocation.test.mjs: User/Institution/membership/último Enrollment revocados, teacher que conserva student, otro Enrollment vigente, enlaces anteriores y cruces de IDs en cada ruta (FR-005; SC-003).

### Implementation

- [ ] T023 [US2] Completar lecturas de backend/src/content/content-access.ts, backend/src/modules/modules.service.ts y backend/src/materials/materials.service.ts: JOIN tenant/estados/rol por consulta, doble publicación en SQL, sin IDs/conteos ocultos ni caché (FR-004/005).
- [ ] T024 [US2] Completar GET en backend/src/modules/modules.controller.ts y backend/src/materials/materials.controller.ts con lista vacía frente a padre 404, detalle directo seguro y errores/headers acordados; reutilizar DTO US1 o contrato con fixtures si se entrega primero (FR-004/005/007).
- [ ] T025 [US2] Extender backend/test/integration/content-revocation.test.mjs con barreras de transacción para revocación vs escritura y ocultación vs lectura; verificar solicitud posterior al commit niega acceso y respeta orden de locks (FR-005/006).
- [ ] T026 [US2] Crear backend/test/integration/content-contract.test.mjs con cliente generado real: listas/detalle, 401/403/404, no-store/nosniff, strings hostiles application/json y ausencia de HTML/filtraciones (FR-005/007; SC-003).
- [ ] T027 [US2] Extender frontend/test/api.test.ts para consumidor markdown como string inerte, filtros/errores del contrato y ausencia de navegación/render HTML; no introducir visor ni dependencia de sanitización (FR-007).
- [ ] T028 [US2] Ejecutar pruebas de lectura/revocación/contrato y frontend; registrar cuatro estados y negativos completos en docs/backend/modules-material-validation.md (SC-001/002/003).

**Checkpoint**: US2 verificable con fixtures SQL aun sin US1; si US1 ya existe,
conservar pruebas de escritura al integrar lecturas. Permisos de audit no cambian.

## Phase 5: Integration and delivery

- [ ] T029 Verificar instalación vacía y upgrade con cursos/roles/audit previos, migración repetida sin pérdida y down solo en DB exclusiva vacía en backend/test/integration/content-integrity.test.mjs (FR-003/006).
- [ ] T030 Ejecutar lint, test:coverage, API lint/check, typecheck, frontend test y límite documental de specs/20261014-234944_modulos-material/quickstart.md; resolver fallos introducidos y registrar impedimentos externos (FR-001–008).
- [ ] T031 Completar evidencia FR/SC, comandos/resultados y exclusión RF15/archivos RF14 en docs/backend/modules-material-validation.md; enlazar docs/adr/shared-markdown-publication.md sin secretos ni reasignación de backlog (FR-006/008).
- [ ] T032 Revisar callers/exportaciones, fixtures y coherencia final de docs/reference/openapi/README.md, frontend/src/lib/api/schema.d.ts y specs/20261014-234944_modulos-material/tasks.md; marcar solo tareas realmente verificadas (SC-001/002/003).

## Dependencies & Execution Order

Identidad-acceso + cursos-roles implementados → T001–T007 → US1 y/o US2 → T029–T032.
Foundation en orden: T003→T004; T005/T006 independientes tras setup; T007 tras T003/T006.
US1: T008/T009/T010 en paralelo → T011/T012 → T013→T014 y T015→T016 → T017–T020.
US2: T021/T022 en paralelo → T023→T024→T025→T026→T027→T028.
Si se entrega US2 primero, sus servicios/controladores implementan solo GET y usan
fixtures SQL; T024 toma DTO de contracts/http.md, sin bloquearse en US1.
Al ejecutar historias en paralelo, servicios/controladores, tipos, audit y AppModule
son archivos compartidos: asignar un responsable o serializar esas ediciones.
Migración, fixtures base y OpenAPI compartidos no tienen dos escritores simultáneos.

## Parallel Examples

- Foundation: T005 validation y T006 fixtures trabajan en archivos distintos.
- US1: T008 módulos, T009 material y T010 validación son archivos independientes
  tras foundation. Luego T013/T014 y T015/T016 pueden avanzar en líneas separadas
  tras T012, con integración común T017 al final.
- US2: T021 lectura y T022 revocación son archivos distintos sobre fixtures completas.
  Sus implementaciones compartidas T023/T024 se ejecutan secuencialmente.

## Implementation Strategy

1. Foundation sin infraestructura futura; gates académicos y tenant antes de endpoints.
2. MVP incremental: US1 (T001–T020), con permisos/audit/negativos y sin lectura pública.
3. US2 añade lectores assistant/student; alternativa independiente usa fixtures SQL.
4. Integrar ambas historias y cerrar SC-001/002/003; la feature completa requiere ambas.
5. Binarios, visor HTML, eliminación, movimiento de contenido y nuevas pantallas quedan fuera.
