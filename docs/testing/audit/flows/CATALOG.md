# Funcionalidades CATALOG

Evidencia: [api-catalog.mjs](../../../../scripts/api-catalog.mjs); [api-catalog-render.mjs](../../../../scripts/api-catalog-render.mjs); [api-catalog-init.js](../../../../scripts/api-catalog-init.js); [api-catalog.md](../../../../docs/reference/api-catalog.md).
Permisos comunes: Consulta anónima de contrato sintético; mantenedor genera release, sin credenciales académicas ni backend activo.
Estados: Release estática válida/error carga; entrada atómica a release revisada; sin consola ejecutable.

## FL-CATALOG-01 — Portal público Swagger UI generado desde OpenAPI
- Requisito: CU-01–16 transversal; RNF9; catálogo-endpoints FR-001–013; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `http://localhost:8080/ → releases/{revision}/index.html; openapi.json`.
- Endpoints/operaciones: assets/JSON estáticos; sin requests académicos; resolver path/método en [API](../API.md).
- Roles: Consulta anónima de contrato sintético; mantenedor genera release, sin credenciales académicas ni backend activo.
- Precondiciones: release estática y servidor loopback8080; API/DB no necesarios para consultar.
- Datos: STATIC-CATALOG, STATIC-CATALOG+FAULT; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Release estática válida/error carga; entrada atómica a release revisada; sin consola ejecutable.
- Dependencias: Node/pnpm, compilación backend solo para metadatos Nest y generador; no instancia servicios ni crea DB.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [CATALOG](../../catalog/CATALOG.md); cada ficha precisa pasos y persistencia.
