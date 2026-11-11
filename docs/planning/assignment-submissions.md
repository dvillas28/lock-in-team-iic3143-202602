# Entregas y calificación de Tareas

Tercera entrega del flujo de Tareas. Depende de los grupos, publicación y
revisiones de #248 y de la autoría, visibilidad y calendario de #249.
[Issue #250](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/250)

| Caso de uso | Actor | Resultado |
| --- | --- | --- |
| CU-24 Realizar entregas | Estudiante con matrícula activa | Registra un intento, recibe comprobante y consulta su historial y nota publicada. |
| CU-25 Revisar y calificar entregas | Docente autorizado | Revisa evidencias por intento, guarda borradores, publica una selección y corrige notas con auditoría. |

## CU-24 · Realizar entregas

1. Abrir una tarea publicada. Consultar condiciones, plazo, cierre e intentos
   restantes. En una tarea transversal con varias matrículas, elegir la
   sección para este intento.
2. Escribir la respuesta, adjuntar archivos, o combinar ambos según la
   configuración. La categoría de formatos Texto representa `.txt` y
   `.csv`. El editor admite negrita, cursiva, listas, párrafos y saltos.
   El límite de texto es 10.000 caracteres. El backend valida contenido y
   el renderizador de Markdown usa elementos permitidos y escapa HTML.
3. Confirmar. Se exige al menos un contenido habilitado. Se admiten hasta
   5 archivos de 10 MiB cada uno, sujetos también a los límites académicos por
   tipo. Una respuesta o un archivo basta en la modalidad combinada.
4. Consultar número de intento, fecha, atraso y evidencia. El reloj de la
   base determina la apertura y el cierre. El instante exacto de cada
   límite está incluido y solo los envíos posteriores a la fecha de entrega
   se marcan como atrasados. Un cierre nulo mantiene la recepción abierta.
   La interfaz muestra fechas en `America/Santiago`.
5. La clave de envío y la cantidad esperada de intentos evitan duplicados.
   La transacción del curso vuelve a validar condiciones después de cargar.
   PostgreSQL conserva intentos y archivos de forma inmutable. Los datos
   anteriores sin respuesta escrita mantienen sus formatos; una lista
   histórica vacía admite formatos académicos soportados.

## CU-25 · Revisar y calificar

1. Consultar el estado por estudiante y sección, abrir una revisión y elegir
   un intento. La docencia activa habilita las secciones propias. El dueño
   con administración vigente y docencia activa tiene alcance de curso.
   Un docente no puede calificarse a sí mismo.
2. Revisar los archivos y la respuesta escrita. Guardar puntaje desde cero
   hasta el máximo, con retroalimentación opcional. El borrador queda ligado
   al intento y es visible para docentes autorizados.
3. Seleccionar uno o varios borradores y confirmar la publicación. La
   selección y cada versión se validan atómicamente. Cada nota pasa al libro
   y aparece en el detalle estudiantil con su retroalimentación.
4. Corregir desde la revisión de la tarea. Una revisión con motivo puede
   asociarse a otro intento de la misma sección histórica. Se conservan el
   resultado anterior, el nuevo, el autor, el instante y ambas asociaciones
   a evidencia. Un nuevo intento por sí solo no modifica la nota publicada.

Las tareas de 0 puntos se pueden registrar y publicar con retroalimentación.
Se muestran sin porcentaje ni nota numérica y quedan fuera del promedio.
El máximo queda fijo al guardar la primera calificación. La sección
destinataria queda fija al recibir el primer intento. En caso de traslado
de sección, la calificación ya registrada conserva su sección histórica.

## Trazabilidad y validación

- Backlog [#250](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/250).
  Amplía CU-22 y CU-23 de [Tareas](course-assignments.md), los requisitos de
  calificación y publicación RF21–26/29 y las fronteras RNF1–4/9.
- El contrato está en [OpenAPI](../reference/openapi/openapi.yaml). La
  configuración del almacenamiento está en la [guía S3](../guides/assignment-submissions-s3.md).
- Las pruebas de integración usan PostgreSQL descartable, almacenamiento
  local para el transporte HTTP y un adaptador S3 simulado para los fallos.
- Calendario, notificaciones, rúbricas avanzadas y borradores de texto
  sincronizados entre dispositivos quedan fuera del flujo.
