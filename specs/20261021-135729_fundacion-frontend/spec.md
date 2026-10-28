# Feature Specification: Fundación y misiones del frontend AcademiX

**Feature Branch**: `docs/frontend-specs`
**Feature Directory**: `specs/20261021-135729_fundacion-frontend`
**Created**: 2026-10-21
**Status**: Complete — seis specs hijos entregados; implementación de producto pendiente
**Input**: Formalizar el frontend mediante una misión cuyas historias produzcan specs
específicos para conectar las vistas al backend, comenzando por login y multitenancy
resuelta desde el dominio, con rutas visibles limpias y contexto explícito en la API.

## User Scenarios & Testing *(mandatory)*

Esta misión entrega especificaciones, no pantallas implementadas. Sus usuarios son
quienes desarrollan y validan AcademiX; cada historia entrega documentos revisables
sin exigir implementar las otras. La aceptación funcional se exige en cada misión hija.

### User Story 1 - Especificar acceso institucional por dominio (Priority: P1)

Como responsable del frontend, necesito especificar acceso desde UC/UTFSM, login y consultas al contexto autorizado.

**Why this priority**: Todas las vistas privadas necesitan identidad y contexto confiables.
**Independent Test**: Revisar la spec hija con UC/UTFSM y una persona multi-institución, sin implementar cursos ni evaluaciones.

**Acceptance Scenarios**:

1. **Given** un dominio reconocido, **When** se especifica acceso, **Then** se definen rutas sin slug y traducción al contexto API.
2. **Given** credenciales y pertenencia válidas, **When** se describe ingreso, **Then** se definen validación, retorno y expiración.
3. **Given** dominio desconocido o pertenencia ausente/revocada, **When** se describe acceso, **Then** no hay tenant por defecto ni datos privados.
4. **Given** dos dominios y local, **When** se revisa la spec, **Then** hay escenarios CORS/preflight y aislamiento de sesión.

### User Story 2 - Especificar navegación, cursos y permisos (Priority: P2)

Como responsable de experiencia académica, necesito especificar navegación y cursos con contexto y permisos efectivos.

**Why this priority**: Entrega el primer recorrido útil después de autenticarse.
**Independent Test**: Revisar la spec con identidades y respuestas como fixtures, sin implementar US1 ni contenido.

**Acceptance Scenarios**:

1. **Given** mockups y contratos, **When** se especifican cursos, secciones y participantes, **Then** cada acción tiene actor, alcance y rechazo.
2. **Given** los cinco perfiles, **When** se especifica navegación, **Then** dominio, URL y controles no amplían permisos.
3. **Given** discrepancias históricas, **When** se revisa la spec, **Then** se resuelven contra el contrato vigente antes de planificarla.

### User Story 3 - Especificar módulos y material (Priority: P3)

Como equipo frontend, necesitamos una spec de lectura, edición, orden y publicación de contenido.
**Why this priority**: Habilita el recorrido académico compartido sin depender de quizzes.
**Independent Test**: Revisar CU-14/05/06 con fixtures y mockups 04/09/12, sin ejecutar US1/US2.
**Acceptance Scenarios**:
1. **Given** módulos e ítems, **When** se especifica visibilidad, **Then** se exigen ambas publicaciones, permisos e historial.
2. **Given** el lector PDF de ejemplo, **When** se delimita el MVP, **Then** markdown queda incluido y binarios excluidos.

### User Story 4 - Especificar autoría de quizzes (Priority: P3)

Como equipo frontend, necesitamos una spec de configuración, preguntas, alternativas, pauta y publicación.
**Why this priority**: Separa la escritura docente del recorrido estudiantil.
**Independent Test**: Revisar CU-07 y mockup 13 con fixtures de permisos, sin implementar contenido ni intentos.
**Acceptance Scenarios**:
1. **Given** docentes con distinto alcance, **When** se especifica autoría, **Then** se delimitan secciones y acceso a pauta.
2. **Given** preguntas inválidas o un quiz publicado, **When** se describe edición, **Then** se respetan validación y restricciones vigentes.

### User Story 5 - Especificar rendición de quizzes (Priority: P3)

Como equipo frontend, necesitamos una spec para iniciar, guardar, reanudar, enviar y cancelar intentos.
**Why this priority**: El envío requiere confirmación y recuperación seguras.
**Independent Test**: Revisar CU-08/09/15 y mockups 05/14 con quizzes de fixture, sin implementar autoría.
**Acceptance Scenarios**:
1. **Given** un intento y fallos de red, **When** se especifica guardar/enviar, **Then** se define recuperación sin duplicados ni nota anticipada.
2. **Given** límite, plazo, cancelación o acceso incompatible a pauta, **When** se especifica rendición, **Then** se respetan las restricciones del backend.

### User Story 6 - Especificar notas y seguimiento (Priority: P3)

Como equipo frontend, necesitamos una spec de ponderaciones, publicación, notas propias, libro docente y auditoría.
**Why this priority**: Agrupa seguimiento con historial sin crear una séptima misión hija.
**Independent Test**: Revisar CU-10/11/12/13/16 y mockups 06/08/15/16 con resultados de fixture.
**Acceptance Scenarios**:
1. **Given** notas sin publicar, **When** se especifica consulta, **Then** el estudiante solo ve las propias publicadas y su promedio.
2. **Given** docentes, ayudante y admin dueño, **When** se especifica seguimiento, **Then** se delimitan escritura, sección y auditoría inmutable.

