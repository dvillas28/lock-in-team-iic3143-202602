# Funcionalidades CONTENT

Evidencia: [modules.service.ts](../../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../../frontend/src/components/content/academic-markdown.tsx).
Permisos comunes: Teacher en cualquier sección del curso escribe compartido; assistant/student solo publicado con Enrollment; owner solo no basta.
Estados: Módulo/material publicado u oculto; posición positiva única; visibilidad efectiva conjunción; sin DELETE.

## FL-CONTENT-01 — Módulos compartidos y orden completo
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/modules`.
- Endpoints/operaciones: listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule; resolver path/método en [API](../API.md).
- Roles: Teacher en cualquier sección del curso escribe compartido; assistant/student solo publicado con Enrollment; owner solo no basta.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: EMPTY, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Módulo/material publicado u oculto; posición positiva única; visibilidad efectiva conjunción; sin DELETE.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [CONTENT](../../catalog/CONTENT.md); cada ficha precisa pasos y persistencia.

## FL-CONTENT-02 — Material Markdown, visibilidad y lectura segura
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/modules/{M1}/materials/{R1}`.
- Endpoints/operaciones: listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial; resolver path/método en [API](../API.md).
- Roles: Teacher en cualquier sección del curso escribe compartido; assistant/student solo publicado con Enrollment; owner solo no basta.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: MARKDOWN, VISIBILITY, WRITE, WRITE+LOST-RESPONSE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Módulo/material publicado u oculto; posición positiva única; visibilidad efectiva conjunción; sin DELETE.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [CONTENT](../../catalog/CONTENT.md); cada ficha precisa pasos y persistencia.
