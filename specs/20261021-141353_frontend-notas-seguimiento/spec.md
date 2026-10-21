# Feature Specification: Notas y seguimiento frontend

**Feature Branch**: `feat/frontend-notas-seguimiento` (propuesta)
**Feature Directory**: `specs/20261021-141353_frontend-notas-seguimiento`
**Created**: 2026-10-21
**Status**: Ready for planning — validación documental, producto pendiente
**Input**: Conectar ponderaciones, publicación, notas propias, libro docente, intentos y auditoría.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mis notas publicadas (Priority: P1)

Como estudiante, quiero conocer mis resultados publicados y su promedio parcial real.
**Why this priority**: Entrega feedback sin depender de configurar pesos desde esta UI.
**Independent Test**: Fixtures con notas publicadas/no publicadas y promedio backend, sin editor docente.
**Acceptance Scenarios**:
1. **Given** notas propias publicadas, **When** consulto, **Then** veo solo esas notas y promedio parcial calculado por backend.
2. **Given** intento calificado sin publicación, **When** abro notas, **Then** no veo su calificación, porcentaje ni promedio que la incorpore.
3. **Given** ninguna nota publicada, **When** consulto, **Then** veo estado pendiente, sin convertir ausencia en cero.

### User Story 2 - Consultar libro y revisar intentos (Priority: P1)

Como teacher o assistant autorizado, quiero revisar resultados dentro de mis secciones.
**Why this priority**: Habilita seguimiento sin exigir permisos de escritura ni publicar.
**Independent Test**: Libro/intentos con filas históricas y fixtures teacher/assistant/admin sin teacher.
**Acceptance Scenarios**:
1. **Given** teacher ordinario o assistant, **When** consulto libro/intentos, **Then** solo veo mis secciones activas y la representación permitida.
2. **Given** teacher con isAdmin y ownership, **When** consulto, **Then** puedo abarcar mi curso completo; admin sin teacher no obtiene ese acceso.
3. **Given** assistant, **When** reviso intento, **Then** no recibo pauta/isCorrect/pointsAwarded ni controles de publicación/cancelación.
4. **Given** estudiante destinatario revocado, **When** docente autorizado revisa historia, **Then** se conserva sección histórica sin atribuirla a la matrícula actual.

### User Story 3 - Configurar pesos y publicar explícitamente (Priority: P2)

Como docente autorizado, quiero definir pesos válidos y publicar una selección precisa de notas.
**Why this priority**: Evita revelar resultados incompletos y cambios retroactivos.
**Independent Test**: Fixtures de curso sin freeze, ponderaciones y selección de publicación con resultados idempotentes.
**Acceptance Scenarios**:
1. **Given** teacher admin dueño y curso sin publicación, **When** guardo pesos completos sumando 100 %, **Then** veo la colección confirmada.
2. **Given** teacher ordinario, **When** publico, **Then** selecciono solo mis secciones; configurar pesos sigue prohibido.
3. **Given** intentos activos o pesos inválidos, **When** confirmo publicación, **Then** veo conflicto y no se cancelan intentos automáticamente.
4. **Given** respuesta perdida, **When** recupero publicación con la misma selección y clave, **Then** veo el recibo original sin duplicar historial.
5. **Given** primera publicación confirmada, **When** vuelvo a pesos, **Then** quedan bloqueados; una nueva publicación no sobrescribe notas ya publicadas.

### User Story 4 - Consultar auditoría del curso (Priority: P2)

Como admin dueño o docente autorizado, quiero consultar cambios académicos sanitizados.
**Why this priority**: Completa seguimiento con historia inmutable dentro del alcance correcto.
**Independent Test**: Eventos de varias secciones y de curso, sin ejecutar nuevas mutaciones.
**Acceptance Scenarios**:
1. **Given** admin dueño sin teacher, **When** abro auditoría, **Then** veo el curso completo sin adquirir acceso a pauta o libro docente.
2. **Given** teacher no admin, **When** filtro historial, **Then** solo veo eventos/snapshots permitidos de mis secciones.
3. **Given** assistant/student, **When** solicito auditoría, **Then** se rechaza; las respuestas permitidas nunca exponen credenciales ni pauta.

### Edge Cases

