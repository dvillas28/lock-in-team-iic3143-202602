# Tasks: Cursos, secciones, roles y auditoría mínima

**Input**: `specs/20261014-234844_cursos-roles/`.
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), modelo y contratos; identidad-acceso operativa.
**Formato**: IDs secuenciales; [P] solo archivos distintos sin dependencia pendiente.
**Pruebas**: requeridas por spec y constitución; mantener responsables PREP-10/BE-09–14.
**Estado**: 39/39 completadas; evidencia y limitaciones en docs/backend/courses-roles-validation.md.

## Phase 1: Setup

- [X] T001 Confirmar base identidad-acceso, comandos y alcance CU-03/04, RF8–12/25–26 y RNF1–4 en specs/20261014-234844_cursos-roles/quickstart.md; preservar cambios locales y usar feat/cursos-roles para implementación.
- [X] T002 Reconciliar dominio, catálogo/ERD y datos históricos con is_admin/is_super_admin institucionales, owner y auditoría sin curso en docs/deliveries/2/06-data-model.md y docs/deliveries/2/12-data-catalog.md; dividir documentos >200 líneas y enlazar nuevas partes, sin borrar invariantes (FR-001/002/009).

## Phase 2: Foundation

- [X] T003 Crear backend/migrations/20261016000100_courses_roles.sql con is_admin/is_super_admin default false, Course/Section/Enrollment/AuditEvent, FK compuestas, CHECK, índices y triggers del data-model.md; sin modificar migraciones aplicadas (FR-006/008/009).
- [X] T004 Extender backend/src/database/database.service.ts para readiness de is_admin/is_super_admin y tablas nuevas; actualizar backend/test/integration/readiness.test.mjs, persistence.test.mjs y backend/test/compose-smoke.mjs donde asumen columnas/conteos anteriores (FR-006).
- [X] T005 Crear backend/test/integration/course-fixtures.mjs usando helpers.mjs: UC/UTFSM, dos owners, dos secciones, admin y superadmin solo UC, roles múltiples, memberships revocadas y fixtures directos para US1 independiente (SC-001).
- [X] T006 [P] Probar FK cruzadas, capacidades, unicidad concurrente y triggers de historia/ownership en backend/test/integration/course-integrity.test.mjs contra PostgreSQL 17; default false, actor nulo sin evidencia operativa rechazado por CHECK y migración repetida/poblada sin pérdida (FR-006/008, SC-003).
- [X] T007 [P] Implementar resolución/autorización SQL vigente en backend/src/courses/course-access.ts para Pool/PoolClient según contracts/authorization.md; locks deterministas de usuarios, institución y memberships para escrituras (FR-005/006/009).
- [X] T008 Implementar registro sanitizado append-only en backend/src/audit/audit.service.ts que recibe PoolClient del caller; soportar evento institucional y eventos académicos con contexto obligatorio (FR-007).

**Checkpoint**: correr checks de fundamento; no iniciar historias con fallos de aislamiento o integridad.

## Phase 3: US1 — Encontrar mis cursos (P1)

**Goal**: descubrir únicamente cursos/secciones autorizados, con admin por institución.
**Independent Test**: fixtures SQL de T005; mismos GET con teacher, assistant y student;
admin dueño ve su curso completo, admin ajeno no; revocación se observa con JWT existente.

- [X] T009 [US1] Escribir tests HTTP de listado/detalle curso/sección, múltiples roles sin duplicados, owner sin Enrollment y admin ajeno en backend/test/integration/courses-read.test.mjs (US1-AS1, SC-001).
- [X] T010 [P] [US1] Ampliar backend/test/integration/access-revocation.test.mjs y institutions.test.mjs para isAdmin/isSuperAdmin UC/no-admin UTFSM, roles vigentes y revocación de admin/Enrollment/membership/User; conservar checks existentes (US1-AS2, FR-010).
- [X] T011 [US1] Implementar list/get filtrados y DTO de Course/Section en backend/src/courses/courses.service.ts y backend/src/sections/sections.service.ts; ordenar y eliminar duplicados según contracts/http.md (US1-AS1).
- [X] T012 [US1] Exponer GET autenticados en backend/src/courses/courses.controller.ts y backend/src/sections/sections.controller.ts; validar slug/UUID y registrar servicios/controladores en backend/src/app.module.ts (FR-005/006).
- [X] T013 [US1] Actualizar backend/src/institutions/institutions.service.ts para /me con isAdmin/isSuperAdmin y sectionMemberships desde Enrollments activos; no cachear ni exponer asignaciones ajenas (FR-010).
- [X] T014 [US1] Sincronizar lecturas y permisos en docs/reference/openapi/paths/courses.yaml, paths/sections.yaml, paths/platform.yaml y components/schemas/tenancy.yaml, courses.yaml; conservar operationIds, sin publicar POST antes de US2 (FR-009/010).
- [X] T015 [US1] Regenerar frontend/src/lib/api/schema.d.ts y ampliar frontend/test/api.test.ts para /me y lecturas sin romper Bearer ni Problem; ejecutar checks US1 y registrar resultado en specs/20261014-234844_cursos-roles/quickstart.md (US1-AS1/2).

