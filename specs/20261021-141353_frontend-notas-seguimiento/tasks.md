# Tasks: Notas y seguimiento frontend

**Input**: `specs/20261021-141353_frontend-notas-seguimiento/`.
**Prerequisites**: [plan](plan.md), [research](research.md), [modelo](data-model.md),
[notas/publicación](contracts/gradebook.md), [seguimiento](contracts/tracking-audit.md).
**Owners**: JC/MA; FE-17→US1, FE-18→US2, FE-15/16→US3, FE-19→US4, FE-20 transversal.
**Formato**: checkbox + ID secuencial; [P] solo archivos independientes y prerrequisitos listos.
Pruebas requeridas por FR-020; no añadir API, DB, migraciones ni dependencias.

## Phase 1: Setup

- [X] T001 [P] Crear fixtures UC/UTFSM de notas propias, libro histórico, pesos, freeze y recibos en `frontend/test/fixtures/gradebook.ts`, incluidos revocados, peso0 y multirol (FR-002–012/020).
- [X] T002 [P] Crear fixtures de auditoría por actor/sección/global, páginas y snapshots sanitizados en `frontend/test/fixtures/audit.ts` (FR-014–016/020).

## Phase 2: Foundation

- [X] T003 Implementar capacidades por acción/curso/sección en `frontend/src/lib/gradebook/capabilities.ts`, separando owner sin teacher, teacher owner, assistant y student con memberships actuales (FR-004/005/007/014).
- [X] T004 Probar matriz anterior, multirol y superadmin aislado en `frontend/test/gradebook-capabilities.test.ts`; exigir teacher para pesos/libro y permitir owner sin teacher solo en auditoría (FR-020).

**Checkpoint**: Foundation lista; sesión/cliente/useResource existentes conservan
contexto. No usar capabilities.configure como autorización académica genérica.

## Phase 3: US1 — Consultar mis notas publicadas (P1, MVP)

**Goal**: Notas propias publicadas y promedio backend, sin editor docente.
**Independent Test**: Fixtures publicada/oculta/sin publicaciones/peso0; solo GET
my-grades sin studentId y ningún resultado anticipado en DOM/requests.

- [X] T005 [P] [US1] Probar GET sin query, DTO/curso inválido y errores en `frontend/test/gradebook-student-api.test.ts` (FR-001–003/018).
- [X] T006 [P] [US1] Probar notas ocultas ausentes, promedio backend/null, peso0, logout y respuesta tardía UC/UTFSM en `frontend/test/gradebook-student-ui.test.ts` (US1.1–3, FR-018/020).
- [X] T007 [US1] Implementar parser StudentGradesResponse en `frontend/src/lib/gradebook/validation.ts` y getStudentGrades en `frontend/src/lib/api/gradebook.ts`; validar curso/valores sin recalcular promedio (FR-002/003).
- [X] T008 [US1] Crear tabla/resumen accesible en `frontend/src/components/gradebook/student-grades.tsx` y ruta protegida `frontend/src/app/courses/[courseId]/grades/page.tsx`; scope generation/slug/actor/curso y estados comunes (FR-001/018/019).
- [X] T009 [US1] Integrar enlace student, breadcrumb y retorno UUID seguro en `frontend/src/components/courses/course-detail.tsx`, `frontend/src/components/institutions/institution-shell.tsx`, `frontend/src/lib/auth/navigation.ts`; ampliar `frontend/test/session.test.ts` (FR-001/018).

**Checkpoint**: US1 funciona sin implementar US2/US3/US4.

## Phase 4: US2 — Consultar libro y revisar intentos (P1)

**Goal**: Seguimiento histórico autorizado; assistant sin corrección ni escritura.
**Independent Test**: Libro/intentos fixture teacher/assistant/owner sin teacher,
filas revocadas y multirol; sin publicación ni autoría requeridas.

