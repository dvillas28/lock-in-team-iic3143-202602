# Tasks: Autoría frontend de quizzes

**Input**: `specs/20261021-141351_frontend-autoria-quizzes/`.
**Prerequisites**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contrato](contracts/quiz-authoring.md), [quickstart](quickstart.md).
**Backlog**: FE-11/20 (JC/MA), CU-07, RF17–18/25–27, RNF1–4/7/9.
**Estado**: 35/35 tareas implementadas y validadas; evidencia y límites en docs/guides/frontend-quiz-authoring.md.
**Formato**: checkbox + ID secuencial + [P] opcional + [USn] en historia + paths.
[P] exige archivos distintos y dependencias previas completas. Sin migraciones ni API nueva.

## Phase 1: Setup

- [X] T001 Confirmar cobertura, exclusiones y matiz FR-010 (bloquea publicación, no guardado draft) en `specs/20261021-141351_frontend-autoria-quizzes/plan.md`; conservar trazabilidad FE-11/20 y contrato vigente.
- [X] T002 Verificar scripts/stack de `frontend/package.json` y prerrequisitos de `specs/20261021-141351_frontend-autoria-quizzes/quickstart.md`; no añadir dependencias ni tocar cambios previos de contenido.

## Phase 2: Foundation

- [X] T003 [P] Definir tipos OpenAPI y parsers separados de resumen/detalle seguro/autoría, validando IDs y courseId en `frontend/src/lib/quizzes/validation.ts`; excluir pauta de proyecciones seguras (FR-002).
- [X] T004 [P] Implementar capability por destino en `frontend/src/lib/quizzes/capabilities.ts` y matriz en `frontend/test/quiz-capabilities.test.ts`: teacher activo, ordinario/admin dueño, admin no dueño, admin/superadmin aislado y multirol; origen/destino (FR-003/004/011).
- [X] T005 Crear fixtures UC/UTFSM, cursos/secciones, drafts vacíos/válidos, publicado/congelado y roles en `frontend/test/fixtures/quizzes.ts`, reutilizando `frontend/test/fixtures/course-ui.ts`; respuestas tardías/revocadas (FR-016).
- [X] T006 Preparar adaptadores con cliente existente, path validado y parsers de T003 en `frontend/src/lib/api/quizzes.ts`, y checks de DTO/relaciones/ausencia de pauta en `frontend/test/quiz-api.test.ts`; no almacenar respuestas globalmente (FR-001/002/013).

**Checkpoint**: contexto institucional y permisos reconciliados; ningún rol visual concede pauta.
No cambiar DB/RLS ni helpers globales salvo falta comprobada; preservar callers existentes.

## Phase 3: US1 - Consultar y crear borradores autorizados (P1)

**Goal**: docente encuentra quizzes y crea draft sin depender del editor de preguntas.
**Independent Test**: fixtures teacher ordinario/admin dueño; lista segura y alta questions:[];
assistant/student/admin aislado sin pauta ni autoría. Cubre US1.1–3.

- [X] T007 [P] [US1] Ampliar `frontend/test/quiz-api.test.ts` con lista/get/create, configuración/null, paths UC/UTFSM cruzados, sección ajena y DTO inesperado; no isCorrect en respuestas seguras (FR-001/002/004/005).
- [X] T008 [P] [US1] Añadir `frontend/test/quiz-list.test.ts` con carga/vacío/error, destinos por rol, entrada directa y cero solicitudes /authoring por consulta/prefetch; pérdida POST y candidatos ambiguos (FR-002/003/012).
- [X] T009 [US1] Completar listCourseQuizzes/getQuiz/createQuiz en `frontend/src/lib/api/quizzes.ts` con filtro sectionId opcional, bodies ≤4096 bytes y errores seguros, sin retries (FR-001/005/012).
- [X] T010 [US1] Implementar listado/resumen en `frontend/src/components/quizzes/quiz-list.tsx` y detalle seguro en `frontend/src/components/quizzes/quiz-detail.tsx`; scope generation/slug/courseId/quizId, retorno al curso y relación padre validada (FR-001/002/013).
- [X] T011 [US1] Implementar creación manual en `frontend/src/components/quizzes/quiz-create.tsx`: título, destino, instrucciones, ventana con zona e intentos nulos; questions vacío, sección explícita ordinaria, curso solo autorizado (FR-004/005/008).
- [X] T012 [US1] Integrar `frontend/src/app/courses/[courseId]/quizzes/page.tsx` y `frontend/src/app/courses/[courseId]/quizzes/[quizId]/page.tsx` con ProtectedInstitution; enlaces en `frontend/src/components/courses/course-detail.tsx` y `frontend/src/components/institutions/institution-shell.tsx` (FR-001).
- [X] T013 [US1] Resolver alta incierta en `frontend/src/components/quizzes/quiz-create.tsx`: bloquear envío, consultar lista, mostrar candidatos sin asumir éxito por título; conservar texto autorizado y no resetear por refresh (FR-012/013).
- [X] T014 [US1] Ejecutar checks US1 de `frontend/test/quiz-api.test.ts`, `frontend/test/quiz-list.test.ts` y `frontend/test/quiz-capabilities.test.ts`; registrar resultados en `docs/guides/frontend-quiz-authoring.md` (SC-001/002).

