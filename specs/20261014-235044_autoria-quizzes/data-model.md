# Data Model: Autoría y publicación de quizzes

Migración propuesta: backend/migrations/20261019000100_quiz_authoring.sql,
posterior a 20261016000200_modules_material.sql; verificar prefijo libre al implementar.
No editar migraciones aplicadas ni crear tablas de intentos/notas.

## Course: marcador de congelación

Agregar grade_items_locked_at timestamptz(6) NULL a courses.
NULL: admite nuevos ítems; no-NULL: no admite nuevos ítems ni futuros cambios de pesos.
No expuesto por API ni modificable por bodies de curso.
Trigger permite NULL→timestamp y no-op; prohíbe cambiar o borrar valor ya fijado.
Lo fija la misión de publicación de notas en la tx de primera publicación.
Sin notas reales aquí: fixtures SQL simulan esa transición.

## Quiz / quizzes

id uuid PK; institution_id uuid NOT NULL; course_id uuid NOT NULL;
section_id uuid NULL; title varchar(200) NOT NULL; instructions varchar(10000) NULL;
opens_at/closes_at/published_at timestamptz(6) NULL; max_attempts integer NULL;
created_by uuid NOT NULL; questions jsonb NOT NULL DEFAULT '[]'.
Estado derivado de published_at: draft si NULL, published en otro caso.
FK(institution_id,course_id) → courses(institution_id,id), DELETE RESTRICT.
FK(institution_id,section_id,course_id) → sections(institution_id,id,course_id),
DELETE RESTRICT; NULL section_id significa destinatarios del curso completo.
FK(institution_id,created_by) → institution_memberships(institution_id,user_id).
UNIQUE(institution_id,id,course_id) y UNIQUE(institution_id,id).
CHECK título trim y 1..200 caracteres; max_attempts NULL o entero positivo int32.
CHECK opens_at < closes_at si ambos existen; jsonb_typeof(questions)='array'.
Índice(institution_id,course_id,id) para lista estable; PK cubre detalle.
id,institution_id,course_id,created_by inmutables por API.
section_id es FK reasignable solo draft dentro del mismo curso/tenant; nunca cambia Section.id.
Sin module_id, estados extra, delete ni borrado en cascada.

## Preguntas y alternativas anidadas

Question: id UUID estable; position entero positivo int32 único en Quiz;
prompt texto no blanco; points número finito positivo con hasta dos decimales;
alternatives arreglo mínimo dos elementos.
Alternative: id string estable no blanco; text no blanco; isCorrect boolean.
IDs de pregunta únicos en Quiz; IDs de alternativa únicos dentro de su pregunta.
Exactamente una alternativa correcta por pregunta.
Arreglo vacío permitido solo draft; publicación exige al menos una pregunta.
Suma de puntos <=999999.99, compatible con score_points numeric(8,2) futuro.
Rechazar NUL, tipos coercionados y claves desconocidas a cualquier profundidad.
Orden devuelto por position; no hay endpoint separado de reordenación.

Alta genera question.id; el input no acepta IDs preexistentes de otro quiz.
PATCH acepta id opcional: presente debe identificar pregunta actual; ausente crea UUID.
Preguntas retenidas preservan id; eliminadas no se reutilizan ni se regeneran al leer.
Alternativas mantienen IDs suministrados al actualizar pregunta retenida.
Se puede eliminar pregunta completa en draft reemplazando questions; publicado no.
Validador de aplicación impone estructura anidada y sumas; SQL impone FK, unicidad
relacional, rango de metadata y tipo JSON. No generar tablas por título del backlog.

## GradeItem / grade_items

id uuid PK; institution_id uuid NOT NULL; course_id uuid NOT NULL;
quiz_id uuid NOT NULL; title varchar(200) NOT NULL;
weight_percent numeric(5,2) NOT NULL DEFAULT 0;
created_at timestamptz(6) NOT NULL DEFAULT now().
FK(institution_id,course_id) → courses(institution_id,id), DELETE RESTRICT.
FK(institution_id,quiz_id,course_id) → quizzes(institution_id,id,course_id),
DELETE RESTRICT. UNIQUE(institution_id,quiz_id).
UNIQUE(institution_id,id,quiz_id) para futura Grade.
CHECK weight_percent BETWEEN 0 AND 100; título trim 1..200.
Índice(institution_id,course_id,id) para libro posterior.
Título copiado de Quiz al publicar; no admite edición HTTP en esta misión.
Trigger BEFORE INSERT bloquea Course FOR UPDATE y rechaza marcador no-NULL:
SQLSTATE 23514, constraint grade_items_course_frozen. Convertir a ConflictException
dentro del callback, antes del mapper genérico de transaction; preservar otros errores.
Peso inicial 0 no configura una distribución; futuros pesos deben sumar 100.
Un publish repetido reutiliza GradeItem existente sin INSERT.

## Estados y auditoría

draft → published, irreversible en esta misión; PATCH publicado responde 409.
Esta política protege preguntas, alternativas, pauta, puntos y maxAttempts desde
antes del primer intento, incluso si ese intento termina cancelado.
AuditEvent existente; acciones quiz.created, quiz.updated, quiz.published.
ResourceType quiz; resourceId Quiz; Course y sectionId derivados de DB.
Reasignación usa quiz.updated con section_id del evento NULL y before/after con
sectionId anterior/nuevo: scope de curso evita filtrar el origen al docente destino.
Snapshot permitido: id/courseId/sectionId/title/opensAt/closesAt/maxAttempts/
publishedAt/createdBy/questionCount/totalPoints/gradeItemId.
gradeItemId solo existe tras publicar; evitar undefined en JSON.
Sin questions, instrucciones, prompts, alternativas, respuestas correctas ni payload.
Edición draft sobrescribe pauta con metadata auditada; publicada queda inmutable.
No-op PATCH/publish no agrega eventos; errores no conservan pauta en logs.

## Transacciones y carreras

Orden heredado: User → Institution → memberships por UUID → Course FOR UPDATE
→ Enrollments autorizantes por UUID FOR SHARE → Quiz FOR UPDATE → GradeItem.
Resolver scope sin confiar en lectura preliminar; revalidar después de los locks.
Una tx, un PoolClient; COMMIT posterior a AuditService.record; release en finally.
Reutilizar transaction/lockContext/courseScope sin cambiar permisos de sus callers.

Alta: revalidar scope e insertar draft + evento.
PATCH: cargar y bloquear Quiz; exigir draft, validar estado combinado y IDs;
si cambia section_id, revalidar canAuthorQuiz en origen y destino dentro de la tx.
Mantener Course e IDs; NULL significa curso completo y exige academicOwner.
actualizar + evento si cambia. Último commit gana con historia de metadata.
Publish: revalidar permiso; si ya publicado devolver estado existente sin cambios;
si draft, validar pauta y marcador NULL, insertar GradeItem, publicar y auditar.
Dos publish se serializan y devuelven mismo Quiz/GradeItem, un solo evento publish.
PATCH vs publish: edit primero se publica editado; publish primero deja PATCH en 409.
Freeze vs publish: Course lock serializa; freeze primero → 409 sin efectos;
publish primero → ítem válido anterior a congelación. Fallo audit revierte todo.
Publicadores futuros de notas/pesos e inicio de intento respetan Course→Quiz,
sin invertir locks ni usar permisos cacheados; ver contrato de integración.

## Migración y conservación

Up agrega columna/tablas/constraints/triggers e índices, sin reescribir datos previos.
Probar instalación vacía, upgrade poblado desde #90 y ejecución repetida del migrador.
Down solo en DB exclusiva descartable; no rollback destructivo en datos reales.
