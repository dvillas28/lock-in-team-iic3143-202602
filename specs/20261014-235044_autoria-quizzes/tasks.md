# Tasks: Autoría y publicación de quizzes

**Input**: `specs/20261014-235044_autoria-quizzes/`.
**Base**: `origin/dev` @ `52aa9ee`; #90 integrado el 2026-10-20.
**Prerequisitos**: [plan](plan.md), [modelo](data-model.md), [HTTP](contracts/http.md),
[autorización](contracts/authorization.md), [integración](contracts/academic-integration.md).
**Estado**: Todas pendientes. Preservar responsables BE-15–17 y parte BE-24.
**Formato**: IDs secuenciales; [P] solo archivos distintos sin dependencia entre sí.
Tests solicitados por spec: dos tenants, permisos, integridad, sanitización y revocación.
Cada archivo <150 líneas; 150–200 solo con excepción motivada; >200 dividir.

## Phase 1: Setup

- [ ] T001 Confirmar prerequisitos #90, CU-07/RF17–18/25–27/RNF1–4, exclusiones y responsables en specs/20261014-235044_autoria-quizzes/plan.md.
- [ ] T002 Verificar secuencia libre de migraciones y comandos reales contra base poblada de #90; registrar límites y pendientes en specs/20261014-235044_autoria-quizzes/quickstart.md.

## Phase 2: Foundation

- [ ] T003 Crear quizzes/grade_items con FK compuestas, índices/constraints del modelo, marker monotónico de Course y trigger INSERT GradeItem con lock/error grade_items_course_frozen en backend/migrations/20261019000100_quiz_authoring.sql (FR-002/003/004/005).
- [ ] T004 [P] Agregar fixtures SQL UC/UTFSM con dos secciones, roles acumulados, draft/publicado/ítem y marcador, reutilizando course-fixtures en backend/test/integration/quiz-fixtures.mjs (Assumptions).
- [ ] T005 [P] Implementar canAuthorQuiz, permiso origen/destino para reasignación draft, visibilidad y orden global de locks con course-access en backend/src/quizzes/quiz-access.ts (FR-001/008/009).
- [ ] T006 [P] Implementar validación exacta create/PATCH, JSON anidado, IDs retenidos, suma de puntos/fechas y publish no vacío en backend/src/quizzes/quiz-validation.ts (FR-001/002/003).
- [ ] T007 [P] Implementar proyecciones positivas Summary/Student/Authoring y snapshot de metadata según contratos en backend/src/quizzes/quiz-dto.ts (FR-006).
- [ ] T008 Extender allowlist quiz con metadata/contadores sin pauta; probar before/after sectionId de reasignación con evento de curso sectionId=NULL en backend/src/audit/audit.service.ts y backend/test/audit.test.mjs (FR-004/006).
- [ ] T009 Verificar columnas quizzes/grade_items/marcador en backend/src/database/database.service.ts y readiness en backend/test/integration/readiness.test.mjs (Prerequisitos).
- [ ] T010 Registrar servicio/controlador compilables sin rutas de historias en backend/src/quizzes/quizzes.service.ts, backend/src/quizzes/quizzes.controller.ts y backend/src/app.module.ts (independencia).
- [ ] T011 Sincronizar QuizUpdate.sectionId opcional/nullable con permiso origen/destino, QuestionUpdate.id, scopes y retry en docs/reference/openapi/paths/quizzes.yaml y docs/reference/openapi/components/schemas/quizzes.yaml; conservar contratos futuros (FR-001..009).
- [ ] T012 Regenerar frontend/src/lib/api/schema.d.ts, comprobar consumidor base en frontend/test/api.test.ts y pnpm docs:api:lint; sin tipos manuales ni UI (FR-006).
- [ ] T013 Probar validación/IDs/DTO seguro y scopes múltiples/estado publicado en backend/test/quiz-validation.test.mjs y backend/test/quiz-access.test.mjs (FR-001/002/003/006/008/009).
- [ ] T014 Probar up vacío/upgrade #90, FK cruzadas, GradeItem único, trigger marcador y rechazo INSERT con freeze en backend/test/integration/quiz-schema.test.mjs (FR-003/004/005).

**Checkpoint**: Build/readiness pasan; SQL/DTO/audit/contrato listos antes de historias.
T004–T007 son paralelos tras T003; T011/T012 comparten cadena y no se paralelizan.
T008/T009/T010 se ejecutan después de helpers y migración; no duplicar implementaciones.

## Phase 3: US1 — Preparar evaluación (P1)

