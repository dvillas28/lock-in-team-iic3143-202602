## CU-05 — Publicar material

### Descripción

El docente prepara contenido de un módulo y decide cuándo hacerlo visible.
**Meta:** poner material académico autorizado a disposición de los estudiantes
del curso. En el MVP, módulos y materiales tienen alcance de curso completo:
todas las secciones del curso ven el mismo material publicado.

### Actores

- Docente.

### Stakeholders

- Estudiantes del curso: necesitan material publicado y accesible.
- Equipo docente: necesita que el contenido corresponda al módulo correcto.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El docente tiene rol activo en el curso y existe un módulo de ese curso.
- Para visibilidad estudiantil, el módulo está publicado.

### Postcondiciones

- El material queda asociado al módulo y publicado dentro de la institución del curso; su publicación queda auditada.

### Trigger

- El docente solicita incorporar material a un módulo y publicarlo.

### Flujo básico

1. El docente abre el módulo del curso y elige crear material markdown o basado en archivo.
2. El sistema comprueba la pertenencia del módulo al curso y solicita el contenido y los metadatos pertinentes.
3. El docente proporciona el contenido o archivo admitido y confirma la creación.
4. El sistema registra el material en el módulo sin exponerlo aún a estudiantes.
5. El docente revisa el material y solicita publicarlo.
6. El sistema publica el material, registra el cambio sensible y lo deja visible en el módulo publicado.

### Flujos alternativos

#### FA-01 — Archivo o información inválida

**Se origina en:** Paso 3 o 4 del flujo básico, cuando faltan datos o el archivo no es PDF, CSV, XLSX, TXT, JPEG o PNG.

1. El sistema indica qué información o formato debe corregirse.
2. El docente puede volver a proporcionar un material válido.

**Resultado:** No se publica contenido inválido.

#### FA-02 — Módulo no visible o permiso insuficiente

**Se origina en:** Paso 2 o 6 del flujo básico, cuando el módulo no pertenece al curso e institución o el actor pierde el rol `teacher` requerido.

1. El sistema rechaza la creación o publicación según corresponda.
2. El sistema no revela un módulo de otra institución ni cambia material existente.

**Resultado:** No se crea ni publica material fuera del alcance.

#### FA-03 — Corregir u ocultar material existente

**Se origina en:** Paso 5 del flujo básico, cuando el docente elige modificar metadatos o retirar material ya publicado.

1. El docente indica el cambio permitido o solicita ocultar el material.
2. El sistema actualiza el contenido editable o retira la visibilidad estudiantil y registra el cambio sensible.

**Resultado:** El material permanece en su módulo con el estado de publicación actualizado; no se reemplaza el binario de un archivo existente.
