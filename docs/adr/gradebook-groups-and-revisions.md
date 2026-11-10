# Grupos de evaluación y revisiones de notas publicadas

Fecha 2026-11-09. Estado implementado en la etapa de [#248][issue].

## Cálculo y compatibilidad

Cada evaluación pertenece a un grupo del mismo curso e institución. El ítem
conserva su puntaje máximo. Los grupos tienen nombre, orden y peso con dos
decimales. Una configuración por grupos suma exactamente 100 %. Un grupo
puede estar vacío o pesar 0 %.

Para cada estudiante se divide la suma de puntos publicados de un grupo por
la suma de máximos correspondientes. El promedio parcial combina esos
porcentajes con sus pesos y divide por el peso activo. Los grupos sin
resultados publicados quedan fuera del promedio. Si el peso activo es cero
el promedio queda pendiente. Se usa aritmética decimal en PostgreSQL. Se
redondea el porcentaje combinado a dos decimales y se aplica la escala de
AcademiX con exigencia de 60 % y nota a un decimal.

La migración crea un grupo por evaluación existente con su peso individual.
Los cursos mantienen la fórmula histórica de promedio ponderado de **notas**
hasta que el docente adopta explícitamente el cálculo por puntos. Por ejemplo,
dos notas de 1,0 y 7,0 con pesos de 30 % y 70 % dan 5,2 con la fórmula
histórica y 4,8 al aplicar la escala chilena al 70 % combinado. En ambos
casos las notas individuales siguen siendo 1,0 y 7,0.

Después de configurar grupos, los quizzes nuevos entran en **Sin clasificar**,
con peso inicial 0 %. El docente puede moverlos desde Ponderaciones.
El peso individual histórico se conserva para el modo anterior y la
compatibilidad del endpoint de pesos. La configuración por grupos se
versiona. La edición posterior a una publicación pide confirmar el recálculo
y guarda la configuración previa y nueva en un evento transaccional.
`grade_items_locked_at` conserva su función de marca de primera publicación.

## Visibilidad y revisiones

Los intentos calificados generan una nota registrada y oculta. El docente
publica una selección de evaluaciones y estudiantes o las notas pendientes
de secciones completas, opcionalmente limitadas a ciertas evaluaciones.
Los lotes de sección omiten notas ya publicadas. La publicación revalida
el último intento calificado y la ausencia de un intento activo por par.
La clave de idempotencia y el recibo se conservan.

Una corrección de nota publicada registra puntaje, versión previa, motivo,
autor y fecha. El modal muestra el máximo y anticipa el porcentaje y la nota
con el mismo redondeo que PostgreSQL. El último puntaje revisado determina la nota y los subtotales
visibles. La nota publicada original, el intento y sus respuestas siguen
siendo evidencia inmutable. El historial y la auditoría registran el antes y
el después. Un ID de revisión permite recuperar el resultado de un reintento
y una versión previa obsoleta devuelve 409.

## Permisos y dependencias

Cualquier docente activo del curso edita la configuración común. Publicar y
corregir requiere docencia en la sección histórica. El dueño con
administración vigente y docencia activa tiene alcance de curso. Los
ayudantes tienen lectura en sus secciones y los estudiantes solo ven notas
propias publicadas. RLS, claves compuestas y el lock transaccional de curso
mantienen las fronteras de institución y serializan escrituras académicas.

Grupos y fórmula operan sobre ítems y puntos. Quizzes y Tareas comparten
la tabla de notas, los recibos y las revisiones. Cada fila referencia un
solo tipo de intento mediante claves compuestas. Una corrección de Tareas
conserva la evidencia anterior y puede asociar otro intento autorizado.
Los ítems con máximo cero quedan fuera de los subtotales y promedios.
Ver [CU-24 y CU-25](../planning/assignment-submissions.md).

## Trazabilidad

CU-10 y CU-16 cubren registro, corrección y seguimiento. CU-11 cubre
publicación y CU-12 lectura estudiantil y promedio parcial. Se amplían
RF21–26 y RF29, con RNF1–4/9 para aislamiento, autorización, auditoría e
integridad. Backlog BE-26–32 y DOC-15. Esta decisión actualiza el
[ADR de publicación](grade-publication-and-weight-freeze.md) y conserva
los permisos del [ADR de docentes](teacher-course-grade-weights.md).

[issue]: https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/248
