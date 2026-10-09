# Catálogo de datos

Catálogo del modelo de AcademiX: 13 tablas y 111 columnas, con tipos PostgreSQL
y límites de cadenas acordados. Las reglas descritas no sustituyen DDL ejecutable.

## Archivos

- [XLSX consolidado](data-catalog/academix-data-catalog.xlsx): catálogo editable con tres hojas, Tablas, Columnas y Relaciones.
- [ER Mermaid](data-catalog/academix-er.mmd), [SVG](data-catalog/academix-er.svg) y [PDF](data-catalog/academix-er.pdf), independientes del XLSX.

El tipo de llave en Columnas indica PK, FK, PK/FK o —. Las restricciones UNIQUE
se documentan en la sección Constraints de este anexo. La cardinalidad de Relaciones
expresa destinos por fila origen y filas origen por destino. Los contratos JSON
y decisiones pendientes se conservan en este documento, fuera del XLSX.

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

| Tabla | Columna | Tipo PostgreSQL | Requerido | Tipo de llave | Descripción |
| --- | --- | --- | --- | --- | --- |
| institutions | id | uuid | Sí | PK | Identificador interno global. |
| institutions | slug | varchar(63) | Sí | — | Identificador legible único global, por ejemplo `uc` o `utfsm`. |
| institutions | name | varchar(200) | Sí | — | Nombre visible de la institución. |
| institutions | active | boolean | Sí | — | Permite desactivar acceso institucional sin borrar datos. |
| institutions | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| institutions | updated_at | timestamptz(6) | Sí | — | Fecha de última actualización. |
| users | id | uuid | Sí | PK | Identidad global resuelta desde JWT `sub`. |
| users | email | text | Sí | — | Correo de referencia; unicidad se define con proveedor de identidad. Correo de referencia; límite, normalización y unicidad pendientes del proveedor de identidad. |
| users | password_hash | varchar(255) | Sí | — | Hash Argon2id codificado completo para autenticación local; incluye algoritmo y parámetros y salt. Máximo 255 caracteres. La contraseña ingresada admite 8 a 30 caracteres y se valida antes de generar el hash; nunca se almacena ni se expone el secreto original. |
| users | name | varchar(200) | Sí | — | Nombre visible. |
| users | active | boolean | Sí | — | Estado global del usuario. |
| users | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| users | updated_at | timestamptz(6) | Sí | — | Fecha de última actualización. |
| institution_memberships | id | uuid | Sí | PK | Identificador de pertenencia. |
| institution_memberships | institution_id | uuid | Sí | FK | Institution a la que pertenece el usuario. |
| institution_memberships | user_id | uuid | Sí | FK | Usuario global asociado. |
| institution_memberships | active | boolean | Sí | — | Controla si la pertenencia permite acceso. |
| institution_memberships | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| institution_memberships | updated_at | timestamptz(6) | Sí | — | Fecha de última actualización. |
| courses | id | uuid | Sí | PK | Identificador del curso. |
| courses | institution_id | uuid | Sí | FK | Tenant lógico dueño del curso. |
| courses | code | varchar(32) | Sí | — | Código académico del curso. |
| courses | name | varchar(200) | Sí | — | Nombre del curso. |
| courses | term | varchar(16) | Sí | — | Periodo académico. Máximo aprobado de 16 caracteres para periodo académico; formato pendiente. |
| courses | created_by | uuid | Sí | FK | Docente creador validado por membership institucional. |
| courses | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| sections | id | uuid | Sí | PK | Identificador de sección. |
| sections | institution_id | uuid | Sí | FK | Tenant lógico. |
| sections | course_id | uuid | Sí | FK | Curso padre. |
| sections | code | varchar(32) | Sí | — | Código de sección. |
| sections | capacity | integer | No | — | Cupo opcional. Cupo entero opcional, no negativo; NULL significa cupo no definido. |
| sections | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| enrollments | id | uuid | Sí | PK | Identificador de pertenencia académica usuario-sección-rol. |
| enrollments | institution_id | uuid | Sí | FK | Tenant lógico. |
| enrollments | section_id | uuid | Sí | FK | Sección asociada. |
| enrollments | user_id | uuid | Sí | FK | Usuario con rol en la sección. |
| enrollments | role | text | Sí | — | `teacher`, `assistant` o `student`. Dominio cerrado mediante CHECK: teacher, student, assistant. |
| enrollments | active | boolean | Sí | — | Estado del rol. |
| enrollments | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| course_modules | id | uuid | Sí | PK | Identificador del módulo. |
| course_modules | institution_id | uuid | Sí | FK | Tenant lógico. |
| course_modules | course_id | uuid | Sí | FK | Curso padre. |
| course_modules | title | varchar(200) | Sí | — | Título del módulo. |
| course_modules | position | integer | Sí | — | Orden dentro del curso. Orden entero; base 0/1 y CHECK de positividad pendientes. |
| course_modules | published_at | timestamptz(6) | No | — | Fecha desde la que estudiantes pueden verlo. |
| materials | id | uuid | Sí | PK | Identificador del material. |
| materials | institution_id | uuid | Sí | FK | Tenant lógico. |
| materials | module_id | uuid | Sí | FK | Módulo contenedor. |
| materials | title | varchar(200) | Sí | — | Título del recurso. |
| materials | kind | text | Sí | — | `markdown` o `file`. Dominio cerrado mediante CHECK: markdown, file. |
| materials | markdown_body | text | No | — | Contenido textual cuando `kind = markdown`. Contenido textual de extensión variable; conservar text para Markdown o instrucciones. |
| materials | storage_key | text | No | — | Clave interna para archivo externo futuro. Clave de extensión variable; proveedor y máximo pendientes. |
| materials | mime_type | text | No | — | MIME del archivo futuro. Identificador MIME; lista permitida pendiente; no imponer tamaño arbitrario. |
| materials | size_bytes | bigint | No | — | Tamaño del archivo futuro. Tamaño entero en bytes de 64 bits; evita el límite de integer; máximo de archivo pendiente. |
| materials | published_at | timestamptz(6) | No | — | Fecha de publicación. |
| materials | created_by | uuid | Sí | FK | Usuario autor validado por membership institucional. |
| quizzes | id | uuid | Sí | PK | Identificador del quiz. |
| quizzes | institution_id | uuid | Sí | FK | Tenant lógico. |
| quizzes | course_id | uuid | Sí | FK | Curso evaluado. |
| quizzes | section_id | uuid | No | FK | Sección específica si el quiz no es de todo el curso. |
| quizzes | title | varchar(200) | Sí | — | Título del quiz. |
| quizzes | instructions | text | No | — | Instrucciones visibles. Contenido textual de extensión variable; conservar text para Markdown o instrucciones. |
| quizzes | opens_at | timestamptz(6) | No | — | Inicio de ventana. |
| quizzes | closes_at | timestamptz(6) | No | — | Cierre de ventana. |
| quizzes | max_attempts | integer | No | — | Máximo de intentos por estudiante. Contenido textual de extensión variable; conservar text para Markdown o instrucciones. |
| quizzes | published_at | timestamptz(6) | No | — | Fecha de publicación. |
| quizzes | created_by | uuid | Sí | FK | Usuario creador validado por membership institucional. |
| quizzes | questions | jsonb | Sí | — | Preguntas, puntajes y alternativas anidadas de la pauta. Documento estructurado; campos internos en Contratos JSON; no implica FK internas. |
| quiz_attempts | id | uuid | Sí | PK | Identificador de intento. |
| quiz_attempts | institution_id | uuid | Sí | FK | Tenant lógico. |
| quiz_attempts | course_id | uuid | Sí | FK | Curso histórico del intento. |
| quiz_attempts | quiz_id | uuid | Sí | FK | Quiz respondido. |
| quiz_attempts | section_id | uuid | Sí | FK | Sección histórica del estudiante. |
| quiz_attempts | student_id | uuid | Sí | FK | Estudiante que responde. |
| quiz_attempts | attempt_number | integer | Sí | — | Número correlativo por quiz y estudiante. Secuencia entera; CHECK > 0 pendiente de cierre. |
| quiz_attempts | status | text | Sí | — | `in_progress`, `submitted`, `graded` o `cancelled`. Dominio cerrado mediante CHECK: in_progress, submitted, graded, cancelled. |
| quiz_attempts | started_at | timestamptz(6) | Sí | — | Inicio del intento. |
| quiz_attempts | submitted_at | timestamptz(6) | No | — | Envío del intento. |
| quiz_attempts | cancelled_at | timestamptz(6) | No | — | Cancelación del intento. |
| quiz_attempts | answers | jsonb | Sí | — | Respuestas del estudiante. Documento estructurado; campos internos en Contratos JSON; no implica FK internas. |
| quiz_attempts | score_points | numeric(8,2) | No | — | Puntaje obtenido. Puntaje exacto de hasta 999999.99; precisión de puntos JSON y rango de dominio pendientes. |
| quiz_attempts | score_percent | numeric(5,2) | No | — | Porcentaje obtenido. Porcentaje decimal exacto con dos decimales; CHECK limita a 0..100. |
| grade_items | id | uuid | Sí | PK | Identificador del ítem evaluado del libro de notas. |
| grade_items | institution_id | uuid | Sí | FK | Tenant lógico. |
| grade_items | course_id | uuid | Sí | FK | Curso dueño. |
| grade_items | quiz_id | uuid | Sí | FK | Quiz asociado. |
| grade_items | title | varchar(200) | Sí | — | Nombre visible del ítem. |
| grade_items | weight_percent | numeric(5,2) | Sí | — | Ponderación porcentual. Porcentaje decimal exacto con dos decimales; CHECK limita a 0..100. |
| grade_items | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| grades | id | uuid | Sí | PK | Identificador de la nota concreta de un estudiante. |
| grades | institution_id | uuid | Sí | FK | Tenant lógico. |
| grades | grade_item_id | uuid | Sí | FK | Ítem evaluado. |
| grades | quiz_id | uuid | Sí | FK | Quiz origen. |
| grades | student_id | uuid | Sí | FK | Estudiante calificado. |
| grades | section_id | uuid | Sí | FK | Sección del estudiante. |
| grades | attempt_id | uuid | Sí | FK | Intento que determina la nota vigente. |
| grades | score_percent | numeric(5,2) | Sí | — | Porcentaje usado para calcular la nota. Porcentaje decimal exacto con dos decimales; CHECK limita a 0..100. |
| grades | grade_value | numeric(3,1) | Sí | — | Nota en escala 1.0 a 7.0. Nota decimal exacta con un decimal; CHECK limita a 1.0..7.0. |
| grades | published_at | timestamptz(6) | No | — | Visibilidad para estudiante. |
| grades | created_at | timestamptz(6) | Sí | — | Fecha de creación. |
| grades | updated_at | timestamptz(6) | Sí | — | Fecha de última actualización antes de publicación. |
| audit_events | id | uuid | Sí | PK | Identificador del evento. |
| audit_events | institution_id | uuid | Sí | FK | Tenant lógico. |
| audit_events | actor_user_id | uuid | Sí | FK | Usuario que ejecuta la acción. |
| audit_events | action | text | Sí | — | Acción registrada. Vocabulario de acciones pendiente; longitud variable. |
| audit_events | resource_type | text | Sí | — | Tipo de recurso afectado. Vocabulario de recursos pendiente; longitud variable. |
| audit_events | resource_id | uuid | Sí | — | ID del recurso afectado. |
| audit_events | course_id | uuid | Sí | FK | Curso asociado al evento. |
| audit_events | section_id | uuid | No | FK | Sección asociada si corresponde. |
| audit_events | occurred_at | timestamptz(6) | Sí | — | Momento del evento. |
| audit_events | changes | jsonb | Sí | — | Snapshot sanitizado sin credenciales ni pauta protegida. Documento estructurado; campos internos en Contratos JSON; no implica FK internas. |

