## CU-16 — Revisar el libro de notas docente

### Descripción

El personal académico consulta calificaciones de sus estudiantes antes de
publicarlas o para dar seguimiento al curso. **Meta:** revisar filas del libro
de notas y, cuando sea necesario, los intentos que originan resultados dentro
del alcance de curso o sección permitido para cada rol.

### Actores

- Docente.
- Ayudante de sección.

### Stakeholders

- Equipo docente: necesita detectar resultados pendientes y dar seguimiento académico.
- Estudiantes: necesitan que sus resultados sean consultados solo por personal autorizado.
- Institución: requiere resguardar la confidencialidad de las calificaciones.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El actor tiene rol `teacher` activo en alguna sección del curso o rol `teacher` o `assistant` activo en una de sus secciones.
- El curso existe dentro de la institución seleccionada.

### Postcondiciones

- Se presentan únicamente filas del libro de notas y, si se solicitan, intentos del curso o de las secciones autorizadas; la consulta no modifica notas ni su estado de publicación.

### Trigger

- El miembro del equipo académico abre el libro de notas del curso.

### Flujo básico

1. El actor selecciona un curso y solicita consultar su libro de notas.
2. El sistema verifica su rol y muestra al docente el curso completo; al docente o ayudante le exige una sección propia.
3. El docente o ayudante selecciona una sección en que mantiene rol activo, si corresponde.
4. El sistema muestra las filas y elementos de nota dentro de ese alcance, con sus resultados y estado de publicación.
5. El actor revisa los resultados sin alterar el libro mediante esta consulta.

### Flujos alternativos

#### FA-01 — Sección ajena o rol perdido

**Se origina en:** Paso 2, 3 o 4 del flujo básico, cuando el actor solicita una sección fuera de sus roles vigentes.

1. El sistema rechaza la consulta fuera de alcance.
2. El actor puede elegir una sección donde aún participa.

**Resultado:** No se exponen calificaciones de otra sección.

#### FA-02 — Curso o sección inexistente en el contexto

**Se origina en:** Paso 2 o 4 del flujo básico, cuando el recurso no existe o pertenece a otra institución.

1. El sistema informa que el recurso no está disponible.
2. El actor regresa a sus cursos y secciones visibles.

**Resultado:** No se revela la existencia de datos de otra institución.

#### FA-03 — Ayudante intenta modificar o publicar

**Se origina en:** Paso 5 del flujo básico, cuando un ayudante solicita una acción de escritura desde el libro consultado.

1. El sistema impide la modificación y explica que el rol `assistant` es de solo lectura en el libro.
2. El ayudante conserva la vista autorizada sin cambios.

**Resultado:** No se modifican ni publican notas mediante el rol de ayudante.

#### FA-04 — Revisar intentos del quiz

**Se origina en:** Paso 5 del flujo básico, cuando el actor decide consultar los intentos relacionados con un quiz del libro.

1. El actor selecciona el quiz y, si es docente o ayudante, una de sus secciones activas.
2. El sistema muestra solo los intentos de ese alcance y permite abrir una vista académica autorizada del intento.
3. El actor revisa el resultado sin cambiar respuestas ni calificaciones.

**Resultado:** La revisión queda limitada a intentos visibles y no modifica registros académicos.
