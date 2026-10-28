# Contract: Rendición y cancelación de intentos

Fuente normativa: `docs/reference/openapi/paths/quizzes.yaml` y
`docs/reference/openapi/components/schemas/quizzes.yaml`; no modificar API.
Base `B = /api/v1/institution/{institutionSlug}`. Bearer por Session.request;
slug solicitado desde dominio, autorizado por backend. Sin caché privada persistente.

## Operaciones consumidas

| Operación | HTTP relativo a B | Request | Éxito |
| --- | --- | --- | --- |
| listCourseQuizzes | GET /courses/{courseId}/quizzes | sectionId opcional existente | 200 items seguros |
| getQuiz | GET /quizzes/{quizId} | Sin cuerpo; nunca /authoring | 200 vista segura con courseId |
| startQuizAttempt | POST /sections/{sectionId}/quizzes/{quizId}/attempts | Sin cuerpo; Idempotency-Key | 201 intento de creación |
| getQuizAttempt | GET /quiz-attempts/{attemptId} | Sin cuerpo | 200 vista autorizada |
| saveQuizAttemptAnswers | PUT /quiz-attempts/{attemptId}/answers | answers completo | 200 intento student |
| submitQuizAttempt | POST /quiz-attempts/{attemptId}/submit | Sin cuerpo; Idempotency-Key | 200 recibo |
| cancelQuizAttempt | POST /quiz-attempts/{attemptId}/cancel | Sin cuerpo; sin clave requerida | 204 sin contenido |

Identidades de usuario/calificación nunca van en request. JSON ≤4096 bytes UTF-8;
claves 1–200 caracteres sin controles/duplicados; usar crypto.randomUUID existente.
Sin endpoint de búsqueda propia ni nuevo listado docente en esta misión.

## Inicio y contexto

- Elegir sección desde enrollments student activos del curso compatibles con quiz;
  no adivinar destino si existe más de una opción. Pauta incompatible bloquea rendición.
- Una operación pendiente conserva exactamente destino y clave, incluso tras red/503.
- Replay start puede devolver inProgress/answers [] históricos tras cancelación o
  calificación. Validar ID y destino; GET actual antes de habilitar cualquier edición.
- Sin ID recibido se puede recuperar repitiendo POST original mientras exista clave.
  Si se pierde clave e ID tras recarga, mostrar límite sin crear otro intento por defecto.
- Ruta `/attempts/{UUID}`: GET intento primero, GET quiz por quizId para courseId;
  no aceptar courseId de query/storage como fuente de autorización.

## Guardado y envío

- PUT reemplaza colección completa; [] borra, exigir intención explícita.
  Rechazar IDs ajenos/duplicados en cliente y manejar rechazo backend real.
- Serializar mutaciones por intento en documento. Congelar elecciones durante
  guardado/envío; no autosave ni actualización silenciosa por respuestas tardías.
- Confirmar envío con snapshot actual; si dirty, PUT y validar confirmación antes de
  submit. Si PUT falla o queda incierto, no POST submit ni nuevo PUT competidor.
- Submit usa clave independiente de inicio. Una vez enviado POST, conservar identidad
  y bloquear edición aunque se pierda respuesta; replay solo POST con misma clave.
- GET graded permite reconstruir recibo mínimo; GET inProgress no prueba que una
  operación en vuelo fracasó. Cancelled es terminal, no recibo de envío.
- 409 no cambia claves ni fuerza éxito; revalidar estado sin sobrescribir borrador.
- Recibo contiene solo id/status/submittedAt. No nota, porcentaje, puntaje ni pauta;
  nota publicada se consulta en misión 6. No autocalificar ni autoenviar por cierre.

## Cancelación

- Acceso desde intento conocido para propietario student sin pauta o teacher con
  alcance sobre sección histórica, ampliado por isAdmin + ownership + teacher.
- Assistant, admin institucional aislado y teacher ajeno no cancelan.
- Confirmar: consume intento del máximo, no genera nota, no sustituye graded para
  publicar. Fuera de ventana permitido; teacher no depende de student vigente.
- 204 confirma éxito/repetición, no intentar parsear JSON. GET fecha si disponible;
  lectura fallida no convierte 204 confirmado en fracaso.
- Timeout mantiene incertidumbre; GET/repetir POST cancel autorizado. No permitir
  cancelación mientras save/submit tenga resultado incierto en el mismo documento.

## Errores, sesión y accesibilidad

| Caso | Comportamiento |
| --- | --- |
| 400/415/422 | Mensaje seguro de formato/valores; conservar entradas autorizadas |
| 401 | Sesión limpia; retorno login local validado hacia ID conocido |
| 403/404 | Recurso no disponible; limpiar datos privados y revalidar contexto |
| 409 | Rechazo/conflicto; no adjudicar causa única ni rotar clave |
| 413 | Explicar límite UTF-8; no enviar/calificar |
| 503/red/timeout/respuesta inválida | Resultado posiblemente aplicado; conservar operación, consultar sin afirmar éxito |
| Logout/expiración/cambio de scope | Limpiar respuestas y claves, descartar completions anteriores |

Retorno login acepta `/attempts/{UUID}` exacto; rechaza esquema, host, query/hash,
backslash y codificación extra; conservar allowlist anterior. Sin tokens en URL.
Alternativas usan fieldset/legend/radio/labels; estado de guardado aria-live.
Diálogos con foco inicial seguro, Escape y retorno de foco. Teclado completo,
375 px, ambos temas y reduced motion conforme DESIGN.md; Lucide y tokens existentes.