**Meta**: docente prepara y publica evaluación autorizada con único GradeItem.
**Prueba independiente**: publicar draft válido, rechazar vacío/inválido y verificar
ítem/evento atómicos; no depende de lista/GET seguro de US2 ni endpoints futuros.

- [ ] T015 [P] [US1] Cubrir create/PATCH/authoring, IDs/entradas inválidas UC/UTFSM, reasignación sección/NULL con permiso origen/destino y create/PATCH/publish tras revocar User/Institution/membership/teacher/is_admin en backend/test/integration/quiz-authoring.test.mjs (US1-A2/A3; FR-001/002/003/009).
- [ ] T016 [P] [US1] Cubrir publish válido/vacío, no-op incluso congelado, peso inicial 0 y único ítem/evento en backend/test/integration/quiz-publish.test.mjs (US1-A1/A2; FR-004/005).
- [ ] T017 [P] [US1] Probar dos publish, PATCH/reasignación vs publish, freeze vs publish y revocación de cada capa vs create/PATCH/publish en ambos órdenes con barreras SQL, fallo audit/rollback en backend/test/integration/quiz-integrity.test.mjs (Edge Cases; FR-001/004/005/008/009).
- [ ] T018 [US1] Implementar create/PATCH y reasignación sectionId solo draft con autorización origen/destino, IDs primarios estables y audit quiz.updated de curso ante reasignación, en tx única en backend/src/quizzes/quizzes.service.ts (FR-001/002/003/006/009).
- [ ] T019 [US1] Implementar publish con Course→Quiz, no-op antes de freeze, GradeItem/audit atómicos y mapeo específico 23514/grade_items_course_frozen→409 dentro de callback transaction en backend/src/quizzes/quizzes.service.ts (FR-004/005).
- [ ] T020 [US1] Implementar consulta authoring autorizada por mismo canAuthorQuiz sin cachear roles en backend/src/quizzes/quizzes.service.ts (FR-006/009).
- [ ] T021 [US1] Exponer POST create/Location, PATCH, publish y GET authoring con validación estricta y DTO autorizado en backend/src/quizzes/quizzes.controller.ts (contracts/http.md).
- [ ] T022 [US1] Comprobar PATCH publicado 409, no-op auditado correctamente y errores/logs/audit sin centinelas de pauta en backend/test/integration/quiz-authoring.test.mjs y backend/test/integration/quiz-integrity.test.mjs (FR-006/008).
- [ ] T023 [US1] Ejecutar tests T015–T022, build/lint y aceptación US1 sin US2; registrar resultados reales en docs/backend/quiz-authoring-validation.md (SC-001/003).

**Checkpoint**: US1 deployable; todos los writes ya sanitizan audit y respuestas.
Pauta solo se devuelve en rutas docentes autorizadas; ningún endpoint estudiantil
se entrega antes de su proyección segura. Conservar contrato integrado de foundation.

## Phase 4: US2 — Proteger pauta (P1)

**Meta**: destinatarios consultan quiz sin pauta; política común bloquea rendición
si canAuthorQuiz. US2 usa fixtures SQL, no depende de tareas US1 para sus GET.
**Prueba independiente**: comparar DTO seguro/autoría generado con fixture,
probar published draft-only y rol student+teacher con guard; sin tabla de intentos.

- [ ] T024 [P] [US2] Cubrir lista/GET, filtros, drafts, global/sección y visibilidad tras reasignación preparada por SQL, dos tenants y proyección exacta en backend/test/integration/quiz-read.test.mjs (US2-A1; FR-006/009).
- [ ] T025 [P] [US2] Cubrir enlaces tras revocar User/Institution/membership/Enrollment/is_admin, conservando roles restantes en backend/test/integration/quiz-revocation.test.mjs (Edge Cases; FR-006/009).
- [ ] T026 [P] [US2] Probar canAuthorQuiz vs student acumulado, teacher ajeno a sección, draft/publicado y estado inmutable con fixtures/predicados en backend/test/quiz-access.test.mjs (US2-A2; FR-007/008).
- [ ] T027 [US2] Exportar requireStudentAttemptEligibility con student vigente, destino compatible y negación del mismo canAuthorQuiz en backend/src/quizzes/quiz-access.ts (FR-007; contracts/academic-integration.md).
- [ ] T028 [US2] Implementar lista/GET con filtros SQL tenant/curso/destinatario/publicación y DTO positivo ordenado en backend/src/quizzes/quizzes.service.ts (FR-006/009).
- [ ] T029 [US2] Exponer GET lista/quiz y validar sectionId sin ampliar scope en backend/src/quizzes/quizzes.controller.ts (US2-A1; contracts/http.md).
- [ ] T030 [US2] Comparar DTO autoría generado con GET seguro, probar no-store/nosniff, 413 y errores/audit sin pauta ni snapshots de origen para teacher solo destino, usando fixtures SQL en backend/test/integration/quiz-contract.test.mjs (FR-006; SC-002).
- [ ] T031 [US2] Verificar lista/GET seguros mediante cliente generado y rechazo de campos secretos en frontend/test/api.test.ts (US2-A1; FR-006).
- [ ] T032 [US2] Ejecutar T024–T031 sobre fixtures SQL con US1 ausente y luego regresión conjunta; registrar guard probado vs HTTP de intento pendiente en docs/backend/quiz-authoring-validation.md (SC-002/003).

