# Feature Specification: Cursos y participación frontend

**Feature Branch**: `feat/frontend-cursos-participacion` (propuesta)
**Feature Directory**: `specs/20261021-141349_frontend-cursos-participacion`
**Created**: 2026-10-21
**Status**: Ready for planning — validación documental, producto pendiente
**Input**: Conectar shell, cursos, secciones y participantes con permisos reales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mis cursos y secciones (Priority: P1)

Como integrante de una institución, quiero encontrar cursos y secciones donde tengo acceso.
**Why this priority**: Es el primer recorrido académico tras autenticarse.
**Independent Test**: Directorio de cursos y secciones con fixtures de acceso; sin contenido ni quizzes.
**Acceptance Scenarios**:
1. **Given** estudiante/ayudante/docente activo, **When** abro `/courses`, **Then** veo solo cursos y secciones autorizados en el dominio actual.
2. **Given** usuario sin cursos, **When** termina la consulta, **Then** veo vacío real, distinto de carga o error.
3. **Given** curso de otro tenant o sin acceso, **When** abro su enlace directo, **Then** no veo datos ni confirmación de existencia.
4. **Given** usuario multirol, **When** navego, **Then** sus acciones reflejan permisos vigentes por curso/sección, no un perfil forzado.

### User Story 2 - Crear y configurar cursos propios (Priority: P2)

Como admin institucional, quiero crear y configurar los cursos de los que soy dueño.
**Why this priority**: Permite preparar la estructura sin confundir admin con docencia.
**Independent Test**: Alta/configuración con fixtures de admin dueño, admin ajeno y teacher sin admin.
**Acceptance Scenarios**:
1. **Given** isAdmin vigente, **When** creo un curso válido, **Then** recibo curso, primera sección y teacher inicial definidos por backend.
2. **Given** admin dueño sin Enrollment docente, **When** configuro curso/secciones, **Then** puedo administrarlos sin adquirir pauta/notas/contenido docente.
3. **Given** admin ajeno o teacher sin admin, **When** intento configurar curso o crear sección, **Then** se rechaza sin cambio local confirmado.
4. **Given** creación con respuesta perdida, **When** recupero la vista, **Then** consulto el estado antes de repetir y trato conflicto sin inventar idempotencia.

### User Story 3 - Gestionar participantes dentro de mi alcance (Priority: P2)

Como docente o admin dueño, quiero asignar y revocar roles de participantes autorizados.
**Why this priority**: El contexto académico depende de matrículas activas y auditablemente modificadas.
**Independent Test**: Secciones con usuarios existentes, múltiples roles y revocación, sin quizzes implementados.
**Acceptance Scenarios**:
1. **Given** teacher ordinario, **When** gestiono participantes, **Then** solo puedo escribir en mis secciones activas.
2. **Given** admin dueño, **When** gestiono participantes, **Then** opero todas las secciones de mi curso según autorización backend.
3. **Given** ayudante/estudiante, **When** abro gestión, **Then** no puedo listar ni modificar participantes mediante ese acceso.
4. **Given** cambio de rol o revocación, **When** backend confirma, **Then** actualizo la matrícula devuelta e historial, sin borrar registros anteriores.

### Edge Cases

