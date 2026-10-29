## CU-08 — Responder quiz

### Descripción

El estudiante inicia un intento y guarda sus respuestas mientras trabaja.
**Meta:** rendir un quiz publicado en la sección que le corresponde sin perder
el control sobre su intento en progreso.

### Actores

- Estudiante.

### Stakeholders

- Estudiante: necesita conservar sus respuestas antes de enviarlas.
- Equipo docente: necesita intentos asociados a la sección correcta.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El estudiante tiene rol `student` activo en la sección aplicable.
- El quiz está publicado y disponible para esa sección; no hay una nota suya ya publicada para ese quiz.

### Postcondiciones

- Existe un intento propio `in_progress`, numerado y asociado de forma histórica a la institución y sección; sus respuestas guardadas persisten sin calcular ni revelar una nota.

### Trigger

- El estudiante elige iniciar un quiz disponible.

### Flujo básico

1. El estudiante abre los quizzes publicados aplicables a su sección y elige uno.
2. El sistema comprueba inscripción vigente, disponibilidad, límite de intentos y ausencia de otro intento en progreso para ese estudiante y quiz.
3. El sistema crea el siguiente intento numerado, conservando institución y sección históricas, y presenta preguntas sin pauta.
4. El estudiante selecciona respuestas y solicita guardarlas.
5. El sistema revalida su permiso estudiantil, reemplaza las respuestas del intento en progreso y confirma el guardado sin mostrar corrección.

### Flujos alternativos

#### FA-01 — Quiz fuera de disponibilidad o sin intentos restantes

**Se origina en:** Paso 2 del flujo básico, cuando el quiz no está disponible o se alcanzó su máximo de intentos iniciados.

1. El sistema informa que no puede iniciarse otro intento.
2. El estudiante puede consultar los quizzes que siguen disponibles.

**Resultado:** No se crea un intento adicional; los cancelados siguen contando para el límite.

#### FA-02 — Intento en progreso o nota ya publicada

**Se origina en:** Paso 2 del flujo básico, cuando existe otro intento activo o una nota publicada del mismo quiz.

1. El sistema rechaza la creación de un intento nuevo e informa el conflicto de estado.
2. El estudiante puede volver al intento aún activo, si existe y conserva acceso.

**Resultado:** No se duplica un intento ni se reabre una nota publicada.

#### FA-03 — Permiso estudiantil perdido o acceso a pauta

**Se origina en:** Paso 2 o 5 del flujo básico, cuando la inscripción deja de estar activa o el usuario puede consultar la pauta como autor.

1. El sistema rechaza iniciar o guardar respuestas, según el momento.
2. El sistema no revela la pauta ni acepta cambios en las respuestas.

**Resultado:** No se rinde un quiz con permisos incompatibles.

#### FA-04 — Respuestas inválidas o intento cerrado

**Se origina en:** Paso 5 del flujo básico, cuando las respuestas no corresponden a las preguntas o el intento ya está enviado, calificado o cancelado.

1. El sistema informa el error de datos o el estado terminal del intento.
2. El estudiante corrige respuestas solo si el intento aún está en progreso.

**Resultado:** Las respuestas previas no se sustituyen por datos inválidos ni se altera un intento cerrado.
