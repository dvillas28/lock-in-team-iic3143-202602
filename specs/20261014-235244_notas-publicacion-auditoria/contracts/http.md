# HTTP Contract: Libro, publicación y seguimiento

Base C=`/api/v1/institutions/{institutionSlug}/courses/{courseId}`.
Bearer JWT, JSON camelCase, no-store. Mantener formatos existentes de OpenAPI.
Este contrato describe cambios a sincronizar durante implementación, no endpoints nuevos hoy.

## US1: configurar/publicar

### GET C/grade-items

200 {items:GradeItem[],totalWeightPercent:number}; teacher/assistant según matriz.
GradeItem existente: id,courseId,quizId,title,weightPercent,createdAt.

### PUT C/gradebook/weights

Body exacto {items:[{gradeItemId:UUID,weightPercent:number}]}.
Colección no vacía, IDs únicos y exactamente todos los ítems del curso; cada peso
0..100 con hasta dos decimales, sin coerción; suma decimal exactamente 100.
Teacher activo y admin dueño. 200 GradebookWeightsResponse existente.
Sin cambios y sin freeze: 200 sin evento. Tras cualquier nota publicada: 409
GRADE_WEIGHTS_LOCKED incluso si request repite pesos. No Idempotency-Key para PUT.

### POST C/gradebook/publications

Header Idempotency-Key requerido, cadena 1..200 caracteres sin espacios exteriores.
Body exacto {gradeItemIds:UUID[],sectionIds:UUID[],studentIds:UUID[]}.
Todas las listas requeridas, no vacías, sin duplicados. studentIds es extensión
necesaria de PublishGradesRequest actual para FR-003, sin selección implícita.
Cada sección debe pertenecer al curso/alcance; cada ítem al curso. Cada par
ítem/estudiante exige Grade calificada cuya sección histórica esté seleccionada.
Estudiante sin Grade en un ítem: 409; no publicar subconjunto. Todos los IDs se
validan antes de mutar. No exigir Enrollment actual del alumno destinatario.
Sin Grade sin publicar, con cualquier inProgress seleccionado o pesos !=100: 409.
Éxito 200 {publishedCount:integer>0,publishedAt:date-time}, un timestamp para todo.
Misma clave y selección (orden irrelevante) devuelve respuesta original tras
revalidar alcance. Otra selección/curso con esa clave: 409 IDEMPOTENCY_CONFLICT.
Otra clave sobre notas ya publicadas: 409 GRADE_ALREADY_PUBLISHED, no sobrescribir.
Fallos de validación/DB/auditoría no reservan clave ni dejan publicaciones parciales.

## US2: resultados/historial

### GET C/gradebook

Filtros sectionId opcional, cursor y limit existentes. 200 GradebookResponse
con PageInfo; items GradebookStudentRow por estudiante/sección histórica:
{student:UserSummary,sectionId,grades:GradeTeacherView[],partialAverage,
publishedWeightPercent}. grades incluye publicadas/no publicadas en alcance;
promedio solo publicadas de esa fila. No filtrar por estado activo actual del alumno.
No serializar pauta/respuestas; teacher y assistant reciben solo seguimiento permitido.
Cursor estable por mínimo created_at de Grade de la fila, studentId y sectionId;
ligarlo a actor/tenant/curso/filtros y revalidar permisos en cada página. Evitar duplicados.

### GET C/my-grades

Sin studentId en query/body; solo sub y Student activo. 200 StudentGradesResponse:
{courseId,items:PublishedGradeStudentView[],partialAverage:number|null,
publishedWeightPercent:number,isPartial:boolean}.
Items solo propios published_at NOT NULL; unión histórica sin duplicar por Enrollment.
Promedio SQL round(sum(grade*weight)/NULLIF(sum(weight),0),1), HALF_UP.
Sin publicados o solo ítems de peso 0: promedio null, peso 0, isPartial=true.
SC-002 devuelve 6.1, peso 65 e isPartial=true. No cuenta pesos sin nota publicada.

### GET /api/v1/institutions/{institutionSlug}/quizzes/{quizId}/attempts

Implementar listQuizAttempts existente, sin alterar GET por intento de su misión.
Filtros sectionId,studentId,status,cursor,limit existentes; cursor (started_at,id)
ligado al actor/tenant/quiz/filtros. 200 QuizAttemptListResponse paginado.
Usar anyOf QuizAttemptAcademicView/QuizAttemptAssistantView por fila según acceso
a pauta; reutilizar DTO/predicado de intentos. Assistant nunca isCorrect/pointsAwarded.
Mantener proyección segura de preguntas omitidas y answers vacías.

### GET C/audit-events

Reutilizar AuditController/AuditService.list: action,resourceType,resourceId,
actorUserId,sectionId,from,to,cursor,limit. Rango inclusivo, from<=to.
Orden estable (occurred_at,id), cursor existente; 200 AuditEventListResponse.
Scope y campos sanitizados según authorization.md; filtros nunca amplían alcance.
Pesos globales solo owner; grade.published lleva sección histórica de cada nota.

## Errores y sincronización

400 forma/query/header desconocido, UUID inválido, duplicados o precisión inválida;
401 identidad inválida; 403 rol insuficiente; 404 recurso fuera de alcance;
409 conflicto de publicación/activo/freeze/clave; 422 conjunto de pesos incompleto,
referencias semánticas inválidas visibles o total !=100; 500/503 fallo sin secretos.
Reutilizar Problem existente y códigos en su campo acordado; no reflejar bodies.
Añadir respuestas 500/503 a las operaciones afectadas cuando falten en OpenAPI.
Actualizar paths/gradebook.yaml, quizzes.yaml, audit.yaml y schemas correspondientes;
regenerar frontend/src/lib/api/schema.d.ts y probar consumidor con studentIds.