- [X] T010 [P] [US2] Probar libro paginado con clave student.id/sectionId, curso cruzado, cursor/filtro y promedio publicado en `frontend/test/gradebook-book-api.test.ts` (FR-004/006/016).
- [X] T011 [P] [US2] Probar vistas teacher/staff/student propio multirol, answers sin corrección assistant y errores/cancel link en `frontend/test/tracking-attempts.test.ts`; extender `frontend/test/fixtures/attempts.ts` sin romper rendición (FR-005/017/020).
- [X] T012 [US2] Añadir parsers GradeItem/GradebookResponse en `frontend/src/lib/gradebook/validation.ts` y listCourseGradeItems/getCourseGradebook en `frontend/src/lib/api/gradebook.ts`; validar relaciones y clave compuesta, sin usar page genérico por id (FR-004/006).
- [X] T013 [P] [US2] Crear `frontend/src/components/gradebook/course-gradebook.tsx` y `frontend/src/app/courses/[courseId]/gradebook/page.tsx`; filtros solo secciones autorizadas, páginas reiniciables, filas históricas y promedio backend (FR-004/006/016/019).
- [X] T014 [P] [US2] Crear parser académico separado en `frontend/src/lib/attempts/review.ts` y extender `frontend/src/lib/api/attempts.ts` con listQuizAttempts/lectura de revisión; preservar getAttempt/parser estudiantil de misión5 y aceptar proyección limitada multirol (FR-005/013).
- [X] T015 [US2] Crear listado/detalle en `frontend/src/components/attempts/attempt-list.tsx`, `frontend/src/components/attempts/attempt-review.tsx` y páginas `frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/page.tsx`, `frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/[attemptId]/page.tsx`; verificar quiz/curso y enlazar cancelación misión5 solo con permiso vigente (FR-001/005/017).
- [X] T016 [US2] Añadir enlaces a libro/intentos y breadcrumb/retorno seguro en `frontend/src/components/courses/course-detail.tsx`, `frontend/src/components/quizzes/quiz-detail.tsx`, `frontend/src/components/institutions/institution-shell.tsx`, `frontend/src/lib/auth/navigation.ts`; libro enlaza revisión por gradeItem.quizId/attemptId (FR-001/017).
- [X] T017 [US2] Probar filas históricas, páginas/filtros, assistant sin pauta/controles, owner sin teacher denegado, revocación y respuestas tardías en `frontend/test/gradebook-book-ui.test.ts`; ampliar `frontend/test/session.test.ts` para rutas nuevas (US2.1–4, FR-018/020).

**Checkpoint**: Consulta independiente de US3; cancelación real reutiliza misión5.

## Phase 5: US3 — Configurar pesos y publicar explícitamente (P2)

**Goal**: Pesos válidos hasta freeze y publicación rectangular confirmada/repetible.
**Independent Test**: Fixtures sin freeze/con freeze, pares incompletos y POST con
respuesta perdida; recibo original al repetir exactamente selección/clave.

- [X] T018 [P] [US3] Probar pesos completos/únicos/decimales/suma exacta, freeze en página posterior y 409 incluso no-op en `frontend/test/gradebook-weights.test.ts` (FR-007/008).
- [X] T019 [P] [US3] Probar publicación rectangular, UUID canónicos, selección explícita/cantidad, doble clic y replay/conflictos en `frontend/test/gradebook-publication.test.ts` (FR-009–013/020).
- [X] T020 [US3] Añadir validadores de pesos en centésimas y selección UUID minúscula/ordenada en `frontend/src/lib/gradebook/validation.ts`; rechazar duplicados, vacíos y cuerpos JSON UTF-8 >4096 bytes (FR-007/009/011).
- [X] T021 [US3] Añadir updateGradebookWeights/publishGrades a `frontend/src/lib/api/gradebook.ts` con Idempotency-Key estable, respuesta confirmada y códigos de conflicto; no exponer problem.detail (FR-008/011/018).
- [X] T022 [P] [US3] Implementar `frontend/src/components/gradebook/weights-form.tsx`: leer libro global completo antes de habilitar, estados unknown/unlocked/locked, bloqueo por publicación/409 y conciliación explícita de PUT incierto sin reenvío automático (FR-007/008/018).
- [X] T023 [P] [US3] Implementar coordinación de operación en `frontend/src/lib/gradebook/publication.ts`: scope/selección/clave en memoria, snapshot inmutable, sending/uncertain/confirmed/rejected y replay exacto; pérdida de contexto limpia operación (FR-011/012/018).
- [X] T024 [US3] Crear `frontend/src/components/gradebook/grade-publication.tsx` con selección explícita de ítems/secciones/alumnos revisados, validación de todos los pares y diálogo de cantidades/foco/aria-live; sin seleccionar páginas invisibles ni cancelar intentos (FR-009/010/019).
- [X] T025 [US3] Integrar pesos/publicación por capacidad en `frontend/src/components/gradebook/course-gradebook.tsx`; refrescar lecturas y bloquear pesos tras recibo, explicar recarga sin clave e impedir publicar con selección incierta (FR-008/012/013).
- [X] T026 [US3] Probar red/timeout/respuesta inválida, POST concurrente, 409 sin rotación, logout/revocación, cambio de sección y recarga sin replay en `frontend/test/gradebook-publication-session.test.ts`; distinguir estado observado de recibo original (US3.1–5, FR-020).
- [X] T027 [US3] Verificar diálogo, cantidades, rectángulo incompleto, permisos y freeze en UI con `frontend/test/gradebook-publication-ui.test.ts`; ninguna mutación fallida figura confirmada ni cancela automáticamente (FR-009/010/019).

**Checkpoint**: US3 usa lectura US2; integridad final/locks se verifican con API real.

