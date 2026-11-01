# Funcionalidades TENANT

Evidencia: [database.service.ts](../../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../../frontend/src/components/auth/protected-institution.tsx).
Permisos comunes: Cada actor de la matriz ROLES; MULTI tiene roles distintos UC/UTFSM, nunca autoridad por Host.
Estados: Institution/User/membership activos o inactivos; slug válido/inválido; recurso visible/invisible.

## FL-TENANT-01 — Resolución e identidad multiinstitucional
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /institutions/{slug}`.
- Endpoints/operaciones: listAccessibleInstitutions; getCurrentUser; listCourses; resolver path/método en [API](../API.md).
- Roles: Cada actor de la matriz ROLES; MULTI tiene roles distintos UC/UTFSM, nunca autoridad por Host.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+TENANT-INACTIVE, REVOKE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Institution/User/membership activos o inactivos; slug válido/inválido; recurso visible/invisible.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [TENANT](../../catalog/TENANT.md); cada ficha precisa pasos y persistencia.

## FL-TENANT-02 — Recursos y relaciones cruzadas
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/...`.
- Endpoints/operaciones: todos los recursos institucionales; ver matriz de operaciones; resolver path/método en [API](../API.md).
- Roles: Cada actor de la matriz ROLES; MULTI tiene roles distintos UC/UTFSM, nunca autoridad por Host.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+DELAY, BASE+WRITE, PAGES, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Institution/User/membership activos o inactivos; slug válido/inválido; recurso visible/invisible.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [TENANT](../../catalog/TENANT.md); cada ficha precisa pasos y persistencia.
