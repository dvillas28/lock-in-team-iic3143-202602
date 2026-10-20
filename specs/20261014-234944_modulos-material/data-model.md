# Data Model: Módulos y material compartido

Objetivo posterior a cursos-roles; nuevas tablas UUID, SQL parametrizado público.

## CourseModule / course_modules

id uuid PK; institution_id uuid NOT NULL; course_id uuid NOT NULL;
title varchar(200) NOT NULL; position integer NOT NULL;
published_at timestamptz(6) NULL, inicialmente NULL.
FK(institution_id,course_id) → courses(institution_id,id), ON DELETE RESTRICT.
UNIQUE(institution_id,id) para FK de materiales.
UNIQUE(institution_id,course_id,position) DEFERRABLE INITIALLY IMMEDIATE.
CHECK(position>0), CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200).
Sin section_id, soft-delete ni endpoints de borrado/movimiento entre cursos.
Índice de unicidad cubre listado por tenant/curso/position; PK cubre lectura por id.

## Material / materials

id uuid PK; institution_id uuid NOT NULL; module_id uuid NOT NULL;
title varchar(200) NOT NULL; kind varchar(16) NOT NULL DEFAULT 'markdown';
markdown_body text NOT NULL; published_at timestamptz(6) NULL inicialmente;
created_by uuid NOT NULL, asignado desde identidad autenticada e inmutable en API.
FK(institution_id,module_id) → course_modules(institution_id,id), DELETE RESTRICT.
FK(institution_id,created_by) → institution_memberships(institution_id,user_id).
UNIQUE(institution_id,id); CHECK(kind='markdown').
CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200).
CHECK(char_length(markdown_body) BETWEEN 1 AND 10000 AND btrim(markdown_body) <> '').
API también rechaza cuerpos solo whitespace Unicode y NUL; pg no admite NUL en text.
Índice(institution_id,module_id,id) para listado estable por módulo.
Sin section_id, campos storage ni copias de course_id; curso se resuelve por módulo.
Relación compuesta impide materiales en módulos de otra institución.
No mover material entre módulos; el body no admite IDs de scope ni kind/createdBy.

## Estados e historia

Borrador/oculto = published_at NULL; publicado = timestamp asignado por DB.
Publish solo cambia NULL a now(); unpublish solo cambia no-NULL a NULL.
Repetir estado devuelve actual sin timestamp nuevo ni nuevo evento.
Ocultar módulo no toca materiales; volver a publicar padre revela hijos publicados.
Edición conserva published_at: el cambio publicado es inmediatamente visible.
Lectura assistant/student exige padre e ítem publicados y Enrollment activo.
Teacher de cualquier sección puede leer borradores de todo el curso.

AuditEvent de cursos-roles se reutiliza con course_id resuelto y section_id NULL.
resource_type: courseModule o material; resource_id validado en la transacción.
Acciones: module.created/updated/reordered/published/unpublished;
material.created/updated/published/unpublished.
module.reordered usa resource_id de Course y resource_type='course'; changes contiene
before/after de [{id,position}], sin body ni copia de recursos de otro curso.
Snapshot módulo: id/courseId/title/position/publishedAt.
Snapshot material: id/moduleId/title/kind/markdownBody/publishedAt/createdBy.
Guardar before/after permitidos conserva contenido e historia; no-op no crea evento.
Nada de payloads HTTP completos, JWT, emails, credenciales ni SQL en auditoría/logs.
No ampliar lectores de auditoría: sus permisos siguen en cursos-roles. Teacher no
admin no consulta eventos comunes section_id NULL; admin dueño sí. No exponer
snapshots de borradores por rutas de material ni eventos a assistant/student.

## Transacciones y orden

Reutilizar orden global: User → Institution → memberships por UUID → Course → Enrollment.
Mutaciones toman User/Institution/membership FOR SHARE; Course FOR UPDATE;
Enrollments autorizantes FOR SHARE, ordenados por UUID, y revalidan teacher.
Luego locks de módulos por UUID → materiales por UUID cuando se necesiten.
Nunca subir SHARE a UPDATE; revocaciones concurrentes usan el protocolo previo.
Resolver scope inicial sin confiar en él y revalidarlo tras locks antes de escribir.
No permitir cambiar institution_id/course_id/module_id por API.
Una tx, un PoolClient, COMMIT solo tras auditoría; ROLLBACK ante cualquier fallo y
release en finally. La revocación confirmada impide solicitudes posteriores.

Alta: validar posición positiva y libre tras lock de curso; conflicto → 409.
Orden: validar IDs únicos, conjunto completo del curso (incluidos ocultos),
rechazar ajenos con 404; conjunto local incompleto/desactualizado → 409.
Diferir solo la constraint de posiciones, asignar 1..N y confirmar; nunca estado parcial.
Dos órdenes válidos se serializan; prevalece último commit. Alta concurrente puede
invalidar el conjunto de una orden, que obtiene 409 sin mutación.
Ediciones concurrentes se serializan; último commit gana con ambos eventos históricos.
No retry automático de POST create: sin clave idempotente un POST repetido es otra alta
(si reutiliza posición ocupada, 409). Publish/unpublish/order/PATCH sin cambios son no-op.

## Migración

Nueva 20261016000200_modules_material.sql, posterior a 20261016000100_courses_roles.sql.
No modificar migraciones ya aplicadas; comprobar unicidad de prefijo al implementar.
Up crea tablas/constraints/índices; no reescribe usuarios, cursos ni material existente.
Validar instalación vacía y upgrade con cursos/inscripciones/auditoría existentes.
Down solo en DB exclusiva sin datos que conservar; no rollback destructivo automático.
