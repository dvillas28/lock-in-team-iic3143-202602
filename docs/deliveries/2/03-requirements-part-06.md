## CU-03 — Ver cursos y secciones

### Descripción

El participante localiza su trabajo académico dentro de una institución.
**Meta:** encontrar los cursos y secciones donde mantiene un rol activo, con
visibilidad ajustada a su alcance.

### Actores

- Docente.
- Ayudante de sección.
- Estudiante.

### Stakeholders

- Equipo docente: necesita ubicar las secciones que atiende.
- Estudiantes: necesitan acceder solo a sus cursos y secciones.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- Existe al menos un curso en la institución seleccionada.

### Postcondiciones

- Se muestra un listado de cursos y secciones visibles conforme a las pertenencias académicas activas del actor; los datos del curso no cambian.

### Trigger

- El participante abre su lista de cursos o entra a un curso visible.

### Flujo básico

1. El participante solicita sus cursos en la institución elegida.
2. El sistema presenta únicamente cursos donde posee pertenencia académica activa.
3. El participante selecciona un curso y solicita sus secciones.
4. El sistema muestra todas las secciones al docente; al docente, ayudante o estudiante le muestra solo las secciones en que participa.
5. El participante abre una sección visible y consulta su información académica permitida.

### Flujos alternativos

#### FA-01 — Sin cursos visibles

**Se origina en:** Paso 2 del flujo básico, cuando el participante no tiene pertenencia académica activa en ningún curso.

1. El sistema presenta la lista vacía dentro de la institución.
2. El sistema no muestra cursos de otros usuarios o instituciones.

**Resultado:** No se abre un curso ni se modifica información.

#### FA-02 — Curso o sección fuera del alcance

**Se origina en:** Paso 4 o 5 del flujo básico, cuando el recurso solicitado no existe, pertenece a otra institución o ya no es visible para el actor.

1. El sistema rechaza la consulta sin confirmar la existencia de un recurso ajeno.
2. El sistema conserva al participante en el último listado autorizado.

**Resultado:** No se divulga información fuera de su alcance.
