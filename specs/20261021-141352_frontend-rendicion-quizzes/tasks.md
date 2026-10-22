# Tasks: Rendición frontend de quizzes

**Input**: `specs/20261021-141352_frontend-rendicion-quizzes/`
**Prerequisites**: [spec](spec.md), [plan](plan.md), [research](research.md),
[modelo](data-model.md), [contrato](contracts/quiz-attempts.md), [guía](quickstart.md).
**Backlog**: FE-12–14/20 (JC/MA); CU-08/09/15. Pruebas requeridas por FR-019.
**Formato**: checkbox + ID secuencial + [P] opcional + [USn] en historias + ruta.
[P] permite trabajo en archivos distintos después de dependencias indicadas.

## Phase 1: Setup

- [X] T001 Verificar API/schema y dependencias existentes en `frontend/package.json` y `frontend/src/lib/api/schema.d.ts` con `pnpm --dir frontend api:check`; registrar discrepancias en `specs/20261021-141352_frontend-rendicion-quizzes/research.md`, sin cambiar API ni stack (FR-016).
- [X] T002 Crear `frontend/test/fixtures/attempts.ts` reutilizando fixtures de quizzes/cursos: UC/UTFSM, IDs conocidos, secciones históricas, student multirol, teacher histórico/admin dueño/ajeno, assistant, revoked, ventanas y terminales (FR-019).

## Phase 2: Foundation

- [X] T003 [P] Añadir pruebas runtime de vistas student/staff y recibo, IDs/fechas/estados, campos prohibidos, alternativas string y JSON UTF-8 en `frontend/test/attempt-validation.test.ts` (FR-006/010/017).
- [X] T004 [P] Añadir matriz de permisos por propietario, pauta, sección histórica e isAdmin+ownership+teacher en `frontend/test/attempt-capabilities.test.ts`; no deducir permiso por presencia de grade (FR-002/013/014).
- [X] T005 Implementar tipos derivados del schema, parsers de intento/recibo y respuestas completas en `frontend/src/lib/attempts/validation.ts`; validar scope/IDs y proyectar staff mínimo, sin exponer nota (FR-006/010/016).
- [X] T006 Implementar capacidades de inicio/guardar/enviar/cancelar en `frontend/src/lib/attempts/capabilities.ts` según backend; conservar teacher histórico y negar assistant/admin aislado (FR-002/013/014).
- [X] T007 Implementar coordinación específica en `frontend/src/lib/attempts/operations.ts`: una mutación activa, snapshot y scope generation/actor/slug/IDs, claves start/submit independientes y estables, estados inciertos bloqueantes; sin retry automático ni modificar useMutation genérico (FR-004/005/009/011/017).

**Checkpoint**: Parsers/permisos comprobables; aún no hay mutaciones UI habilitadas.

## Phase 3: US1 — Iniciar, guardar y reanudar (P1, MVP)

**Goal**: Trabajar sobre intento propio y distinguir borrador de guardado confirmado.
**Independent Test**: Quiz publicado y student fixture, sin editor ni libro frontend.

- [X] T008 [P] [US1] Probar GET/start/PUT, rutas singulares, sección explícita, header estable, payload completo/vacío, 400/415/422/413 y ausencia de identidad/pauta en `frontend/test/attempt-api.test.ts` (FR-001/004/006).
- [X] T009 [P] [US1] Probar doble inicio, respuesta perdida/replay histórico terminal, sección elegida, máximo/ventana rechazados y límite tras recarga en `frontend/test/attempt-start.test.ts` (US1.1/4, FR-003/004/007).
- [X] T010 [P] [US1] Probar snapshot completo, confirmación de vaciado, guardado fallido/incierto/tardío, controles congelados y reanudación conocida en `frontend/test/attempt-save.test.ts` (US1.2/3, FR-005/008/011).
- [X] T011 [US1] Añadir start/get/save tipados a `frontend/src/lib/api/attempts.ts`, validando DTO/IDs/snapshot y respuestas JSON; ampliar lectura segura de `frontend/src/lib/api/quizzes.ts` para curso desconocido desde quizId conservando validaciones de callers actuales (FR-006/007/016).
- [X] T012 [US1] Conectar `frontend/src/components/attempts/attempt-start.tsx` desde `frontend/src/components/quizzes/quiz-detail.tsx`; elegir enrollment student compatible, clave por destino, GET actual tras start/replay y enlace conocido en `frontend/src/components/quizzes/quiz-list.tsx`, sin prometer búsqueda automática (FR-001/003/004/007).
- [X] T013 [US1] Crear `frontend/src/app/attempts/[attemptId]/page.tsx` y `frontend/src/components/attempts/attempt-detail.tsx`: ProtectedInstitution, GET intento→quiz seguro→curso, resumen autorizado sin depender de preguntas para terminales y estados de carga/error; no exigir matrícula actual en sección histórica (FR-001/007/012/017).
- [X] T014 [US1] Integrar respuestas manuales, fieldset/radios, snapshots confirmados, aria-live y borrado explícito en `frontend/src/components/attempts/attempt-detail.tsx` usando `frontend/src/lib/attempts/operations.ts`; PUT incierto bloquea nuevos guardados/envío/cancelación y no se desbloquea por GET aislado (FR-005/006/008/018).
- [X] T015 [US1] Ampliar allowlist exacta `/attempts/{UUID}` en `frontend/src/lib/auth/navigation.ts` y retorno pathname en `frontend/src/components/auth/protected-institution.tsx`; cubrir login/recarga, next duplicado, URL externa, query/hash, backslash y doble codificación en `frontend/test/session.test.ts` y `frontend/test/auth-ui.test.ts` (US1.3, FR-007/017).
- [X] T016 [US1] Comprobar integración y regresión de listado/detalle docente en `frontend/test/quiz-list.test.ts`; ejecutar US1 de `specs/20261021-141352_frontend-rendicion-quizzes/quickstart.md` y registrar límites de acceso histórico sin alterar permisos API (FR-001/016/019).

