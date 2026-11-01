# Feature Specification: Polish y respuesta al feedback de E2

**Feature Branch**: `fix/polish-feedback-e2`
**Feature Directory**: `specs/20261028-185147_privacidad-notas-auditoria`
**Created**: 2026-10-28 | **Revised**: 2026-10-29
**Status**: Implementado y validado localmente; 28/28 tareas, 20 FR y 10 SC comprobados. Sin despliegue.
**Input**: Responder al feedback de E2 documentando lo existente al inicio del polish, las brechas y los cambios posteriores; conservar la corrección asociada de privacidad de notas.

## Context & Baseline

Fuente: planilla `01- 2026-02 Alumnos Proyecto, Notas y Presentaciones.xlsx`,
pestaña E2, Lock In fila 6, nota 6,3125. No confundir con feedback E1.
La [línea base y matriz](../../docs/deliveries/2/15-feedback-e2.md) registra
el corte 2026-10-29 y commit `7f4334a03cc9b2245a169fd56b9a1c99942030f0`.
Presencia en código, prueba histórica, verificación nueva y despliegue son evidencias distintas.
El nombre histórico del directorio se conserva para no romper referencias.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinguir trabajo previo y respuesta nueva (Priority: P1)

Como equipo/evaluador, necesito saber qué existía antes de este polish y qué se cambia después.
**Why this priority**: Evita atribuir implementaciones previas a comentarios nuevos o cerrar sin evidencia.
**Independent Test**: Revisar la matriz contra el corte y un cambio posterior sin ejecutar el resto de las historias.
**Acceptance Scenarios**:
1. **Given** cada comentario E2, **When** se registra su respuesta, **Then** incluye celda, resumen fiel, estado previo, evidencia fechada, brecha y acción propuesta, también para comentarios positivos.
2. **Given** una capacidad ya existente, **When** solo se mejora su explicación, **Then** se clasifica como documentación/validación de trabajo previo, no implementación nueva.
3. **Given** trabajo posterior, **When** se cierra una acción, **Then** se añade commit, evidencia y limitaciones sin reemplazar el estado inicial ni marcar ejecutado lo solo planificado.

### User Story 2 - Entender modelos y cardinalidades (Priority: P1)

Como evaluador, necesito modelos consistentes que expliquen relaciones y roles sin depender del código.
**Why this priority**: Responde a D6 y a la observación de role en E6, ambos criterios con descuento.
**Independent Test**: Comparar dominio, relaciones, catálogo e informe/presentación con las reglas ya existentes.
**Acceptance Scenarios**:
1. **Given** los diagramas entregables, **When** se revisan sus relaciones, **Then** cada extremo tiene multiplicidad/opcionalidad y coinciden las representaciones del mismo modelo.
2. **Given** los roles académicos, **When** se consulta el modelo y se intenta asignar un valor ajeno al dominio permitido, **Then** la lista está explícita y el valor es rechazado sin cambiar datos.
3. **Given** administradores y eventos operativos, **When** se contrastan diagramas y reglas, **Then** se distinguen permisos institucionales de matrícula y las relaciones opcionales históricas no se vuelven obligatorias por simplificar el dibujo.

### User Story 3 - Explicar administración y provisión de cuentas (Priority: P1)

Como responsable de entrega, necesito explicar quién crea cursos, delega permisos y prepara las cuentas.
**Why this priority**: Responde a las preguntas explícitas de E6 sobre admins, superadmins y nuevas cuentas.
**Independent Test**: Con cuentas demo de dos instituciones, comprobar creación/delegación, rechazo ajeno y repetición del bootstrap; describir límites de altas generales.
**Acceptance Scenarios**:
1. **Given** operador, superadmin institucional, admin propietario, docente, ayudante y estudiante, **When** se revisa la matriz, **Then** queda definido quién provisiona instituciones, delega administración, crea cursos y accede a datos académicos.
2. **Given** cuentas demo y provisión inicial existentes, **When** se preparan y repiten, **Then** se conservan identidades, credenciales, revocaciones e historia; las etiquetas de cuenta no conceden matrículas.
3. **Given** una solicitud de más cuentas, **When** se explica la entrega, **Then** se distingue la provisión inicial de institución de altas generales en una institución existente, declarando qué no está soportado y qué necesita otra misión.

### User Story 4 - Proteger notas conservando historia (Priority: P1)

Como estudiante y docente, necesito que la administración no anticipe notas y la docencia conserve su historia autorizada.
**Why this priority**: Hallazgo técnico adicional detectado en la revisión; no es comentario textual de E2.
**Independent Test**: Eventos existentes y owner+student sin teacher frente a docentes de dos secciones, sin depender del polish documental.
**Acceptance Scenarios**:
1. **Given** owner+student sin teacher, **When** consulta auditoría antes/después de publicar y con filtros/páginas, **Then** no recibe eventos grade y conserva administrativos; solo ve su nota propia publicada por el recorrido estudiantil.
2. **Given** teacher ordinario u owner+teacher, **When** consulta, **Then** conserva sección histórica o curso respectivamente; sin docencia, student/assistant/superadmin no adquieren auditoría.
3. **Given** revocación confirmada de docencia/admin o desactivación de identidad/pertenencia/institución, **When** consulta con la misma sesión o cursor anterior, **Then** se aplica el alcance nuevo sin modificar eventos.

