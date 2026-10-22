# Tasks: Cursos y participación frontend

**Input**: `specs/20261021-141349_frontend-cursos-participacion/`
**Prerequisites**: [plan](plan.md), [spec](spec.md), [contrato](contracts/courses-participation.md),
[modelo](data-model.md), [research](research.md), [quickstart](quickstart.md).
**Owners backlog**: JC/MA, FE-05–07/20. Coordinar asignación, sin inventar dueño individual.
**Tests**: requeridos por FR-015 y constitución; node:test/tsx/jsdom existentes.
**Estado**: frontend verificado; aceptación runtime US3 pendiente de DEP-FE-SEARCH-001.

## Phase 1: Setup

- [X] T001 Verificar dependencia de acceso por dominio, Session.request y `/me` contra `specs/20261021-141348_frontend-acceso-multitenant/plan.md`; registrar disponibilidad y CU/RF/RNF/FE en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md` (FR-001/013).
- [X] T002 Revisar `docs/reference/openapi/paths/platform.yaml` contra backend registrado en `backend/src/app.module.ts`; verificar disponibilidad y criterios de `specs/20261021-141349_frontend-cursos-participacion/dependencies/participant-search.md` (DEP-FE-SEARCH-001), y registrar búsqueda `/users` ausente como dependencia externa US3 en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md`, sin implementar endpoint ni cambiar permisos (FR-008/011/016).
- [X] T003 Crear fixtures UC/UTFSM, propietario con/sin teacher, admin ajeno, teacher, assistant/student, superadmin aislado, multirol e historia en `frontend/test/fixtures/courses.ts`; incluir respuestas diferidas, destino inactivo, 409/422/503 y paginación (FR-015).

## Phase 2: Foundation

- [X] T004 [P] Añadir validación de respuestas desconocidas Course/Section/Enrollment y formularios en `frontend/src/lib/courses/validation.ts`, tipos desde schema.d.ts, UUID/relaciones, Unicode tras trim, capacity vacío→null, cero válido y PATCH no vacío (FR-012/016).
- [X] T005 [P] Implementar capacidades solo de presentación en `frontend/src/lib/courses/capabilities.ts`: isAdmin para alta, owner confirmado para configurar, teacher por sección para participantes y teacher institucional para búsqueda; conservar roles múltiples (FR-001/004–007/011).
- [X] T006 Cubrir validación y matriz de capacidades, incluidos límites y contexto cruzado, en `frontend/test/courses-api.test.ts`; verificar que CourseSummary sin createdBy nunca habilite configuración (FR-004–007/012/015).
- [X] T007 Integrar validación con feedback compartido en `frontend/src/lib/route-feedback.ts` y desmontaje al perder contexto en `frontend/src/components/auth/protected-institution.tsx`; evitar bucles de revalidación 403/404 y conservar logout 401 existente (FR-003/013).

**Checkpoint**: mocks pueden operar sin backend nuevo; Session es la única frontera privada.
Cada panel debe invalidar respuestas por recurso/secuencia además de generación de sesión.

## Phase 3: US1 — Consultar mis cursos y secciones (P1)

**Goal**: Directorio y detalle con roles y secciones autorizados; sin contenido/quizzes.
**Independent Test**: Con fixtures, perfiles ven solo sus cursos/secciones; cero cursos ajenos
ni respuestas anteriores tras cambio de sesión. Vacío real, carga y error son distintos.

