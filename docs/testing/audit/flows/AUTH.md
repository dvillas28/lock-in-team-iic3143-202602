# Funcionalidades AUTH

Evidencia: [session.ts](../../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../../backend/src/auth/auth.guard.ts).
Permisos comunes: Todos los usuarios activos autentican globalmente; contexto exige membership activa.
Estados: anonymous → authenticating → authenticated; timeout/401/exp/logout → anonymous; context válido/error/warning.

## FL-AUTH-01 — Autenticación global y validación
- Requisito: CU-02; RF1/7; RNF2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/login`.
- Endpoints/operaciones: login; listAccessibleInstitutions; getCurrentUser; resolver path/método en [API](../API.md).
- Roles: Todos los usuarios activos autentican globalmente; contexto exige membership activa.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: AUTH-NEG, BASE, BASE+AUTH-NEG, BASE+FAULT, RATE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: anonymous → authenticating → authenticated; timeout/401/exp/logout → anonymous; context válido/error/warning.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [AUTH](../../catalog/AUTH.md); cada ficha precisa pasos y persistencia.

## FL-AUTH-02 — Sesión en memoria y navegación segura
- Requisito: CU-02; RF1/25; RNF2/9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /login?next=...`.
- Endpoints/operaciones: getCurrentUser; listCourses; resolver path/método en [API](../API.md).
- Roles: Todos los usuarios activos autentican globalmente; contexto exige membership activa.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: ACTIVE, BASE, EXPIRY, JWT-NEG; [definiciones](../../E2E_TEST_DATA.md).
- Estados: anonymous → authenticating → authenticated; timeout/401/exp/logout → anonymous; context válido/error/warning.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [AUTH](../../catalog/AUTH.md); cada ficha precisa pasos y persistencia.
