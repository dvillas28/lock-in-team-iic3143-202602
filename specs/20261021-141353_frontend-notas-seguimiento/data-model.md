# Data Model: Notas y seguimiento frontend

Modelos de lectura/comandos derivados de OpenAPI. Sin entidades SQL ni migraciones.
Tipos se importan de `frontend/src/lib/api/schema.d.ts`; parsers validan relaciones.

## GradeItem y pesos (US2/US3)

- GradeItem: id, courseId, quizId UUID; title; weightPercent 0–100; createdAt.
- ListResponse: items, totalWeightPercent. Sin campo de freeze público.
- PUT: items completos `{gradeItemId, weightPercent}`, únicos y no vacíos;
  hasta dos decimales. Suma en centésimas enteras=10000; cero individual permitido.
- Estado local de freeze: unknown → unlocked tras agotar libro global sin publicadas;
  unknown/unlocked → locked ante cualquier publishedAt, recibo o conflicto de freeze.
  Nunca volver a unlocked por refrescar una página parcial o filtrada.

## Notas propias (US1)

- StudentGradesResponse: courseId, items, partialAverage number|null,
  publishedWeightPercent 0–100, isPartial boolean.
- Item: gradeItemId, title, weightPercent, scorePercent 0–100, grade 1–7,
  publishedAt no nulo. Identidad estudiante deriva de sesión, sin studentId enviado.
- Promedio/peso/isPartial se muestran como backend; null no equivale a cero.
  También puede haber items publicados con peso cero y partialAverage null.

## Seguimiento histórico (US2)

- GradebookResponse: courseId, items, hasMore, nextCursor string|null.
- Fila: student {id,name,email,active}, sectionId, grades, partialAverage,
  publishedWeightPercent. Clave compuesta student.id/sectionId; no tiene id de fila.
- Grade: id, gradeItemId, studentId, sectionId, attemptId, scorePercent, grade,
  publishedAt nullable. Validar studentId/sección contra fila y gradeItemId conocido.
- Staff puede ver notas no publicadas autorizadas; promedio incluye solo publicadas.
- No inferir Enrollment vigente del destinatario; sectionId pertenece a historia.

## Intentos (US2)

- Identidad común: id, quizId, studentId, sectionId, attemptNumber y timestamps;
  status inProgress|submitted|graded|cancelled. Grade referencia attemptId.
- Teacher: representación académica con answers y corrección autorizada;
  staff/assistant: answers de consulta sin isCorrect/pointsAwarded ni pauta.
- No derivar teacher desde presencia de campos. Seleccionar vista por permisos
  actuales y sección histórica; verificar quiz/curso de la ruta con GET seguro.
- Lectura no muta; enlace a cancelación solo para teacher autorizado por misión 5.

## PublicationOperation (US3, solo memoria)

- scope: generation, slug, actor, courseId y permisos vigentes.
- request: gradeItemIds[], sectionIds[], studentIds[], UUID únicos/no vacíos,
  ordenados. Elegir explícitamente sin incluir páginas no seleccionadas.
- key: opaca estable para scope/request; header Idempotency-Key.
- state: editing → confirming → sending → confirmed|uncertain|rejected.
- sending/uncertain inmovilizan request/key y bloquean nueva publicación;
  replay autorizado conserva ambos. 409 no confirma ni rota clave.
- receipt: publishedCount entero ≥1, publishedAt backend; no contiene notas.
- Reset por logout/401/expiración/contexto; abandonar/recargar pierde replay.
  Consulta posterior describe estado actual sin atribuir recibo original.

## AuditEvent y filtros (US4)

- id, institutionId, actorUserId nullable, action, resourceType, resourceId,
  courseId nullable, sectionId nullable, occurredAt, changes {before?,after?}.
- Ruta de curso exige courseId esperado e institución actual en respuesta.
- Snapshots son sanitizados y de solo lectura; mostrar como texto escapado,
  sin interpretar HTML ni restaurar campos ausentes. Nunca fuente de autorización.
- Filtros: action ≤64, resourceType ≤32, resourceId, actorUserId, sectionId,
  from/to date-time; cursor opaco, limit 1–100. Validar rango temporal.
- Eventos institucionales excluidos; null sectionId permitido solo al alcance owner.

## Estado transversal

Scope = generation/slug/actor/curso/quiz/sección/filtros. Cambio reinicia cursor,
páginas y selección; respuestas tardías se descartan. Sin persistencia privada.
Carga, vacío, error, denegado, conflicto e incertidumbre son estados distintos.
Revalidar roles tras denegación; 403/404 no conservan datos privados visibles.