- [X] T008 [US1] Escribir pruebas de GET listCourses/getCourse/listSections/getSection, paths UC/UTFSM, validación DTO y 400/401/403/404/503 en `frontend/test/courses-api.test.ts` usando fetch inyectado (US1-1/3, FR-003/013).
- [X] T009 [US1] Escribir pruebas DOM de directorio/detalle, multirol, vacío/carga/error, enlace ajeno y respuesta tardía tras navegación/logout/revocación en `frontend/test/courses-ui.test.ts` (US1-1–4, SC-001/004).
- [X] T010 [P] [US1] Añadir funciones listCourses/getCourse tipadas en `frontend/src/lib/api/courses.ts`, usando cliente existente, path institucional explícito y validación de respuestas (FR-002/003/016).
- [X] T011 [P] [US1] Añadir funciones listSections/getSection en `frontend/src/lib/api/sections.ts`, validando relaciones solicitadas y sin acceso fetch paralelo al cliente compartido (FR-003/013/016).
- [X] T012 [US1] Conectar `frontend/src/components/courses/course-directory.tsx` y `frontend/src/app/courses/page.tsx` a Session.request; mostrar resumen real y enlaces sin N+1, sin actividad/notas ficticias (US1-1/2, FR-002/003).
- [X] T013 [US1] Implementar `frontend/src/components/courses/course-detail.tsx` y `frontend/src/app/courses/[courseId]/page.tsx` con Course confirmado y roles de `/me`; validar UUID y descartar respuestas viejas (US1-3/4, FR-001/013).
- [X] T014 [US1] Implementar lectura de `frontend/src/components/courses/sections-panel.tsx` y `frontend/src/app/courses/[courseId]/sections/page.tsx` con listado autorizado y selección de sección sin inventar ruta nueva; usar getSection para confirmar recurso seleccionado (FR-002/003).
- [X] T015 [US1] Adaptar shell/breadcrumbs en `frontend/src/components/institutions/institution-shell.tsx` y enlaces limpios en `frontend/src/lib/institution-routes.ts`; aria-current real, contexto visible y acciones según capacidades sin perfiles URL ni enlaces futuros rotos (FR-001/002/014).
- [X] T016 [US1] Actualizar regresiones en `frontend/test/institution-layout.test.ts`, `frontend/test/auth-ui.test.ts` y `frontend/test/session.test.ts`; ejecutar US1 y registrar SC-001/004 en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md` (FR-013/015).

**Checkpoint**: US1 es MVP entregable con acceso existente; no depende de formularios US2/US3.

## Phase 4: US2 — Crear y configurar cursos propios (P2)

**Goal**: Alta atómica y configuración propia sin conceder docencia por administración.
**Independent Test**: Fixtures dueño sin teacher permite configuración; admin ajeno y teacher
sin admin quedan rechazados. Respuesta perdida nunca dispara alta automática adicional.

- [X] T017 [US2] Escribir tests de alta/configuración y payloads en `frontend/test/course-admin.test.ts`: owner inmutable, teacher inicial backend, admin ajeno, superadmin aislado, capacidad null/0/límite y revocación concurrente (US2-1–3, FR-004–006/015).
- [X] T018 [US2] Extender `frontend/test/course-admin.test.ts` con doble envío, PATCH vacío, 409/422/503 y POST de curso y de sección confirmado en servidor con respuesta perdida; para sección exigir listSections antes de repetir, cubrir coincidencia existente y fallo de consulta sin nuevo POST ni éxito ficticio (US2-4, FR-012).
- [X] T019 [US2] Añadir createCourse/updateCourse a `frontend/src/lib/api/courses.ts` y createSection/updateSection a `frontend/src/lib/api/sections.ts`; bodies contractuales sin owner/roles, DTO confirmado como resultado (FR-004/005/016).
- [X] T020 [P] [US2] Crear `frontend/src/components/courses/course-form.tsx` para alta/edición, initialSection al alta, labels/límites/errores asociados, sin editor de owner y bloqueo de envío pendiente (FR-004/012/014).
- [X] T021 [P] [US2] Crear `frontend/src/components/courses/section-form.tsx` con create/update, code y capacity, PATCH solo modificado, sin controles para teacher no admin (FR-005/012/014).
- [X] T022 [US2] Integrar formulario y reconciliación de alta en `frontend/src/components/courses/course-directory.tsx`: tras 201 consultar secciones y `/me`; ante resultado incierto consultar code/term antes de habilitar repetición, sin asumir éxito por conflicto (US2-1/4).
- [X] T023 [US2] Integrar configuración solo de dueño confirmado en `frontend/src/components/courses/course-detail.tsx` y `frontend/src/components/courses/sections-panel.tsx`; aplicar DTO confirmado, revalidar rechazo y conservar separación académica sin teacher; ante alta de sección incierta consultar listSections y revisar código/capacidad, mostrar estado observado sin atribuir éxito al envío perdido y bloquear repetición si no se resuelve (US2-2–4, FR-012).
- [X] T024 [US2] Ejecutar pruebas US2 y regresión US1; registrar permisos, historial backend existente y resultados SC-002/003 en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md` (FR-015/016).

## Phase 5: US3 — Gestionar participantes dentro de mi alcance (P2)

**Goal**: Gestionar roles e historial de personas existentes dentro de secciones autorizadas.
**Independent Test**: Fixtures de cursos/secciones existentes, sin depender de alta US2;
teacher limitado a su sección, dueño todas, assistant/student sin solicitudes de gestión.
**Dependencia externa**: [DEP-FE-SEARCH-001](dependencies/participant-search.md) bloquea
búsqueda real hasta verificar handler searchInstitutionUsers y sus criterios de cierre.
Fixtures permiten desarrollo y validación de contrato; no habilitan aceptación runtime completa.

