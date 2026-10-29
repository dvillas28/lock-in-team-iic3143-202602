## CU-04 — Gestionar secciones y roles

### Descripción

El docente mantiene la organización y las personas de su curso.
**Meta:** disponer de secciones actualizadas y asignar roles académicos a
participantes de la misma institución.

### Actores

- Docente.

### Stakeholders

- Equipo docente: depende de asignaciones correctas para trabajar en sus secciones.
- Estudiantes: dependen de una inscripción de sección vigente.
- Institución: requiere trazabilidad de los cambios de participantes.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El curso existe y el actor tiene rol `teacher` activo en al menos una sección
  del curso, o el actor está creando el curso junto con su primera sección.
- La persona a incorporar ya posee pertenencia activa a la misma institución.

### Postcondiciones

- La sección queda creada o actualizada y la pertenencia académica queda registrada con el rol solicitado, dentro del curso y la institución correctos; los cambios sensibles quedan auditados.

### Trigger

- El docente solicita crear o actualizar una sección y asignar un participante.

### Flujo básico

1. El docente abre el curso y consulta sus secciones y participantes.
2. El sistema muestra todas las secciones y las pertenencias del curso que puede administrar.
3. El docente define o actualiza una sección y busca una persona perteneciente a la institución.
4. El sistema comprueba que la sección corresponde al curso y que la persona puede participar en esa institución.
5. El docente selecciona el rol de sección (`teacher`, `assistant` o `student`) y confirma la asignación.
6. El sistema registra la sección y la pertenencia de sección, y muestra la asignación vigente con su historial de cambio cuando corresponde.

### Flujos alternativos

#### FA-01 — Falta de rol `teacher`

**Se origina en:** Paso 2 o 6 del flujo básico, cuando el actor ya no tiene rol
`teacher` en el alcance administrado.

1. El sistema impide la modificación de secciones y pertenencias.
2. El sistema informa que la operación requiere rol docente activo.

**Resultado:** No cambia la organización del curso.

#### FA-02 — Participante o relación fuera de la institución

**Se origina en:** Paso 4 del flujo básico, cuando la persona, sección o curso no existe en el contexto solicitado o no pertenece a la misma institución.

1. El sistema rechaza la relación propuesta y no incorpora a la persona.
2. El docente puede elegir una persona y sección válidas.

**Resultado:** No se crea una relación académica cruzada o inexistente.

#### FA-03 — Rol activo duplicado o datos de sección inválidos

**Se origina en:** Paso 6 del flujo básico, cuando ya existe el mismo rol activo para esa persona y sección o los datos de sección incumplen una restricción.

1. El sistema informa el conflicto o el dato que debe corregirse.
2. El docente revisa la asignación existente o corrige la sección.

**Resultado:** Se conserva el estado previo sin duplicar roles activos.

#### FA-04 — Cambiar o desactivar una pertenencia

**Se origina en:** Paso 5 del flujo básico, cuando el docente selecciona una pertenencia existente en vez de crear otra.

1. El docente indica el nuevo rol o desactiva la pertenencia.
2. El sistema verifica que no se duplique un rol activo y registra el estado anterior y el nuevo.

**Resultado:** La pertenencia queda actualizada sin eliminar su historial.

#### FA-05 — Actualizar configuración general del curso

**Se origina en:** Paso 3 del flujo básico, cuando el docente decide modificar datos generales del curso antes de continuar con sus secciones.

1. El docente indica los datos del curso que deben cambiar.
2. El sistema valida la configuración y registra el cambio sensible dentro del mismo curso e institución.

**Resultado:** El curso queda actualizado sin crear otro curso ni alterar sus pertenencias.
