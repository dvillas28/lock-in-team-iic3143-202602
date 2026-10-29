# Catálogo de datos

Catálogo del modelo de AcademiX: 14 tablas académicas (incluido el ledger de publicación), con tipos PostgreSQL
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
| materials | Material Markdown; archivos binarios diferidos. | Sí |
| quizzes | Evaluaciones autocorregidas. | Sí |
| quiz_attempts | Intentos de estudiantes. | Sí |
| grade_items | Ítems ponderados del libro de notas. | Sí |
| grades | Nota vigente por estudiante e ítem. | Sí |
| audit_events | Historial académico inmutable. | Sí |
| grade_publications | Recibos privados e inmutables de publicación. | Sí |

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
| users | email | varchar(254) | Sí | — | Correo de referencia, máximo 254 caracteres; normalización y unicidad pendientes del contrato de autenticación. |
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
| institution_memberships | is_admin | boolean | Sí | — | Default false; creación y administración de cursos propios. |
| institution_memberships | is_super_admin | boolean | Sí | — | Default false; delegación institucional, sin acceso académico implícito. |
| institution_memberships | updated_at | timestamptz(6) | Sí | — | Fecha de última actualización. |
| courses | id | uuid | Sí | PK | Identificador del curso. |
| courses | institution_id | uuid | Sí | FK | Tenant lógico dueño del curso. |
| courses | code | varchar(32) | Sí | — | Código académico del curso. |
| courses | name | varchar(200) | Sí | — | Nombre del curso. |
| courses | term | varchar(16) | Sí | — | Periodo académico. Máximo aprobado de 16 caracteres para periodo académico; formato pendiente. |
| courses | created_by | uuid | Sí | FK | Dueño único inmutable; creación exige is_admin institucional vigente. |
| courses | grade_items_locked_at | timestamptz(6) | No | — | Primera publicación; bloqueo monotónico de pesos/ítems. |
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
| enrollments | role | varchar(16) | Sí | — | Rol académico: teacher, assistant o student; máximo 16 caracteres y valores restringidos por CHECK. |
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
| materials | kind | varchar(16) | Sí | — | Solo markdown; varchar(16) y CHECK kind=markdown. Binarios diferidos. |
| materials | markdown_body | text | Sí | — | Markdown requerido, 1..10000 caracteres; no vacío tras btrim. |
| materials | published_at | timestamptz(6) | No | — | Fecha de publicación. |
| materials | created_by | uuid | Sí | FK | Usuario autor validado por membership institucional. |
| quizzes | id | uuid | Sí | PK | Identificador del quiz. |
| quizzes | institution_id | uuid | Sí | FK | Tenant lógico. |
| quizzes | course_id | uuid | Sí | FK | Curso evaluado. |
| quizzes | section_id | uuid | No | FK | Sección específica si el quiz no es de todo el curso. |
| quizzes | title | varchar(200) | Sí | — | Título del quiz. |
| quizzes | instructions | varchar(10000) | No | — | Instrucciones visibles, máximo 10000 caracteres para texto extenso de la evaluación. |
| quizzes | opens_at | timestamptz(6) | No | — | Inicio de ventana. |
| quizzes | closes_at | timestamptz(6) | No | — | Cierre de ventana. |
| quizzes | max_attempts | integer | No | — | Máximo de intentos por estudiante; integer positivo y NULL para intentos ilimitados. |
| quizzes | published_at | timestamptz(6) | No | — | Fecha de publicación. |
| quizzes | created_by | uuid | Sí | FK | Usuario creador validado por membership institucional. |
| quizzes | questions | jsonb | Sí | — | Preguntas, puntajes y alternativas anidadas de la pauta. Documento estructurado; campos internos en Contratos JSON; no implica FK internas. |
| quiz_attempts | id | uuid | Sí | PK | Identificador de intento. |
| quiz_attempts | institution_id | uuid | Sí | FK | Tenant lógico. |
| quiz_attempts | course_id | uuid | Sí | FK | Curso histórico del intento. |
| quiz_attempts | quiz_id | uuid | Sí | FK | Quiz respondido. |
| quiz_attempts | section_id | uuid | Sí | FK | Sección histórica del estudiante. |
| quiz_attempts | student_id | uuid | Sí | FK | Estudiante que responde. |
| quiz_attempts | attempt_number | integer | Sí | — | Número correlativo por quiz y estudiante. Secuencia entera; CHECK > 0, tenant/quiz/student único. |
| quiz_attempts | status | varchar(16) | Sí | — | Estado del intento: in_progress, submitted, graded o cancelled; máximo 16 caracteres y valores restringidos por CHECK. |
| quiz_attempts | started_at | timestamptz(6) | Sí | — | Inicio del intento. |
| quiz_attempts | submitted_at | timestamptz(6) | No | — | Envío del intento. |
| quiz_attempts | cancelled_at | timestamptz(6) | No | — | Cancelación del intento. |
| quiz_attempts | answers | jsonb | Sí | — | Respuestas del estudiante. Documento estructurado; campos internos en Contratos JSON; no implica FK internas. |
| quiz_attempts | score_points | numeric(8,2) | No | — | Puntaje obtenido. Puntaje exacto de hasta 999999.99; CHECK 0..999999.99; puntos JSON positivos de hasta dos decimales. |
| quiz_attempts | score_percent | numeric(5,2) | No | — | Porcentaje obtenido. Porcentaje decimal exacto con dos decimales; CHECK limita a 0..100. |
| quiz_attempts | grade_value | numeric(3,1) | No | — | Nota histórica 1.0..7.0; HALF_UP usando porcentaje redondeado. |
| quiz_attempts | start_key | text | Sí | UNIQUE por tenant/student | Clave original de inicio, longitud 1..200. |
| quiz_attempts | submit_key | text | No | UNIQUE parcial por tenant/student | Clave original aceptada al enviar; sin alias. |
| grade_items | id | uuid | Sí | PK | Identificador del ítem evaluado del libro de notas. |
| grade_items | institution_id | uuid | Sí | FK | Tenant lógico. |
| grade_items | course_id | uuid | Sí | FK | Curso dueño. |
| grade_items | quiz_id | uuid | Sí | FK | Quiz asociado. |
| grade_items | title | varchar(200) | Sí | — | Nombre visible del ítem. |
| grade_items | weight_percent | numeric(5,2) | Sí | — | Ponderación porcentual. Porcentaje decimal exacto con dos decimales; CHECK limita a 0..100. |

Publicación: selección explícita ítems×estudiantes, sección histórica; teacher activo,
pesos además admin dueño. Primer published_at congela pesos/ítems; Grade publicada
inmutable. grade_publications persiste recibo/selección canónica por tenant/actor/clave,
append-only con FK tenant/curso/membership. Pesos NUMERIC(5,2), total exacto 100;
promedio publicado HALF_UP, null con peso cero. Detalle y trazabilidad:
[ADR de publicación](../../adr/grade-publication-and-weight-freeze.md).

Ledger: id, institution_id, course_id, actor_user_id UUID; idempotency_key text
(1..200), request JSONB canónico privado, published_count integer >0,
published_at timestamptz(6). UNIQUE(tenant,actor,key); FK tenant/curso y
membership; UPDATE/DELETE prohibidos, recibo público solo count/timestamp.
