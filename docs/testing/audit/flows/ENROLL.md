# Funcionalidades ENROLL

Evidencia: [enrollments.service.ts](../../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../../frontend/src/components/courses/enrollment-form.tsx).
Permisos comunes: Consultar owner/teacher/assistant sección; escribir owner/teacher; directorio solo teacher institucional.
Estados: Creación activa; role change revoca predecesor y devuelve sucesor; active false/true; búsqueda paginada.

## FL-ENROLL-01 — Búsqueda institucional de participantes
- Requisito: CU-04; RF12/25; RNF1/2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/sections`.
- Endpoints/operaciones: searchInstitutionUsers; resolver path/método en [API](../API.md).
- Roles: Consultar owner/teacher/assistant sección; escribir owner/teacher; directorio solo teacher institucional.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+PAGES, BASE+SEARCH, PAGES+DELAY; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Creación activa; role change revoca predecesor y devuelve sucesor; active false/true; búsqueda paginada.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ENROLL](../../catalog/ENROLL.md); cada ficha precisa pasos y persistencia.

## FL-ENROLL-02 — Asignar cambiar revocar y reactivar roles
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/sections`.
- Endpoints/operaciones: listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment; resolver path/método en [API](../API.md).
- Roles: Consultar owner/teacher/assistant sección; escribir owner/teacher; directorio solo teacher institucional.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: PAGES+REVOKE, REVOKE, WRITE, WRITE+DELAY; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Creación activa; role change revoca predecesor y devuelve sucesor; active false/true; búsqueda paginada.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ENROLL](../../catalog/ENROLL.md); cada ficha precisa pasos y persistencia.
