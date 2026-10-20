# Feature Specification: Libro de notas, publicación y auditoría

**Feature Branch**: `feat/notas-publicacion-auditoria`
**Feature Directory**: `specs/20261014-235244_notas-publicacion-auditoria`
**Created**: 2026-10-14
**Status**: Planned; implementación en la siguiente capa del stack; bloqueo heredado #96 pendiente
**Input**: Backend MVP de Entrega 2: Libro de notas, publicación y auditoría.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar y publicar (Priority: P1)

Como docente autorizado, configuro pesos y publico resultados de mi alcance.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Configurar 100 % y publicar selección sin intentos activos.

**Acceptance Scenarios**:

1. Pesos válidos y selección autorizada sin intentos abiertos permiten publicar toda la selección con auditoría.
2. Intento activo o pesos distintos de 100 % impiden modificar notas seleccionadas.
3. Primera nota publicada bloquea nuevos ítems, cambio de pesos y sobrescritura de esa nota.

### User Story 2 - Consultar resultados e historial (Priority: P1)

Como participante, consulto únicamente los resultados/eventos que mi rol permite.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Consultar libro como estudiante, ayudante y docentes de distinto alcance.

**Acceptance Scenarios**:

1. Estudiante obtiene solo notas propias publicadas y promedio normalizado por sus pesos.
2. Sin peso publicado no existe promedio numérico ni cero artificial.
3. Docente y ayudante consultan notas publicadas y no publicadas dentro de su alcance de seguimiento; ayudante sin pauta ni escritura.
4. Docente consulta solo historial sanitizado de su alcance.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Configurar pesos entre 0 y 100 % y reemplazarlos atómicamente con total 100 % antes de publicar.
- **FR-002**: Reservar configuración global al alcance resuelto en cursos-roles; ayudante nunca edita ni publica.
- **FR-003**: Publicar selección explícita de evaluación, secciones y estudiantes autorizados; validar todo el conjunto antes de confirmar y auditar.
- **FR-004**: Rechazar publicación con intentos activos de estudiantes/quizzes seleccionados o resultados no calificados; no cancelar automáticamente.
- **FR-005**: Bloquear nuevos ítems/pesos desde primera nota publicada; nota publicada inmutable sin recorrección silenciosa.
- **FR-006**: Mostrar al estudiante solo notas propias publicadas; promedio sum(nota × peso) / sum(peso publicado), HALF_UP a un decimal; peso total cero produce ausencia de promedio.
- **FR-007**: Permitir libro/intentos y notas publicadas o no publicadas al docente dentro de su alcance y al ayudante solo lectura de sus secciones activas, sin pauta.
- **FR-008**: Permitir al docente consultar auditoría por fecha, acción, recurso y sección en su alcance; ocultar secretos y pauta; estudiante/ayudante no acceden.
- **FR-009**: Revalidar revocaciones y conservar curso/sección históricos de notas, intentos y eventos.
- **FR-010**: Verificar flujo completo identidad → institución → curso → quiz → intento → nota → publicación en UC y UTFSM, incluidas carreras con envío y cambios de peso.

### Key Entities

- GradeItem, Grade publicada, AuditEvent inmutable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toda selección se publica íntegra o no se publica; todos los fallos conservan notas previas.
- **SC-002**: (6.5×15 + 6.8×15 + 5.1×25 + 7.0×10) / 65 devuelve 6.1 y 65 % publicado.
- **SC-003**: La suite final de los 16 CU impide accesos cruzados y notas no publicadas en consultas estudiantiles; verifica que solo docentes y ayudantes con permiso de seguimiento en la sección histórica pueden consultar esas notas.

## Assumptions

- Permisos resueltos por el ADR vigente de admin y ownership; antes de implementar deben integrarse y verificarse las dependencias reales. No añade exportación, corrección manual ni cambios posteriores a publicación.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [intentos-calificacion](../20261014-235144_intentos-calificacion/spec.md), [modulos-material](../20261014-234944_modulos-material/spec.md).

## Sources & Traceability

- Casos: CU-10, CU-11, CU-12, CU-13, CU-16. Requisitos: RF21–RF26, RF29; RNF1–RNF4, RNF9.
- Backlog: BE-26–BE-32, DOC-15; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): reconciliado con el ADR vigente de admin y ownership; la integración de las dependencias sigue siendo un prerrequisito.

Permisos vigentes: [ADR de admin y ownership](../../docs/adr/institution-admin-and-course-ownership.md).
Teacher activo habilita evaluación; admin dueño amplía alcance, sin reemplazar rol.
Assistant conserva solo lectura de seguimiento; superadmin no concede docencia.
