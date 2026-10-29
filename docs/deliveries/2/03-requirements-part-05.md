## CU-02 — Acceder al contexto institucional

### Descripción

El usuario entra a una institución seleccionada y reconoce los roles académicos
que tiene allí. **Meta:** trabajar únicamente dentro de un contexto al que
pertenece, sin confundir pertenencia institucional con autorización de curso.

### Actores

- Usuario autenticado.

### Stakeholders

- Institución: necesita preservar la separación de su información académica.
- Usuario: necesita conocer sus alcances reales en el contexto elegido.

### Precondiciones

- El usuario posee una identidad autenticada vigente.
- Existe una institución seleccionada o solicitada por el usuario.

### Postcondiciones

- El usuario permanece en una institución activa con pertenencia vigente y conoce sus roles disponibles; ninguna operación académica queda autorizada sin comprobar además el curso o la sección.

### Trigger

- El usuario navega a la institución elegida o solicita una vista dentro de ella.

### Flujo básico

1. El usuario solicita entrar a la institución seleccionada.
2. El sistema identifica la institución solicitada y verifica que sea visible para ese usuario.
3. El sistema confirma su pertenencia institucional activa y recupera sus roles de curso y sección en ese contexto.
4. El sistema presenta la identidad contextual y permite continuar hacia las vistas que correspondan a esos roles.

### Flujos alternativos

#### FA-01 — Institución inexistente o no visible

**Se origina en:** Paso 2 del flujo básico, cuando la institución no existe o el usuario no puede verla.

1. El sistema informa que el contexto solicitado no está disponible.
2. El sistema no entrega identidad contextual ni recursos académicos de esa institución.

**Resultado:** No se establece acceso institucional.

#### FA-02 — Pertenencia inactiva

**Se origina en:** Paso 3 del flujo básico, cuando la pertenencia institucional dejó de estar activa.

1. El sistema impide continuar en ese contexto.
2. El sistema ofrece volver a las instituciones accesibles.

**Resultado:** El usuario no puede operar en la institución solicitada.