### User Story 5 - Presentar arquitectura simple y real (Priority: P2)

Como evaluador, necesito distinguir la solución actual de infraestructura futura.
**Why this priority**: Responde a C6 sin agregar componentes para justificar el diseño anterior.
**Independent Test**: Comparar arquitectura de documentos y despliegue declarado con configuración versionada; distinguir configuración de validación remota.
**Acceptance Scenarios**:
1. **Given** arquitectura y configuración actuales, **When** se presentan, **Then** HAProxy/HA/pooling externo no necesarios quedan retirados de la topología actual o claramente diferidos con justificación.
2. **Given** evidencia solo local o de configuración, **When** se informa el estado, **Then** no se presenta como un despliegue o disponibilidad verificados.

### Edge Cases

- Código ya implementado con documentos/PDF obsoletos: mejorar documentación no implica volver a implementar.
- Evidencia sin commit, fecha o alcance; archivos locales sin versionar: no acreditan cierre del equipo por sí solos.
- Membership multiinstitución, roles acumulables y actor operativo sin usuario: conservar límites y opcionalidad histórica.
- Nota legacy antes/después, sin sección, páginas mixtas/solo grade y cursor previo a revocación: no filtran resultados excluidos; sin sección exige autorización de todo el curso.
- Quien puede consultar pauta no rinde ese quiz como estudiante; preparar la regresión revocando teacher antes de rendir, sin eludir permisos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Autorizar cada consulta en una institución explícita y pertenencia activa; privilegios administrativos o identificadores conocidos no permiten cruces, incluso ante omisión de un filtro interno.
- **FR-002**: Permitir eventos de notas solo con docencia vigente en la sección histórica; propietario administrador con docencia en el curso amplía a todas sus secciones. Propiedad o administración sin docencia no bastan.
- **FR-003**: Excluir el evento completo de nota no autorizado, incluidos identificadores y estados anterior/posterior; filtros, páginas e indicadores describen únicamente eventos autorizados.
- **FR-004**: Conservar al propietario administrador sin docencia sus eventos administrativos distintos de notas; estudiante, ayudante y superadministrador no adquieren auditoría por esos roles o privilegios.
- **FR-005**: Revalidar permisos en cada consulta y continuación con la misma sesión; pérdida de docencia, administración, identidad o pertenencia reduce el acceso correspondiente.
- **FR-006**: Mantener consultas estudiantiles limitadas a notas propias publicadas y seguimiento docente/ayudante dentro de su alcance vigente, sin nuevos permisos de auditoría.
- **FR-007**: Aplicar la política a eventos existentes y futuros sin borrar, modificar o regenerar historia; las consultas no cambian notas, intentos, publicación, ponderaciones ni eventos.
- **FR-008**: Mantener secretos, credenciales, respuestas y pauta fuera del historial; otro tipo de evento no puede convertirse en una vía alternativa para exponer resultados.
- **FR-009**: Mantener recursos ajenos no visibles y rechazar acciones prohibidas sobre recursos visibles; una consulta autorizada sin eventos visibles devuelve una colección vacía sin revelar eventos excluidos.
- **FR-010**: Verificar aceptación con casos negativos por rol, revocación, filtro, paginación e institución y casos positivos docentes y administrativos; no cerrar el hallazgo solo con comprobaciones de presentación.
- **FR-011**: Conservar una línea base inmutable del inicio del polish con fecha, commit y alcance de inspección; no atribuir causalidad al feedback sin historia verificable.
- **FR-012**: Mantener matriz por comentario E2 C6/D6/E6/F6/G6 con evidencia previa, brecha, clasificación documental/validación/funcional/diferida, cambio previsto, resultado real, responsable y referencia posterior; separar hallazgos propios.
- **FR-013**: Explicitar multiplicidad mínima/máxima en ambos extremos de cada relación del dominio/ER entregado y su regla; mantener coherencia con restricciones y ciclo de vida, distinguiendo modelo conceptual y persistencia.
- **FR-014**: Definir el dominio cerrado teacher/student/assistant y justificar su representación; rechazar otros roles sin agregar privilegios ni exigir un cambio físico solo por formato del diagrama.
- **FR-015**: Explicar identidad global, pertenencia institucional, permisos administrativos, ownership y roles de sección, incluyendo al operador del producto; ningún privilegio concede acceso académico general o cruza instituciones.
- **FR-016**: Declarar las cuentas entregadas, cómo se provisionan instituciones/identidad inicial y cómo se atienden nuevas cuentas; conservar repetición segura sin restituir permisos o credenciales y explicitar altas generales no soportadas.
- **FR-017**: Presentar arquitectura actual mínima y alternativas diferidas con motivo; distinguir plataforma configurada, operación observada y evolución, sin añadir infraestructura para cumplir una propuesta histórica.
- **FR-018**: Alinear modelos, catálogo, contratos, estado, informe y presentación, fuentes y exportaciones finales; conservar el corte histórico y registrar cómo reproducir cada formato modificado.
- **FR-019**: Vincular cada cierre con evidencia de alcance explícito, fecha y versión; una referencia histórica, implementación, prueba local y verificación desplegada no son intercambiables.
- **FR-020**: Conservar valoraciones positivas de riesgos/planificación y sus responsables; no reabrir alcance, inventar requisitos del evaluador ni cerrar pendientes ajenos sin comprobarlos.

