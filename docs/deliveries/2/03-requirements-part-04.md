## CU-01 — Elegir institución

### Descripción

El usuario identifica entre sus instituciones accesibles aquella en la que
quiere trabajar. **Meta:** seleccionar un contexto institucional válido para
continuar sus actividades.

### Actores

- Usuario autenticado.

### Stakeholders

- Usuario: necesita distinguir sus contextos de trabajo.
- Instituciones a las que pertenece: requieren que solo se ofrezcan contextos autorizados.

### Precondiciones

- El usuario posee una identidad autenticada vigente.

### Postcondiciones

- El contexto elegido corresponde a una institución con pertenencia activa del usuario; aún no se le atribuye un rol académico por esa elección.

### Trigger

- El usuario abre el selector de instituciones.

### Flujo básico

1. El usuario solicita ver las instituciones a las que puede acceder.
2. El sistema muestra solo instituciones con pertenencia activa de ese usuario.
3. El usuario elige una de las instituciones mostradas.
4. El sistema establece la institución elegida como contexto de navegación y conduce al usuario a ella.

### Flujos alternativos

#### FA-01 — Sin instituciones accesibles

**Se origina en:** Paso 2 del flujo básico, cuando no hay pertenencias institucionales activas.

1. El sistema muestra una lista vacía e informa que no hay instituciones disponibles.
2. El usuario permanece fuera de un contexto académico.

**Resultado:** No se selecciona institución ni se accede a datos académicos.

#### FA-02 — La pertenencia deja de estar activa

**Se origina en:** Paso 4 del flujo básico, cuando la pertenencia cambió desde que se mostró la lista.

1. El sistema rechaza el acceso al contexto elegido sin revelar sus datos.
2. El sistema devuelve al usuario a la selección de instituciones vigentes.

**Resultado:** No se establece un contexto no autorizado.