**Checkpoint**: MVP completo; crear no exige preguntas y lista/detalle nunca descargan pauta.

## Phase 4: US2 - Editar preguntas, configuración y pauta (P2)

**Goal**: editar un draft autorizado conservando entradas y restricciones de destino.
**Independent Test**: fixture draft existente, preguntas válidas/inválidas y publicado;
no requiere US1 ni intentos frontend. Cubre US2.1–4.

- [X] T015 [P] [US2] Crear `frontend/test/quiz-validation.test.ts`: IDs/posiciones, exactamente una correcta, dos alternativas, centésimas/suma, Unicode/NUL, fechas/zonas/nulos, JSON 4096/4097 y PATCH omitido vs null (FR-006/008).
- [X] T016 [P] [US2] Crear `frontend/test/quiz-editor.test.ts`: authoring explícito, guardado confirmado, conservación ante 422/red, 409 publicado, origen/destino rechazados, multirol y teclado de preguntas (FR-002/006/007/011/015).
- [X] T017 [US2] Completar validación de payload create/update en `frontend/src/lib/quizzes/validation.ts` según `specs/20261021-141351_frontend-autoria-quizzes/data-model.md`; sin truncar ni aceptar campos readOnly, preguntas sin correcta quedan locales (FR-005/006/008).
- [X] T018 [US2] Implementar getQuizAuthoringView/updateQuiz en `frontend/src/lib/api/quizzes.ts` y ampliar `frontend/test/quiz-api.test.ts`: PATCH parcial, UUID retenido, nuevas sin id, questions completo, destino omitido/null y errores 400/413/422 (FR-006/008).
- [X] T019 [US2] Implementar `frontend/src/components/quizzes/question-editor.tsx`: agregar/quitar/reordenar preguntas con botones, alternativas con IDs estables y radio correcta por pregunta; foco y labels explícitos (FR-006/015).
- [X] T020 [US2] Implementar `frontend/src/components/quizzes/quiz-editor.tsx` y ruta `frontend/src/app/courses/[courseId]/quizzes/[quizId]/authoring/page.tsx`: validar detalle seguro/destino antes de autoría; configuración, guardado manual, conservar UUID y omisiones (FR-002/004/005/008).
- [X] T021 [US2] Resolver 409/403/404 y revalidación en `frontend/src/components/quizzes/quiz-editor.tsx`: publicado de solo lectura, limpiar pauta al perder permiso, no sustituir destino/entradas ni duplicar quiz; explicar restricción teacher+student (FR-007/011/013/014).
- [X] T022 [US2] Crear `frontend/test/quiz-session.test.ts` con logout, expiración, cambio usuario/tenant, revocación en lectura/escritura y respuestas fuera de orden; verificar cero pauta restaurada en DOM/storage/URL (FR-013/016).
- [X] T023 [US2] Ejecutar checks de `frontend/test/quiz-validation.test.ts`, `frontend/test/quiz-editor.test.ts`, `frontend/test/quiz-session.test.ts` y `frontend/test/quiz-api.test.ts`; registrar límites/concurrencia sin ETag en `docs/guides/frontend-quiz-authoring.md` (SC-001/002/004).

**Checkpoint**: draft editable con pauta reservada; todo publicado permanece inmutable.

## Phase 5: US3 - Publicar con efecto académico explícito (P2)

**Goal**: publicar con confirmación y mostrar quiz/ítem realmente confirmados.
**Independent Test**: fixture draft válido, publicado repetido y curso congelado;
no requiere construir editor ni módulo de notas. Cubre US3.1–3.

