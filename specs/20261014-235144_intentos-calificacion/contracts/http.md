# HTTP: Intentos y calificación

Base `/api/v1/institutions/{institutionSlug}`; Bearer obligatorio.
Mantener operationIds y rutas OpenAPI actuales; JSON estricto y no-store.
Slug/UUID según validadores existentes; body con campos desconocidos → 400.

## Operaciones

| Método/ruta relativa | operationId | Éxito |
| --- | --- | --- |
| POST /sections/{sectionId}/quizzes/{quizId}/attempts | startQuizAttempt | 201 + Location + StudentView |
| GET /quiz-attempts/{attemptId} | getQuizAttempt | 200 + vista autorizada |
| PUT /quiz-attempts/{attemptId}/answers | saveQuizAttemptAnswers | 200 + StudentView |
| POST /quiz-attempts/{attemptId}/cancel | cancelQuizAttempt | 204 |
| POST /quiz-attempts/{attemptId}/submit | submitQuizAttempt | 200 + recibo |

GET permite reanudar a partir de ID obtenido al iniciar; no añadir endpoint de
búsqueda ni persistencia de sesión. Listado académico existente queda para notas.

## Inicio

Sin body; aceptar vacío o {} y rechazar otros campos. Idempotency-Key requerida,
1..200 caracteres, sin controles ni headers duplicados. Scope: tenant+actor+
operación start. Persistir start_key y comparar quizId/sectionId al reutilizarla.
Igual clave/destino: 201 con Location y representación original de creación
(reconstruir id, contexto/número/startedAt, status inProgress, answers [], fechas
terminales NULL), aunque después cambie estado. GET devuelve estado vigente.
Revalidar identidad, membership, propiedad/acceso estudiantil y pauta en replay;
no volver a evaluar máximo/ventana/nota publicada para repetir éxito confirmado.
Clave de otro destino → 409. Clave distinta con activo previo → 409.

Nuevo inicio exige publicación, destinatarios, sección student activa, ventana,
máximo no alcanzado, ningún activo ni Grade publicada del quiz/estudiante.
Derivar studentId desde request.userId; no recibir actor, curso ni número del cliente.

## Guardado

Body exacto `{answers:[{questionId,alternativeId}]}`. PUT reemplaza conjunto completo;
[] borra respuestas en progreso. IDs pregunta UUID y alternativa string existente,
únicos por pregunta, pertenecientes al quiz/pregunta. Respuesta omitida aporta cero.
Rechazar IDs ajenos con 422 genérico sin revelar su dueño; estructura/duplicados 400.
No aceptar respuestas corregidas ni puntajes. Límite HTTP existente aplica;
cantidad de respuestas no excede preguntas; alternativeId válido en pauta.
Revalidar permisos, inProgress, ventana y nota no publicada tras locks.
Save idéntico es no-op sin auditoría nueva. Estado terminal → 409 sin mutación.

## Cancelación

Sin body o {}; propietario habilitado o teacher autorizado de sección histórica.
No exige ventana. inProgress → cancelled, fija cancelledAt; consume intento,
conserva answers y Grade previa. Repetir cancelled → 204 sin nuevo evento.
graded/submitted → 409. Assistant nunca cancela por capacidad de seguimiento.

## Envío

Sin body o {}; califica solo answers guardadas. Idempotency-Key requerida con
misma validación; scope tenant+actor+operación submit, diferente del scope start.
Clave usada en otro intento → 409. graded propio ya confirmado devuelve el mismo
recibo solo con su submit_key original; cualquier otra clave produce 409 sin
registrarla ni mutar resultado/eventos. Validar permisos vigentes antes de replay;
no exigir ventana ni Grade no publicada en no-op.
Primer envío exige inProgress, ventana y Grade no publicada; cancelled → 409.

Recibo exacto `{id,status:"graded",submittedAt}`: sin score ni nota. En tx:
inmovilizar respuestas → submitted → corregir → graded → insertar/actualizar Grade
si attempt_number es mayor al vigente → eventos → COMMIT. Cualquier fallo revierte.
No devolver submitted ni confirmar respuesta antes del COMMIT.

## Vistas y errores

GET usa StudentView/AcademicView/AssistantView según
[authorization.md](authorization.md). Añadir QuizAttemptAssistantView y su rama
al anyOf GET, reemplazando el oneOf actual, sin cambiar DTO student. Las vistas
docente/ayudante pueden coincidir sin corrección (por ejemplo answers [] y
resultados NULL); anyOf admite ese solapamiento. Sin exponer claves persistidas.

Errores compartidos: 400 entrada/header inválido; 401 identidad; 403 acción visible
prohibida; 404 contexto/recurso invisible; 409 estado, ventana, máximo o clave;
422 relación de respuestas inválida; 503 DB no disponible; 500 fallo interno.
Usar ProblemFilter y límites de main existentes, sin detalles de pauta/SQL.

Actualizar docs/reference/openapi/paths/quizzes.yaml con ventana, replays y scope;
components/schemas/quizzes.yaml con AssistantView y anyOf GET. En esta misión no
implementar listQuizAttempts; su integración con AssistantView queda en notas.
Regenerar frontend/src/lib/api/schema.d.ts y probar consumidor con recibo exacto,
403/404/409 y vistas que no contienen campos de corrección estudiantil.