- Pesos incompletos/duplicados/suma no exacta, primera publicación concurrente y curso congelado.
- Último intento calificado por número, intento cancelado sin nota y nota ya publicada inmutable.
- Cursor de otro actor/tenant/filtro, página vacía y cambio de sección con respuesta tardía.
- Publicación con resultado incierto tras recarga: no asumir replay si se perdió la clave efímera.
- 401/403/404/409/422/503/red; lector de auditoría sin historial; superadmin aislado sin permisos académicos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Rutas limpias de notas/libro/intentos/auditoría bajo curso; dominio aporta slug a consultas institucionales autorizadas.
- **FR-002**: Student consulta solo notas propias publicadas; no enviar otro studentId ni derivar nota anticipada de intentos/recibos.
- **FR-003**: Mostrar promedio parcial y pesos publicados entregados por backend; ausencia no es cero y no recalcular con notas ocultas.
- **FR-004**: Teacher ordinario/assistant consultan libro e intentos en secciones activas propias; teacher con isAdmin y ownership amplía al curso.
- **FR-005**: Assistant solo lectura, sin pauta/isCorrect/pointsAwarded; teacher usa representación académica autorizada. Admin/superadmin aislados no sustituyen teacher.
- **FR-006**: Mantener filas/intentos con su sección histórica, incluidos estudiantes revocados; no convertir snapshot histórico en permiso vigente.
- **FR-007**: Configurar pesos exige teacher activo, isAdmin y ownership; colección completa y única, hasta dos decimales y suma exacta 100 %.
- **FR-008**: Primera publicación congela pesos/ítems; mostrar bloqueo incluso para no-op y no ofrecer modificaciones que backend rechaza.
- **FR-009**: Publicar exige teacher dentro de su alcance; selección explícita de evaluaciones, secciones y estudiantes, con resumen y confirmación de cantidad antes de enviar.
- **FR-010**: Exigir pesos válidos, nota calificada y ausencia de intentos activos según selección; no cancelar automáticamente ni publicar notas canceladas/inexistentes.
- **FR-011**: Publicación usa clave idempotente estable con selección canónica; reintentar solo misma operación tras resultado incierto, nunca reemplazar clave para esquivar conflicto.
- **FR-012**: Tras recarga sin clave disponible, consultar estado y explicar incertidumbre sin afirmar publicación ni repetirla automáticamente; conservar límites de sesión vigente.
- **FR-013**: Mantener notas publicadas inmutables y auditoría backend; no implementar cálculo/recalificación, migración ni edición manual de nota.
- **FR-014**: Auditoría: admin dueño ve curso completo incluso sin teacher; teacher ordinario solo secciones propias; assistant/student no acceden.
- **FR-015**: Historial inmutable sanitizado con filtros contractuales de actor/acción/recurso/sección/fecha y paginación; no incluir eventos institucionales ni reconstruir snapshots ocultos.
- **FR-016**: Listados paginados usan cursor ligado al contexto/filtros; cambiar filtros/actor reinicia navegación y no mezcla páginas previas.
- **FR-017**: Vista de revisión enlaza cancelación definida en misión 5 solo a actores autorizados; no duplica reglas ni concede escritura al ayudante.
- **FR-018**: Carga/vacío/error y 401/403/404/409/422 se distinguen; logout/revocación/expiración limpian datos y descartan respuestas ajenas/tardías.
- **FR-019**: Tablas con encabezados accesibles, foco, labels, confirmaciones anunciadas, cifras tabulares, contraste ≥4.5:1, 375 px, ambos temas y movimiento reducido.
- **FR-020**: Pruebas futuras UC/UTFSM, publicación concurrente/replay, multirol, revocación, assistant sin corrección, admin sin teacher y ausencia de exposición anticipada.
- **FR-021**: Consolidar FE-20 sobre los seis recorridos sin postergar accesibilidad de misiones previas ni declarar su UI ya implementada.

### Key Entities

- **GradeItem/ponderación**: Evaluación y peso común, congelados desde primera publicación.
- **Nota/publicación**: Resultado backend con visibilidad explícita y recibo idempotente.
- **Fila de seguimiento**: Estudiante y sección histórica autorizada, sin permisos inferidos.
- **AuditEvent**: Evento inmutable y sanitizado con alcance y filtros del curso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de escenarios estudiantiles muestra solo notas propias publicadas y promedio correspondiente.
- **SC-002**: Todas las operaciones de pesos/publicación/auditoría respetan matriz de actores y cero datos de otra sección/tenant.
- **SC-003**: Repetición autorizada de publicación original muestra un recibo único; bloqueos dejan cero cambios locales presentados como confirmados.
- **SC-004**: Consulta/publicación funcionan por teclado en móvil y ambos temas, con cantidad/selección explícitas antes de confirmar.
- **SC-005**: Las seis misiones tienen escenarios verificables de accesibilidad, responsive y ambos temas al consolidar FE-20.

## Assumptions

- Calificación, promedio, inmutabilidad y auditoría ya existen en backend; no se cambian reglas numéricas.
- US1/US2/US4 se validan con fixtures sin implementar US3; la integración completa consume intentos de misión 5.

## Sources & Traceability

- CU-10/11/12/13/16, RF21–26/29, RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-15–19/20 (JC/MA), vistas 05 notas/06/08/15/16 consulta: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencia runtime y cancelación: [rendición](../20261021-141352_frontend-rendicion-quizzes/spec.md).
- Contratos: [gradebook](../../docs/reference/openapi/paths/gradebook.yaml), [intentos](../../docs/reference/openapi/paths/quizzes.yaml),
  [audit](../../docs/reference/openapi/paths/audit.yaml); [freeze](../../docs/adr/grade-publication-and-weight-freeze.md), [diseño](../../DESIGN.md).
- Operaciones: listCourseGradeItems/updateGradebookWeights/getCourseGradebook/publishGrades/getStudentGrades,
  listQuizAttempts/getQuizAttempt/listCourseAuditEvents; cancelQuizAttempt pertenece a misión 5.
- Exclusiones: corrección manual, edición de nota publicada, analítica/exportación nueva, auditoría institucional general, binarios y cambios API/DB.