- [X] T024 [P] [US3] Crear `frontend/test/quiz-publication-api.test.ts`: publish sin cuerpo, repetición, freeze 409, lectura grade-items ligada al quiz/curso y peso actual; no creación local de ítem (FR-009/010).
- [X] T025 [P] [US3] Crear `frontend/test/quiz-publication.test.ts`: confirmar/cancelar, cambios pendientes, foco dialog, respuesta perdida, publishedAt estable e ítem único; lectura secundaria fallida no revierte POST 200 (FR-009/010/012/015).
- [X] T026 [US3] Implementar publishQuiz y lectura listCourseGradeItems en `frontend/src/lib/api/quizzes.ts`; validar DTO GradeItem en `frontend/src/lib/quizzes/validation.ts`, filtrar por quizId/courseId y mostrar peso recibido (FR-009).
- [X] T027 [US3] Implementar `frontend/src/components/quizzes/quiz-publish.tsx`: dialog con Volver inicial, alcance/ventana/irreversibilidad, bloqueo por cambios locales y explicación del ítem peso inicial cero (FR-009/015).
- [X] T028 [US3] Integrar publicación en `frontend/src/components/quizzes/quiz-editor.tsx`: estado backend confirmado, GradeItem de solo lectura, consulta repetible sin duplicados; no ofrecer unpublish/delete ni configurar pesos (FR-009/010/014).
- [X] T029 [US3] Resolver publicación incierta, 409 genérico y fallo grade-items en `frontend/src/components/quizzes/quiz-publish.tsx`: reconciliar sin retry automático, preservar publicado confirmado y mensaje de posible freeze sin causa inventada (FR-010/012).
- [X] T030 [US3] Ejecutar checks de `frontend/test/quiz-publication-api.test.ts` y `frontend/test/quiz-publication.test.ts`; documentar comprobación backend de evento/ítem único aparte del DOM en `docs/guides/frontend-quiz-authoring.md` (SC-003).

**Checkpoint**: publicación atómica delegada al backend, representación coherente sin notas frontend.

## Phase 6: Integration & delivery

- [X] T031 Ajustar layout mínimo en `frontend/src/styles/quizzes.css` e importarlo desde `frontend/src/app/layout.tsx` solo si hace falta; reutilizar tokens/app.css sin duplicar shell, colores ni componentes (FR-015).
- [X] T032 Revisar navegación/exports/callers de `frontend/src/components/courses/course-detail.tsx`, `frontend/src/components/institutions/institution-shell.tsx` y `frontend/src/lib/api/quizzes.ts`; regresiones de auth/cursos/contenido existentes (FR-001/013).
- [X] T033 Ejecutar revisión navegador según `specs/20261021-141351_frontend-autoria-quizzes/quickstart.md`: teclado, foco, aria-live, contraste, 375 px, ambos temas, reduced motion y recorrido real UC/UTFSM; evidencia en `docs/guides/frontend-quiz-authoring.md` (FR-015/016).
- [X] T034 Ejecutar scripts vigentes de `frontend/package.json`: api:check, lint, typecheck, test, test:coverage y build; comprobar documentos con `.github/scripts/check-doc-length.py`; registrar fallos previos separadamente en `docs/guides/frontend-quiz-authoring.md` (SC-001–004).
- [X] T035 Cerrar trazabilidad FR-001–016 y SC-001–004 en `docs/guides/frontend-quiz-authoring.md`; distinguir implementado, mocks, backend real y pendiente; actualizar checkboxes de `specs/20261021-141351_frontend-autoria-quizzes/tasks.md` únicamente con evidencia.

## Dependencies & Execution Order

```text
T001–T002 → (T003 || T004) → T005 → T006 → fundación lista
Fundación → US1: (T007 || T008) → T009–T014
Fundación → US2: (T015 || T016) → T017–T023
Fundación → US3: (T024 || T025) → T026–T030
US1 + US2 + US3 → T031–T035
```

Las historias se prueban con fixtures propias; integración del control US3 en editor
requiere T020, pero T027/T029 se prueban aisladas antes. El recorrido completo sí requiere
US1+US2+US3. Ejecución recomendada secuencial por compartir validation.ts, quizzes.ts
y quiz-editor.tsx; no editar esos archivos desde historias paralelas.
No reejecutar diseño de aislamiento DB: sin cambios SQL, usar checks backend existentes
si se valida RLS, ausencia de predicados, conexiones o auditoría en entorno real.

## Parallel Execution Examples

- Fundación: T003 parsers y T004 capabilities en archivos diferentes; unir antes de T005.
- US1: T007 contrato API y T008 UI sobre fixtures ya disponibles, sin editar adaptadores.
- US2: T015 validación y T016 editor, después de fundación; integrar antes de implementar.
- US3: T024 contrato publicación y T025 UI publicación; luego implementación secuencial.

## Implementation Strategy

1. Completar setup/fundación sin servicios, dependencias, migraciones o abstracciones nuevas.
2. Entregar MVP US1, validar permisos y creación incierta antes de ampliar edición.
3. Añadir US2 y US3 con sus fixtures independientes; conservar contrato y pruebas previas.
4. Integrar accesibilidad y recorrido real; registrar limitaciones sin marcar pendientes hechos.