**Checkpoint**: US1 entregable; errores no afirman guardado ni disponibilidad ficticia.

## Phase 4: US2 — Enviar una sola vez (P1)

**Goal**: Confirmar respuestas actuales y recuperar envío con identidad original.
**Independent Test**: Intento guardado fixture; no exige crear intento mediante US1.

- [X] T017 [P] [US2] Cubrir confirmación, PUT antes de submit, PUT fallido que impide envío, doble clic, POST perdido, replay sin PUT, cierre/409 y GET inProgress tardío en `frontend/test/attempt-submit.test.ts` (US2.1/2/4, FR-008/009/011).
- [X] T018 [US2] Extender `frontend/test/attempt-api.test.ts` con submit sin cuerpo, clave independiente estable y recibo estricto sin score/grade/corrección; probar GET graded que reconstruye recibo y cancelled que no lo hace (US2.3, FR-010).
- [X] T019 [US2] Añadir submit y parser de recibo en `frontend/src/lib/api/attempts.ts`; conservar clave original para recuperar resultado incierto y rechazar respuesta inválida sin afirmar fracaso definitivo (FR-009/010/011).
- [X] T020 [US2] Completar protocolo save→submit en `frontend/src/lib/attempts/operations.ts`: congelar snapshot confirmado, abortar cadena si PUT falla, retener clave/destino tras POST y permitir únicamente consulta/replay de ese POST; 409 nunca rota clave (FR-008/009/011/012).
- [X] T021 [US2] Crear confirmación accesible y recibo mínimo en `frontend/src/components/attempts/attempt-submit.tsx`, integrar en `frontend/src/components/attempts/attempt-detail.tsx`; bloquear edición incierta/terminal y no mostrar nota, porcentaje ni puntos (FR-008/010/018).
- [X] T022 [US2] Añadir recuperación explícita GET/replay original a `frontend/src/components/attempts/attempt-submit.tsx`; comunicar incertidumbre, pérdida de clave al abandonar documento y cierre sin autosubmit, sin repetir PUT ni forzar éxito (FR-009/011/012).
- [X] T023 [US2] Ejecutar US2 y verificar replay/cierre/publicación con pruebas existentes `backend/test/integration/attempt-concurrency.test.mjs`, `backend/test/integration/attempt-grading.test.mjs` y `backend/test/integration/attempt-window.test.mjs`; registrar intento/Grade/eventos únicos en `docs/guides/frontend-quiz-attempts.md` (FR-016/019).

**Checkpoint**: Un envío confirmado produce solo recibo seguro; ambigüedad conserva clave.

## Phase 5: US3 — Cancelar explícitamente (P2)

**Goal**: Cerrar abandono autorizado sin nota ni historial duplicado.
**Independent Test**: Intento activo conocido fixture; sin libro de notas frontend.

- [X] T024 [P] [US3] Cubrir propietario, teacher histórico/admin dueño, student revocado, assistant/ajeno rechazados, fuera de ventana, terminal y repetición en `frontend/test/attempt-cancel.test.ts` (US3.1–4, FR-013/014/015).
- [X] T025 [US3] Extender `frontend/test/attempt-api.test.ts` para cancel sin cuerpo/clave, 204 sin JSON, error y lectura posterior fallida sin borrar éxito confirmado (FR-011/014/017).
- [X] T026 [US3] Añadir cancel tipado y tratamiento 204 en `frontend/src/lib/api/attempts.ts`, integrar exclusión con save/submit inciertos en `frontend/src/lib/attempts/operations.ts` (FR-012/013/016).
- [X] T027 [US3] Crear `frontend/src/components/attempts/attempt-cancel.tsx` con confirmación/foco: cuenta para máximo, no genera nota ni reemplaza graded para publicación; GET/repetición tras incertidumbre y fecha solo backend (FR-013/014/015/018).
- [X] T028 [US3] Integrar cancelación student/teacher en `frontend/src/components/attempts/attempt-detail.tsx` para ID conocido; usar sección histórica y capacidades vigentes, assistant sin botón, sin construir listado/libro ni renderizar calificación (FR-013/014/016).
- [X] T029 [US3] Ejecutar US3 y verificar auditoría/repetición/notas intactas con `backend/test/integration/attempt-lifecycle.test.mjs`, `backend/test/integration/attempt-permissions.test.mjs` y `backend/test/integration/attempt-integrity.test.mjs`; registrar evidencia real en `docs/guides/frontend-quiz-attempts.md` (FR-014/019).

