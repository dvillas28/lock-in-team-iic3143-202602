## CU-15 — Cancelar un intento en progreso

### Descripción

El estudiante o el personal docente autorizado cierra un intento que no se
enviará. **Meta:** liberar un intento abandonado sin calificarlo ni alterar una
nota, para que no bloquee indebidamente la publicación.

### Actores

- Estudiante propietario del intento.
- Docente.
- Docente de la sección histórica del intento.

### Stakeholders

- Estudiante propietario: necesita conocer el estado final de su intento.
- Equipo docente: necesita resolver bloqueos antes de publicar notas.
- Institución: requiere registro de quién canceló el intento.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- Existe un intento `in_progress` del quiz en la institución.
- El estudiante conserva inscripción activa y no accede a la pauta, o el actor de personal conserva rol `teacher` del curso o docencia en la sección histórica.

### Postcondiciones

- El intento queda `cancelled` con fecha y actor auditados; conserva su número, cuenta para el límite de intentos, no genera nota y deja de bloquear la publicación.

### Trigger

- El estudiante o personal autorizado solicita cancelar un intento en progreso.

### Flujo básico

1. El actor abre el intento visible y solicita su cancelación.
2. El sistema verifica el estado `in_progress` y revalida propiedad o rol académico sobre el curso y sección históricos.
3. El sistema marca el intento como `cancelled`, registra fecha y evento de auditoría, sin generar una calificación.
4. El sistema confirma que el intento cerrado conserva su número, cuenta para el límite de intentos y ya no bloquea la publicación.

### Flujos alternativos

#### FA-01 — Falta de permiso actual

**Se origina en:** Paso 2 o 3 del flujo básico, cuando el actor perdió la inscripción o rol requerido, o el estudiante adquirió acceso a la pauta.

1. El sistema rechaza la cancelación.
2. El sistema conserva el intento en su estado previo.

**Resultado:** Ningún actor fuera de alcance cancela intentos.

#### FA-02 — Intento ya cancelado

**Se origina en:** Paso 2 o 3 del flujo básico, cuando la cancelación ya fue aplicada.

1. El sistema confirma que el intento está cancelado.
2. El sistema no registra un segundo evento ni modifica notas.

**Resultado:** Se mantiene el estado terminal y la auditoría única.

#### FA-03 — Intento enviado, calificado o no visible

**Se origina en:** Paso 2 del flujo básico, cuando el intento ya fue enviado o calificado, no existe o pertenece a otro contexto.

1. El sistema rechaza la transición incompatible o informa que el intento no está disponible.
2. El actor vuelve a los intentos que puede consultar.

**Resultado:** No se cancela una calificación ni se revela un intento ajeno.
