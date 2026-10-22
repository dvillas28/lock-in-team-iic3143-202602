# Feature Specification: Autoría frontend de quizzes

**Feature Branch**: `feat/frontend-autoria-quizzes` (propuesta)
**Feature Directory**: `specs/20261021-141351_frontend-autoria-quizzes`
**Created**: 2026-10-21
**Status**: Implementada y validada localmente — evidencia y límites en [guía](../../docs/guides/frontend-quiz-authoring.md)
**Input**: Conectar configuración, preguntas, pauta y publicación docente de quizzes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar y crear borradores autorizados (Priority: P1)

Como docente, quiero encontrar mis quizzes y crear borradores dentro de mi alcance.
**Why this priority**: Entrega una capacidad de autoría sin necesitar rendición frontend.
**Independent Test**: Curso y secciones con fixtures teacher ordinario/admin dueño y API existente.
**Acceptance Scenarios**:
1. **Given** teacher activo, **When** consulto el curso, **Then** veo borradores/publicados autorizados sin que la lista revele pauta.
2. **Given** teacher no admin, **When** creo quiz, **Then** solo elijo secciones propias; teacher admin dueño puede ampliar al curso.
3. **Given** assistant/student o admin sin teacher, **When** solicito autoría, **Then** no recibo pauta ni puedo crear quizzes.

### User Story 2 - Editar preguntas, configuración y pauta (Priority: P2)

Como docente autorizado, quiero preparar preguntas válidas y revisar la pauta antes de publicar.
**Why this priority**: La evaluación debe estar completa y coherente antes de quedar disponible.
**Independent Test**: Borrador con preguntas/alternativas válidas e inválidas, sin intentos implementados.
**Acceptance Scenarios**:
1. **Given** borrador editable, **When** guardo preguntas con alternativas y una correcta, **Then** veo la representación de autoría confirmada.
2. **Given** pregunta sin correcta o con varias correctas, **When** guardo/publico, **Then** recibo validación y conservo el formulario autorizado.
3. **Given** quiz publicado/utilizado o cambio a sección fuera de alcance, **When** intento editar, **Then** muestro conflicto/rechazo sin modificar destinatarios silenciosamente.
4. **Given** teacher también student, **When** accedo a pauta, **Then** la UI no ofrece rendición incompatible de ese quiz.

### User Story 3 - Publicar con efecto académico explícito (Priority: P2)

Como docente, quiero publicar un quiz válido y reconocer qué queda bloqueado después.
**Why this priority**: Publicar habilita rendición y crea el elemento de calificación.
**Independent Test**: Fixtures de publicación válida, repetida y curso con primera nota publicada.
**Acceptance Scenarios**:
1. **Given** borrador válido, **When** confirmo publicar, **Then** veo estado publicado y elemento de nota generado por backend.
2. **Given** publicación ya confirmada, **When** se repite, **Then** no aparecen ítems ni eventos duplicados en la representación.
3. **Given** curso congelado por publicación de notas, **When** intento publicar un nuevo borrador, **Then** se explica el conflicto sin simular éxito.

### Edge Cases

