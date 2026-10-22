# Tasks: Módulos y material frontend

**Input**: `specs/20261021-141350_frontend-modulos-material/`
**Prerequisitos**: spec.md, plan.md, research.md, data-model.md, contracts/modules-material.md.
**Backlog**: FE-08–10/20 (JC/MA); CU-05/06/14 y RF/RNF de spec.md.
**Tests**: requeridos por FR-016; node:test + tsx/jsdom existentes, sin infraestructura nueva.
**Estado**: 27/28 completas. T026 parcial: navegador PASS; backend real pendiente.
**Evidencia**: [guía de entrega](../../docs/guides/frontend-content.md) y quickstart.md.
**Límite externo**: backend/credenciales no disponibles; audit adicional reporta high preexistente en tooling.

## Formato

`- [X] T001 [P?] [US1?] Acción con ruta y referencia de aceptación`.
`[P]` permite trabajo en archivos diferentes cuando sus prerrequisitos estén completos.
Tareas de pruebas preceden implementación de cada historia; confirmar que detectan fallos.

## Phase 1: Setup

- [X] T001 Revalidar contratos/alcance CU/RF/RNF y disponibilidad de módulos/material backend; registrar diferencias reales en specs/20261021-141350_frontend-modulos-material/research.md antes de editar runtime (FR-001–008).
- [X] T002 Ejecutar baseline api:check, lint, typecheck y test de frontend/package.json; registrar resultados en specs/20261021-141350_frontend-modulos-material/quickstart.md sin cambiar stack ni dependencias (FR-015/016).

## Phase 2: Foundation

- [X] T003 Crear fixtures UC/UTFSM, teachers admin/no admin, assistant/student, admin sin teacher, dos secciones, cuatro publicaciones y markdown adversarial en frontend/test/fixtures/content.ts (FR-002–004/016).
- [X] T004 [P] Definir tipos desde schema.d.ts y validadores de DTO/parentesco/fechas/listas sin duplicados, títulos Unicode, markdown preservado y JSON UTF-8 ≤4096 bytes en frontend/src/lib/content/validation.ts; cubrir int32, NUL, vacíos, escapes y límites en frontend/test/content-api.test.ts (FR-005/009/010).
- [X] T005 [P] Definir capacidad docente de contenido compartido por curso desde /me en frontend/src/lib/content/capabilities.ts y comprobar teacher no admin, roles múltiples y flags sin teacher en frontend/test/content-capabilities.test.ts; no usar manage de participantes (FR-004).

**Checkpoint**: tipos y permisos resueltos; Session.request, useResource/useMutation y Field se reutilizan.
No hay migraciones, endpoints nuevos ni cambios de privilegios DB. Aislamiento persistido,
barrera por omisión, runtime role, conexión reutilizada y excepciones globales siguen en backend;
esta misión verifica paths y denegaciones, sin atribuir a mocks UI evidencia SQL.

## Phase 3: US1 — Consultar material publicado (P1, MVP)

**Goal**: encontrar y leer material autorizado con retorno al curso.
**Independent Test**: fixtures publicadas, sin editor ni quizzes; cuatro combinaciones y UC/UTFSM.

