# Funcionalidades SECTION

Evidencia: [sections.service.ts](../../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../../frontend/src/components/courses/section-form.tsx).
Permisos comunes: Crear/editar owner; leer owner o roles activos de esa sección; no expansión docente por institución.
Estados: Código/capacidad editable; roles activos/históricos; sin cierre/periodo separado ni cuota automática.

## FL-SECTION-01 — Consulta y gestión de secciones
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/sections`.
- Endpoints/operaciones: listSections; getSection; createSection; updateSection; resolver path/método en [API](../API.md).
- Roles: Crear/editar owner; leer owner o roles activos de esa sección; no expansión docente por institución.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+DELAY, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Código/capacidad editable; roles activos/históricos; sin cierre/periodo separado ni cuota automática.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [SECTION](../../catalog/SECTION.md); cada ficha precisa pasos y persistencia.
