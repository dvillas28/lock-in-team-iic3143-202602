# Catálogo de datos

Este anexo convierte el modelo lógico en una tabla exportable a planilla. El
DDL final puede ajustar nombres o tipos cuando el Spec Kit elija ORM y
migraciones, pero no debe romper la frontera `institution_id` ni las FK
institution-aware sin registrar una decisión.

## Archivos adjuntos

- [academix-data-catalog.xlsx](data-catalog/academix-data-catalog.xlsx): workbook
  con hojas `Tablas`, `Columnas` y `Constraints`.
- [tables.csv](data-catalog/tables.csv): resumen de tablas.
- [columns.csv](data-catalog/columns.csv): catálogo de columnas.
- [constraints.csv](data-catalog/constraints.csv): llaves y constraints.

## Tablas

| Tabla | Propósito | Tenant-owned |
| --- | --- | --- |
| institutions | Tenant lógico visible como universidad/institución. | No |
| users | Identidad global autenticada. | No |
| institution_memberships | Pertenencia de un usuario global a una Institution. | Sí |
| courses | Curso semestral dentro de una Institution. | Sí |
| sections | Secciones de un curso. | Sí |
| enrollments | Roles por usuario en una sección. | Sí |
| course_modules | Organización de contenidos por curso. | Sí |
| materials | Material markdown o archivo externo. | Sí |
| quizzes | Evaluaciones autocorregidas. | Sí |
| quiz_attempts | Intentos de estudiantes. | Sí |
| grade_items | Ítems ponderados del libro de notas. | Sí |
| grades | Nota vigente por estudiante e ítem. | Sí |
| audit_events | Historial académico inmutable. | Sí |

## Columnas