**Checkpoint**: US2 consultable sin US1; no atribuir integración real de intentos.
PATCH HTTP de fixture publicada se verifica con US1 en cierre; el bloqueo del
predicado compartido sí se prueba en US2 aislada y no requiere tabla de intentos.

## Phase 5: Integración y entrega

- [ ] T033 Ejecutar suite conjunta con published fixtures: asegurar PATCH 409 protege pauta/puntos/maxAttempts y POST publish repetido no duplica en backend/test/integration/quiz-integrity.test.mjs (US2-A2; FR-008; SC-003).
- [ ] T034 Completar comprobación de upgrade poblado, rerun del migrador, rollback operativo y preservación de datos #90 en backend/test/integration/quiz-schema.test.mjs (RNF1–4).
- [ ] T035 Verificar cierre local vs gates de integración FR-005/007/008 en specs/20261014-235044_autoria-quizzes/spec.md y contracts/academic-integration.md del mismo directorio, con referencias obligatorias en specs/20261014-235144_intentos-calificacion/spec.md y specs/20261014-235244_notas-publicacion-auditoria/spec.md.
- [ ] T036 Ejecutar docs:api:lint, api:check/typecheck/tests frontend y backend lint/test:coverage; registrar salidas y pendientes en docs/backend/quiz-authoring-validation.md (SC-001..003).
- [ ] T037 Actualizar estado real de rutas/limitación 4 KiB y enlazar evidencia en docs/reference/openapi/README.md; mantener authored docs <150 líneas (Constitution VI).
- [ ] T038 Ejecutar .github/scripts/check-doc-length.py y git diff --check; registrar trazabilidad FR/SC y marcar solo tareas realmente completadas en specs/20261014-235044_autoria-quizzes/tasks.md (Constitution V/VI).

## Dependencies & Execution Order

Setup → Foundation → US1 o US2 → Integración. Ambas historias requieren Foundation.
US1 y US2 comparten quizzes.service.ts/controller.ts: ejecutar sus ediciones en serie.
Ninguna requiere implementación de intentos/notas; esos consumidores deben cumplir
contracts/academic-integration.md y agregar luego pruebas HTTP/Grade reales.
US1: T015/T016/T017 paralelos; luego T018→T019→T020→T021→T022→T023.
US2: T024/T025/T026 paralelos; luego T027→T028→T029→T030→T031→T032.
Escrituras/tests compartidos de audit, schema y cliente tienen un solo responsable;
T022 y T033 retoman archivos de su historia, después de sus tareas previas.

## Parallel Execution Examples

- Foundation: T004 fixtures, T005 scope, T006 validación y T007 DTO en archivos distintos.
- US1: preparar pruebas T015 authoring, T016 publish y T017 integrity simultáneamente.
- US2: preparar pruebas T024 lectura, T025 revocación y T026 predicados simultáneamente.
- No paralelizar ediciones US1/US2 del mismo servicio/controlador ni tipos y su fuente.

## Implementation Strategy

Entrega en dos PRs: documentación en `docs/autoria-quizzes-plan` sobre #90;
código, contratos OpenAPI/tipos generados, pruebas y evidencia en `feat/autoria-quizzes`
sobre el documental. Foundation es una fase interna del PR de código, sin PR separado.

1. Confirmar base integrada en dev y completar Foundation sin tablas/endpoints futuros.
2. MVP: US1 con todos sus negativos, auditoría y unicidad; no omitir sanitización.
3. Agregar US2 con fixtures independientes y guard de elegibilidad compartido.
4. Cerrar regresiones, trazabilidad y evidencia; no marcar tests no ejecutados.
