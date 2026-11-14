# Tasks: Calendario de plazos

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Issue**: #316 (`CAL-01`)

## Phase 1: Base compartida

- [x] T001 Endpoint `GET calendar` con validación de rango y visibilidad por rol (FR-001–003)
- [x] T002 OpenAPI `CalendarEvent`/`CalendarEventList` y regeneración de `schema.d.ts`
- [x] T003 [P] Integración: estudiante, docente, dueño, ayudante, admin, UTFSM y rangos inválidos
- [x] T004 [P] Cliente `listCalendar` con validación de contrato y lógica pura de grilla/marcas

## Phase 2: US1 Botón flotante — CAL-01 / #316

- [x] T005 `CalendarFab` + popover con mini grilla, agenda y contador de 7 días (FR-004)
- [x] T006 Montaje vía `ProtectedInstitution` → `InstitutionShell.floating` solo para docentes/estudiantes
- [x] T007 [P] Pruebas UI: contador, apertura, teclado, Escape y retorno de foco

## Phase 3: US2 Vista completa — CAL-01 / #316

- [x] T008 Ruta `/calendar`, filtros por tipo y curso, agenda lateral y leyenda
- [x] T009 Ítem «Calendario» en el sidebar y título en breadcrumb (FR-005)
- [x] T010 [P] Pruebas UI de filtros, visibilidad del ítem y E2E `E2E-CALENDAR-001`

## Phase 4: US3 Docentes y cierre

- [x] T011 Chips «Borrador»/«Oculta» en agenda para docentes
- [x] T012 Estilos con tokens, responsive y tema oscuro; revisión visual (FR-007)

## Dependencies & Execution Order

Phase 1 → Phases 2 y 3 en paralelo → Phase 4.

## Implementation Strategy

MVP = Phase 1 + 2; la vista completa y el sidebar reutilizan la misma grilla y endpoint.
