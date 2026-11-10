# Tareas del curso

La [issue #249](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/249)
parte del libro de notas por grupos de la [issue #248](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/248).
La [issue #250](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/250)
cubrirá las entregas, S3, el registro de intentos, la corrección y las notas de tareas.

| Caso de uso | Actor y resultado | Trazabilidad |
| --- | --- | --- |
| CU-22 Gestionar tareas | Docente crea borradores, edita, publica y oculta tareas dentro de su alcance. | #249, integración de tareas y flujo académico, OpenAPI Assignments. |
| CU-23 Consultar tareas | Estudiante matriculado consulta tareas publicadas, por fecha o grupo, y abre su detalle. | #249, integración de tareas, comprobación de fechas y navegación responsive. |

## Alcance y visibilidad

- La sesión autoriza la institución y el curso. El backend consulta matrículas
  activas en la transacción y PostgreSQL aplica RLS por institución.
- Un docente de sección escribe en sus secciones. El docente que administra
  su propio curso puede escribir para todo el curso o cualquiera de sus secciones.
  Una edición de destinatarios exige autorización sobre el origen y el destino.
- El estudiante ve publicadas de todo el curso o de sus secciones activas.
  Puede leer instrucciones antes de la apertura y después del cierre.
  Ocultar una tarea retira el acceso estudiantil de inmediato.
- El historial registra creación, edición, publicación y ocultamiento con actor,
  curso, sección y cambios. La clave de idempotencia permite reintentos con el mismo cuerpo y
  está acotada a institución, curso y autor. El servidor genera el ID de la tarea. La versión protege contra ediciones concurrentes incompatibles.

## Fechas y configuración

La UI usa `America/Santiago` y la API recibe instantes UTC con sufijo `Z`.
El formulario rechaza una hora local inexistente y permite elegir la primera
o segunda ocurrencia de una hora repetida. Si se informan fechas, su orden es
apertura, entrega y cierre. Para crear o cambiar un plazo anterior al reloj del servidor se requiere
confirmación explícita. Editar otros campos conserva un plazo histórico
sin volver a pedir confirmación.

La apertura es inclusiva y el atraso comienza después del plazo. Se admite
un periodo de atraso cuando se define un cierre posterior. A falta de cierre
explícito, rige el plazo si existe. Una tarea sin ambos campos queda sin cierre.
Los formatos se guardan como extensiones normalizadas y el límite nulo de
intentos representa intentos ilimitados.

## Libro de notas

La primera evaluación de cada tipo registra un grupo predeterminado mediante
una clave estable. Si existe un grupo manual con el nombre convencional, se
adopta conservando su peso. El grupo inicial de un curso vacío recibe 100 %.
Los grupos nuevos de cursos con grupos existentes reciben 0 %. Renombrar un
grupo mantiene su identidad y sus evaluaciones. Se puede elegir otro grupo
al crear o editar una tarea o un quiz en borrador. Para quizzes publicados,
la reasignación usa la configuración auditada del libro.

Cada tarea tiene un ítem del libro de notas, incluso si vale 0 puntos. El
promedio considera únicamente notas publicadas. La migración agrega el nuevo
tipo de ítem sin convertir las notas históricas de quizzes. Cursos previos
con grupos por evaluación conservan ese cálculo hasta adoptar el modo por puntos.
