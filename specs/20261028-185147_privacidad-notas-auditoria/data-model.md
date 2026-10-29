# Data Model: Modelos y evidencia del polish E2

Sin nuevas tablas, columnas, índices o migraciones. Revisar modelos documentales
y añadir metadatos de evidencia en documentación, no como entidades de producto.

## Entidades existentes y relaciones

| Entidad | Campos relevantes | Regla |
| --- | --- | --- |
| Institution / User | id, active | Contexto e identidad activos |
| InstitutionMembership | institution_id, user_id, active, is_admin, is_super_admin | is_admin no implica teacher; superadmin no concede acceso académico |
| Course | id, institution_id, created_by | Owner requiere is_admin vigente y created_by propio |
| Section / Enrollment | institution_id, course_id; user_id, role, active | Teacher activo aporta secciones autorizadas del curso |
| AuditEvent | institution_id, course_id, section_id, resource_type, action, changes, occurred_at, id | Histórico inmutable; sección del evento, no matrícula estudiantil actual |
| Grade / QuizAttempt | student_id, section_id, published_at / status | No cambian; auditoría no adelanta publicación estudiantil |

## Proyección de permisos

- `teacherSections`: secciones con Enrollment teacher vigente del actor en el curso.
- `owner`: propiedad inmutable del curso combinada con is_admin vigente.
- Acceso base a auditoría: owner o teacherSections no vacío.
- Alcance base de eventos: owner o sección del evento incluida en teacherSections.
- Condición adicional: recurso distinto de grade o teacherSections no vacío.
- Todos los predicados se combinan con institución, curso y filtros solicitados.
- section_id nulo solo resulta visible con owner; si es grade exige además teacher.
- Eventos operativos institucionales sin curso siguen excluidos del historial de curso.

## Matriz de lectura

| Actor | Eventos no grade | Eventos grade |
| --- | --- | --- |
| Owner admin + teacher | Todo su curso | Todo su curso |
| Owner admin sin teacher, con/sin student | Todo su curso | Ninguno |
| Teacher ordinario, con/sin is_admin | Secciones docentes | Secciones docentes |
| Student o assistant sin owner/teacher | Sin auditoría | Sin auditoría |
| Superadmin aislado o admin ajeno sin docencia | Sin acceso al curso | Sin acceso al curso |

Los roles se acumulan: una persona teacher+student conserva su permiso docente
solo en el alcance autorizado, conforme a la política existente de evaluación.
El seguimiento assistant y consulta estudiantil de publicadas no cambian.

## Proyección de eventos y paginación

El evento no autorizado se excluye completo antes de seleccionar la página.
No retorna identificadores, before/after ni metadatos del evento excluido.
hasMore y nextCursor se calculan solo con filas visibles; no hay total global.
Se mantienen cursor opaco y orden por occurred_at/id; no hay cambios de DTO.

## Transiciones de autorización

- Revocar último teacher a owner: pierde todos los grade; mantiene administrativos.
- Revocar is_admin a owner+teacher: conserva solo secciones docentes vigentes.
- Revocar sección docente: pierde grade y otros eventos de esa sección si no es owner.
- Desactivar actor, pertenencia o institución: pierde contexto; cursor no lo recupera.
- Publicar Grade: habilita su consulta estudiantil normal, sin conceder auditoría.

Las consultas iniciadas después de confirmar revocación aplican estado nuevo.
Los registros de calificación y auditoría nunca se mutan como efecto de leer.

## Integridad y sanitización

RLS, rol runtime restringido y FK compuestas existentes permanecen.
Las allowlists de snapshot siguen excluyendo secretos, respuestas y pauta.
La autorización se aplica también a eventos antiguos con payload de calificación.
Comparar contenido/cantidad antes y después de consultas comprueba no mutación.

## Metadatos documentales y cardinalidades

- Observación: ID, celda E2, resumen, valoración positiva o acción.
- Línea base: fecha/commit/alcance y evidencia previa; sección inmutable.
- Respuesta: clase documental/validación/funcional/diferida, responsable vigente,
  cambios posteriores con commit/PR, prueba o revisión, resultado y limitación.
- Las siete observaciones y AUD-PRIV viven en documentación; no crear tablas.
- Cada relación documentada requiere extremos, mínimo/máximo, motivo y
  correspondencia con nulabilidad, FK, unicidad o regla de ciclo de vida.
- Contrastar User/Membership/Institution, ownership de Course, Section/Enrollment,
  Quiz con Section opcional y eventos operativos sin actor/curso. No confundir
  regla de creación de curso con constraint persistido de mínimo de secciones.
- role es dominio enumerado; CHECK implementa la restricción existente.
  Los flags institucionales no pertenecen a Enrollment ni implican docencia.
- Onboarding crea institución/identidad inicial, nueva o existente; bootstrap
  demo y seed académico son operaciones distintas. No hay altas generales.
