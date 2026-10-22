# Data Model: Autoría frontend de quizzes

Proyecciones del contrato existente; sin tablas, migraciones ni persistencia nueva.
Fuente: `docs/reference/openapi/components/schemas/quizzes.yaml` y
`backend/src/quizzes/quiz-validation.ts`.

## QuizSummary / QuizStudentView / QuizAuthoringView

| Campo | Regla |
| --- | --- |
| id, courseId | UUID backend inmutable; courseId debe coincidir con ruta frontend |
| sectionId | UUID de sección del curso o null para curso completo |
| title | No vacío/NUL, máximo 200 caracteres; normalización según backend |
| instructions | string o null, máximo 10000 caracteres, sin NUL; vacío permitido |
| opensAt, closesAt | date-time con zona o null; si ambos existen, apertura < cierre |
| maxAttempts | Entero 1..2147483647 o null ilimitado |
| status | draft o published; coherente con publishedAt |
| publishedAt | Timestamp backend o null; no editable |
| createdBy | Solo autoría, UUID backend, no editable ni permiso suficiente |
| questions | Ausente en resumen; segura sin isCorrect o autoría con isCorrect |

No usar createdBy del quiz como autorización: dominio usa docencia y dueño del curso.
Omisión en PATCH conserva valor; sectionId:null solicita todo el curso.
En POST omisión de sectionId significa curso completo; docente ordinario debe enviarlo.
Null de fechas significa sin límite; null de intentos significa ilimitados.
Formulario muestra zona local explícita y convierte cambios a ISO con zona;
fechas intactas retienen el string original para no perder precisión.

## Pregunta / Alternativa

| Campo | Regla |
| --- | --- |
| pregunta.id | UUID recibido; retener en PATCH; omitir en preguntas nuevas y POST |
| prompt | String no blanco ni NUL; sin límite adicional inventado |
| position | Entero 1..2147483647, único en quiz; enviar posiciones al reordenar |
| points | Finito >0, máximo 999999.99, hasta dos decimales |
| alternatives | Al menos dos; exactamente una isCorrect:true por pregunta |
| alternativa.id | String no blanco ni NUL, único dentro de pregunta; no exige UUID |
| alternativa.text | String no blanco ni NUL |
| alternativa.isCorrect | Booleano exclusivo de autoría/input, nunca vista segura |

UUID de pregunta suministrado en PATCH debe pertenecer a la colección existente.
Questions en PATCH reemplaza la colección completa; omitirla conserva pauta.
Suma de puntos en centésimas ≤99999999 (999999.99); no inventar máximos de cantidad.
Draft admite questions:[]; publicar exige al menos una pregunta válida.
Validar bytes UTF-8 de JSON.stringify(body) ≤4096 en cada escritura; caracteres
multibyte y escapes cuentan. No truncar entradas ni ampliar límite HTTP.
No enviar campos readOnly, propiedades desconocidas, NaN o Infinity.

## GradeItem de solo lectura

`id`, `courseId`, `quizId`, `title`, `weightPercent`, `createdAt`, según esquema
`docs/reference/openapi/components/schemas/grades.yaml`.
Relación única por tenant/quiz, creada transaccionalmente por publish; peso inicial 0.
Consultar lista institucional del curso y seleccionar por quizId; validar courseId.
El peso mostrado es el actual recibido, no una constante. Sin edición de notas.

## Estado local y transiciones

- Lista/detalle seguro → editor: cargar autoría solo con permiso sobre destino actual.
- Nuevo → draft confirmado por POST; respuesta perdida → incierto, envío bloqueado.
- Draft → draft por PATCH; formulario no autorizado/inválido no se envía.
- Draft guardado y válido → published por confirmación; backend crea GradeItem/evento.
- Published → published por publish repetido autorizado; mismo timestamp e ítem.
- Published → PATCH devuelve 409; no ofrecer unpublish/delete ni duplicación evasiva.
- Curso congelado → publish de draft 409; crear/editar draft sigue posible.
- Cambios locales pendientes → guardar antes de publicar; no publicar versión antigua.
- Pérdida de autorización → borrar pauta/formulario, revalidar contexto y descartar tardías.

Scope local: sesión/generation + slug + courseId + quizId + vista segura/autoría.
Datos privados no se guardan en storage, URL, caché global, logs o mensajes de error.
Validación/red conserva formulario solo mientras autorización siga vigente.
409 recarga estado sin mezclar versiones ni sobreescribir entradas silenciosamente.
No hay ETag: edición concurrente no ofrece garantía adicional a la API actual.

## Historia académica

Draft se sobrescribe con auditoría backend de metadata y contadores; sin pauta.
Publicado inmutable. Reasignación audita contexto de curso sin exponer origen.
Frontend no escribe auditoría, historial, resultados ni snapshots de intentos.
