# Feature Specification: Cursos, secciones, roles y auditoría mínima

**Feature Branch**: `feat/cursos-roles` (propuesta)
**Feature Directory**: `specs/20261014-234844_cursos-roles`
**Created**: 2026-10-14
**Status**: Needs clarification
**Input**: Backend MVP de Entrega 2: Cursos, secciones, roles y auditoría mínima.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar mis cursos (Priority: P1)

Como participante, encuentro cursos y secciones según mis permisos vigentes.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Consultar el mismo curso con docente, ayudante y estudiante.

**Acceptance Scenarios**:

1. Inscripción activa permite consultar únicamente cursos y secciones autorizados.
2. Desactivar inscripción elimina su acceso y conserva su historial.

### User Story 2 - Mantener secciones y participantes (Priority: P1)

Como docente autorizado, organizo secciones y roles dentro de mi alcance.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Asignar dos roles distintos, repetir uno y desactivarlo.

**Acceptance Scenarios**:

1. Asignar un rol a miembro activo conserva contexto y genera historial.
2. Repetir un rol ya activo no lo duplica; desactivarlo conserva los otros roles.
3. Fallo al registrar historial impide confirmar el cambio de rol.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Crear Course, primera Section y rol teacher del creador como una operación indivisible; no permitir cursos huérfanos.
- **FR-002**: Restringir creación inicial de cursos al bootstrap operativo hasta definir quién concede administración de curso.
- **FR-003**: Permitir al docente autorizado crear/actualizar secciones y configuración del curso; validar código único por curso y capacidad no negativa.
- **FR-004**: Asignar, cambiar y desactivar roles teacher/student/assistant solo a miembros activos de la misma institución; admitir varios roles sin duplicar el mismo rol activo.
- **FR-005**: Limitar ayudante a lectura de seguimiento y estudiante al recorrido propio; membership no concede escrituras académicas.
- **FR-006**: Impedir vínculos entre instituciones y relaciones inconsistentes de sección/curso aun con identificadores manipulados.
- **FR-007**: Registrar historial inmutable y sanitizado junto a cada cambio sensible: institución, actor, recurso, curso, sección cuando aplique, fecha y antes/después.
- **FR-008**: Conservar roles y registros académicos referenciados; revocación no elimina evidencia.
- **FR-009**: [NEEDS CLARIFICATION: ¿Adoptar capacidad administrativa de curso separada de teacher según ADR de UI, o mantener teacher con administración de curso según modelo vigente?]

### Key Entities

- Course, Section, Enrollment, AuditEvent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los roles se verifican en dos instituciones sin lecturas, escrituras ni relaciones cruzadas.
- **SC-002**: Cada cambio sensible confirmado tiene evento; todos los fallos conservan el estado previo.
- **SC-003**: Repetir asignación no produce duplicados y desactivar un rol conserva los demás.

## Assumptions

- La decisión de alcance docente bloquea el plan de esta misión. Enrollment es la fuente académica vigente: no agregar CourseMembership ni SectionMembership por títulos históricos del backlog.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [identidad-acceso](../20261014-234744_identidad-acceso/spec.md).

## Sources & Traceability

- Casos: CU-03, CU-04. Requisitos: RF8–RF12, RF25–RF26; RNF1–RNF4.
- Backlog: PREP-10, BE-09–BE-14; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.
