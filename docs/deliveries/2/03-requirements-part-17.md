## CU-14 — Organizar módulos del curso

### Descripción

El docente estructura el contenido del curso antes de exponerlo.
**Meta:** disponer de módulos ordenados y decidir cuáles son visibles para los
estudiantes.

### Actores

- Docente.

### Stakeholders

- Equipo docente: necesita una secuencia de contenido coherente.
- Estudiantes: necesitan navegar solo por módulos publicados y en el orden previsto.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El actor tiene rol `teacher` activo en un curso existente.

### Postcondiciones

- El módulo queda creado en el curso, su orden queda registrado y el módulo publicado resulta visible para estudiantes del curso; la publicación queda auditada.

### Trigger

- El docente solicita organizar el contenido de un curso.

### Flujo básico

1. El docente abre los módulos del curso y solicita crear uno.
2. El sistema muestra los módulos actuales y verifica que el actor tenga rol `teacher` activo en ese curso.
3. El docente proporciona los datos del módulo y confirma su creación.
4. El sistema lo registra en el curso y muestra el orden actual.
5. El docente ajusta el orden completo y solicita publicar el módulo preparado.
6. El sistema valida el orden propuesto, lo guarda y publica el módulo con auditoría.

### Flujos alternativos

#### FA-01 — Orden incompleto o datos inválidos

**Se origina en:** Paso 3 o 6 del flujo básico, cuando faltan datos del módulo o el orden omite, duplica o incluye módulos ajenos.

1. El sistema indica qué dato o posición debe corregirse.
2. El docente revisa la propuesta y puede volver a confirmarla.

**Resultado:** Se conserva el orden previo y no se publica una organización inválida.

#### FA-02 — Curso ajeno o falta de rol `teacher`

**Se origina en:** Paso 2 o 6 del flujo básico, cuando el curso no es visible o el rol `teacher` deja de estar activo.

1. El sistema rechaza la modificación y no muestra módulos ajenos.
2. El actor vuelve a sus cursos autorizados.

**Resultado:** No cambia el contenido de un curso fuera de alcance.

#### FA-03 — Actualizar u ocultar módulo

**Se origina en:** Paso 5 del flujo básico, cuando el docente selecciona un módulo existente para editarlo u ocultarlo.

1. El docente modifica sus datos o solicita retirar su publicación.
2. El sistema comprueba el estado y actualiza el módulo o su visibilidad, registrando el cambio sensible.

**Resultado:** Se conserva el módulo en su curso con los datos o estado de publicación actualizados.
