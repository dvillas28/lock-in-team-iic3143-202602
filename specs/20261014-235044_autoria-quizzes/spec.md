# Feature Specification: Autoría y publicación de quizzes

**Feature Branch**: `feat/autoria-quizzes` (propuesta)
**Feature Directory**: `specs/20261014-235044_autoria-quizzes`
**Created**: 2026-10-14
**Status**: Draft
**Input**: Backend MVP de Entrega 2: Autoría y publicación de quizzes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar evaluación (Priority: P1)

Como docente autorizado, preparo pauta y destinatarios antes de publicar.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Publicar borrador válido e intentar publicar otro inválido.

**Acceptance Scenarios**:

1. Borrador válido se publica para sus destinatarios con un único elemento de nota.
2. Pauta inválida impide publicación y no genera elementos parciales.

### User Story 2 - Proteger pauta (Priority: P1)

Como estudiante, consulto un quiz sin acceder a respuestas correctas.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Comparar consultas de docente y estudiante y modificar tras primer intento.

**Acceptance Scenarios**:

1. Consulta estudiantil no contiene pauta ni campos de corrección.
2. Después del primer intento se rechazan cambios a pauta, puntajes y política de intentos.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Crear/editar borradores con título, instrucciones, destinatarios de curso o sección autorizada, ventana y máximo positivo de intentos o ilimitados.
- **FR-002**: Exigir preguntas con puntos positivos, al menos dos alternativas y exactamente una correcta; identificadores estables y no duplicados.
- **FR-003**: Validar apertura anterior al cierre cuando existan y destinatarios del mismo curso e institución.
- **FR-004**: Publicar quiz, crear un GradeItem único y auditar como una operación indivisible; repetir no duplica el ítem.
- **FR-005**: Rechazar publicación de un quiz nuevo que agregaría ítems después de la primera nota publicada del curso.
- **FR-006**: Separar vista estudiantil de pauta; excluir respuestas correctas de logs, errores e historial.
- **FR-007**: Impedir rendir a quien puede consultar pauta aunque tenga rol student acumulado.
- **FR-008**: Inmovilizar preguntas, alternativas, respuestas correctas, puntajes y política de intentos desde el primer intento.
- **FR-009**: Validar destinatarios con alcance docente resuelto en cursos-roles; ayudante no publica ni obtiene pauta.

### Key Entities

- Quiz con preguntas/alternativas; GradeItem único de la evaluación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los borradores inválidos se rechazan sin quiz publicado ni elemento parcial.
- **SC-002**: Ninguna vista estudiantil, error o evento de aceptación contiene pauta anticipada.
- **SC-003**: Publicación repetida conserva un único elemento; primer intento bloquea todos los cambios protegidos.

## Assumptions

- Preguntas y alternativas integran Quiz según el modelo vigente; no imponer tablas por títulos históricos del backlog. Configurar ponderaciones corresponde a notas-publicacion-auditoria.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [cursos-roles](../20261014-234844_cursos-roles/spec.md).

## Sources & Traceability

- Casos: CU-07. Requisitos: RF17–RF18, RF25–RF27; RNF1–RNF4.
- Backlog: BE-15–BE-17; parte de BE-24; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.

Permisos vigentes: [ADR de admin y ownership](../../docs/adr/institution-admin-and-course-ownership.md).
Teacher activo habilita evaluación; admin dueño amplía alcance, sin reemplazar rol.
Assistant conserva solo lectura de seguimiento; superadmin no concede docencia.