## Phase 6: US4 — Consultar auditoría del curso (P2)

**Goal**: Historia sanitizada dentro del alcance vigente, sin conceder libro/pauta.
**Independent Test**: Eventos globales y de secciones fixture con owner sin teacher,
teacher ordinario y actores denegados; sin ejecutar nuevas mutaciones.

- [X] T028 [P] [US4] Probar filtros contractuales/UTC inclusivo, rango, límite, cursor y curso/institución cruzados en `frontend/test/audit-api.test.ts` (FR-014–016/020).
- [X] T029 [P] [US4] Probar owner sin teacher, teacher sección, assistant/student denegados, snapshot escapado y cambio de scope en `frontend/test/audit-ui.test.ts` (US4.1–3, FR-018/019).
- [X] T030 [US4] Crear parsers/filtros en `frontend/src/lib/audit/validation.ts` y listCourseAuditEvents en `frontend/src/lib/api/audit.ts`; convertir fechas a UTC, validar curso/institución y mantener actions como texto acotado (FR-014–016).
- [X] T031 [US4] Crear filtros/listado/paginación/snapshots texto en `frontend/src/components/audit/course-audit.tsx` y ruta `frontend/src/app/courses/[courseId]/audit/page.tsx`; sin HTML ni reconstrucción de campos ocultos (FR-014–016/019).
- [X] T032 [US4] Integrar enlace audit por capacidad, breadcrumbs y retorno UUID seguro en `frontend/src/components/courses/course-detail.tsx`, `frontend/src/components/institutions/institution-shell.tsx`, `frontend/src/lib/auth/navigation.ts`; ampliar `frontend/test/session.test.ts` sin habilitar libro a owner sin teacher (FR-001/014/018).

**Checkpoint**: US4 solo requiere foundation y fixtures, puede adelantarse a US2/US3.

## Phase 7: Polish & Cross-Cutting Delivery

- [X] T033 Ejecutar checks y escenarios API real de `specs/20261021-141353_frontend-notas-seguimiento/quickstart.md`: UC/UTFSM, multirol, revocación, freeze concurrente, replay/historial único y ninguna exposición anticipada; registrar evidencia en `docs/guides/frontend-grades-tracking.md` (FR-020).
- [X] T034 Consolidar FE-20 sobre seis recorridos en `docs/guides/frontend-grades-tracking.md`: teclado/foco, th/scope, labels/aria-live, 375px, claro/oscuro, contraste y movimiento reducido; marcar pendientes de otras misiones sin declararlas implementadas (FR-019/021).
- [X] T035 Corregir solo problemas encontrados en tablas/diálogos/shell de `frontend/src/components/gradebook/`, `frontend/src/components/attempts/`, `frontend/src/components/audit/`, `frontend/src/components/institutions/institution-shell.tsx`; reusar `frontend/src/styles/app.css` y tokens canónicos, y repetir checks afectados (FR-019).
- [X] T036 Ejecutar api:check/typecheck/lint/test/build de `frontend/package.json` y `.github/scripts/check-doc-length.py`; actualizar evidencia/CU-RF-RNF, exclusiones y pendientes en `docs/guides/frontend-grades-tracking.md` antes de cerrar (FR-020/021).

## Dependencies & Execution Order

T001/T002 → T003 → T004 → historias. US1/US2/US4 no dependen entre sí;
US3 depende de parsers/lectura del libro de US2 (T012/T013) y foundation.
Ruta de cancelación depende de misión5; consulta de revisión conserva entrega propia.
US1 y US2 son P1; US3/US4 son P2. Integración final exige todas las historias.
Shared files (gradebook API/validation, navegación, shell y session.test) tienen
un escritor a la vez; no ejecutar paralelamente tareas que los modifican.

## Parallel Execution Examples

- Setup: T001 y T002 en archivos distintos.
- US1: T005 y T006 tras foundation; integración T009 secuencial con navegación ajena.
- US2: T010 y T011 tras foundation; T013 y T014 tras T012, archivos independientes.
- US3: T018 y T019 tras lectura US2; T022 y T023 tras T020/T021, archivos distintos.
- US4: T028 y T029 tras foundation; T030/T031 secuenciales, T032 espera shell libre.
- Estas oportunidades describen implementación futura; no requieren agentes ahora.

## Implementation Strategy

1. MVP: foundation + US1 (FE-17), validar publicadas/pendiente/aislamiento por separado.
2. Entregar US2 de solo consulta (FE-18), preservando representación segura por actor.
3. Entregar US3 (FE-15/16), pesos antes de publicación; probar recuperación y freeze.
4. Entregar US4 (FE-19) de forma independiente; consolidar FE-20 y evidencia real.
5. No marcar tareas completas por generar este plan; producto y aceptación pendientes.
