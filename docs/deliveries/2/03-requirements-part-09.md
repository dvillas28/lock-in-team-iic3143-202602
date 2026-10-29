## CU-06 — Consultar material

### Descripción

El estudiante consulta recursos didácticos de sus cursos. **Meta:** acceder al
contenido publicado que corresponde a su institución y a una sección en la que
mantiene inscripción activa. La sección autoriza el acceso al curso; no filtra
material distinto por paralelo.

### Actores

- Estudiante.

### Stakeholders

- Estudiante: necesita estudiar con el material correcto.
- Equipo docente: necesita distribuir solo versiones publicadas.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El estudiante tiene inscripción `student` activa en una sección del curso.
- Existe al menos un módulo y material publicados del curso.

### Postcondiciones

- El estudiante recibe el material publicado solicitado; el estado académico no cambia.

### Trigger

- El estudiante abre los módulos de su curso o selecciona un material.

### Flujo básico

1. El estudiante abre el curso al que está inscrito mediante una de sus secciones y solicita sus módulos.
2. El sistema muestra únicamente módulos publicados y, dentro de ellos, materiales publicados.
3. El estudiante selecciona un material.
4. El sistema verifica su acceso vigente y muestra el markdown o entrega el archivo autorizado sin revelar su ubicación interna.

### Flujos alternativos

#### FA-01 — Contenido no publicado o inexistente

**Se origina en:** Paso 2 o 4 del flujo básico, cuando el módulo o material está oculto, no existe o es ajeno al contexto.

1. El sistema no incluye el contenido en el listado o rechaza su apertura.
2. El estudiante permanece en los contenidos publicados disponibles.

**Resultado:** No se divulga material no publicado ni de otra institución.

#### FA-02 — Inscripción inactiva

**Se origina en:** Paso 4 del flujo básico, cuando la inscripción estudiantil dejó de estar activa.

1. El sistema deniega la consulta del material.
2. El sistema informa que el curso ya no está disponible para ese estudiante.

**Resultado:** No se entrega el contenido solicitado.
