# Contract: Revisión de intentos y auditoría

Fuentes: `docs/reference/openapi/paths/quizzes.yaml`, `paths/audit.yaml` y schemas
`quizzes.yaml`, `audit.yaml`, bajo `docs/reference/openapi/`.
Prefijo institucional: `/api/v1/institution/{institutionSlug}`.

## US2: Intentos

| Método/ruta bajo prefijo | Entrada | Respuesta |
| --- | --- | --- |
| GET /quizzes/{quizId}/attempts | sectionId?, studentId?, status?, cursor?, limit? | items, hasMore, nextCursor |
| GET /quiz-attempts/{attemptId} | Sin filtros | Vista autorizada del intento |

Status contractual: inProgress, submitted, graded, cancelled. Teacher admin dueño
con teacher activo abarca curso; teacher ordinario/assistant solo secciones activas
propias. Se verifica sección histórica del intento, no matrícula actual del alumno.

Campos comunes: id, quizId, sectionId, studentId, attemptNumber, startedAt,
submittedAt, cancelledAt, status, answers, scorePercent, grade. Staff recibe
scorePercent/grade nullable; teacher graded añade isCorrect/pointsAwarded a answers.
Assistant solo answers {questionId,alternativeId}, sin pauta/corrección ni escritura.
La vista estudiantil conserva prohibición de nota anticipada de misión 5.

GET detalle puede priorizar vista student propietario elegible en actores multirol;
el listado staff también puede limitar proyección propia. No exigir corrección
solo porque existe teacher en otra sección ni reconstruir campos ausentes.
Validar relaciones quiz/curso/ruta y renderizar únicamente representación permitida.
No solicitar endpoint de pauta desde la vista assistant.

El parser actual `attemptDto(...,{staff:true})` descarta answers y score/grade:
crear parser académico específico en `frontend/src/lib/attempts/review.ts`, reusando
validadores básicos. Mantener estricto el parser de rendición y sus callers.
Extender `frontend/src/lib/api/attempts.ts` con listado/lectura de revisión sin
cambiar comportamiento de getAttempt para misión 5.

Rutas UI: `/courses/{courseId}/quizzes/{quizId}/attempts` y
`/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}`. Desde libro enlazar por
GradeItem.quizId + Grade.attemptId. Enlace a `/attempts/{attemptId}` para cancelar
solo si permisos actuales lo autorizan; flujo y confirmación pertenecen a misión 5.

## US4: Auditoría de curso

`GET /courses/{courseId}/audit-events` retorna `{items,hasMore,nextCursor}`.
Filtros exactos: action (≤64), resourceType (≤32), resourceId UUID, actorUserId UUID,
sectionId UUID, from/to, cursor y limit. Fechas UTC
`YYYY-MM-DDTHH:mm:ss[.1–6 dígitos]Z`, inclusivas; from≤to. Convertir fecha local
antes de enviar. No usar ejemplos OpenAPI de action como enum cerrado: acciones
reales incluyen `gradebook.weightsUpdated`, `grade.published`, `attempt.graded`.

Evento: id, institutionId, actorUserId nullable, action, resourceType, resourceId,
courseId nullable, sectionId nullable, occurredAt, changes {before?,after?}.
En este endpoint validar institución/curso esperado. Admin dueño accede al curso
completo sin teacher, incluidos eventos sectionId=null. Otro teacher solo secciones
propias; assistant/student aislados no acceden. Superadmin aislado tampoco.

Snapshots ya sanitizados al escribir/leer. Renderizar texto escapado con etiquetas
antes/después, sin HTML, credenciales, claves, answers, isCorrect o pointsAwarded.
No reconstruir ausencias ni derivar permisos desde historia. No hay mutaciones,
exportación ni auditoría institucional en esta misión.

## Paginación, estados y sesión

Cursores opacos ≤4096, ligados a actor/tenant/recurso/filtros; limit 1–100, default20.
Nunca construir, decodificar para autorizar ni reutilizar cursor en otro contexto.
Cambio de sección/quiz/filtro/actor inicia primera página y limpia selección.
Página vacía final es válida; no confundir error con ausencia de resultados.

Scope incluye generación de sesión y permisos vigentes. Descarta respuestas tardías
sin conservar filas ajenas. 401/logout/expiración limpia datos; 403/404 limpia y
revalida contexto. Distinguir 400/409/422/503/red con estados comunes existentes.
Tablas con caption/th/scope, cifras tabulares, foco y controles etiquetados;
confirmaciones anunciadas, teclado, 375 px, ambos temas y reduced motion.