| Tabla | Columna | Tipo lógico | PK | FK | Requerido | Descripción |
| --- | --- | --- | --- | --- | --- | --- |
| institutions | id | uuid | Sí | No | Sí | Identificador interno global. |
| institutions | slug | text | No | No | Sí | Identificador legible único global, por ejemplo `uc` o `utfsm`. |
| institutions | name | text | No | No | Sí | Nombre visible de la institución. |
| institutions | active | boolean | No | No | Sí | Permite desactivar acceso institucional sin borrar datos. |
| institutions | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| institutions | updated_at | timestamptz | No | No | Sí | Fecha de última actualización. |
| users | id | uuid | Sí | No | Sí | Identidad global resuelta desde JWT `sub`. |
| users | email | text | No | No | Sí | Correo de referencia; unicidad se define con proveedor de identidad. |
| users | name | text | No | No | Sí | Nombre visible. |
| users | active | boolean | No | No | Sí | Estado global del usuario. |
| users | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| users | updated_at | timestamptz | No | No | Sí | Fecha de última actualización. |
| institution_memberships | id | uuid | Sí | No | Sí | Identificador de pertenencia. |
| institution_memberships | institution_id | uuid | No | institutions.id | Sí | Institution a la que pertenece el usuario. |
| institution_memberships | user_id | uuid | No | users.id | Sí | Usuario global asociado. |
| institution_memberships | active | boolean | No | No | Sí | Controla si la pertenencia permite acceso. |
| institution_memberships | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| institution_memberships | updated_at | timestamptz | No | No | Sí | Fecha de última actualización. |
| courses | id | uuid | Sí | No | Sí | Identificador del curso. |
| courses | institution_id | uuid | No | institutions.id | Sí | Tenant lógico dueño del curso. |
| courses | code | text | No | No | Sí | Código académico del curso. |
| courses | name | text | No | No | Sí | Nombre del curso. |
| courses | term | text | No | No | Sí | Periodo académico. |
| courses | created_by | uuid | No | users.id | Sí | Docente creador validado por membership institucional. |
| courses | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| sections | id | uuid | Sí | No | Sí | Identificador de sección. |
| sections | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| sections | course_id | uuid | No | courses.id | Sí | Curso padre. |
| sections | code | text | No | No | Sí | Código de sección. |
| sections | capacity | integer | No | No | No | Cupo opcional. |
| sections | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| enrollments | id | uuid | Sí | No | Sí | Identificador de pertenencia académica usuario-sección-rol. |
| enrollments | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| enrollments | section_id | uuid | No | sections.id | Sí | Sección asociada. |
| enrollments | user_id | uuid | No | users.id | Sí | Usuario con rol en la sección. |
| enrollments | role | text | No | No | Sí | `teacher`, `assistant` o `student`. |
| enrollments | active | boolean | No | No | Sí | Estado del rol. |
| enrollments | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| course_modules | id | uuid | Sí | No | Sí | Identificador del módulo. |
| course_modules | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| course_modules | course_id | uuid | No | courses.id | Sí | Curso padre. |
| course_modules | title | text | No | No | Sí | Título del módulo. |
| course_modules | position | integer | No | No | Sí | Orden dentro del curso. |
| course_modules | published_at | timestamptz | No | No | No | Fecha desde la que estudiantes pueden verlo. |
| materials | id | uuid | Sí | No | Sí | Identificador del material. |
| materials | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| materials | module_id | uuid | No | course_modules.id | Sí | Módulo contenedor. |
| materials | title | text | No | No | Sí | Título del recurso. |
| materials | kind | text | No | No | Sí | `markdown` o `file`. |
| materials | markdown_body | text | No | No | No | Contenido textual cuando `kind = markdown`. |
| materials | storage_key | text | No | No | No | Clave interna para archivo externo futuro. |
| materials | mime_type | text | No | No | No | MIME del archivo futuro. |
| materials | size_bytes | bigint | No | No | No | Tamaño del archivo futuro. |
| materials | published_at | timestamptz | No | No | No | Fecha de publicación. |
| materials | created_by | uuid | No | users.id | Sí | Usuario autor validado por membership institucional. |
| quizzes | id | uuid | Sí | No | Sí | Identificador del quiz. |
| quizzes | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| quizzes | course_id | uuid | No | courses.id | Sí | Curso evaluado. |
| quizzes | section_id | uuid | No | sections.id | No | Sección específica si el quiz no es de todo el curso. |
| quizzes | title | text | No | No | Sí | Título del quiz. |
| quizzes | instructions | text | No | No | No | Instrucciones visibles. |
| quizzes | opens_at | timestamptz | No | No | No | Inicio de ventana. |
| quizzes | closes_at | timestamptz | No | No | No | Cierre de ventana. |
| quizzes | max_attempts | integer | No | No | No | Máximo de intentos por estudiante. |
| quizzes | published_at | timestamptz | No | No | No | Fecha de publicación. |
| quizzes | created_by | uuid | No | users.id | Sí | Usuario creador validado por membership institucional. |
| quizzes | questions | jsonb | No | No | Sí | Preguntas, puntajes y alternativas anidadas de la pauta. |
| quiz_attempts | id | uuid | Sí | No | Sí | Identificador de intento. |
| quiz_attempts | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| quiz_attempts | course_id | uuid | No | courses.id | Sí | Curso histórico del intento. |
| quiz_attempts | quiz_id | uuid | No | quizzes.id | Sí | Quiz respondido. |
| quiz_attempts | section_id | uuid | No | sections.id | Sí | Sección histórica del estudiante. |
| quiz_attempts | student_id | uuid | No | users.id | Sí | Estudiante que responde. |
| quiz_attempts | attempt_number | integer | No | No | Sí | Número correlativo por quiz y estudiante. |
| quiz_attempts | status | text | No | No | Sí | `in_progress`, `submitted`, `graded` o `cancelled`. |
| quiz_attempts | started_at | timestamptz | No | No | Sí | Inicio del intento. |
| quiz_attempts | submitted_at | timestamptz | No | No | No | Envío del intento. |
| quiz_attempts | cancelled_at | timestamptz | No | No | No | Cancelación del intento. |
| quiz_attempts | answers | jsonb | No | No | Sí | Respuestas del estudiante. |
| quiz_attempts | score_points | numeric(8,2) | No | No | No | Puntaje obtenido. |
| quiz_attempts | score_percent | numeric(5,2) | No | No | No | Porcentaje obtenido. |
| grade_items | id | uuid | Sí | No | Sí | Identificador del ítem evaluado del libro de notas. |
| grade_items | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| grade_items | course_id | uuid | No | courses.id | Sí | Curso dueño. |
| grade_items | quiz_id | uuid | No | quizzes.id | Sí | Quiz asociado. |
| grade_items | title | text | No | No | Sí | Nombre visible del ítem. |
| grade_items | weight_percent | numeric(5,2) | No | No | Sí | Ponderación porcentual. |
| grade_items | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| grades | id | uuid | Sí | No | Sí | Identificador de la nota concreta de un estudiante. |
| grades | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| grades | grade_item_id | uuid | No | grade_items.id | Sí | Ítem evaluado. |
| grades | quiz_id | uuid | No | quizzes.id | Sí | Quiz origen. |
| grades | student_id | uuid | No | users.id | Sí | Estudiante calificado. |
| grades | section_id | uuid | No | sections.id | Sí | Sección del estudiante. |
| grades | attempt_id | uuid | No | quiz_attempts.id | Sí | Intento que determina la nota vigente. |
| grades | score_percent | numeric(5,2) | No | No | Sí | Porcentaje usado para calcular la nota. |
| grades | grade_value | numeric(3,1) | No | No | Sí | Nota en escala 1.0 a 7.0. |
| grades | published_at | timestamptz | No | No | No | Visibilidad para estudiante. |
| grades | created_at | timestamptz | No | No | Sí | Fecha de creación. |
| grades | updated_at | timestamptz | No | No | Sí | Fecha de última actualización antes de publicación. |
| audit_events | id | uuid | Sí | No | Sí | Identificador del evento. |
| audit_events | institution_id | uuid | No | institutions.id | Sí | Tenant lógico. |
| audit_events | actor_user_id | uuid | No | users.id | Sí | Usuario que ejecuta la acción. |
| audit_events | action | text | No | No | Sí | Acción registrada. |
| audit_events | resource_type | text | No | No | Sí | Tipo de recurso afectado. |
| audit_events | resource_id | uuid | No | No | Sí | ID del recurso afectado. |
| audit_events | course_id | uuid | No | courses.id | Sí | Curso asociado al evento. |
| audit_events | section_id | uuid | No | sections.id | No | Sección asociada si corresponde. |
| audit_events | occurred_at | timestamptz | No | No | Sí | Momento del evento. |
| audit_events | changes | jsonb | No | No | Sí | Snapshot sanitizado sin credenciales ni pauta protegida. |