- [X] T006 [P] [US1] Probar GET módulos/material, path institucional, DTO incorrectos, padres cruzados, 401/403/404/503 y cuatro combinaciones de lectura en frontend/test/content-read-api.test.ts (FR-001–003/013/016).
- [X] T007 [P] [US1] Probar carga/vacío/error, texto adversarial sin HTML/URLs activas y respuesta tardía tras navegación/logout/expiración/cambio tenant en frontend/test/content-reader.test.ts (FR-009/013/014/016).
- [X] T008 [US1] Implementar listCourseModules/getCourseModule en frontend/src/lib/api/modules.ts y listModuleMaterials/getMaterial en frontend/src/lib/api/materials.ts con cliente existente y validación de frontera (FR-001–003).
- [X] T009 [US1] Crear frontend/src/components/content/modules-panel.tsx con carga diferida al expandir, estados reales, clave/garda sesión+slug+curso+módulo+secuencia y enlaces autorizados; montar frontend/src/app/courses/[courseId]/modules/page.tsx usando layout protegido (FR-001–003/013).
- [X] T010 [US1] Crear frontend/src/components/content/material-reader.tsx y frontend/src/app/courses/[courseId]/modules/[moduleId]/materials/[materialId]/page.tsx verificando padres antes de mostrar texto React escapado, retorno al módulo y limpieza ante revocación (FR-001/009/013).
- [X] T011 [US1] Agregar navegación real a módulos en frontend/src/components/courses/course-detail.tsx y breadcrumbs específicos en frontend/src/components/institutions/institution-shell.tsx; comprobar navegación en frontend/test/content-reader.test.ts (FR-001/013).
- [X] T012 [US1] Aplicar clases canónicas y solo layout/ajuste de texto necesario en frontend/src/styles/content.css, importándolo desde frontend/src/app/layout.tsx; verificar 375 px, dos temas, foco y contraste sin colores nuevos (FR-014/015).

**Checkpoint**: MVP lectura completo con fixtures y revisión runtime según quickstart.md.

## Phase 4: US2 — Crear y editar contenido compartido (P2)

**Goal**: teacher no admin prepara y ordena contenido común sin cambiar publicación.
**Independent Test**: curso/módulos fixture, sin depender de implementación del lector ni de US3.

- [X] T013 [P] [US2] Probar payloads alta/PATCH/PUT, posición con huecos/max int32, orden completo/duplicados, errores 400/409/413/415/422 y límites UTF-8 en frontend/test/content-write-api.test.ts (FR-005/008/010/016).
- [X] T014 [P] [US2] Probar teacher no admin, denegaciones, borrador conservado al refresh autorizado, alta incierta con lista fallida/ambigua y limpieza ante revocación en frontend/test/content-editor.test.ts (FR-004/010–013/016).
- [X] T015 [US2] Agregar create/update/reorder módulos en frontend/src/lib/api/modules.ts y create/update material en frontend/src/lib/api/materials.ts; enviar solo campos contractuales, sin retry, tenant ni padres en body (FR-005/008/010/011).
- [X] T016 [US2] Crear frontend/src/components/content/module-form.tsx reutilizando Field/useMutation; alta borrador con max(position)+1 o 1, edición título, conflicto sin retry y reconciliación consultando lista sin equiparar coincidencia a éxito (FR-005/006/010/012).
- [X] T017 [US2] Crear frontend/src/components/content/material-form.tsx con título/textarea, PATCH mínimo, límite JSON, borrador solo memoria y sin key que reinicie texto al refrescar; resultado incierto consulta lista/recurso y bloquea repetición ambigua (FR-005/006/009–012).
- [X] T018 [US2] Integrar formularios y botones Subir/Bajar en frontend/src/components/content/modules-panel.tsx; PUT con todos los IDs incluidos borradores, guardado confirmado, capacidad teacher compartida y foco preservado; no ordenar ítems ni agregar delete (FR-004–006/014).
- [X] T019 [US2] Comprobar alcance identidad/tenant/curso/material y respuestas tardías durante altas/ediciones/orden en frontend/test/content-editor.test.ts; verificar que admin sin teacher jamás activa autoría y pérdida de contexto limpia borradores (FR-004/008/013/016).

**Checkpoint**: autoría funciona con fixtures sin notas, evaluaciones ni publicación nueva.

## Phase 5: US3 — Controlar publicación por módulo e ítem (P2)

**Goal**: mostrar estado propio y disponibilidad efectiva confirmados por servidor.
**Independent Test**: recursos fixture de cuatro combinaciones, sin necesitar altas/editor de US2.

