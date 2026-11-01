# Quizzes: publicación e historial de intentos

## Publicación docente

El editor coloca «Guardar borrador» y «Publicar quiz» en una barra superior
que permanece visible durante el desplazamiento. Publicar es la acción principal.
El botón de guardado está asociado al formulario mediante su atributo `form`.

Publicar requiere una versión guardada con preguntas y ninguna operación
pendiente. Si hay cambios locales se explica que deben guardarse primero.
El diálogo conserva confirmación explícita, foco inicial en «Volver», Escape
y retorno del foco al botón. La publicación sigue dejando el quiz inmutable.
No cambian autorización, auditoría ni reglas de congelamiento del curso.

## Recorrido del estudiante

En el detalle del quiz, «Mis intentos» reemplaza la recuperación manual por ID.
El detalle muestra «Preguntas ocultas»: el estudiante no recibe preguntas ni
alternativas desde el GET general del quiz, aun si ya tiene un intento activo.
Solo `GET /api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}/questions`
las entrega al dueño de un intento en progreso, sin pauta y revalidando permisos.
El listado muestra número, estado, sección histórica y fechas, del más reciente
al más antiguo. Las páginas permiten consultar todo el historial autorizado.

- «Continuar intento» abre el intento propio en progreso, incluso cuando no
  está incluido en la página actual.
- «Ver detalle» abre un intento finalizado o cancelado, conservando su historia.
- «Iniciar nuevo intento» aparece cuando el servidor informa disponibilidad.
- Una sola sección se selecciona automáticamente; varias requieren elección.
- Fechas, máximo agotado, intento activo o notas publicadas explican el bloqueo.
- Mientras la consulta carga o falla no se ofrece iniciar un intento nuevo.
- «Actualizar intentos» permite refrescar disponibilidad tras cambios externos.

Las notas publicadas siguen consultándose desde calificaciones. El historial
no expone notas, puntajes ni corrección, tampoco para identidades multirol.
No se almacenan IDs, respuestas, claves ni historial en almacenamiento persistente
del navegador. La recuperación de un inicio incierto conserva su clave en memoria.

## Contrato y aislamiento

`GET /api/v1/institution/{institutionSlug}/quizzes/{quizId}/my-attempts`
acepta únicamente `cursor` y `limit`. El usuario se deriva de la sesión,
con institución y matrícula activa en el destino del quiz. Acceso docente a la
pauta impide el recorrido de estudiante para ese quiz.

La respuesta contiene `items`, `hasMore`, `nextCursor` y `availability`:
`canStart`, `reason`, `remainingAttempts` y `activeAttemptId`.
La disponibilidad considera el historial completo y el reloj del servidor.
El cursor pertenece al actor, institución y quiz; cada petición revalida permisos.
El listado docente existente mantiene su autorización y representación propias.

La consulta no escribe: no hay migraciones, nuevas tablas ni cambios de historial.
El endpoint de inicio mantiene sus validaciones transaccionales; una carrera
puede invalidar la disponibilidad observada y se resuelve consultando de nuevo.

## Verificación

Pruebas frontend cubren reanudación, paginación, carga/error, cambio de actor,
bloqueos, rechazo de datos ajenos o corrección, y guardado/publicación superior.
Pruebas backend cubren proyección segura, filtros de actor/tenant, cursor,
permisos y disponibilidad. La integración HTTP usa exclusivamente la base
`_test` con credenciales operativa/runtime separadas; requiere PostgreSQL 17/18.
