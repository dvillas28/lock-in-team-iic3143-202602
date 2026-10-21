# Feature Specification: Módulos y material frontend

**Feature Branch**: `feat/frontend-modulos-material` (propuesta)
**Feature Directory**: `specs/20261021-141350_frontend-modulos-material`
**Created**: 2026-10-21
**Status**: Ready for planning — validación documental, producto pendiente
**Input**: Conectar organización, edición y lectura de contenido markdown del curso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar material publicado (Priority: P1)

Como estudiante o ayudante, quiero encontrar y leer contenido disponible de mis cursos.
**Why this priority**: Entrega valor de aprendizaje sin depender del editor docente.
**Independent Test**: Curso con matriz módulo/ítem publicado y fixtures de lectura, sin quizzes.
**Acceptance Scenarios**:
1. **Given** módulo e ítem publicados, **When** abro su contenido, **Then** veo markdown autorizado del curso actual.
2. **Given** uno de los dos sin publicar, **When** intento abrir material, **Then** no se muestra ni se confirma contenido oculto.
3. **Given** curso sin material visible, **When** termina la consulta, **Then** veo vacío real con retorno al curso.
4. **Given** recurso de UTFSM desde UC, **When** solicito su enlace, **Then** no aparecen datos cruzados.

### User Story 2 - Crear y editar contenido compartido (Priority: P2)

Como teacher activo, quiero organizar módulos y editar material compartido de mi curso.
**Why this priority**: Permite preparar contenido sin asociarlo artificialmente a una sección.
**Independent Test**: Fixtures teacher admin/no admin y contenido borrador, sin publicar notas ni evaluaciones.
**Acceptance Scenarios**:
1. **Given** teacher activo de una sección, **When** creo módulo/material, **Then** queda en borrador y es contenido compartido del curso.
2. **Given** teacher no admin, **When** edito o reordeno módulos, **Then** puedo hacerlo sin exigir ownership administrativo.
3. **Given** assistant/student o admin sin teacher, **When** intento editar, **Then** la acción se rechaza sin cambio confirmado.
4. **Given** respuesta perdida o validación inválida, **When** guardo, **Then** conservo el texto en la vista vigente y explico cómo verificar/reintentar sin duplicar altas.

### User Story 3 - Controlar publicación por módulo e ítem (Priority: P2)

Como docente, quiero publicar cada unidad y conocer la visibilidad efectiva para el estudiante.
**Why this priority**: Evita confundir estado del ítem con disponibilidad bajo su módulo.
**Independent Test**: Las cuatro combinaciones de publicación y repetición de acciones con fixtures.
**Acceptance Scenarios**:
1. **Given** módulo oculto e ítem publicado, **When** reviso el editor, **Then** el ítem conserva estado publicado pero se explica que no es visible.
2. **Given** módulo publicado, **When** lo oculto, **Then** se conserva el estado de sus ítems y el historial backend.
3. **Given** publicación fallida o revocación, **When** termina la solicitud, **Then** no se muestra éxito ni se retienen datos privados prohibidos.

### Edge Cases