- IDs/puntajes/alternativas inválidos, menos de dos alternativas, fechas invertidas y cuerpo mayor de 4 KiB.
- sectionId omitido conserva destino y null solicita curso completo solo si autorizado; origen/destino requieren permiso.
- Revocación durante edición, recursos de otro tenant, 401/403/404/409/413/422/503 y red caída.
- Crear con respuesta perdida; abrir detalle seguro frente a autoría; logout con pauta cargada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Usar rutas limpias de quizzes bajo el curso; dominio aporta slug solo al consumir API institucional con sesión autorizada.
- **FR-002**: Separar listado/detalle seguro de vista de autoría con pauta; nunca precargar pauta para assistant/student ni incluirla en mensajes/logs.
- **FR-003**: Autoría/pauta exigen teacher activo; isAdmin más ownership amplía alcance, sin convertir admin/superadmin aislados en docentes.
- **FR-004**: Teacher ordinario selecciona sus secciones; alcance a todo el curso solo cuando contrato lo autoriza; validar origen y destino al reasignar.
- **FR-005**: Crear borradores con título, instrucciones, ventana, límite de intentos y preguntas según contrato; no inventar tipos de pregunta ni corrección manual.
- **FR-006**: Preguntas tienen puntaje y al menos dos alternativas con IDs válidos/únicos y exactamente una correcta; validar límites reales y conservar feedback seguro.
- **FR-007**: Permitir editar solo borrador no utilizado según backend; publicación/uso restringen cambios, sin duplicar quiz para esquivar un bloqueo.
- **FR-008**: Explicar destino de sección/curso, fechas y límites nulos; no convertir null/omisión en el mismo cambio de destino.
- **FR-009**: Confirmar publicación antes de enviar; reflejar publicación y GradeItem creado por backend con peso inicial cero, sin crearlo aparte en frontend.
- **FR-010**: Respetar repetición de publish y bloqueo de nuevos borradores tras congelación del curso; no ofrecer unpublish/delete no disponibles.
- **FR-011**: Usuario con acceso autorizado a pauta no puede rendir ese quiz aunque tenga student; comunicar restricción y mantener backend como autoridad.
- **FR-012**: Conservar carga/vacío/error, validaciones, 409 y resultado incierto; verificar estado antes de repetir creación y no reintentar mutaciones automáticamente.
- **FR-013**: Formularios autorizados conservan texto ante validación/red, pero pauta/borradores privados se limpian al logout/expiración/cambio de usuario; ignorar respuestas antiguas.
- **FR-014**: Historial/publicación siguen auditados por backend; no alterar resultados, ownership, rol ni sección histórica desde el editor.
- **FR-015**: Teclado para preguntas/alternativas, foco y labels claros, avisos anunciados, contraste ≥4.5:1, 375 px, ambos temas y movimiento reducido.
- **FR-016**: Pruebas futuras cubren UC/UTFSM, teacher ordinario/admin dueño, admin aislado, assistant/student, multirol, revocación y conflictos de edición/publicación.

### Key Entities

- **Quiz**: Curso, destinatarios, ventana, límite de intentos y estado borrador/publicado.
- **Pregunta/alternativa**: Datos integrados del quiz con pauta reservada a autoría autorizada.
- **GradeItem**: Elemento creado por backend al publicar; ponderación se configura en misión 6.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Docentes ordinarios y admin dueño completan crear/editar/publicar dentro de su alcance con cero destinos ajenos aceptados.
- **SC-002**: El 100 % de escenarios assistant/student/admin aislado carece de pauta y acciones de autoría autorizadas.
- **SC-003**: Publicación repetida no muestra elementos duplicados; todos los conflictos de edición o curso congelado conservan el estado confirmado.
- **SC-004**: Configuración y preguntas se completan por teclado en ambos temas/móvil sin depender del color.

## Assumptions

- Se consume autoría backend existente; contenido markdown frontend no bloquea esta misión.
- La UI de notas configura pesos después; este editor no calcula calificaciones ni publica notas.

## Sources & Traceability

- CU-07, RF17–18/25–27, RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-11/20 (JC/MA), vista 13: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencia runtime: [cursos](../20261021-141349_frontend-cursos-participacion/spec.md); fixtures permiten revisión independiente.
- [Contrato](../../docs/reference/openapi/paths/quizzes.yaml), [integridad](../../docs/adr/quiz-authoring-integrity.md), [diseño](../../DESIGN.md).
- Operaciones: listCourseQuizzes/getQuiz/createQuiz/updateQuiz/getQuizAuthoringView/publishQuiz.
- Exclusiones: corrección manual, nuevos tipos, eliminación/unpublish, archivos, rendición, cálculo/publicación de notas y cambios API/DB.