**Checkpoint**: Cancelled terminal confirmado, sin nota nueva; rechazo no altera intento.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T030 Añadir `frontend/test/attempt-session.test.ts` para UC/UTFSM/IDs cruzados, logout, 401/403/404, revocación, cambio de recurso/actor/contexto, completions tardías y limpieza de claves/respuestas; verificar default de Session.request en `frontend/src/lib/auth/session.ts` (FR-017/019).
- [X] T031 Revisar `frontend/src/components/attempts/attempt-detail.tsx`, `frontend/src/components/attempts/attempt-submit.tsx` y `frontend/src/components/attempts/attempt-cancel.tsx` en navegador: teclado, foco/Escape, aria-live, 375 px, ambos temas, contraste/reduced motion; corregir reutilizando estilos/tokens existentes (FR-018).
- [X] T032 Ejecutar comandos de `specs/20261021-141352_frontend-rendicion-quizzes/quickstart.md`, suite frontend/coverage/build y regresiones autoría/login; registrar resultados/skips y prueba API real de tenant/RLS, permisos, publicación concurrente y auditoría en `docs/guides/frontend-quiz-attempts.md` (FR-016/019).
- [X] T033 Actualizar trazabilidad FR-001–019/SC-001–005 y límites implementados/pendientes en `docs/guides/frontend-quiz-attempts.md`; validar longitud documental y completar solo tareas comprobadas en `specs/20261021-141352_frontend-rendicion-quizzes/tasks.md`.

## Dependencies & Execution Order

- Grafo: Setup T001–T002 → Foundation T003–T007 → US1/US2/US3 → Polish.
- US1 MVP completo: T001–T016. US2/US3 usan intentos fixture independientes.
- Reutilización de código: T011/T013 crean API/base de ruta usada por US2/US3;
  esas piezas son prerrequisitos técnicos, no requieren ejecutar inicio/guardado US1.
- Orden mínimo integrado: US1 → US2 → US3; compartir API/operations/detail exige
  serializar ediciones de esos archivos. No marcar esas tareas [P].
- T005 depende T003; T006 depende T004; T007 usa parsers y scope establecidos.
- T017/T024 pueden escribirse sobre foundation y fixtures mientras avanza US1;
  sus implementaciones esperan T011/T013 y los contratos respectivos.
- Checks backend usan entorno aislado existente; no implementar SQL nuevo ni
  ampliar alcance con migraciones, notas publicadas o descubrimiento de intentos.

## Parallel Execution Examples

- Foundation: T003 (validación) y T004 (permisos), archivos distintos tras T002.
- US1: T008 (API), T009 (inicio), T010 (guardado) tras foundation, contratos/fixtures listos.
- US2: T017 (UI/protocolo) junto a T018 (API), ambos sobre fixture guardado;
  completar T018 antes de T019 y pruebas correspondientes antes de implementación.
- US3: T024 (UI/permisos) junto a T025 (API), con fixture activo conocido;
  no solapar T025 con T018 porque comparten archivo.
- Paralelismo descrito es oportunidad de ejecución futura, no exige agentes.

## Implementation Strategy

1. Reutilizar stack y contrato, establecer scope/parsers/permisos antes de mutar.
2. Entregar US1 MVP sobre quiz publicado fixture y comprobar guardado/reanudación.
3. Entregar US2 con envío recuperable y después US3 con cancelación independiente.
4. Validar integración real, accesibilidad y regresiones; distinguir mocks de DB.
5. Mantener exclusiones: sin autosubmit/offline/persistencia privada/API nueva/nota anticipada.

## Evidencia final

- [Validación por capa y trazabilidad](../../docs/guides/frontend-quiz-attempts.md).
- Frontend: 248/248; cobertura 94,35 % líneas / 87,44 % ramas; build PASS.
- Backend: repetición completa 126/126 sin skips; dos readiness deadline de
  primera pasada superados aislados y en la repetición, sin cambiar helpers.
- Chromium: teclado/diálogos/375 px/ambos temas; API simulada diferenciada de DB real.
- Auditoría suplementaria detecta braces en ESLint; dependencias conservadas.
- Hooks opcionales commit omitidos; sin commit/push/deploy/PR/cambio de rama.
