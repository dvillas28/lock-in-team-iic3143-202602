## CU-09 — Enviar intento y obtener calificación automática

### Descripción

El estudiante finaliza un intento respondido. **Meta:** entregar sus respuestas
para que el sistema las califique y registre la nota vigente, sin divulgarla
antes de su publicación.

### Actores

- Estudiante.

### Stakeholders

- Estudiante: necesita confirmar que su entrega fue recibida.
- Equipo docente: necesita una calificación reproducible y vinculada al intento correcto.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El estudiante es propietario de un intento `in_progress` de un quiz publicado y conserva rol `student` activo.
- El usuario no posee acceso actual a la pauta de ese quiz; la nota correspondiente aún no está publicada.

### Postcondiciones

- El intento queda `graded`, con respuestas inmovilizadas; la nota vigente corresponde al último intento calificado por número y queda asociada al elemento del libro de notas sin exposición estudiantil anticipada.

### Trigger

- El estudiante confirma el envío de su intento.

### Flujo básico

1. El estudiante revisa sus respuestas guardadas y solicita enviar el intento.
2. El sistema comprueba propiedad, inscripción vigente, ausencia de acceso a pauta y estado `in_progress`.
3. El sistema inmoviliza las respuestas y las compara con la pauta del quiz.
4. El sistema calcula puntaje y nota según las reglas de calificación del curso.
5. El sistema registra el intento calificado y crea o actualiza la nota vigente si es el último intento calificado; confirma la recepción sin mostrar la nota aún no publicada.

### Flujos alternativos

#### FA-01 — Permiso vigente insuficiente

**Se origina en:** Paso 2 del flujo básico, cuando el estudiante perdió la inscripción o adquirió acceso a la pauta.

1. El sistema rechaza el envío y explica que no puede rendir con los permisos actuales.
2. El sistema conserva el intento y las respuestas previas sin calificarlos.

**Resultado:** No se genera nota por un envío no autorizado.

#### FA-02 — Intento inexistente, ajeno o cerrado

**Se origina en:** Paso 2 del flujo básico, cuando el intento no es visible, está cancelado o ya fue procesado con una solicitud incompatible.

1. El sistema deniega el acceso a intentos ajenos o indica el conflicto de estado del propio intento.
2. El sistema no vuelve a calificar ni duplica la nota.

**Resultado:** El registro académico permanece consistente; repetir la misma solicitud identificada conserva su resultado previo.

#### FA-03 — Nota ya publicada

**Se origina en:** Paso 2 o 5 del flujo básico, cuando la nota se publicó antes de completar el envío.

1. El sistema impide el envío o la sustitución de la nota publicada.
2. El sistema informa que la calificación ya no admite nuevos intentos.

**Resultado:** No se modifica una nota publicada.
