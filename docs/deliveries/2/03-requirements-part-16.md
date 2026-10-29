## CU-13 — Consultar auditoría

### Descripción

El docente examina cambios académicos sensibles de su curso. **Meta:**
reconstruir quién hizo un cambio, sobre qué recurso y cuándo, sin alterar el
historial.

### Actores

- Docente y admin propietario (este último solo administrativos sin teacher).

### Stakeholders

- Institución: necesita trazabilidad de registros académicos.
- Equipo docente y estudiantes afectados: tienen interés en la integridad de los cambios.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- Teacher activo en alguna sección o is_admin vigente con ownership del curso.

### Postcondiciones

- Se presenta el historial autorizado del curso y su institución; los eventos permanecen inmutables y no exponen secretos ni pautas.

### Trigger

- El docente abre el historial académico del curso.

### Flujo básico

1. El docente selecciona su curso y solicita eventos de auditoría.
2. El sistema revalida permisos: teacher solo secciones docentes históricas; owner+teacher todo curso; owner sin teacher solo eventos distintos de grade.
3. El docente filtra, si lo necesita, por acción, recurso, actor, sección o período.
4. El sistema presenta los eventos coincidentes con fecha, actor y cambios sanitizados, sin permitir editarlos.

### Flujos alternativos

#### FA-01 — Curso ajeno o permiso perdido

**Se origina en:** Paso 2 o 4 del flujo básico, cuando el curso no es visible o los permisos vigentes cambian.

1. El sistema reduce alcance o rechaza si no queda permiso. Cursor no conserva acceso revocado.
2. El sistema no revela eventos de otra institución o curso.

**Resultado:** El historial permanece protegido y sin modificaciones.

#### FA-02 — Filtro inválido o sin resultados

**Se origina en:** Paso 3 o 4 del flujo básico, cuando el filtro es inválido o no coincide con eventos.

1. El sistema solicita corregir el filtro inválido o informa que no hay coincidencias.
2. El docente puede ajustar los criterios de búsqueda.

**Resultado:** No se crean, eliminan ni alteran eventos por la consulta.
