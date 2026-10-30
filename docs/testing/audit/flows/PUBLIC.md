# Funcionalidades PUBLIC

Evidencia: [public-entry.ts](../../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../../frontend/src/components/public/domain-entry.tsx).
Permisos comunes: Anónimo; portal no revela membresías. Host institucional no concede acceso.
Estados: Portal/host institucional/desconocido; anónimo o sesión activa; no estado persistido público.

## FL-PUBLIC-01 — Directorio público y destinos institucionales
- Requisito: CU-01; RF2/6; RNF9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/`.
- Endpoints/operaciones: sin API privada; resolver path/método en [API](../API.md).
- Roles: Anónimo; portal no revela membresías. Host institucional no concede acceso.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Portal/host institucional/desconocido; anónimo o sesión activa; no estado persistido público.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [PUBLIC](../../catalog/PUBLIC.md); cada ficha precisa pasos y persistencia.

## FL-PUBLIC-02 — Rutas inexistentes, hosts y compatibilidad legacy
- Requisito: CU-02; RF4/6; RNF1; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/login; /institutions; /institutions/{slug}; /no-existe`.
- Endpoints/operaciones: getCurrentUser solo tras login; resolver path/método en [API](../API.md).
- Roles: Anónimo; portal no revela membresías. Host institucional no concede acceso.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+HOST-UNKNOWN; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Portal/host institucional/desconocido; anónimo o sesión activa; no estado persistido público.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [PUBLIC](../../catalog/PUBLIC.md); cada ficha precisa pasos y persistencia.
