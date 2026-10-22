# Data Model: Rendición frontend de quizzes

Modelo de consumo/estado local; no tablas, migraciones ni cálculo académico nuevos.
Fuente: `docs/reference/openapi/components/schemas/quizzes.yaml`.

## Recursos confirmados

| Entidad | Campos y relaciones |
| --- | --- |
| Quiz seguro | id, courseId, sectionId nullable, title, instructions, opensAt/closesAt nullable, maxAttempts nullable, status, publishedAt, questions |
| Pregunta segura | UUID id, prompt, position, alternatives con id/text; points recibido no se muestra en rendición |
| Intento | UUID id/quizId/sectionId/studentId, attemptNumber positivo, startedAt, submittedAt/cancelledAt nullable, status, answers |
| Respuesta | questionId UUID, alternativeId string perteneciente a pregunta; máximo una selección por pregunta |
| Recibo | UUID id, status constante graded, submittedAt fecha válida; ningún campo de calificación |
| Scope local | generation, actor, slug, quizId/attemptId, curso derivado y permisos vigentes |

Intento no incluye courseId: derivarlo del quiz seguro autorizado. Sección del
intento es histórica e inmutable; no exigir que coincida con matrícula actual.
No exigir obtener sección histórica desde lista de secciones actuales para mostrar
un intento que el backend ya autorizó. Usar su UUID si no hay etiqueta disponible.

## Vistas y validaciones

- Adoptar tipos generados; parsers runtime validan UUID, fechas, número/estado,
  IDs esperados, campos permitidos y respuestas sin duplicados.
- Student: studentId debe ser identidad vigente; no grade/scorePercent/isCorrect/
  pointsAwarded, aun si son null. Nunca obtener pauta para responder.
- Staff: GET puede incluir grade/scorePercent/corrección según permisos. Proyectar
  solo identidad, sección histórica, estado y fechas para cancelación; no imprimir DTO.
- GET intento con status graded y submittedAt válido puede producir recibo seguro.
- inProgress: fechas terminales null; graded: submittedAt válido, cancelledAt null;
  cancelled: cancelledAt válido, submittedAt null. submitted es transitorio,
  sin controles de edición; no simular procesamiento/calificación local.
- Respuestas salientes contienen exclusivamente questionId/alternativeId dentro de
  `{answers:[...]}`. Sin studentId, nota, pauta ni campos derivados del cliente.
- Validar JSON serializado ≤4096 bytes UTF-8; alternativa ID es string, no UUID obligatorio.
- Relación alternativa/pregunta se valida con preguntas cargadas para editar;
  recibo/seguimiento terminal no depende de que ese detalle aún sea accesible.

## Estado local de respuestas

`confirmedAnswers` es último snapshot confirmado; `draftAnswers` es elección local.
Estados: pristine, dirty, saving, saved, error, uncertain; no confundirlos con status API.
Una operación activa conserva snapshot y scope. Durante saving se congela edición,
envío y cancelación. Éxito coincidente actualiza ambos snapshots; fallo conserva
borrador autorizado sin afirmar guardado. Vacío requiere confirmación de borrado.
Resultado incierto conserva snapshot y bloquea nuevas escrituras; consulta muestra
observación, sin asegurar que PUT tardío terminó. Sin control global entre clientes.

## Operaciones efímeras

| Operación | Identidad | Recuperación |
| --- | --- | --- |
| start | UUID key + actor/slug/quizId/sectionId | Repetir POST original; GET ID recibido antes de editar |
| save | Snapshot completo + intento/scope, sin clave API | No reenviar ni superponer snapshots tras timeout |
| submit | UUID key distinta de start + actor/slug/attemptId | GET estado o repetir solo POST original, sin PUT |
| cancel | attemptId/scope; idempotencia semántica sin header | GET o repetir POST cancel autorizado |

No singleton global ni almacenamiento persistente. Mantener claves mientras el
componente propietario esté montado; navegación/recarga puede perderlas. Informar
límite antes de abandonar operación incierta; no prometer recuperarlas tras login.
Un nuevo intento legítimo usa una nueva operación solo tras resolver la anterior;
409 no es autorización para rotar clave o destino.

## Transiciones académicas (backend)

- Sin intento → inProgress: POST start válido; máximo cuenta todos los iniciados.
- inProgress → inProgress: PUT reemplaza colección completa dentro de ventana.
- inProgress → submitted → graded: transacción submit y Grade/auditoría atómicos.
- inProgress → cancelled: cancelación explícita auditada; no genera calificación.
- Replay start devuelve creación histórica; no revierte transiciones actuales.
- Replay submit clave original devuelve recibo; cancel repetido devuelve 204.
- Cierre, logout o cambio de sección no cancelan ni envían automáticamente.
- Grade se decide por último graded según número y publicación backend; fuera de UI.
