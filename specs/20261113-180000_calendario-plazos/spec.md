# Feature Specification: Calendario de plazos

**Feature Branch**: `feat/student-calendar`
**Feature Directory**: `specs/20261113-180000_calendario-plazos`
**Created**: 2026-11-13
**Status**: Implementada en rama; E2E reservado a GitHub Actions.
**Input**: Calendario con fechas de inicio y cierre de tareas y quizzes de todos los cursos, accesible desde un botón flotante con mini calendario expandible a pantalla completa (#316).
**Responsables**: Matías. Objetivo: Semana 6 E4 (9–15 de noviembre de 2026).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis plazos desde cualquier vista (Priority: P1)

Como estudiante, abro un mini calendario flotante y veo los plazos de todos mis cursos sin salir de la página.
**Why this priority**: Encontrar trabajo pendiente y entregar a tiempo. **Independent Test**: Estudiante con un quiz y una tarea publicados en dos cursos.
**Acceptance Scenarios**:

1. **Given** un estudiante con matrículas activas, **When** abre el botón flotante, **Then** ve el mes actual con puntos por día y la agenda del día seleccionado.
2. **Given** borradores, tareas ocultas o actividades de otra sección, **When** consulta, **Then** no aparecen.
3. **Given** el mini calendario abierto, **When** presiona Escape o hace clic fuera, **Then** se cierra y (con Escape) el foco vuelve al botón.

### User Story 2 - Planificar en la vista completa (Priority: P2)

Como estudiante o docente, expando el calendario o uso «Calendario» en la navegación lateral para ver el mes completo con filtros.
**Why this priority**: Organizar la semana entre cursos. **Independent Test**: Usuario con dos cursos; no requiere el botón flotante.
**Acceptance Scenarios**:

1. **Given** la vista `/calendar`, **When** filtra por Tareas, Quizzes o un curso, **Then** la grilla y la agenda muestran solo esos plazos.
2. **Given** una pantalla < 760 px, **When** consulta, **Then** la grilla muestra puntos y la agenda del día queda debajo, sin scroll horizontal.

### User Story 3 - Docente revisa plazos de sus cursos (Priority: P3)

Como docente, veo los plazos de mis cursos, incluidos borradores u ocultos marcados como tales.
**Independent Test**: Docente de una sección con un quiz en borrador.
**Acceptance Scenarios**:

1. **Given** un quiz en borrador de su sección, **When** abre el calendario, **Then** aparece con el chip «Borrador».

### Edge Cases

- Ayudantes y administradores sin matrícula docente/estudiantil no ven el botón y reciben lista vacía.
- Fechas cerca de medianoche se agrupan por día de America/Santiago, incluido el cambio de horario.
- Un cierre igual a la entrega se muestra una sola vez.

## Requirements *(mandatory)*

- **FR-001**: `GET /api/v1/institution/{slug}/calendar?from&to` devuelve quizzes y tareas con alguna fecha en `[from, to)`, rango ≤ 100 días; otro rango o parámetro responde 400.
- **FR-002**: La visibilidad replica los listados por curso: estudiantes solo publicados de su sección o del curso completo; docentes según `visibleSql()` y `AssignmentsService.visible()`.
- **FR-003**: Fechas marcadas: quiz apertura/cierre; tarea inicio/entrega/cierre (cierre solo si difiere).
- **FR-004**: Botón flotante con contador de entregas/cierres en 7 días; oculto en `/calendar`.
- **FR-005**: Ítem «Calendario» en la navegación lateral para docentes y estudiantes.
- **FR-006**: Grilla accesible (`role="grid"`, flechas, Inicio/Fin, RePág/AvPág), enlaces a cada actividad.
- **FR-007**: Solo tokens de `tokens.css`, iconos Lucide, tema oscuro y `prefers-reduced-motion`.

### Trazabilidad

- **CU**: CU-26 *Consultar calendario de plazos* (propuesto); relacionados CU-22/23 y quizzes.
- **RF/RNF**: visibilidad por rol y sección; aislamiento multi-tenant; accesibilidad AA; responsive 375 px.
- **Backlog**: #316 (`CAL-01`), Semana 6 E4. **Dependencias**: #249 (tareas), #270 (quizzes).
- **Exclusiones**: iCal/Google/Outlook, eventos personales, notificaciones, edición desde el calendario.

## Success Criteria *(mandatory)*

- **SC-001**: Un estudiante encuentra su próximo plazo en ≤ 2 interacciones desde cualquier vista.
- **SC-002**: Ningún evento no publicado o de otra institución aparece a estudiantes (prueba de integración).
