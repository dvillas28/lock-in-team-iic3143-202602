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

| grade_publications | id | uuid | Sí | PK | Identificador del recibo. |
| grade_publications | institution_id | uuid | Sí | FK | Tenant del curso. |
| grade_publications | course_id | uuid | Sí | FK | Curso publicado. |
| grade_publications | actor_user_id | uuid | Sí | FK | Membership del docente autorizador. |
| grade_publications | idempotency_key | text | Sí | — | Privada; 1..200, única por tenant y actor. |
| grade_publications | request | jsonb | Sí | — | Selección canónica privada. |
| grade_publications | published_count | integer | Sí | — | Cantidad publicada positiva. |
| grade_publications | published_at | timestamptz(6) | Sí | — | Fecha del recibo inmutable. |

## Relaciones

| Tabla origen | Campos origen | Tabla destino | Campos destino | Cardinalidad |
| --- | --- | --- | --- | --- |
| institution_memberships | institution_id | institutions | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| institution_memberships | user_id | users | id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| courses | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| enrollments | institution_id, user_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| materials | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, created_by | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, student_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grades | institution_id, student_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, actor_user_id | institution_memberships | institution_id, user_id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| sections | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| course_modules | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_items | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, course_id | courses | institution_id, id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| enrollments | institution_id, section_id | sections | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| materials | institution_id, module_id | course_modules | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| quizzes | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| audit_events | institution_id, section_id, course_id | sections | institution_id, id, course_id | Cada fila origen: 0..1 destino; cada destino: 0..N filas origen. |
| quiz_attempts | institution_id, quiz_id, course_id | quizzes | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_items | institution_id, quiz_id, course_id | quizzes | institution_id, id, course_id | Cada fila origen: 1 destino; cada destino: 0..1 filas origen. |
| grades | institution_id, grade_item_id, quiz_id | grade_items | institution_id, id, quiz_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grades | institution_id, attempt_id, quiz_id, student_id, section_id | quiz_attempts | institution_id, id, quiz_id, student_id, section_id | Cada fila origen: 1 destino; cada destino: 0..1 filas origen. |

| grade_publications | institution_id, course_id | courses | institution_id, id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |
| grade_publications | institution_id, actor_user_id | institution_memberships | institution_id, user_id | Cada fila origen: 1 destino; cada destino: 0..N filas origen. |


Restricciones, JSON y decisiones: [reglas](12-data-catalog-rules.md).
