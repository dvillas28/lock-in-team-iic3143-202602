# Tasks: Fundación del frontend AcademiX

**Input**: `specs/20261021-135729_fundacion-frontend/`.
**Prerequisites**: spec, plan, research, modelo documental y contrato de entrega.
**Organization**: Seis US producen seis specs; no implementar UI ni planes/tasks hijos.
**Owners**: Conservar JC/MA del backlog, sin reasignar issues.

Rutas de hijos reservadas en `plan.md`; invocar `speckit-specify` con
`SPECIFY_FEATURE_DIRECTORY` explícito para cada una. Una generación crea un solo hijo.
Cada tarea de checklist revisa semántica; no basta marcar casillas automáticamente.
`[P]`: archivo distinto, ejecutable tras la base común. Sin pruebas runtime en esta misión.

## Phase 1: Setup

- [X] T001 Crear `docs/frontend/README.md` con seis misiones, rutas reservadas, orden y estado pendiente; enlazar fuentes y conservar responsables (FR-001/002).
- [X] T002 Crear `docs/frontend/coverage.md` con entradas CU-01–16, FE-01–20, RF/RNF y vistas 01–16; clasificar incluidas/reutilizadas/parciales/excluidas según `specs/20261021-135729_fundacion-frontend/contracts/spec-delivery.md` (SC-001).

## Phase 2: Foundation

- [X] T003 Registrar en `docs/frontend/README.md` dominio→slug→API, rutas limpias, pertenencia backend, CORS separado de permisos y criterio común de aceptación hija (FR-003/005/006/008/013).
- [X] T004 Reconciliar en `docs/frontend/coverage.md` FE-02 con rutas limpias, coordinador FE-07/11 con roles vigentes y mockups con ADR admin/ownership; asignar cancelación a US5, consulta a US6 y FE-20 transversal (FR-009/010/014).

**Checkpoint**: Mapa común estable; no transportar ambigüedades históricas a las specs.

## Phase 3: US1 - Acceso y multitenancy (P1)

**Goal**: Spec de acceso institucional desde dominio, login y sesión.
**Independent Test**: Revisar escenarios UC/UTFSM/local y persona multi-institución sin UI académica.

- [X] T005 [P] [US1] Generar `specs/20261021-141348_frontend-acceso-multitenant/spec.md` mediante speckit-specify: FE-01 reuso/FE-02 transición/FE-03–04, CU-01/02, dominio/local/desconocidos, `/me`, sesión/logout/expiración, cambio de dominio, retorno seguro, CORS/preflight y rutas/helpers/tests/guías afectados; resolver decisiones de experiencia antes del checklist, sin elegir stack nuevo (FR-003–008/014; US1.1–4).
- [X] T006 [US1] Revisar y completar `specs/20261021-141348_frontend-acceso-multitenant/checklists/requirements.md`: escenarios exitosos, rechazo, simultaneidad, revocación y aislamiento; dudas bloqueantes mantienen casillas pendientes (FR-013; SC-002/003).
- [X] T007 [US1] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con links y evidencia de revisión de US1, distinguiendo spec validada de integración implementada (FR-001; SC-004).

## Phase 4: US2 - Cursos y participación (P2)

**Goal**: Spec de shell, cursos, secciones y participantes con permisos reales.
**Independent Test**: Revisar cinco perfiles con fixtures de identidad, sin implementar US1.

- [X] T008 [P] [US2] Generar `specs/20261021-141349_frontend-cursos-participacion/spec.md`: FE-05–07, CU-03/04, mockups 03/07/11, operaciones existentes, estados, roles múltiples, admin dueño sin Enrollment, docente/ayudante/estudiante y superadmin; exigir rechazos de curso/sección ajena (FR-009–013; US2.1–3).
- [X] T009 [US2] Revisar `specs/20261021-141349_frontend-cursos-participacion/checklists/requirements.md` contra contrato/ADR vigentes y fixtures UC/UTFSM; registrar brechas antes de habilitar su plan (FR-009/010/013; SC-002).
- [X] T010 [US2] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con revisión, vínculos y dependencia runtime de acceso; no exigir UI implementada para aceptar la spec (FR-001/002; SC-004).

## Phase 5: US3 - Módulos y material (P3)

**Goal**: Spec de contenido markdown y publicación independiente de módulos/ítems.
**Independent Test**: Revisar CU-05/06/14 con fixtures de visibilidad y mockups 04/09/12.

- [X] T011 [P] [US3] Generar `specs/20261021-141350_frontend-modulos-material/spec.md`: FE-08–10, consulta/creación/edición/orden/publicación, docente activo, lectura publicada, historial, estados y exclusión PDF/binarios; incluir ambas publicaciones requeridas para visibilidad (FR-009–013; US3.1–2).
- [X] T012 [US3] Revisar `specs/20261021-141350_frontend-modulos-material/checklists/requirements.md` con matriz módulo/ítem, rechazo por rol/tenant, revocación y accesibilidad (SC-002).
- [X] T013 [US3] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con evidencia, dependencia runtime de cursos y clasificación parcial/excluida de vistas 04/09 (SC-001/004).

## Phase 6: US4 - Autoría de quizzes (P3)

**Goal**: Spec de autoría docente, pauta y publicación dentro del alcance autorizado.
**Independent Test**: Revisar CU-07/mockup 13 con fixtures de permisos y restricciones de edición.

