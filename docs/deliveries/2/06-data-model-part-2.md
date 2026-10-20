
Campos: `id uuid PK`, `institution_id uuid`, `section_id uuid`,
`user_id uuid`, `role varchar(16)`, `active boolean`, `created_at timestamptz(6)`.

Reglas:

- `role in ('teacher', 'student', 'assistant')`;
- FK `(institution_id, section_id)` referencia Section;
- FK `(institution_id, user_id)` referencia InstitutionMembership;
- único parcial
  `(institution_id, section_id, user_id, role) WHERE active`;
- índices `(institution_id, user_id, active, section_id)` y
  `(institution_id, section_id, active, id)`;
- teacher gestiona participantes de sus secciones y contenido compartido;
  assistant solo seguimiento; student recorrido propio. Configuración y secciones
  exigen is_admin y ownership, independientes del rol académico;
- desactivar o cambiar un rol no elimina su evidencia histórica y genera
  auditoría.

### course_modules

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `title varchar(200)`,
`position integer`, `published_at timestamptz(6) nullable`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- `unique (institution_id, course_id, position)`;
- no tiene `section_id`: el módulo pertenece al Course completo;
- estudiantes ven solo módulos publicados de cursos autorizados.

### materials

Markdown o metadatos de un archivo externo.

Campos: `id uuid PK`, `institution_id uuid`, `module_id uuid`, `title varchar(200)`,
`kind varchar(16)`, `markdown_body text nullable`, `storage_key varchar(1024) nullable`,
`mime_type varchar(255) nullable`, `size_bytes bigint nullable`,
`published_at timestamptz(6) nullable`, `created_by uuid`.

Reglas:

- FK `(institution_id, module_id)` referencia CourseModule;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- no tiene `section_id`: el material publicado es común para todas las secciones
  del Course del módulo;
- `kind in ('markdown', 'file')`;
- markdown exige cuerpo y excluye campos de archivo;
- file exige metadatos, MIME permitido y `size_bytes >= 0`;
- el futuro `storage_key` usa namespace interno por Institution, no se expone a
  clientes ni auditoría;
- el backend valida InstitutionMembership y matrícula antes de servir contenido.

### quizzes

Quiz de Course o de una Section del mismo Course.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`,
`section_id uuid nullable`, `title varchar(200)`, `instructions varchar(10000) nullable`,
`opens_at timestamptz(6) nullable`, `closes_at timestamptz(6) nullable`,
`max_attempts integer nullable`, `published_at timestamptz(6) nullable`,
`created_by uuid`, `questions jsonb`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, section_id, course_id)` referencia Section cuando existe;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- `max_attempts IS NULL OR max_attempts > 0`;
- `opens_at < closes_at` cuando ambos existen;
- `(institution_id, id, course_id)` es único para relaciones posteriores;
- `questions` es un arreglo JSON con `id` local, `position`, `prompt`, `points`
  y `alternatives`;
- cada pregunta tiene `points > 0`;
- cada pregunta contiene al menos dos alternativas, IDs locales únicos y
  exactamente una correcta;
- los IDs de pregunta y alternativa son estables dentro del Quiz y se usan en
  `quiz_attempts.answers`;
- pauta y campos de corrección nunca aparecen en la vista estudiantil,
  auditoría o logs;
- tras el primer intento se inmovilizan pauta, puntajes y política de intentos.

### quiz_attempts

Conserva Institution, Course y Section históricas.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `quiz_id uuid`,
`section_id uuid`, `student_id uuid`, `attempt_number integer`, `status varchar(16)`,
`started_at timestamptz(6)`, `submitted_at timestamptz(6) nullable`,
`cancelled_at timestamptz(6) nullable`, `answers jsonb`,
`score_points numeric(8,2) nullable`, `score_percent numeric(5,2) nullable`,
`grade_value numeric(3,1) nullable`, `start_key text NOT NULL`, `submit_key text nullable`.

Reglas:

- `status in ('in_progress', 'submitted', 'graded', 'cancelled')`;
- FK `(institution_id, quiz_id, course_id)` referencia Quiz;
- FK `(institution_id, section_id, course_id)` referencia Section;
- FK `(institution_id, student_id)` referencia InstitutionMembership;
- `unique (institution_id, quiz_id, student_id, attempt_number)`;
- `(institution_id, id, quiz_id, student_id, section_id)` es único para Grade;
- único parcial
  `(institution_id, quiz_id, student_id) WHERE status = 'in_progress'`;
- iniciar valida membership, Enrollment student, scope, ventana, máximo, acceso a
  pauta y ausencia de nota publicada;
- `score_percent between 0 and 100` cuando exista;
- cancelación conserva número, no crea Grade y genera AuditEvent;
- respuestas y corrección quedan inmutables al calificar; cancelled también es terminal;
- claves 1..200 únicas por tenant/student/operación; submit original sin alias;
- submitted solo dentro de tx: constraint diferible rechaza commit pendiente;
- porcentaje HALF_UP a dos decimales y nota histórica a uno, calculada desde ese porcentaje;
- ventana [opens_at,closes_at), NULL ilimitado, reloj DB después de locks.


### grade_items

Evaluaciones ponderadas del libro de notas. Un GradeItem define que un Quiz
cuenta como ítem evaluado del Course, con un peso porcentual. No representa una
nota de estudiante.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `quiz_id uuid`,
`title varchar(200)`, `weight_percent numeric(5,2)`, `created_at timestamptz(6)`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, quiz_id, course_id)` referencia Quiz;
- `unique (institution_id, quiz_id)`;
- `(institution_id, id, quiz_id)` es único para Grade;
- `weight_percent between 0 and 100`;
- el reemplazo de ponderaciones es atómico y debe sumar 100 % antes de publicar;

Publicación: selección explícita ítems×estudiantes, sección histórica; teacher activo,
pesos además admin dueño. Primer published_at congela pesos/ítems; Grade publicada
inmutable. grade_publications persiste recibo/selección canónica por tenant/actor/clave,
append-only con FK tenant/curso/membership. Pesos NUMERIC(5,2), total exacto 100;
promedio publicado HALF_UP, null con peso cero. Detalle y trazabilidad:
[ADR de publicación](../../adr/grade-publication-and-weight-freeze.md).