- isAdmin revocado durante formulario; isSuperAdmin sin isAdmin; admin de curso ajeno con teacher propio.
- Sin participantes elegibles; múltiples roles simultáneos; cambio devuelve ID sucesor; último teacher revocado.
- Código/período duplicado, cuerpo inválido, respuesta perdida, 401/403/404/409/422/503 y red caída.
- Mismo curso/sección solicitado desde otro dominio, cambio de usuario y respuestas de sesión anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mostrar shell institucional, identidad y acciones contextuales usando pertenencia/roles vigentes; sin permisos derivados de URL, mockup o teacher aislado.
- **FR-002**: Usar rutas limpias `/courses`, `/courses/{courseId}` y `/courses/{courseId}/sections`; dominio aporta slug solo al consultar API.
- **FR-003**: Listar únicamente cursos visibles y secciones autorizadas; separar carga, vacío, error, recurso no disponible y pérdida de sesión.
- **FR-004**: Permitir creación solo con isAdmin vigente; propietario inmutable y teacher inicial provienen del backend, sin editor de owner.
- **FR-005**: Configuración de curso y creación/edición de sección exigen isAdmin y ownership; admin ajeno no obtiene acceso por el flag.
- **FR-006**: Admin dueño conserva administración sin Enrollment docente; contenido docente, pauta y notas siguen exigiendo sus permisos académicos propios.
- **FR-007**: Teacher ordinario lista/gestiona participantes solo de sus secciones; admin dueño amplía alcance a su curso; assistant/student no listan ni escriben matrículas.
- **FR-008**: Seleccionar personas ya existentes de la institución; no invitar/crear usuarios, modificar otra institución ni conceder isAdmin/isSuperAdmin desde esta vista.
- **FR-009**: Preservar múltiples roles distintos y cambios auditados; usar respuesta de cambio de rol con posible ID sucesor, sin sobrescribir historia ni borrar matrícula.
- **FR-010**: Mostrar confirmación antes de revocar; no impedir arbitrariamente revocar último teacher si el contrato lo permite; conservar curso e historial.
- **FR-011**: Buscar participantes mediante operación autorizada para teacher; admin dueño sin teacher no consulta una búsqueda prohibida y puede usar identificador conocido permitido por contrato.
- **FR-012**: Resolver 409/422/errores de red de forma segura; no reintentar automáticamente altas no idempotentes ni marcar cambios exitosos sin confirmación backend.
- **FR-013**: Proteger datos ante sesión expirada, revocación o respuesta tardía; todas las operaciones conservan contexto institucional explícito y autorización backend.
- **FR-014**: Reutilizar diseño y componentes existentes; teclado, foco, labels, avisos anunciados, contraste ≥4.5:1, 375 px, ambos temas y movimiento reducido.
- **FR-015**: Pruebas futuras incluyen UC/UTFSM, admin dueño/ajeno, teacher/assistant/student, superadmin aislado, multirol y revocación concurrente.
- **FR-016**: Persistencia e historial de curso/sección/matrícula se mantienen en backend; no replicar SQL, RLS, auditoría ni cálculo de permisos como autoridad frontend.

### Key Entities

- **Curso**: Institución, configuración, propietario inmutable y secciones visibles.
- **Sección**: División de curso con participantes y roles contextualizados.
- **Enrollment**: Rol académico activo/histórico; una persona puede conservar varios roles.
- **Capacidad administrativa**: isAdmin vigente más ownership para el curso; separada de docencia y superadmin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cada perfil de prueba ve el 100 % de sus cursos/secciones autorizados y cero registros ajenos.
- **SC-002**: Crear/configurar curso y asignar/revocar participante completan el recorrido por teclado en ambos temas.
- **SC-003**: Todos los rechazos por permiso o conflicto dejan cero cambios mostrados como confirmados sin aceptación backend.
- **SC-004**: Al expirar sesión o cambiar usuario, cero datos del curso anterior reaparecen tras respuestas tardías.

## Assumptions

- Las operaciones necesarias ya existen; la búsqueda de usuarios está reservada a teachers, sin ampliar permisos para facilitar el formulario.
- Shell enlaza capacidades pendientes sin inventar contenido; los mocks permiten validar esta spec independientemente.

## Sources & Traceability

- CU-03/04, RF10–12/25–26, RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-05–07/20 (JC/MA), vistas 03/07/11 y cabecera 04: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencia runtime: [acceso](../20261021-141348_frontend-acceso-multitenant/spec.md); [permisos](../../docs/adr/institution-admin-and-course-ownership.md).
- Contratos: [cursos](../../docs/reference/openapi/paths/courses.yaml), [secciones](../../docs/reference/openapi/paths/sections.yaml),
  [búsqueda](../../docs/reference/openapi/paths/platform.yaml), [diseño](../../DESIGN.md).
- Operaciones: listCourses/createCourse/getCourse/updateCourse, listSections/createSection/getSection/updateSection,
  listSectionEnrollments/createSectionEnrollment/updateSectionEnrollment y searchInstitutionUsers.
- Exclusiones: rol coordinador nuevo, delegación institucional, invitaciones, transferencia de ownership, contenido/evaluación/notas y cambios API/DB.