## Relaciones

| Tabla origen | Campos origen | Tabla destino | Campos destino | Cardinalidad |
| --- | --- | --- | --- | --- |
| institution_memberships | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| courses | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| sections | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| enrollments | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| course_modules | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| materials | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_items | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grades | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| institution_memberships | user_id | users | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| courses | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| enrollments | institution_id, user_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| materials | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, student_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grades | institution_id, student_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, actor_user_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| sections | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| course_modules | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_items | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| enrollments | institution_id, section_id | sections | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| materials | institution_id, module_id | course_modules | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, quiz_id, course_id | quizzes | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_items | institution_id, quiz_id, course_id | quizzes | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..1 filas origen. |
| grades | institution_id, grade_item_id, quiz_id | grade_items | institution_id, id, quiz_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grades | institution_id, attempt_id, quiz_id, student_id, section_id | quiz_attempts | institution_id, id, quiz_id, student_id, section_id | Cada fila origen: 1 destino; cada destino: 0..1 filas origen. |

## Constraints

| Tabla | Tipo | Campos o condición | Justificación |
| --- | --- | --- | --- |
| institutions | UNIQUE | (slug) | Evita repetir el identificador legible de una institución. |
| institution_memberships | UNIQUE | (institution_id, user_id) | Una pertenencia estable por usuario e institución. |
| courses | UNIQUE | (institution_id, code, term) | Evita duplicar un curso del mismo periodo en una institución. |
| sections | UNIQUE | (institution_id, course_id, code) | Código de sección único dentro de cada curso institucional. |
| course_modules | UNIQUE | (institution_id, course_id, position) | Evita módulos con la misma posición dentro de un curso. |
| quiz_attempts | UNIQUE | (institution_id, quiz_id, student_id, attempt_number) | Evita repetir un número de intento para el mismo estudiante y quiz. |
| grade_items | UNIQUE | (institution_id, quiz_id) | Un único ítem del libro de notas por quiz. |
| grades | UNIQUE | (institution_id, grade_item_id, student_id) | Una única nota vigente por estudiante e ítem evaluado. |
| courses | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| sections | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| course_modules | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| sections | UNIQUE | (institution_id, id, course_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| quizzes | UNIQUE | (institution_id, id, course_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| grade_items | UNIQUE | (institution_id, id, quiz_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| quiz_attempts | UNIQUE | (institution_id, id, quiz_id, student_id, section_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| enrollments | UNIQUE INDEX parcial | (institution_id, section_id, user_id, role) WHERE active | No duplica un rol activo; conserva filas históricas. |
| quiz_attempts | UNIQUE INDEX parcial | (institution_id, quiz_id, student_id) WHERE status = 'in_progress' | Un único intento activo por quiz y estudiante. |
| sections | CHECK | capacity IS NULL OR capacity >= 0 | Valida los valores permitidos por el modelo. |
| enrollments | CHECK | role IN ('teacher', 'student', 'assistant') | Valida los valores permitidos por el modelo. |
| materials | CHECK | kind IN ('markdown', 'file') | Valida los valores permitidos por el modelo. |
| materials | CHECK | (kind = 'markdown' AND markdown_body IS NOT NULL AND storage_key IS NULL AND mime_type IS NULL AND size_bytes IS NULL) OR (kind = 'file' AND storage_key IS NOT NULL AND mime_type IS NOT NULL AND size_bytes IS NOT NULL AND size_bytes >= 0) | Valida los valores permitidos por el modelo. |
| quizzes | CHECK | max_attempts IS NULL OR max_attempts > 0 | Valida los valores permitidos por el modelo. |
| quizzes | CHECK | opens_at IS NULL OR closes_at IS NULL OR opens_at < closes_at | Valida los valores permitidos por el modelo. |
| quiz_attempts | CHECK | status IN ('in_progress', 'submitted', 'graded', 'cancelled') | Valida los valores permitidos por el modelo. |
| quiz_attempts | CHECK | score_percent IS NULL OR score_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grade_items | CHECK | weight_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grades | CHECK | score_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grades | CHECK | grade_value BETWEEN 1.0 AND 7.0 | Valida los valores permitidos por el modelo. |

## Contratos JSON

| Columna | Ruta | Tipo interno | Requerido | Regla |
| --- | --- | --- | --- | --- |
| quizzes.questions | $ | array | Sí | Preguntas del quiz; cantidad mínima y límite pendientes. |
| quizzes.questions | $[].id | ID local | Sí | Estable y único dentro del quiz; representación pendiente. |
| quizzes.questions | $[].position | entero | Sí | Orden; base y unicidad pendientes. |
| quizzes.questions | $[].prompt | string JSON | Sí | Enunciado; límite pendiente. |
| quizzes.questions | $[].points | number JSON | Sí | > 0; precisión y máximo pendientes. |
| quizzes.questions | $[].alternatives | array | Sí | Al menos dos; exactamente una correcta. |
| quizzes.questions | $[].alternatives[].id | ID local | Sí | Único dentro de la pregunta; estable; representación pendiente. |
| quizzes.questions | $[].alternatives[] | object | Sí | Nombre/tipo del contenido y marcador de corrección pendientes; pauta protegida. |
| quiz_attempts.answers | $ | Pendiente | Sí | Usa IDs de pregunta y alternativa del quiz; estructura, duplicados y validación pendientes. |
| audit_events.changes | $ | Pendiente | Sí | Snapshot sanitizado; estructura por acción pendiente; excluir secretos y pauta. |

## Pendientes

| Área | Decisión |
| --- | --- |
| Identidad | Definir cómo JWT sub resuelve users.id; longitud, normalización y unicidad de email. |
| Cadenas | Definir formato de slug/códigos/term, normalización y prohibición de valores vacíos. |
| Defaults | Generación de UUID, defaults de active salvo institutions.active=true, fechas y mantenimiento de updated_at. |
| Referencias | Definir ON DELETE/ON UPDATE sin pérdida de registros académicos o evidencia histórica. |
| Enteros | Definir base de position y CHECK de attempt_number > 0; semántica de capacity=0. |
| Material | Excluir markdown_body en archivos, lista MIME, máximo de bytes y proveedor/límite de storage_key. |
| Intentos | Coherencia de status/fechas/puntajes; puntaje no negativo ni superior al total del quiz. |
| JSON | Cerrar estructura de answers/changes, tipos de IDs locales y precisión de points compatible con numeric(8,2). |
| Auditoría | Resolver eventos institucionales sin curso: audit_events.course_id es NOT NULL actualmente. |
| Inmutabilidad | Definir mecanismos de bloqueo de pauta, respuestas, notas publicadas y UPDATE/DELETE de auditoría. |
| Persistencia | Elegir ORM/migraciones y materializar las reglas documentadas en DDL y transacciones. |
