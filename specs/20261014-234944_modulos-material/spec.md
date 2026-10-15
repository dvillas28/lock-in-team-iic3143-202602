# Feature Specification: Módulos y material compartido

**Feature Branch**: `feat/modulos-material` (propuesta)
**Feature Directory**: `specs/20261014-234944_modulos-material`
**Created**: 2026-10-14
**Status**: Draft
**Input**: Backend MVP de Entrega 2: Módulos y material compartido.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organizar contenido (Priority: P1)

Como docente, organizo y publico contenido compartido por todas las secciones.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Crear dos módulos, reordenarlos y publicar material.

**Acceptance Scenarios**:

1. Crear/editar/reordenar como docente activo actualiza el mismo contenido para todas las secciones.
2. Material publicado bajo módulo oculto permanece invisible al estudiante.

### User Story 2 - Consultar material (Priority: P1)

Como estudiante, leo únicamente contenido publicado de mis cursos activos.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Publicar y ocultar módulos/material y repetir lectura directa.

**Acceptance Scenarios**:

1. Módulo y material publicados con inscripción activa permiten lectura autorizada.
2. Revocar inscripción u ocultar contenido impide lectura incluso mediante enlace anterior.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Permitir al docente activo crear, editar, ordenar, publicar y ocultar módulos del curso, con posiciones únicas.
- **FR-002**: Permitir crear, editar, publicar y ocultar material markdown en un módulo del mismo curso e institución.
- **FR-003**: Compartir módulos/materiales por curso, sin copias ni propiedad de sección.
- **FR-004**: Exigir publicación de módulo y material para visibilidad estudiantil; ocultar módulo conserva publicación individual de sus ítems.
- **FR-005**: Restringir ayudante/estudiante a lectura publicada dentro de sus cursos; impedir acceso directo a borradores.
- **FR-006**: Auditar cambios y publicaciones atómicamente; ocultar conserva contenido e historial.
- **FR-007**: Validar títulos y cuerpo; impedir que contenido aportado por usuarios ejecute acciones al consumirse.
- **FR-008**: Excluir carga de binarios; RF15 y la parte de archivos de RF14 se difieren explícitamente al alcance P2.

### Key Entities

- CourseModule, Material.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todas las combinaciones de publicación de módulo/material producen la visibilidad esperada.
- **SC-002**: Dos secciones reciben el mismo material publicado sin copias divergentes.
- **SC-003**: Todas las pruebas de enlaces directos, revocación y cruces institucionales niegan datos no autorizados.

## Assumptions

- Requiere alcance docente resuelto en cursos-roles. No añade almacenamiento de archivos ni modifica mockups.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [cursos-roles](../20261014-234844_cursos-roles/spec.md).

## Sources & Traceability

- Casos: CU-14, CU-05, CU-06. Requisitos: RF13–RF16, RF25–RF26; RNF1–RNF4.
- Backlog: BE-21–BE-23; parte de BE-24; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.