### Edge Cases

- Dominio no configurado, host manipulado, alias, puerto local y navegación directa/refresco.
- Dominio válido con tenant inexistente/inactivo, sin pertenencia o con pertenencia revocada.
- Usuario de dos instituciones en pestañas simultáneas, cambio de dominio y sesión vencida.
- Redirección de retorno externa, datos anteriores visibles tras logout y caché entre usuarios.
- Origen denegado, preflight fallido, red caída, respuestas 401/403/404/429 y lista vacía.
- Usuario con varios roles; admin sin Enrollment docente; superadmin sin acceso académico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La misión MUST entregar índice en `docs/frontend/` y seis specs hijas con checklist, trazabilidad y aceptación independiente.
- **FR-002**: El mapa MUST comenzar por acceso y cursos; contenido y autoría podrán avanzar separadamente tras resolver permisos.
- **FR-003**: Las specs MUST resolver slug desde dominio; rutas visibles, enlaces y retornos no incluyen prefijo institucional.
- **FR-004**: Acceso MUST definir dominios reconocidos/desconocidos, equivalencia local de ambos tenants y navegación directa sin tenant por defecto.
- **FR-005**: La spec de acceso MUST preservar el contrato backend
  `/api/v1/institution/{institutionSlug}/...`; login y directorio institucional son globales.
  El frontend consulta la API central; nunca accede directamente a la base de datos.
- **FR-006**: Cada spec MUST exigir pertenencia y autorización del backend; Host/Origin no sustituyen slug ni conceden acceso.
- **FR-007**: La spec de acceso MUST cubrir login, persistencia y límites de sesión,
  expiración, logout, retorno seguro, aislamiento entre dominios y solicitudes concurrentes.
  Debe decidir la experiencia de elegir/cambiar institución sin asumir sesión compartida.
- **FR-008**: Acceso MUST identificar orígenes autorizados y escenarios CORS/preflight UC/UTFSM/local; CORS no autoriza datos.
- **FR-009**: Cada spec MUST declarar permisos por institución/curso/sección y distinguir isAdmin, ownership, isSuperAdmin y Enrollment.
- **FR-010**: Las specs MUST inventariar vistas, operaciones y carga/vacío/error; registrar brechas del backend antes del plan afectado.
- **FR-011**: Cada spec MUST incluir teclado, foco, labels, contraste, móvil y temas con diseño canónico, sin copiar permisos simulados.
- **FR-012**: Las specs MUST preservar auditoría/historial académico; esta misión documental no modifica registros, permisos ni persistencia.
- **FR-013**: Cada spec MUST definir evidencia futura de dos tenants, revocación y roles, distinguiéndola de validación documental ejecutada.
- **FR-014**: Acceso MUST identificar transición de `/institutions/[institutionSlug]`, helpers, pruebas y guías; su reemplazo será implementación hija.

### Key Entities

- **Misión frontend**: Capacidad entregable con spec, cobertura, dependencias y aceptación.
- **Contexto institucional**: Dominio reconocido y slug solicitado; pertenencia validada por API.
- **Sesión**: Identidad global autenticada, vigencia y límites entre orígenes por definir en su spec.
- **Capacidad contextual**: Acciones permitidas según pertenencia, ownership y roles efectivos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de CU-01–16, FE-01–20 y las 16 pantallas queda clasificado por misión, reutilización o exclusión justificada.
- **SC-002**: Cada misión hija tiene checklist completo y al menos un recorrido exitoso,
  uno de rechazo y los casos de aislamiento y permisos aplicables.
- **SC-003**: UC y UTFSM tienen escenarios equivalentes con rutas visibles sin slug,
  incluyendo recarga directa, usuario multi-institución y rechazo de dominio desconocido.
- **SC-004**: El mapa identifica siguiente spec y prerrequisitos sin revisar código; ninguna dependencia es circular.

## Assumptions

- Se reutilizan backend, cliente, diseño y sesión en memoria de #124 en dev `ee4a329`; no se elige nueva tecnología.
- Partición acordada: acceso/sesión; navegación/cursos/secciones; módulos/material;
  autoría de quizzes; intentos/envío; notas/publicación/seguimiento con auditoría.
- La spec de acceso resuelve el selector histórico mediante navegación entre dominios.
  No se presupone portal global, SSO ni transporte de tokens entre dominios.
- La ADR de admin/ownership vigente prevalece sobre descripciones históricas de mockups.

## Sources & Traceability

- CU-01–16, RF1–29 y RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- Backlog FE-01–20 (JC, MA), DOC-01 y contrato #29: [detalle](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
  Se conservan responsables; no se afirma estado remoto ni se crean issues en esta fase.
- Dependencias: [misiones backend](../../docs/backend/README.md), [demo/contexto](../20261020-211552_demo-aislamiento-dominios/spec.md),
  [OpenAPI](../../docs/reference/openapi/openapi.yaml), [cliente](../../docs/guides/frontend-api-client.md).
- Diseño: [inventario](../../mockups/README.md), [DESIGN](../../DESIGN.md),
  [admin y ownership](../../docs/adr/institution-admin-and-course-ownership.md).
- Exclusiones: implementación de pantallas, planes/tasks de código, despliegues, DNS/TLS,
  cambios de API/DB, registro público, invitaciones, SSO, archivos binarios (FE-21), IA y analítica.
