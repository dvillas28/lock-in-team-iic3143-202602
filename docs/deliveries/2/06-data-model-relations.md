# Relaciones contrastadas con DDL

Revisión documental: 2026-10-29, commit base 7f4334a. No cambia persistencia.
DDL: migraciones de identidad, cursos, contenido, autoría, intentos y publicación
[versionadas](../../../backend/migrations/). La tabla física completa (25 FK) está
en [catálogo, relaciones](12-data-catalog-part-2.md); cada fila indica mínimo y
máximo en ambos extremos. Las FK compuestas mantienen institución y curso.

| Relación conceptual | Padres por hijo | Hijos por padre | Regla física/ciclo de vida |
| --- | --- | --- | --- |
| Institution–Membership | 1 | 0..* | FK NOT NULL; UNIQUE institución+usuario |
| User–Membership | 1 | 0..* | Identidad global, FK NOT NULL |
| Institution–tabla tenant-owned | 1 | 0..* | institution_id NOT NULL, RLS; contexto transitivo por FK compuestas |
| Membership–Course propietario | 1 | 0..* | created_by inmutable y FK membership |
| Course–Section | 1 | 0..* | FK; API crea primera sección, SQL no impone mínimo permanente |
| Section–Enrollment | 1 | 0..* | FK; rol activo único por usuario/sección/rol |
| Membership–Enrollment | 1 | 0..* | FK institucional; User–Enrollment conceptual transitiva |
| Course–CourseModule | 1 | 0..* | FK; posición única por curso |
| CourseModule–Material | 1 | 0..* | FK; material no depende directamente de sección |
| Membership–Material/Quiz autor | 1 | 0..* | FK created_by institucional |
| Course–Quiz | 1 | 0..* | FK; alcance de curso aunque section_id sea NULL |
| Section–Quiz | 0..1 | 0..* | FK opcional; sección debe ser del curso |
| Quiz–QuestionJson | 1 | 1..* publicado | Conceptual JSON; borrador incompleto permitido; no FK |
| Quiz–QuizAttempt | 1 | 0..* | FK quiz+course; número único por quiz/estudiante |
| Section–QuizAttempt | 1 | 0..* | FK con curso, conserva sección histórica |
| Membership–QuizAttempt | 1 | 0..* | FK student; matrícula actual no reescribe historia |
| Course–GradeItem | 1 | 0..* | FK; primera publicación congela ítems y pesos |
| Quiz–GradeItem | 1 | 0..1 | UNIQUE quiz institucional; creado al publicar quiz |
| GradeItem–Grade | 1 | 0..* | UNIQUE ítem+estudiante; FK compuesta quiz |
| QuizAttempt–Grade | 1 | 0..1 | Grade vigente; intento anterior puede dejar de determinarla |
| Membership–Grade | 1 | 0..* | FK student institucional |
| Section–Grade | 1 | 0..* | Sección histórica en FK del intento |
| Course–AuditEvent | 0..1 | 0..* | NULL solo eventos institucionales permitidos por CHECK |
| Membership–AuditEvent actor | 0..1 | 0..* | NULL solo operación controlada con evidencia obligatoria |
| Section–AuditEvent | 0..1 | 0..* | FK opcional section+course; nunca sección sin curso |
| Course–GradePublication | 1 | 0..* | Recibo append-only, FK curso institucional |
| Membership–GradePublication actor | 1 | 0..* | FK actor; clave idempotente única tenant+actor |

User–Grade/QuizAttempt/AuditEvent en UML abstrae Membership; ER explicita FK real.
Auditoría institucional no se consulta por historial de curso.
No existe FK polimórfica resource_id: la operación valida el recurso.
Catálogo académico incluye 14 tablas; ledgers operativos de migración no son
entidades académicas ni conceden permisos de producto.

Las líneas directas Institution–entidad académica son conceptuales: la mayoría
no tiene FK simple a institutions. En ER/catálogo físico se muestran solo las
25 FK reales; institution_id participa en FK compuestas hacia padres/membership.
Se retiraron 11 asociaciones transitivas que figuraban como FK directas.