- [X] T025 [US3] Escribir pruebas de paths/roles/paginación para matrículas y búsqueda en `frontend/test/participants.test.ts`; assistant/student no disparan GET, dueño sin teacher usa UUID y nunca GET users/memberships, teacher no escribe sección ajena (US3-1–3, FR-007/008/011).
- [X] T026 [US3] Cubrir POST 200/201, múltiples roles, sucesor nuevo/existente, historial, cancelación/revocación último teacher, destinatario inactivo y 409/422 en `frontend/test/participants.test.ts` (US3-4, FR-009/010/012).
- [X] T027 [US3] Cubrir autorevocación, respuesta tardía de sección/búsqueda anterior, logout y pérdida de respuesta durante escritura en `frontend/test/participants.test.ts`; cero permisos/datos repuestos (FR-012/013, SC-003/004).
- [X] T028 [US3] Implementar listSectionEnrollments/createSectionEnrollment/updateSectionEnrollment/searchInstitutionUsers tipados en `frontend/src/lib/api/enrollments.ts`; cursor opaco, search no vacío, limit contractual y PATCH de una sola propiedad (FR-007–012/016).
- [X] T029 [P] [US3] Crear `frontend/src/components/courses/participants-panel.tsx` con listado paginado activo/histórico por Enrollment.id, roles hermanos, estados y selección autorizada; invalidar solicitudes por sección/secuencia (FR-007/009/013).
- [X] T030 [P] [US3] Crear `frontend/src/components/courses/enrollment-form.tsx` con búsqueda paginada exclusiva teacher o UUID conocido para dueño sin teacher, usuarios existentes y selección de rol; ningún grant institucional ni invitación (FR-008/011/014).
- [X] T031 [US3] Añadir cambio de rol y confirmación de revocación a `frontend/src/components/courses/participants-panel.tsx` con diálogo accesible; usar ID devuelto, resetear cursor/recargar historial y refrescar `/me` en cambios propios, sin bloquear último teacher (FR-009/010/013/014).
- [X] T032 [US3] Integrar participantes en `frontend/src/components/courses/sections-panel.tsx`; no montar gestión ni consultar matrículas para assistant/student sin otra capacidad, ni devolver UI optimista tras rechazo o respuesta incierta (FR-007/012/013).
- [ ] T033 [US3] Ejecutar tests y escenarios US3 de `specs/20261021-141349_frontend-cursos-participacion/quickstart.md`; verificar criterios de `specs/20261021-141349_frontend-cursos-participacion/dependencies/participant-search.md` y registrar búsqueda real pendiente hasta verificar handler externo autorizado, no confundir 404 con cero resultados (FR-011/015, SC-001–004).

T033: escenarios fixture ejecutados; aceptación real pendiente de handler y criterios externos.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T034 Revisar pantallas US1–US3 contra `DESIGN.md` y `mockups/README.md`; ajustar únicamente layout necesario en `frontend/src/styles/institution-layout.css` reutilizando tokens/app.css, Lucide y tipografía integrada (FR-014).
- [X] T035 Validar con navegador teclado, foco/modal/Escape, avisos, contraste ≥4.5:1, 375 px, ambos temas y reduced motion; registrar evidencia en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md` (SC-002, FR-014).
- [X] T036 Ejecutar api:check, lint, typecheck, test, test:coverage y build de `frontend/package.json`, más `.github/scripts/check-doc-length.py`; comprobar callers/fixtures/exports afectados y registrar resultados reales en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md` (FR-015/016).
- [X] T037 Reconciliar FR-001–016/SC-001–004 con evidencia en `specs/20261021-141349_frontend-cursos-participacion/quickstart.md`; separar entrega comprobada de búsqueda externa pendiente, sin desplegar ni modificar backend/DB (FR-016).

## Dependencies & Execution Order

```text
T001–T003 → T004–T007 → US1 (T008–T016) → US2 (T017–T024)
                                  └──→ US3 (T025–T033)
US1 + US2 + US3 + handler externo de búsqueda → aceptación completa (T034–T037)
```

US2 y US3 son incrementos separados sobre lectura US1 y comparten algunos archivos;
serializar integración de sections-panel.tsx. US3 usa cursos fixture y no necesita US2.
No marcar US3 runtime completada si falta búsqueda autorizada en backend.
Escribir T008/T009 antes de T010–T015, T017/T018 antes de T019–T023 y
T025–T027 antes de T028–T032. T016/T024/T033 verifican integración posterior. Marcar [P]
solo para archivos disjuntos y ejecutar cada grupo tras sus prerrequisitos.

## Parallel Execution Examples

- Fundación: T004 y T005 en paralelo tras fixtures T003; T006 verifica ambos.
- US1: completar pruebas T008 y T009 antes de T010/T011; ambos clientes pueden
  implementarse en paralelo. T012–T016 integran y verifican el recorrido.
- US2: T020 y T021 en paralelo tras T019; T022/T023 integran sin pisar archivos.
- US3: T029 y T030 en paralelo tras T028; T031/T032 integran de forma secuencial.
- Entre historias: pruebas `course-admin.test.ts` y `participants.test.ts` son disjuntas;
  no paralelizar escrituras compartidas en API o sections-panel.tsx.

## Implementation Strategy

1. Completar fundación y US1 como MVP: consulta real con aislamiento y sesión segura.
2. Entregar US2 sobre el directorio estable; preservar integridad en respuestas inciertas.
3. Entregar US3 con fixtures/contratos; exigir búsqueda backend antes de aceptación real.
4. Cerrar accesibilidad y checks existentes, registrando solo evidencia ejecutada.
