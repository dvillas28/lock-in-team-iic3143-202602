## CU-11 — Publicar notas

### Descripción

El docente decide qué notas calificadas se comunican a los
estudiantes. **Meta:** hacer visibles resultados ya calculados dentro del
alcance académico autorizado.

### Actores

- Docente.

### Stakeholders

- Estudiantes afectados: necesitan conocer resultados definitivos para esa publicación.
- Equipo docente: necesita evitar publicaciones incompletas o contradictorias.
- Institución: requiere historial de la publicación de registros académicos.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- Existen notas originadas por intentos calificados en los elementos y secciones seleccionados.
- El actor mantiene rol `teacher` en el curso o en las secciones que selecciona.

### Postcondiciones

- Las notas seleccionadas quedan publicadas y visibles para sus propietarios; no se sobrescriben notas publicadas y se registra auditoría de la operación.

### Trigger

- El docente solicita publicar notas de uno o más elementos y secciones.

### Flujo básico

1. El actor consulta el libro de notas del curso dentro de su alcance y selecciona elementos y secciones.
2. El sistema muestra solo las notas calificadas y secciones que el actor puede publicar.
3. El actor revisa la selección y confirma la publicación.
4. El sistema valida los permisos vigentes, que las ponderaciones sumen 100 % y que no haya intentos `in_progress` de los estudiantes y quizzes afectados.
5. El sistema publica en conjunto las notas seleccionadas, conserva su valor y registra el evento de auditoría.
6. El sistema confirma qué notas quedaron visibles para sus estudiantes.

### Flujos alternativos

#### FA-01 — Sección fuera del alcance docente

**Se origina en:** Paso 2 o 4 del flujo básico, cuando un docente incluye una sección que no enseña o pierde el rol.

1. El sistema rechaza la selección no autorizada.
2. El actor puede seleccionar solo sus secciones vigentes.

**Resultado:** No se publica ninguna nota fuera de su alcance.

#### FA-02 — Ponderaciones incompletas o sin nota calificada

**Se origina en:** Paso 4 del flujo básico, cuando es la primera publicación y los pesos no suman 100 %, o la selección carece de nota originada por intento `graded`.

1. El sistema informa qué condición académica falta.
2. El actor corrige la configuración mediante CU-10 o espera una entrega calificada mediante CU-09.

**Resultado:** No se publican notas incompletas.

#### FA-03 — Intento aún en progreso

**Se origina en:** Paso 4 del flujo básico, cuando uno de los estudiantes y quizzes seleccionados conserva un intento `in_progress`.

1. El sistema detiene la publicación e identifica el conflicto dentro del alcance autorizado.
2. El actor puede resolver el intento abandonado mediante CU-15 y volver a solicitar la publicación.

**Resultado:** No se cancela automáticamente el intento ni se publican las notas seleccionadas.

#### FA-04 — Nota ya publicada o selección incompatible

**Se origina en:** Paso 4 o 5 del flujo básico, cuando se intenta sobrescribir una nota publicada o se incluyen elementos ajenos al curso.

1. El sistema informa el conflicto o la selección inválida.
2. El actor revisa las notas y elementos vigentes.

**Resultado:** Se conserva la publicación anterior sin sobrescritura.
