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
| audit_events | actor_user_id | uuid | No | FK | Actor autenticado; nulo solo en onboarding/superadmin con evidencia operativa. |
| audit_events | action | varchar(64) | Sí | — | Acción auditada, máximo 64 caracteres; vocabulario de acciones pendiente. |
| audit_events | resource_type | varchar(32) | Sí | — | Tipo de recurso auditado, máximo 32 caracteres; vocabulario de recursos pendiente. |
| audit_events | resource_id | uuid | Sí | — | ID del recurso afectado. |
| audit_events | course_id | uuid | No | FK | Obligatorio para eventos académicos; nulo solo para privilegios institucionales. |
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
| quiz_attempts.answers | $ | array de questionId/alternativeId | Sí | Reemplazo completo; pregunta única y alternativa de su pregunta; graded añade isCorrect/pointsAwarded. |
| audit_events.changes | $ | Pendiente | Sí | Snapshot sanitizado; estructura por acción pendiente; excluir secretos y pauta. |

## Pendientes

| Área | Decisión |
| --- | --- |
| Identidad | Definir cómo JWT sub resuelve users.id; normalización y unicidad de email (máximo 254 caracteres acordado). |
| Cadenas | Definir formato de slug/códigos/term, normalización y prohibición de valores vacíos. |
| Defaults | Generación de UUID, defaults de active salvo institutions.active=true, fechas y mantenimiento de updated_at. |
| Referencias | Definir ON DELETE/ON UPDATE sin pérdida de registros académicos o evidencia histórica. |
| Enteros | Definir base de position y CHECK de attempt_number > 0; semántica de capacity=0. |
| Material | Excluir markdown_body en archivos, lista MIME, máximo de bytes y proveedor; validar el límite en bytes de storage_key además del máximo de 1024 caracteres. |
| Intentos | Coherencia de status/fechas/puntajes; puntaje no negativo ni superior al total del quiz. |
| JSON | Cerrar estructura de answers/changes, tipos de IDs locales y precisión de points compatible con numeric(8,2). |
| Auditoría | Resuelto: course_id nullable solo en eventos de privilegios; actor nulo requiere evidencia operativa. |
| Inmutabilidad | Definir mecanismos de bloqueo de pauta, respuestas, notas publicadas y UPDATE/DELETE de auditoría. |
| Persistencia | Elegir ORM/migraciones y materializar las reglas documentadas en DDL y transacciones. |

Intentos: checks coherentes de estado/fechas/resultados, claves de 1..200 únicas
por tenant/student/operación; constraint diferible impide submitted persistido.
Triggers conservan identidad e intentos terminales; Grade publicada es inmutable.
GET student omite resultados/corrección; assistant omite corrección por respuesta.
