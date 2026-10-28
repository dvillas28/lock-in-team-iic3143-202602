# Contrato HTTP: Autoría y publicación de quizzes

Base: /api/v1/institutions/{institutionSlug}; JSON camelCase; Bearer vigente.
Contrato canónico: docs/reference/openapi/paths/quizzes.yaml y schemas/quizzes.yaml.
Este diseño prescribe su actualización durante implementación, no afirma API operativa.

## Rutas

| Método/ruta relativa | Resultado | Historia |
| --- | --- | --- |
| POST /courses/{courseId}/quizzes | 201 QuizAuthoringView + Location | US1 |
| PATCH /quizzes/{quizId} | 200 QuizAuthoringView, solo draft | US1 |
| POST /quizzes/{quizId}/publish | 200 QuizAuthoringView | US1 |
| GET /quizzes/{quizId}/authoring | 200 QuizAuthoringView con pauta autorizada | US1 |
| GET /courses/{courseId}/quizzes | 200 {items:QuizSummary[]} | US2 |
| GET /quizzes/{quizId} | 200 QuizStudentView sin pauta, para todo rol | US2 |

No endpoints de preguntas/alternativas, unpublish, delete, intentos ni notas nuevos.
POST publish no acepta body; query solo sectionId en lista, UUID de sección visible.
Lista ordenada por id, sin paginación nueva; nunca duplicar quiz por sección.
Filtro sectionId devuelve quizzes globales aplicables + quizzes de esa sección;
no permite ampliar permisos. Lista sin filtro devuelve unión del scope visible.

## QuizCreate

Objeto exacto: title obligatorio; sectionId/instructions/opensAt/closesAt/
maxAttempts/questions opcionales. Omitido: NULL salvo questions=[].
sectionId NULL significa curso completo; teacher + admin dueño obligatorio.
Section concreta exige teacher en ella o teacher + admin dueño del curso.
IDs de actor, institución y curso, createdBy, publishedAt y status no se aceptan.
Título trim 1..200; instrucciones string hasta 10000 o NULL; strings sin NUL.
opensAt/closesAt: ISO8601 con zona, fecha real; normalizar UTC al persistir.
Si ambos existen, opensAt < closesAt. No exigir fecha futura.
maxAttempts NULL=ilimitado; de otro modo entero 1..2147483647, sin coerción.
questions=[] permite guardar borrador sin pauta; publicar ese borrador da 422.
Cada pregunta suministrada debe cumplir el modelo; texto prompt/alternativas no blanco.
points finito positivo con hasta dos decimales; suma <=999999.99.
QuestionCreate: prompt, position, points, alternatives, sin id.
QuestionUpdate: mismos campos más id UUID opcional, usado únicamente en PATCH.
AlternativeInput: id string no blanco, text no blanco, isCorrect boolean.
position entero positivo int32; posiciones únicas, no exigir contigüidad.
Preguntas y alternativas con claves desconocidas/IDs duplicados se rechazan.

## QuizUpdate

Objeto no vacío con sectionId/title/instructions/opensAt/closesAt/maxAttempts/questions.
sectionId omitido conserva destino; UUID reasigna a esa sección; NULL amplía al curso.
Solo draft, mismo curso/institución y canAuthorQuiz sobre origen Y destino bajo locks.
No cambia Quiz.id ni Section.id; courseId, actor e institución permanecen inmutables.
Validar estado resultante combinado con campos omitidos conservados.
questions reemplaza arreglo completo; [] vacía el draft.
Agregar QuestionUpdate con id UUID opcional al contrato canónico y usarlo en PATCH.
En POST rechazar id recibido; en PATCH id recibido debe existir en ese Quiz;
id ausente crea pregunta nueva; id duplicado o desconocido produce 422.
No cambiar identidad al editar prompt/puntos/posición de pregunta existente.
Actualizar alternativas reteniendo sus IDs; todos sus IDs siguen siendo locales.
PATCH idéntico es no-op en draft; publicado siempre 409, incluso si idéntico.

## Publish y repetición

Publicar exige pauta completa no vacía y scope autorizado vigente.
Una tx fija publishedAt, crea GradeItem único (peso 0) y registra quiz.published.
Si curso congelado y quiz draft: 409; sin evento, ítem ni timestamp parcial.
Si ya publicado: 200 con mismo estado e ítem, aun con curso congelado;
revalidar identidad y autorización antes del no-op.
No devolver peso ni nota como parte de QuizAuthoringView.
POST create repetido es otra alta; no agregar clave de idempotencia.

## Representaciones

QuizSummary: id/courseId/sectionId/title/instructions/opensAt/closesAt/
maxAttempts/status/publishedAt. Sin questions ni createdBy.
QuizStudentView: QuizSummary + questions con id/prompt/position/points/
alternatives[{id,text}]. Proyección positiva; nunca isCorrect u otro campo de corrección.
QuizAuthoringView: QuizSummary + createdBy + questions con isCorrect.
GET seguro usa siempre vista segura aunque actor sea teacher/admin.
Autoría usa ruta explícita; respuestas authoring no llegan a lista ni historial.
No incluir GradeItem, answers, score, grade, correctAlternativeId ni flags internos.
Responder preguntas ordenadas por position, alternativas según orden guardado.

## Errores y transporte

400: JSON/tipo/UUID/query/clave desconocida inválidos; 401: identidad inválida.
403: recurso visible pero acción prohibida; 404: recurso ausente o invisible.
409: publicado no editable, congelación de ítems o conflicto concurrente definido.
422: pauta, IDs locales, fechas o destinatarios locales incompatibles con dominio.
IDs ajenos a tenant/curso o sección invisible: 404 uniforme, sin confirmar existencia.
413: JSON >4096 bytes; 415: contenido no JSON. Conservar ProblemFilter.
DB inaccesible 503, inesperado 500; no exponer SQL, body, pauta ni valores inválidos.
Éxitos/errores protegidos no-store; JSON inerte y nosniff existentes.
No imprimir request/response authoring en logs ni incluir pauta en snapshots.

## Sincronización de consumidores

Foundation actualiza solo operaciones/esquemas afectados, manteniendo las rutas
de intentos/notas como contratos futuros; no retirarlas ni afirmar implementación.
Agregar maxLength/rangos/readOnly coherentes; QuestionUpdate.id opcional conserva
identidad de PATCH y QuestionCreate excluye id; no duplicar tipos TypeScript manuales.
Precisar retry publicado antes de congelación y scopes en paths/quizzes.yaml.
Agregar sectionId opcional y nullable a QuizUpdate; documentar permiso en ambos scopes.
Regenerar frontend/src/lib/api/schema.d.ts con pnpm --dir frontend api:generate.
Pruebas de consumidor usan DTO seguro; no construir pantallas en esta misión.