- Markdown con HTML/enlaces peligrosos, texto vacío, límites de cuerpo 4 KiB y errores 413/422.
- Curso con varias secciones, módulo sin ítems, orden inválido y edición concurrente sin control de versión contractual.
- Cambio de dominio/usuario, sesión vencida, respuestas antiguas, 403/404/409/503 y error de red.
- PDF ilustrativo del mockup sin servicio binario disponible; no presentar descarga falsa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Usar rutas limpias bajo `/courses/{courseId}` para módulos/material; dominio resuelve slug solo para API institucional autorizada.
- **FR-002**: Leer mediante pertenencia y roles backend; student/assistant solo ven contenido publicado de cursos accesibles.
- **FR-003**: Material requiere módulo e ítem publicados; las cuatro combinaciones tienen aceptación explícita, sin confiar en ocultar botones.
- **FR-004**: Teacher activo de cualquier sección edita contenido compartido del curso y puede leer borradores; isAdmin/isSuperAdmin sin teacher no habilitan contenido docente.
- **FR-005**: Permitir crear/editar módulos, reemplazar orden mediante contrato y crear/editar material markdown; no agregar delete, archivos o reordenamiento de ítems sin endpoint vigente.
- **FR-006**: Nuevos módulos/ítems quedan sin publicar; mostrar controles independientes, estado textual, estado accesible y visibilidad efectiva bajo el módulo.
- **FR-007**: Publicar/ocultar conserva estado de hijos e historial; confirmar la respuesta real y refrescar representación autorizada, sin inventar eventos frontend.
- **FR-008**: No modificar curso/tenant del material ni tratarlo como contenido de una sola sección; backend mantiene integridad y auditoría transaccionales.
- **FR-009**: Contenido se representa de forma segura, sin ejecutar HTML ni scripts provenientes del markdown o metadatos; enlaces no deben ejecutar protocolos peligrosos.
- **FR-010**: Validar formularios según contrato y manejar 400/409/413/415/422; conservar borrador solo en la sesión/vista autorizada, limpiar al logout/expiración.
- **FR-011**: No declarar autosave, edición colaborativa, merge de versiones ni protección contra sobrescritura no ofrecida por API; una mutación confirmada sustituye la representación vigente según contrato.
- **FR-012**: Ante resultado incierto de creación, verificar lista antes de repetir; no reintentar mutaciones automáticamente ni confundir red caída con vacío.
- **FR-013**: Carga/vacío/error/recurso no disponible con recuperación segura; sesiones/respuestas ligadas a identidad/contexto, sin fuga tras revocación.
- **FR-014**: Teclado y alternativa operable para ordenar, foco visible, labels, estados anunciados, contraste ≥4.5:1, ambos temas, 375 px y movimiento reducido.
- **FR-015**: Usar tokens/componentes canónicos; íconos Lucide y texto para publicación, sin depender del color.
- **FR-016**: Pruebas futuras de UC/UTFSM, matriz de publicación, teacher no admin, assistant/student, admin sin teacher, revocación, markdown adversarial y respuestas tardías.

### Key Entities

- **Módulo**: Curso, título, orden y estado de publicación independiente.
- **Material markdown**: Módulo padre, texto/metadatos y publicación propia.
- **Visibilidad efectiva**: Publicación de ambos niveles más pertenencia/rol autorizado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las cuatro combinaciones módulo/ítem producen exactamente la visibilidad esperada para student/assistant.
- **SC-002**: Docente no admin completa creación, edición, orden y publicación sin privilegios administrativos adicionales.
- **SC-003**: Cero casos de rol/tenant rechazado o markdown adversarial exponen contenido prohibido o ejecutan scripts.
- **SC-004**: Lectura, edición y orden funcionan por teclado en ambos temas y móvil; todos los estados de publicación se entienden sin color.

## Assumptions

- Se reutilizan persistencia, auditoría y restricciones de contenido existentes; no se solicita colaboración en tiempo real.
- El lector PDF del prototipo queda excluido; el recorrido completo del MVP usa markdown.

## Sources & Traceability

- CU-05/06/14, RF13/14(markdown)/16/25–26, RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-08–10/20 (JC/MA), vistas 04 parcial/12 y 09 excluida: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencia runtime: [cursos](../20261021-141349_frontend-cursos-participacion/spec.md); revisión independiente con fixtures.
- Contratos: [módulos](../../docs/reference/openapi/paths/sections.yaml), [material](../../docs/reference/openapi/paths/materials.yaml).
- Operaciones: listCourseModules/createCourseModule/getCourseModule/updateCourseModule/reorderCourseModules,
  publishCourseModule/unpublishCourseModule y listModuleMaterials/createMarkdownMaterial/getMaterial/updateMaterial/publishMaterial/unpublishMaterial.
- [Publicación compartida](../../docs/adr/shared-markdown-publication.md), [diseño](../../DESIGN.md), [mockups](../../mockups/README.md).
- Exclusiones: RF15/FE-21/RNF8, PDF/binarios, borrado físico, autosave, colaboración/versionado nuevo, quizzes y cambios API/DB.
