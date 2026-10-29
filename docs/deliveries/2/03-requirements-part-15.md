## CU-12 — Ver notas y promedio

### Descripción

El estudiante revisa su desempeño académico. **Meta:** conocer únicamente
sus notas publicadas y el promedio parcial derivado de ellas.

### Actores

- Estudiante.

### Stakeholders

- Estudiante: necesita conocer su progreso publicado.
- Equipo docente: necesita que el promedio refleje las ponderaciones del curso.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El estudiante tiene inscripción activa en una sección del curso.

### Postcondiciones

- Se presentan solo las notas publicadas del estudiante y el promedio parcial calculado con sus ponderaciones publicadas; no se modifica ningún registro.

### Trigger

- El estudiante abre sus calificaciones de un curso.

### Flujo básico

1. El estudiante selecciona un curso en el que está inscrito y abre sus calificaciones.
2. El sistema identifica al estudiante por su sesión y recupera solo sus notas publicadas en ese curso e institución.
3. El sistema calcula el promedio parcial como suma de nota por ponderación dividida por la suma de ponderaciones de las notas publicadas.
4. El sistema presenta las notas y el promedio parcial, sin incluir notas aún no publicadas ni las de otras personas.

### Flujos alternativos

#### FA-01 — Sin notas publicadas

**Se origina en:** Paso 2 del flujo básico, cuando no existen notas propias publicadas.

1. El sistema informa que aún no hay calificaciones visibles.
2. El sistema no presenta un promedio sin ponderaciones publicadas.

**Resultado:** No se confunde ausencia de notas con una nota cero.

#### FA-02 — Curso o inscripción no visible

**Se origina en:** Paso 1 o 2 del flujo básico, cuando el curso es ajeno al contexto o la inscripción dejó de estar activa.

1. El sistema rechaza la consulta y no revela notas.
2. El estudiante vuelve a sus cursos disponibles.

**Resultado:** No se exponen calificaciones fuera de su alcance.