### Key Entities *(include if feature involves data)*

- **Observación y respuesta**: Celda fuente, estado previo, brecha, acción, responsable, evidencia y estado posterior; hallazgos adicionales separados.
- **Institución, identidad, pertenencia, curso, sección y matrícula**: Cardinalidades y permisos institucionales/académicos distintos; ownership y provisión explícitos.
- **Evento, nota y publicación**: Historia inmutable; sección histórica define acceso y la auditoría no sustituye publicación estudiantil.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cero eventos, identificadores o valores históricos de notas expuestos sin docencia autorizada en los escenarios de aceptación, publicados o no y con filtros/páginas.
- **SC-002**: El 100 % de eventos permitidos de dos secciones de prueba sigue disponible al docente correspondiente; cero eventos de otra institución o sección no autorizada.
- **SC-003**: En el 100 % de escenarios de revocación, primera consulta posterior y continuaciones respetan permisos nuevos con la misma sesión.
- **SC-004**: El 100 % de notas, intentos, ponderaciones y eventos conserva contenido y cantidad tras las consultas; el propietario sin docencia conserva sus eventos administrativos permitidos.
- **SC-005**: Estudiante obtiene su nota propia tras publicación por el recorrido habitual; ayudante conserva seguimiento autorizado y ninguno obtiene auditoría por esos roles.
- **SC-006**: El 100 % de comentarios C6/D6/E6/F6/G6 está trazado, cubriendo cinco frentes accionables y dos valoraciones positivas; cada acción distingue línea base y trabajo posterior.
- **SC-007**: El 100 % de relaciones representadas en modelos finales tiene multiplicidades en ambos extremos y regla contrastada; cero contradicciones sin explicar entre representaciones del mismo modelo.
- **SC-008**: Se comprueban creación de curso y delegación autorizadas, rechazo cruzado y de rol inválido en dos instituciones; los seis actores definidos tienen capacidades y límites documentados.
- **SC-009**: La repetición del bootstrap conserva identidades, credenciales, privilegios revocados y datos previos; la entrega indica cuentas disponibles y limitaciones de altas nuevas, sin secretos publicados.
- **SC-010**: Los cinco frentes accionables tienen decisión y evidencia de cierre o limitación explícita; modelos, informe y presentación reflejan el mismo estado final y no alteran la línea base.

## Assumptions

- Corte es inicio del polish, no fecha de entrega E2 ni de recepción del feedback; preexistente no significa anterior al comentario original.
- Se conserva role de dominio cerrado; administración se modela como capacidades institucionales y no como rol de Enrollment. No se crea superadmin global ni autoservicio de cuentas.
- Privacidad exige teacher para todos los eventos grade, incluso publicados; el owner conserva administrativos. La planificación acota los ADR contradictorios antes del cambio.
- Reutilizar capacidades existentes; toda brecha funcional no descrita requiere refinamiento. Diferir o documentar una limitación no equivale a aprobar una tarea ni la corrección de privacidad.

## Sources & Traceability

- Fuente primaria y corte: [feedback E2](../../docs/deliveries/2/15-feedback-e2.md); E1 se conserva como antecedente distinto en PR 159.
- CU-01–04/12/13/16; RF1–12/23/25/26/29; RNF1–4/6/7/9/10: [requerimientos E2](../../docs/deliveries/2/03-use-cases-and-requirements.md). Observaciones de modelos/arquitectura son criterios de entrega, no nuevos CU.
- Backlog: PREP-05, BE-02, BE-28/30/31, FE-19 y documentación/arquitectura existente de la [planilla](../../docs/deliveries/2/08-work-plan-detail/lock-in-LMS%20-%20Backlog.tsv); conservar responsables sin inventar cierres.
- Dependencias: [cursos/roles](../20261014-234844_cursos-roles/spec.md), [demo](../20261020-211552_demo-aislamiento-dominios/spec.md), [notas](../20261014-235244_notas-publicacion-auditoria/spec.md) y [ADR de permisos](../../docs/adr/institution-admin-and-course-ownership.md).
- Exclusiones: nuevas funciones LMS, alta general/invitaciones, nuevo RBAC, superadmin global, infraestructura HA, despliegue remoto, nueva telemetría, cambio de cálculo/publicación, borrado de historia y cierre automático de otras misiones.
