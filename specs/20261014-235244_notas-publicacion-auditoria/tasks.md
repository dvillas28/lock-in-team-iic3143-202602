# Tasks: Libro de notas, publicación y auditoría

**Input**: `specs/20261014-235244_notas-publicacion-auditoria/`.
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md.
**Status**: 35/36 completas; T036 pendiente de cierre por bloqueo heredado de auditoría (#96). Conservar responsables BE-26–32/DOC-15.
**Format**: `- [X] T001 [P?] [USn] Acción con ruta y referencia de aceptación`.
Tests requeridos por spec: permisos, integridad, revocación, UC/UTFSM y carreras.

## Phase 1: Setup

- [X] T001 Integrar código/migraciones reales de identidad, cursos, módulos, autoría e intentos desde sus ramas/worktrees, confirmar esquema GradeItem/Grade y predicado de pauta; registrar rutas/nombres/estado en specs/20261014-235244_notas-publicacion-auditoria/research.md y plan.md; bloquear Foundation si faltan dependencias, sin fakes de producción (FR-009/010).
- [X] T002 Confirmar timestamp libre posterior a dependencias para backend/migrations/20261019000300_grade_publication.sql y comandos/DB exclusiva en specs/20261014-235244_notas-publicacion-auditoria/quickstart.md; preservar migraciones aplicadas y cambios ajenos (FR-005/009).
- [X] T003 [P] Registrar decisiones de teacher+owner para pesos, sección histórica, selección explícita, freeze e idempotencia en docs/adr/grade-publication-and-weight-freeze.md y vincular CU/RF/RNF/backlog sin reasignar responsables (FR-001–010).

## Phase 2: Foundation

- [X] T004 Crear ledger grade_publications, FK/unique/checks y trigger append-only; reforzar freeze de GradeItem y Grade publicada según data-model.md en backend/migrations/20261019000300_grade_publication.sql; no recrear tablas de dependencias (FR-001/005/009).
- [X] T005 [P] Ampliar backend/src/audit/audit.service.ts con allowlists grade/gradebook y snapshot anidado de pesos; conservar tipos existentes y probar sanitización de escritura en backend/test/audit.test.mjs, sin permitir claves/answers/pauta ni objetos arbitrarios (FR-003/008).
- [X] T006 Implementar permisos teacher/owner/assistant/student y locks de actor→Course→Enrollment en backend/src/gradebook/gradebook-access.ts, reutilizando backend/src/courses/course-access.ts y predicado de pauta; alcance histórico y roles acumulados por acción (FR-002/007/009).
- [X] T007 [P] Implementar validación estricta y DTO compartidos en backend/src/gradebook/gradebook-validation.ts y gradebook-dto.ts; probar pesos exactos, duplicados, UUID, studentIds obligatorio y clave 1..200 sin coerción en backend/test/gradebook-validation.test.mjs (FR-001/003/006).
- [X] T008 Registrar servicio/controlador compilables sin rutas todavía en backend/src/gradebook/gradebook.service.ts, gradebook.controller.ts y backend/src/app.module.ts; ampliar backend/src/database/database.service.ts check con esquema requerido (FR-001/003/007).
- [X] T009 Crear fixtures SQL UC/UTFSM de esquema real con dos secciones, roles acumulados, destinatarios revocados, Grades graded/publicadas y pesos cero/SC-002 en backend/test/integration/gradebook-fixtures.mjs; permitir probar cada historia sin endpoints de la otra (FR-006/009/010).
- [X] T010 Probar constraints/unique/FK cruzadas, freeze por SQL directo, inmutabilidad de Grade/ledger y preservación de historia en backend/test/integration/gradebook-integrity.test.mjs; incluir cambio de identidad de GradeItem y datos preexistentes (FR-005/009).

**Checkpoint**: dependencias operativas y esquema real; T005 paralelo a T004;
T006 y T007 en archivos distintos tras T001. T008 requiere T006/T007; T009/T010 requieren T004.

## Phase 3: US1 - Configurar y publicar (P1)

**Goal**: reemplazar pesos y publicar toda la selección autorizada con auditoría.
**Independent Test**: Grades calificadas de Foundation; configurar 100 y publicar
sin endpoints US2 ni envío HTTP; repetir/fallar conserva datos y recibos.

- [X] T011 [US1] Añadir casos PUT completos, total !=100, fuera de rango/precisión, IDs faltantes/ajenos/repetidos, no-op y freeze en backend/test/integration/gradebook-weights.test.mjs; verificar before/after y rollback (FR-001/002/005; US1-1/3).
- [X] T012 [P] [US1] Añadir casos publicación íntegra, Grade ausente/no graded, activo/cancelado, selección alumno/sección histórica, publicado previo, replay reordenado y reutilización conflictiva de clave en backend/test/integration/gradebook-publication.test.mjs (FR-003/004/005; US1-1/2/3).
- [X] T013 [US1] Implementar GET ítems y PUT pesos en backend/src/gradebook/gradebook.service.ts: teacher+owner para mutar, colección completa exacta, NUMERIC 100, Course lock, freeze y auditoría atómica; no-op antes de freeze sin evento (FR-001/002/005).
- [X] T014 [US1] Implementar selección ítems×estudiantes con Grade en sección histórica elegida en backend/src/gradebook/gradebook.service.ts; validar todo el conjunto/alcance, estado graded y ausencia in_progress bajo locks ordenados sin exigir alumno vigente ni cancelar implícitamente (FR-003/004/009).
- [X] T015 [US1] Completar publicación/ledger en backend/src/gradebook/gradebook.service.ts: timestamp DB común, Grade inmutable, grade.published por nota, recibo durable, canonicalización y replay autorizado, otra clave sobre publicada 409; fallo revierte Grades/eventos/clave (FR-003/005/009).
- [X] T016 [US1] Exponer GET grade-items, PUT weights y POST publications con 200 explícito, header/body estrictos, Problem y no-store en backend/src/gradebook/gradebook.controller.ts (FR-001/003; contracts/http.md).
- [X] T017 [US1] Verificar y completar freeze de creación de GradeItem en backend/src/quizzes/quizzes.service.ts y bloqueo de start/submit sobre publicada en backend/src/attempts/attempts.service.ts usando rutas reales de T001; conservar replay original de submit, validaciones y locks Course comunes (FR-004/005/010).
- [X] T018 [US1] Añadir negativos actor/tenant/rol/revocación y permisos tras esperar Course, teacher sección ajena, assistant/admin sin teacher y alumno movido/revocado en backend/test/integration/gradebook-write-permissions.test.mjs; comprobar cero mutación o exposición (FR-002/003/009).
- [X] T019 [US1] Probar publicación-publicación (misma/distinta clave y solapamiento), clave igual entre cursos, publicación contra pesos/alta de ítem y start/submit/cancel HTTP en ambos órdenes con barreras DB en backend/test/integration/gradebook-concurrency.test.mjs (FR-003/004/005/010).
- [X] T020 [US1] Extender backend/test/integration/gradebook-publication.test.mjs con fallo inyectado en cada evento/recibo, reintento tras rollback, replay tras reinicio/revocación y comparación exacta de IDs/fechas/resultados/eventos sin duplicados; capturar stdout/stderr durante fallos y comprobar error observable sin sentinelas de Idempotency-Key/JWT/pauta/answers/datos identificables o notas de UC/UTFSM, reutilizando verificaciones de logs existentes (FR-003/009; SC-001; RNF9).
- [X] T021 [US1] Sincronizar studentIds requerido, teacher+owner de pesos, idempotencia, precisión y errores en docs/reference/openapi/paths/gradebook.yaml y components/schemas/grades.yaml; regenerar frontend/src/lib/api/schema.d.ts y probar consumidor en frontend/test/api.test.ts (FR-001–005).
- [X] T022 [US1] Verificar contratos HTTP reales y respuesta de todos los errores US1 en backend/test/integration/gradebook-contract.test.mjs; ejecutar checks de historia y registrar evidencia/pending en docs/backend/gradebook-validation.md (US1-1/2/3; SC-001).

**Checkpoint**: US1 desplegable; publica íntegramente, bloquea pesos/ítems posteriores
y permite replay durable, sin necesitar rutas de lectura de US2.

## Phase 4: US2 - Consultar resultados e historial (P1)

**Goal**: consultar solo resultados/eventos permitidos y promedio publicado exacto.
**Independent Test**: Foundation crea Grades/eventos por SQL; consultar como student,
assistant y teachers de distinto alcance sin ejecutar PUT/POST de US1.

- [X] T023 [US2] Añadir casos notas propias publicadas, ausencia, peso cero, SC-002=6.1/65%, empate HALF_UP, fila histórica, notas no publicadas visibles solo a teacher/assistant autorizados y paginación de libro en backend/test/integration/gradebook-read.test.mjs (FR-006/007/009; US2-1/2).
- [X] T024 [P] [US2] Añadir casos historial filtrado/sanitizado, eventos históricos con claves/answers/pauta, eventos globales owner y denegación student/assistant en backend/test/integration/gradebook-audit-read.test.mjs (FR-008/009; US2-4).
- [X] T025 [US2] Implementar consultas SQL parametrizadas de libro y my-grades en backend/src/gradebook/gradebook.service.ts: scope vigente/histórico, proyecciones mínimas, published-only propio, promedio NUMERIC/NULLIF/round y cursor estable según contracts/http.md sin duplicar por Enrollment (FR-006/007/009).
- [X] T026 [US2] Exponer GET gradebook/my-grades en backend/src/gradebook/gradebook.controller.ts sin studentId propio y con no-store, validación de filtros/cursor y DTO seguro de backend/src/gradebook/gradebook-dto.ts (FR-006/007).
- [X] T027 [US2] Implementar listQuizAttempts en backend/src/attempts/attempts.service.ts y attempts.controller.ts usando backend/src/attempts/attempt-dto.ts; filtrar tenant/quiz/alcance histórico y sectionId/studentId/status, paginar y proyectar por permiso de pauta sin ampliar acceso assistant (FR-007/009; US2-3).
- [X] T028 [US2] Sanitizar lectura histórica por allowlist en backend/src/audit/audit.service.ts conservando AuditController, filtros/curso/sección y owner sin teacher; ampliar backend/test/audit.test.mjs para snapshots nuevos y preservar consumidores institucionales (FR-008/009).
- [X] T029 [US2] Probar lista de intentos/vistas assistant sin isCorrect/pointsAwarded, roles acumulados, alumnos movidos y cursor cruzado en backend/test/integration/gradebook-attempts-read.test.mjs; validar campos permitidos con DTO real de intentos (FR-007/009; US2-3).
- [X] T030 [US2] Cubrir ID ajeno UC/UTFSM, consultas estudiantiles sin notas ajenas/no publicadas y staff sin notas fuera de su alcance, scope histórico, revocación User/Institution/membership/Enrollment/is_admin, filtros/cursor y páginas sin fuga en backend/test/integration/gradebook-read-permissions.test.mjs (FR-006–009; SC-003).
- [X] T031 [US2] Sincronizar my-grades null con peso cero, libro y unión anyOf académica/assistant de listado en docs/reference/openapi/paths/gradebook.yaml, quizzes.yaml, audit.yaml y components/schemas/grades.yaml, quizzes.yaml, audit.yaml; regenerar frontend/src/lib/api/schema.d.ts y cubrir consumidor en frontend/test/api.test.ts (FR-006–008).
- [X] T032 [US2] Ampliar backend/test/integration/gradebook-contract.test.mjs con respuestas/filtros/paginación/no-store y proyecciones US2; ejecutar US2 con fixtures independientes y registrar resultados en docs/backend/gradebook-validation.md (US2-1/2/3/4).

**Checkpoint**: US2 verificable sin endpoints US1; consultas estudiantiles solo
muestran notas propias publicadas; staff autorizado consulta no publicadas en su
alcance. Errores y paginación no amplían permisos; auditoría permanece sanitizada.

## Phase 5: Integración y entrega

- [X] T033 Probar flujo real identidad→institución→curso→quiz→intento→Grade→publicación→consulta en UC/UTFSM en backend/test/integration/academic-flow.test.mjs; mapear los 16 CU a suites existentes/nuevas y completar faltantes según docs/deliveries/2/03-use-cases-and-requirements.md (FR-010; SC-003).
- [X] T034 Verificar instalación vacía/upgrade poblado/migrador repetido, persistencia tras reinicio y readiness en backend/test/integration/gradebook-integrity.test.mjs y backend/test/integration/readiness.test.mjs; conservar notas/eventos/identidades anteriores y reutilizar la comprobación de /health (status/version/commit/deployedAt/timestamp) sin secretos ni datos académicos (FR-005/009; RNF9).
- [X] T035 Alinear recibos, freeze, precisión, sección histórica y permisos en docs/deliveries/2/06-data-model-part-2.md, 06-data-model-part-3.md, 12-data-catalog-part-1.md, 12-data-catalog-part-2.md y docs/reference/openapi/README.md; vincular ADR sin exceder límites (FR-001–009; DOC-15).
- [ ] T036 Ejecutar lint/build/test/integration/coverage, OpenAPI lint, api:check/typecheck/test consumidor y longitud documental de specs/20261014-235244_notas-publicacion-auditoria/quickstart.md; registrar comandos/resultados, CU/FR/SC, evidencia RNF9 de T020/T034 (logs sanitizados, health y metadatos de despliegue) y pendientes en docs/backend/gradebook-validation.md; no cerrar con negativos pendientes (FR-010; SC-001/002/003).

## Dependencies & Execution Order

```text
Setup T001–T003 → Foundation T004–T010 → US1 T011–T022 → integración T033–T036
                                     → US2 T023–T032 → integración T033–T036
```

T001 es gate real; T003 puede redactarse en paralelo a T002 tras resolver T001.
US1/US2 se verifican por separado con fixtures de Foundation; orden recomendado
US1→US2 porque comparten servicio/controlador/contratos, no porque US2 llame US1.
T013→T014→T015→T016; T019 requiere T016/T017 y endpoints reales de dependencias.
T025→T026; T027 requiere DTO de intentos confirmado en T001; T028 requiere T005.
T033 requiere ambas historias y todas las misiones anteriores operativas.
No paralelizar escrituras de migración, servicio/controlador, AuditService o schemas compartidos.

## Parallel Execution Examples

- US1: tras Foundation, T011 y T012 escriben tests distintos. Tras T016, T018
  puede redactarse junto a T019 en archivos distintos; ejecutar al terminar dependencias.
- US2: T023 y T024 escriben tests distintos tras Foundation. T027 y T028 pueden
  implementarse juntos después de T005/T001 sin tocar servicio gradebook.
- Foundation: T004/T005 y T006/T007 usan archivos distintos; ejecutar tests tras sus requisitos.

## Implementation Strategy

1. Confirmar/integrar dependencias sin dar por implementado lo que solo está planeado.
2. Completar Foundation con esquema, fixtures y seguridad; ninguna infraestructura futura.
3. Entregar MVP US1 con publicación, freeze y negativos completos.
4. Entregar US2 con fixtures propias, decimales, lectura por rol e historial seguro.
5. Integrar los 16 CU, carreras reales y migraciones; evidencia verificable antes de cierre.
