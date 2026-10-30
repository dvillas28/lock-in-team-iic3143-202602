# Matriz de errores y recuperación

Fuente: [ProblemFilter](../../../backend/src/http/problem.filter.ts),
[main/parser](../../../backend/src/main.ts), [transacciones](../../../backend/src/database/tenant-transaction.ts),
[OpenAPI por operación](../audit/API.md), [feedback cliente](../../../frontend/src/lib/route-feedback.ts).
No asumir422 para toda validación ni403 para toda invisibilidad. Usar body/UUID válidos al probar permisos.

| Resultado | Disparador reproducible | API / UI / persistencia esperadas | Casos |
| --- | --- | --- | --- |
|400 BAD_REQUEST |Shape/campo extra, UUID/slug/cursor inválido, límite1..100, fecha imposible |Problem; error local; sin cambio. login errors solo campos allowlist | AUTH-006; ENROLL-015; AUDIT-006 |
|401 UNAUTHORIZED |Sin Bearer, firma/claims/exp/User inactivo |WWW-Authenticate Bearer; sesión limpia en privados; mensaje genérico login | AUTH-003/017/018; NETWORK-001 |
|403 FORBIDDEN |Recurso visible y rol insuficiente |Sin datos extra; error local, me revalida; no logout si contexto sigue válido | RBAC-005/006; NETWORK-002 |
|404 RESOURCE_NOT_FOUND |Tenant no accesible, UUID ajeno/inexistente, draft oculto |Mismo mensaje genérico invisible/inexistente; sin enumeración ni cambios | TENANT-001/008; CONTENT-009 |
|409 CONFLICT |Activo previo, límite/ventana, draft/publicación incompatible, duplicado natural |Estado anterior conservado; no reintento ciego; clave no reservada por fallo | ATTEMPT-005/007; COURSE-007 |
|409 GRADE_WEIGHTS_LOCKED |PUTweights tras primera nota publicada, incluso no-op |Aviso específico bloqueo; refrescar lock; no cambio | GRADE-017/019 |
|409 GRADE_ALREADY_PUBLISHED |Publicar de nuevo Grade con keynueva |No sobrescribe timestamp/nota; corregir selección | GRADE-027/030 |
|409 IDEMPOTENCY_CONFLICT |Misma key/actor/tenant otra selección/curso autorizado |Receipt no reapropiado; cuerpo original no cambia | GRADE-026 |
|422 UNPROCESSABLE_ENTITY |TítuloMarkdown/puntos/posición inválidos, pauta semántica, pesos incompletos/suma |Error de regla; no cambio parcial; formulario conserva draft | CONTENT-005/011; QUIZ-008; GRADE-015 |
|413 PAYLOAD_TOO_LARGE |JSON>4096bytes UTF-8 |Problema de tamaño; no truncar ni guardar parcial | QUIZ-012; NETWORK-010 |
|415 UNSUPPORTED_MEDIA_TYPE |Content-type/encoding no aceptado en body |Rechazo sin mutación; aplicación exige JSON, no upload | AUTH-006; NETWORK-010 |
|429 TOO_MANY_REQUESTS |Sexto login por IP en60s |Retry-After; contador UI; sin auto-login ni bucle | AUTH-007 |
|500 INTERNAL_ERROR |Error inesperado en clon aislado o respuesta inyectada solo UX |Sanitizado; lectura reintentable; write incierto exige reconciliar, no éxito | NETWORK-005/012; OPS-007 |
|503 SERVICE_UNAVAILABLE |Caída/errores reconocidos DB, AuthService dependencias |ready tiene shape especial status unavailable; privadoProblem; sin éxito parcial | OPS-002; NETWORK-003 |
|Timeout cliente |Request privado>15s |Abort/red, sin status HTTP inventado; GET recuperable; write incierto | NETWORK-006; GRADE-029 |
|Conexión/offline |Networkabort/desconexión |Error seguro; recuperar explícito; no cache como autoridad | NETWORK-007; ATTEMPT-016 |
|200 body inválido |Fault inyectado DTO shape/parent incoherente |ApiResponseError, no tratar lista vacía o éxito; retry permitido | NETWORK-004; TENANT-012 |

## Aserciones comunes

- En privados error: content-type application/problem+json, status igual HTTP, code allowlist,
  instance solo path sin query, traceId UUID, Cache-Control no-store, errors seguros.
- `GET /ready`503 devuelve `{status:unavailable}`, no Problem; health no garantiza base lista.
- No SQL, stacks, password/hash/token/Authorization, body de request ni datos de otro tenant en respuesta/log.
- Distinguir fallo antes de commit de respuesta perdida después; un500/timeout observado no demuestra rollback.
- Ante4xx determinista no enviar repetición automática; submit/cancel pueden conservar recuperación explícita
  según operación frontend. Ante incertidumbre preservar cuerpo/key/actor y consultar sin inventar éxito.
- Validar snapshots y eventos tras rechazos, no solo status o texto. Auditoría y operación deben compartir commit.

## Diferencias contractuales y pendientes

El inventario lista códigos declarados de cada operación;500/503 sí son parte de varios contratos,
no significa que todos los fallos DB den el mismo código. SQL23505→409;23514/23503→422;
fallos de conexión reconocidos→503; otros inesperados500. NUL metadatos Q02 requiere contrato explícito.
413/415 son posibles por parser global pero no se declaran en cada path: D09/FINDINGS, sin editarOpenAPI.
405 no es promesa del MVP: rutas DELETE inexistentes pueden devolver404 por framework; no fijar405.
408/504 no se inventan para timeout cliente; proxy HTTP externo no forma parte baseline local.
No hacer fault injection por mock sistemático de todaAPI. Cada error UX simulado registra alcance y
se complementa con al menos un caso backend real (caídaDB/validaciones/permisos/atomicidad) pertinente.