- [X] T014 [P] [US4] Generar `specs/20261021-141351_frontend-autoria-quizzes/spec.md`: FE-11, preguntas/alternativas/validación, configuración/publicación, pauta protegida, destinatarios por sección y restricciones vigentes; explicitar multirol e incompatibilidad con rendición (FR-009–013; US4.1–2).
- [X] T015 [US4] Revisar `specs/20261021-141351_frontend-autoria-quizzes/checklists/requirements.md` con éxito/rechazo docente, ayudante/estudiante denegados, otra sección y otro tenant (SC-002).
- [X] T016 [US4] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con evidencia y dependencia runtime de cursos, sin dependencia artificial de contenido implementado (SC-001/004).

## Phase 7: US5 - Rendición de quizzes (P3)

**Goal**: Spec del ciclo de intento y confirmación segura de envío.
**Independent Test**: Revisar CU-08/09/15 con quiz/intentos de fixture y fallos de red.

- [X] T017 [P] [US5] Generar `specs/20261021-141352_frontend-rendicion-quizzes/spec.md`: FE-12–14, iniciar/guardar/reanudar/enviar/cancelar, plazos/límites, conflictos y recuperación sin duplicados; incluir cancelación propia/docente autorizada de vista 16, sin pautas ni notas anticipadas (FR-009–013; US5.1–2).
- [X] T018 [US5] Revisar `specs/20261021-141352_frontend-rendicion-quizzes/checklists/requirements.md` con red caída, envío repetido, sesión vencida, estados terminales, revocación, multirol y cruces de tenant/sección (SC-002).
- [X] T019 [US5] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con evidencia, acciones de vistas 05/14/16 y dependencia runtime de autoría; mantener calificación en backend (SC-001/004).

## Phase 8: US6 - Notas y seguimiento (P3)

**Goal**: Spec de pesos, publicación, resultados, seguimiento y auditoría consultable.
**Independent Test**: Revisar CU-10/11/12/13/16 con notas/intentos/eventos de fixture.

- [X] T020 [P] [US6] Generar `specs/20261021-141353_frontend-notas-seguimiento/spec.md`: FE-15–19, ponderaciones/publicación, libro docente/ayudante, notas propias y promedio, revisión de intentos y auditoría inmutable sanitizada; enlazar cancelación de US5, separar US internas y preservar permisos/ownership (FR-009–013; US6.1–2).
- [X] T021 [US6] Revisar `specs/20261021-141353_frontend-notas-seguimiento/checklists/requirements.md` con notas no publicadas ocultas, sección ajena, ayudante sin escritura, admin sin Enrollment y aislamiento; incluir consolidación futura FE-20 (SC-002).
- [X] T022 [US6] Actualizar `docs/frontend/README.md` y `docs/frontend/coverage.md` con evidencia, vistas 05/06/08/15/16 y dependencia runtime de rendición, conservando separadas revisión documental y prueba de producto (SC-001/004).

## Phase 9: Integration and delivery

- [X] T023 Auditar `docs/frontend/coverage.md` contra CU-01–16, RF1–29/RNF, FE-01–20 y 16 vistas; asegurar cero acciones MVP huérfanas, FE-21 excluido y FE-20 transversal (SC-001).
- [X] T024 Revisar `docs/frontend/README.md` y seis specs/checklists: links existentes, cero ciclos, seis historias revisables con fixtures y ninguna brecha de permiso bloqueante oculta (SC-002/004).
- [X] T025 Ejecutar checks de planificación/cierre de `specs/20261021-135729_fundacion-frontend/quickstart.md`, `python3 .github/scripts/check-doc-length.py` y `git diff --check`; registrar resultados reales en `docs/frontend/coverage.md` (SC-001–004).
- [X] T026 Actualizar `specs/20261021-135729_fundacion-frontend/checklists/requirements.md` y estado del spec padre con evidencia final; declarar seis specs listos para sus planes, sin marcar pantallas ni pruebas runtime como implementadas (FR-001/013).

## Dependencies & Execution Order

`T001 → T002 → T003 → T004 → redacción/revisión por US → T023 → T024 → T025 → T026`.
Por US: redactar → revisar checklist → integrar evidencia en índice/cobertura.
Redacción T005/T008/T011/T014/T017/T020 usa archivos distintos y puede ser paralela
tras T004; decisiones compartidas de acceso deben reconciliarse al integrar.
Integraciones T007/T010/T013/T016/T019/T022 son secuenciales: comparten índice/cobertura.
Runtime futuro: `US1 → US2 → {US3,US4}; US4 → US5 → US6`; no bloquea revisión con fixtures.

## Parallel Examples

- US1: T005 puede redactarse junto a T008; T006 espera T005.
- US2: T008 puede redactarse junto a T005; T009 espera T008.
- US3: T011 puede redactarse junto a T014; T012 espera T011.
- US4: T014 puede redactarse junto a T011; T015 espera T014.
- US5: T017 puede redactarse junto a T020 con fixtures; T018 espera T017.
- US6: T020 puede redactarse junto a T017, fijando referencia a cancelación; T021 espera T020.

## Implementation Strategy

1. MVP documental: T001–T007, acceso listo para su propio plan.
2. Continuar por cursos y luego capacidades académicas; validar cada hijo antes de integrar.
3. Cerrar con cobertura/enlaces/longitud y evidencia, sin implementar producto ni crear issues.