## Llaves y constraints principales

| Tabla | Constraint | Descripción |
| --- | --- | --- |
| institutions | unique(slug) | Evita duplicar slugs institucionales. |
| institution_memberships | unique(institution_id, user_id) | Una pertenencia estable por usuario e Institution. |
| courses | unique(institution_id, code, term) | Código de curso reutilizable entre Institutions. |
| sections | unique(institution_id, course_id, code) | Código de sección único dentro del curso institucional. |
| enrollments | unique parcial(institution_id, section_id, user_id, role) WHERE active | Permite roles acumulables sin duplicar rol activo. |
| course_modules | unique(institution_id, course_id, position) | Orden estable por curso. |
| quizzes | check(opens_at < closes_at) | Ventana temporal válida cuando existe. |
| quizzes | JSON questions válido | Cada pregunta tiene ID local, puntaje positivo, posición y al menos dos alternativas con exactamente una correcta. |
| quiz_attempts | unique(institution_id, quiz_id, student_id, attempt_number) | Secuencia de intentos por estudiante. |
| quiz_attempts | unique parcial(institution_id, quiz_id, student_id) WHERE status = 'in_progress' | Solo un intento en progreso por quiz y estudiante. |
| grade_items | unique(institution_id, quiz_id) | Un ítem de nota por quiz. |
| grades | unique(institution_id, grade_item_id, student_id) | Una nota vigente por ítem y estudiante. |
| audit_events | append-only | Eventos inmutables; actualización/borrado prohibidos por persistencia. |

Todas las FK entre tablas tenant-owned deben incluir `institution_id`, aunque la
tabla anterior liste la referencia conceptual usando el nombre simple del
recurso para legibilidad.