**Checkpoint**: US1 entregable sin endpoints de escritura US2; MVP de consulta.

## Phase 4: US3 — Onboarding y delegación institucional (P1)

**Goal**: PM habilita primer superadmin; institución delega is_admin a sus miembros.
**Independent Test**: foundation con identidades/memberships y sin cursos; ejecutar
onboarding y PUT de delegación en UC, comprobar UTFSM intacta y admin ordinario rechazado.

- [X] T016 [US3] Escribir backend/test/integration/onboarding.test.mjs: nuevo/existente User, tenant nuevo, repetición/concurrencia, no reponer privilegios, colisiones, rollback y sanitización de credenciales; origen operativo y fingerprint inicial sin credenciales (FR-013, US3-AS1/2).
- [X] T017 [P] [US3] Escribir backend/test/integration/membership-admin.test.mjs: listar activos, delegación/revocación/no-op, actor revocado, admin ordinario y cruces UC/UTFSM, isSuperAdmin manipulado y fallo de evento (FR-012/014, US3-AS3–5).
- [X] T018 [P] [US3] Escribir backend/test/integration/superadmin-recovery.test.mjs según contracts/set-superadmin.md: cero/último superadmin, reemplazo atómico, aislamiento, no-op/replay, colisiones, rollback y revocación concurrente (FR-014, US3-AS6).
- [X] T019 [US3] Implementar backend/src/data-migrations/onboard-institution.ts según contracts/onboarding.md: configuración segura, Argon2id existente, transacción y evento operativo único; reejecución insert-only sin resucitar flags ni resetear passwords (FR-013).
- [X] T020 [US3] Implementar backend/src/data-migrations/set-superadmin.ts con entradas/locks/auditoría del contrato, fingerprint y protección del último superadmin; validar contra superadmin-recovery.test.mjs sin endpoints US2 (FR-014, SC-004).
- [X] T021 [US3] Implementar listado paginado y set is_admin en backend/src/institutions/membership-admin.service.ts con is_super_admin vigente, orden de locks global sin upgrades y evento atómico; nunca modificar User, is_super_admin u ownership (FR-012/014).
- [X] T022 [US3] Exponer GET memberships y PUT course-admin en backend/src/institutions/membership-admin.controller.ts, validación exacta y registro en backend/src/app.module.ts; errores/no-op del contrato (FR-012/014).
- [X] T023 [US3] Agregar operaciones, parámetros y DTO MembershipAdmin a docs/reference/openapi/paths/platform.yaml y components/schemas/tenancy.yaml; enlazar en openapi.yaml, isSuperAdmin readOnly en /me y AuditEvent.actorUserId nullable solo para migraciones onboarding/superadmin (FR-010/012/013).
- [X] T024 [US3] Regenerar frontend/src/lib/api/schema.d.ts y ampliar frontend/test/api.test.ts para delegación y flags institucionales; validar tipos, Bearer y Problem, sin crear pantallas (FR-010/012).
- [X] T025 [US3] Documentar precondición de miembros ya provisionados, onboarding PM, migración explícita de tenants demo existentes, recuperación/reemplazo del último superadmin y evidencia US3 en docs/backend/courses-roles-validation.md; correr checks con fixtures sin US2 (FR-013/014, SC-004).


**Checkpoint**: no cerrar sin negativos de escalamiento, recuperación y onboarding repetido verificados.


## Phase 5: US2 — Mantener secciones y participantes (P1)

**Goal**: crear cursos propios y administrar secciones/roles dentro del alcance autorizado.
**Independent Test**: con fixtures T005 y HTTP US1, crear curso, asignar dos roles,
repetir uno, cambiar/desactivar y verificar historia; fallar auditoría revierte todo.