- [X] T020 [P] [US3] Probar publish/unpublish sin body, DTO confirmado, cuatro combinaciones, ocultar padre conservando hijos y no-op repetido en frontend/test/content-publication-api.test.ts (FR-003/006/007/016).
- [X] T021 [P] [US3] Probar estado textual/aria-pressed/foco, teacher no admin, revocación, respuesta perdida y refresh fallido tras éxito confirmado en frontend/test/content-publication.test.ts (FR-004/006/007/013/014).
- [X] T022 [US3] Agregar publish/unpublish módulos en frontend/src/lib/api/modules.ts y material en frontend/src/lib/api/materials.ts, sin body ni reintento automático; consultar estado tras resultado incierto (FR-006/007/012).
- [X] T023 [US3] Crear frontend/src/components/content/publication-toggle.tsx con Lucide, texto, aria-label de acción/recurso y aria-pressed; bloquear envío pendiente, conservar foco y distinguir fallo de mutación/fallo de refresh (FR-006/007/014/015).
- [X] T024 [US3] Integrar controles en frontend/src/components/content/modules-panel.tsx, estado propio por ítem y «No visible: módulo sin publicar»; refrescar representación autorizada sin cambiar hijos ni generar auditoría local (FR-003/006/007/008).

**Checkpoint**: las cuatro combinaciones y rechazos conservan datos íntegros y visibilidad correcta.

## Phase 6: Integración y entrega

- [X] T025 Verificar regresiones de navegación/sesión/curso y llamadas API de frontend/test/content-reader.test.ts, frontend/test/content-editor.test.ts y frontend/test/content-publication.test.ts; incluir rutas UC con IDs UTFSM y peticiones tardías tras cambiar recurso (FR-001/013/016).
- [ ] T026 Ejecutar checklist visual/manual de specs/20261021-141350_frontend-modulos-material/quickstart.md: teclado, 375 px, ambos temas, contraste, foco, reduced motion y rechazo API real; registrar evidencia en docs/guides/frontend-content.md (FR-002–004/014/015; SC-001–004).
- [X] T027 Ejecutar api:check, lint, typecheck, test, test:coverage y build de frontend/package.json y .github/scripts/check-doc-length.py; resolver fallos de la feature y registrar pendientes externos en docs/guides/frontend-content.md (FR-016).
- [X] T028 Reconciliar FR/SC, backlog y límites implementados en specs/20261021-141350_frontend-modulos-material/quickstart.md y docs/guides/frontend-content.md; mantener PDF/delete/autosave/versionado fuera y no marcar runtime sin evidencia.

## Dependencies & Execution Order

- Setup T001–T002 → fundación T003–T005 → historias.
- US1: T006–T007 → T008 → T009–T012; navegación/estilos después de componentes.
- US2: T013–T014 → T015 → T016–T017 → T018–T019.
- US3: T020–T021 → T022 → T023 → T024.
- US2/US3 usan fixtures y fundación: no dependen funcionalmente de US1/entre sí.
  Si se implementan primero, crear módulos de API/panel definidos en plan en su forma mínima;
  al integrar US1 reutilizarlos. Orden recomendado US1 → US2 → US3 evita edición simultánea.
- modules.ts, materials.ts y modules-panel.tsx son archivos compartidos: un solo editor activo.
- T025–T028 después de integrar las historias; no desplegar ni cambiar API/DB por esta misión.

## Parallel Execution Examples

- Fundación: T004 validadores + T005 capacidades, después de T003.
- US1: T006 contratos lectura + T007 lector UI; T009 panel y T010 lector tras T008.
- US2: T013 contratos escritura + T014 editor UI; T016 módulo y T017 material tras T015.
- US3: T020 contratos publicación + T021 publicación UI; T022 API y T023 control tras pruebas.
- Cada ejemplo usa archivos diferentes; integrar cambios del panel de forma secuencial.

## Implementation Strategy

1. Completar fundación sin crear infraestructura; contratos/permisos antes de UI dependiente.
2. Entregar US1 como MVP de lectura y ejecutar sus pruebas independientes.
3. Agregar US2 y US3 incrementalmente, manteniendo aceptación independiente con fixtures.
4. Cerrar integración, revisión visual y trazabilidad; separar mocks de validación runtime.
