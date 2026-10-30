# Funcionalidades ADMIN

Evidencia: [membership-admin.service.ts](../../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../../backend/src/data-migrations/set-superadmin.ts).
Permisos comunes: SA activo delega isAdmin propio tenant; solo operador provisiona/recupera isSuperAdmin; sin superadmin global.
Estados: isAdmin on/off; isSuperAdmin operativo independiente; onboarding una vez; sin alta general UI/API.

## FL-ADMIN-01 — Delegación institucional vía API y efecto UI
- Requisito: RF12/25/26; RNF1/2/3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `sin UI propia; efecto /courses`.
- Endpoints/operaciones: listInstitutionMemberships; setInstitutionCourseAdmin; resolver path/método en [API](../API.md).
- Roles: SA activo delega isAdmin propio tenant; solo operador provisiona/recupera isSuperAdmin; sin superadmin global.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, PAGES, REVOKE, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: isAdmin on/off; isSuperAdmin operativo independiente; onboarding una vez; sin alta general UI/API.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: API integrada; interfaz propia excluida; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ADMIN](../../catalog/ADMIN.md); cada ficha precisa pasos y persistencia.

## FL-ADMIN-02 — Onboarding y recuperación de superadmin operativos
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `sin UI/API; operación controlada`.
- Endpoints/operaciones: onboard-institution; set-superadmin (operaciones existentes, no endpoints); resolver path/método en [API](../API.md).
- Roles: SA activo delega isAdmin propio tenant; solo operador provisiona/recupera isSuperAdmin; sin superadmin global.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: OPERATIONS, RACE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: isAdmin on/off; isSuperAdmin operativo independiente; onboarding una vez; sin alta general UI/API.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: operación CLI/SQL implementada; fuera E2E navegador; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ADMIN](../../catalog/ADMIN.md); cada ficha precisa pasos y persistencia.
