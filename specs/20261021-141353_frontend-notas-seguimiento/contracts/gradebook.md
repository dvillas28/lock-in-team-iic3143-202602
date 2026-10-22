# Contract: Notas, libro, pesos y publicación

Fuente normativa: `docs/reference/openapi/paths/gradebook.yaml` y
`docs/reference/openapi/components/schemas/grades.yaml`. Sin cambios al contrato.
Prefijo: `/api/v1/institution/{institutionSlug}/courses/{courseId}`.
Session.request aplica identidad vigente; frontend valida slug/UUID y relaciones.

## Operaciones

| Historia | Método/ruta bajo prefijo | Entrada | Salida 200 |
| --- | --- | --- | --- |
| US1 | GET /my-grades | Sin query, sin studentId | StudentGradesResponse |
| US2/US3 | GET /grade-items | Sin filtros | items GradeItem[], totalWeightPercent |
| US2/US3 | GET /gradebook | sectionId?, cursor?, limit? | courseId, items, hasMore, nextCursor |
| US3 | PUT /gradebook/weights | items [{gradeItemId,weightPercent}] | items, totalWeightPercent=100 |
| US3 | POST /gradebook/publications | gradeItemIds, sectionIds, studentIds; Idempotency-Key | publishedCount, publishedAt |

## Capacidades

| Operación | Student | Assistant | Teacher sección | Teacher admin dueño | Admin dueño sin teacher |
| --- | --- | --- | --- | --- | --- |
| my-grades | Propias | Solo si también student | Solo si también student | Solo si también student | No |
| grade-items | No | Lectura | Lectura | Lectura | No |
| gradebook | No | Secciones propias | Secciones propias | Curso | No |
| weights | No | No | No | Curso | No |
| publications | No | No | Secciones propias | Curso | No |

Cada celda se evalúa por roles actuales, institución activa y curso; un actor
multirol suma permisos por operación, sin convertir capacidad admin en teacher.

## Lecturas

StudentGradesResponse conserva courseId, items publicados, partialAverage nullable,
publishedWeightPercent e isPartial. Nunca completar notas mediante GET intento,
libro o cálculo local. Mostrar pendiente cuando null, incluido peso cero.

Libro conserva student, sectionId histórico, grades, partialAverage y peso publicado.
No es nómina completa: filas requieren al menos una Grade. Una misma persona puede
ocupar varias filas históricas. No sustituir por matrícula actual ni ocultar revocados.
Validar clave compuesta, IDs de notas y relaciones; helpers list/page que exigen
id por fila no son aplicables directamente. Páginas usan cursor opaco del backend,
limit 1–100 (20 por defecto), reiniciado ante cambio de actor/tenant/sección.

## Pesos

Colección completa única, ≥1 ítem, valores numéricos 0–100 con ≤2 decimales y suma
exacta 100. Validar texto decimal mediante centésimas enteras, convertir a número
solo en payload. No redondear silenciosamente ni usar suma float para validación.
Guardar colección devuelta tras éxito; no mostrar borrador como persistido.

No hay campo público de freeze: owner teacher recorre libro global hasta hallar
publishedAt o agotar páginas. Estado desconocido impide guardar; un fallo mantiene
ese estado. Recibo confirmado, cualquier nota publicada o GRADE_WEIGHTS_LOCKED
bloquea incluso no-op. Una escritura concurrente se resuelve mediante 409.
PUT con resultado incierto exige conciliación explícita por lectura; no reintentar
silenciosamente ni afirmar que una lectura prueba ausencia de escritura en vuelo.

## Publicación explícita e idempotente

1. Seleccionar UUID únicos no vacíos; normalizar minúsculas y ordenar cada lista.
   UI elige rectángulo ítems×estudiantes; sectionIds contiene cada sección histórica.
   No seleccionar automáticamente alumnos/páginas no revisadas.
2. Resumen previo: evaluaciones, secciones, estudiantes y cantidad esperada de notas
   = número de ítems×número de estudiantes. Pares ausentes/ya publicados impiden
   confirmar; no enviar selección dispersa como si el backend la aceptara.
3. Backend exige pesos=100, Grade del último intento graded y ningún intento activo
   para estudiantes/quizzes seleccionados, incluso de otra sección. Cancelled no
   bloquea ni produce nota. Ningún error cancela intentos ni publica parte del lote.
4. Generar clave estable por operación; enviar header Idempotency-Key con selección
   canónica. Durante envío/incierto bloquear cambios y doble envío; repetir solo
   POST exacto, misma clave, mismo curso, identidad y tenant vigentes.
5. 200 confirma únicamente recibo publishedCount/publishedAt; refrescar libro/pesos.
   La respuesta puede ser replay original; no duplicar mensaje de nueva publicación.
6. Red/timeout/5xx o respuesta ilegible puede dejar resultado incierto. GET publicado
   describe estado actual, no atribuye recibo perdido. GET sin publicar tampoco
   demuestra fallo definitivo de POST en vuelo. Sin clave tras recarga, consultar
   y explicar límite; nunca POST automático ni nueva clave para eludir conflicto.
7. 409 IDEMPOTENCY_CONFLICT exige revisar operación; GRADE_ALREADY_PUBLISHED no
   sobrescribe nota. GRADE_WEIGHTS_LOCKED bloquea pesos. Sin éxito optimista.

## Errores y seguridad

400 entrada/cursor inválido; 401 limpia sesión; 403/404 limpia datos y revalida
contexto; 409 conflicto; 422 colección/suma inválida; 503/red indisponibilidad.
Usar mensajes propios según código conocido, sin exponer problem.detail ni snapshots
en errores. No guardar resultados, selección, claves o credenciales en storage/URL.
Respuestas privadas no-store; descartar respuestas tardías al cambiar scope.