- [X] T026 [US2] Escribir backend/test/integration/courses-write.test.mjs: POST atómico, owner del actor, admin UC/no-admin UTFSM, admin ajeno con/sin visibilidad, validación, conflictos y rechazo de createdBy/isAdmin manipulados (FR-001/002/003/009).
- [X] T027 [P] [US2] Escribir backend/test/integration/enrollments.test.mjs: permisos por sección, actor/destinatario revocados, roles múltiples, POST repetido/concurrente, PATCH sucesor/reactivación y desactivación del último teacher sin borrar curso, cruces y rollback por fallo de evento (FR-004/006/008, SC-002/003).
- [X] T028 [P] [US2] Escribir backend/test/integration/course-audit.test.mjs para snapshots, precedencia admin dueño+teacher (incluye sectionId=null), teacher sin admin y eventos por scope, paginación/filtros, inmutabilidad y aislamiento de eventos institucionales; fault injection solo en fixtures (FR-007, SC-002).
- [X] T029 [US2] Agregar creación/configuración de curso en backend/src/courses/courses.service.ts y courses.controller.ts: PoolClient único, locks, owner fijo, primera sección/teacher/eventos y 409 sin parcialidad; probar fallo del último evento (FR-001/002/003).
- [X] T030 [US2] Agregar create/update de sección en backend/src/sections/sections.service.ts y sections.controller.ts con admin dueño, capacidad/código y auditoría transaccional (FR-003/006/007).
- [X] T031 [US2] Implementar backend/src/enrollments/enrollments.service.ts: listado paginado, alta idempotente, cambio por sucesor y desactivación/reactivación; serializar por curso y revalidar memberships/permiso bajo locks (FR-004/008).
- [X] T032 [US2] Exponer rutas y validación exacta en backend/src/enrollments/enrollments.controller.ts; registrar en backend/src/app.module.ts; 201/200/409 y Location según contrato, sin Idempotency-Key obligatorio (FR-004/006).
- [X] T033 [US2] Agregar consulta audit scoped en backend/src/audit/audit.service.ts y audit.controller.ts; filtros/cursor validados y registrar controlador en backend/src/app.module.ts (FR-007/009).
- [X] T034 [US2] Completar OpenAPI en docs/reference/openapi/paths/courses.yaml, sections.yaml, audit.yaml y components/schemas/courses.yaml, sections.yaml, audit.yaml: POST curso, admin+owner, DTO, errores, cursor, cambio por sucesor y no-op (FR-001–010).
- [X] T035 [US2] Regenerar frontend/src/lib/api/schema.d.ts y probar contratos de creación/escritura en frontend/test/api.test.ts; correr checks US2 y regresión US1 según specs/20261014-234844_cursos-roles/quickstart.md (SC-001–003).

**Checkpoint**: no cerrar US2 con negativos, carreras o auditoría pendientes.

## Phase 6: Integración y entrega

- [X] T036 Probar carreras reales de revocación de admin/superadmin/membership/User/Institution/teacher contra escritura, incluyendo requests tras COMMIT, en backend/test/integration/course-integrity.test.mjs; verificar orden de locks sin cambios parciales (FR-005/007/009).
- [X] T037 Alinear permisos de las misiones posteriores en docs/reference/openapi/paths/quizzes.yaml y gradebook.yaml, y enlazar ADR vigente desde sus specs; no implementar contenido/evaluación ni ampliar assistant (FR-005/009).
- [X] T038 Documentar migración poblada, onboarding y delegación y límite de dueño único en docs/reference/openapi/README.md y docs/backend/courses-roles-validation.md; distinguir planeado/implementado/verificado (FR-008/011).
- [X] T039 Validar integración real onboarding→delegación→creación→revocación; ejecutar backend lint/test/integration/coverage, OpenAPI lint, frontend api:check/typecheck/test y check-doc-length.py; guardar comandos/resultados reales y cobertura CU/RF/RNF en docs/backend/courses-roles-validation.md (SC-001–004).

## Dependencies & Execution Order

Orden de entrega: identidad-acceso → foundation → US1 → US3 → US2 → integración.
US3 puede probarse con foundation y fixtures de miembros, sin cursos ni US2.
US2 puede probarse con roles/admin de fixtures, sin invocar delegación US3.
La integración final une onboarding, concesión, creación y revocación reales.
Migración y AppModule tienen un solo editor; coordinar archivos compartidos.
Auditoría acompaña primera escritura y onboarding, nunca se difiere al viewer.

## Parallel Execution Examples

- Foundation: constraints || course-access, tras fixtures T005.
- US1: tests de cursos || tests de revocación/me, tras foundation.
- US2: tests de cursos || tests de enrollments || tests de audit, tras US1.
- US3: tests de onboarding || tests de delegación, tras foundation.
- US3 puede avanzar junto a US1/US2 coordinando AppModule/OpenAPI/tipos compartidos.
- [P] solo tareas de archivos distintos; no elimina prerrequisitos.

## Implementation Strategy

1. Entregar foundation y US1 como MVP de consulta con fixtures de dos tenants.
2. Entregar US3 para onboarding PM y delegación autónoma de permisos.
3. Entregar US2 para creación/administración propia con permisos concedidos por US3.
4. Sincronizar contratos/tipos y checks por historia; cerrar evidencia SC-001–004.
5. Sin UI, coordinador, grants múltiples, invitaciones ni transferencia de cursos.
