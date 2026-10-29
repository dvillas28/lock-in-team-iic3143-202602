## CU-07 — Crear y publicar quiz

### Descripción

El docente autorizado prepara una evaluación de alternativas.
**Meta:** ofrecer a los estudiantes un quiz válido, con pauta protegida y
alcance de curso o sección según el rol del autor.

### Actores

- Docente.

### Stakeholders

- Estudiantes destinatarios: necesitan una evaluación disponible y consistente.
- Equipo docente: necesita una pauta correcta y notas vinculables al libro de notas.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El curso existe y el docente tiene rol `teacher` activo dentro del alcance que
  quiere administrar.

### Postcondiciones

- El quiz queda publicado con preguntas y pauta válidas, disponible en su alcance autorizado y vinculado a un único elemento del libro de notas; la publicación queda auditada.

### Trigger

- El docente solicita preparar un quiz para su curso o sección.

### Flujo básico

1. El actor elige el curso y, si corresponde, la sección destinataria.
2. El sistema verifica su alcance: el docente puede elegir el curso o una
sección donde mantiene rol `teacher` activo.
3. El actor define los datos del quiz y su política de intentos; el sistema lo guarda como borrador.
4. El actor agrega preguntas con puntajes, al menos dos alternativas por pregunta y una respuesta correcta en cada una.
5. El sistema conserva la pauta en la vista de autoría, separada de la vista estudiantil.
6. El actor revisa el borrador y solicita publicarlo.
7. El sistema valida preguntas, pauta, fechas y puntajes, crea o confirma el elemento de nota único y publica el quiz con auditoría.

### Flujos alternativos

#### FA-01 — Alcance o rol insuficiente

**Se origina en:** Paso 2 o 7 del flujo básico, cuando el docente elige otra sección o pierde el rol requerido.

1. El sistema rechaza la creación o publicación fuera del alcance autorizado.
2. El sistema no expone la pauta ni modifica quizzes ajenos.

**Resultado:** El quiz no queda publicado por un actor sin permiso.

#### FA-02 — Pauta o configuración incompleta

**Se origina en:** Paso 4 o 7 del flujo básico, cuando falta una pregunta válida, hay alternativas insuficientes o duplicadas, más de una correcta, puntajes o fechas inválidos.

1. El sistema señala las condiciones incumplidas.
2. El actor corrige el borrador y puede volver a solicitar publicación.

**Resultado:** El quiz conserva estado de borrador hasta superar la validación.

#### FA-03 — Quiz bloqueado o libro de notas ya publicado

**Se origina en:** Paso 3 o 7 del flujo básico, cuando el quiz ya fue publicado o utilizado, o existe una nota publicada del curso que impide agregar el elemento.

1. El sistema rechaza el cambio incompatible e informa el conflicto de estado.
2. El actor conserva la versión vigente sin alterar intentos ni notas.

**Resultado:** No se modifica una pauta protegida ni se añade un ítem después del bloqueo del libro.
