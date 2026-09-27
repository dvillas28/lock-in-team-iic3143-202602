# Contrato OpenAPI de AcademiX

El punto de entrada es [`openapi.yaml`](openapi.yaml). El contrato usa OpenAPI
3.1, JSON con propiedades `camelCase`, paths separados por dominio y componentes
reutilizables bajo `components/`. Los `$ref` son relativos al archivo que los
declara; `openapi.yaml` enlaza cada Path Item mediante JSON Pointer.

## Seguridad y tenancy

`x-tenant` selecciona la universidad y su base de datos. No identifica, autentica
ni autoriza al usuario. La API académica utiliza JWT Bearer; el claim `sub`
identifica al usuario y los permisos se obtienen desde memberships persistidas.

`GET /health` es público y no requiere tenant. `GET /api/hello` también es
público, pero exige `x-tenant`. `GET /api/v1/tenants` requiere autenticación y no
exige tenant; solo devuelve universidades accesibles para la identidad actual.

## Decisiones pendientes

- Emisor, audiencia, expiración y provisioning de identidades JWT.
- Flujo de bootstrap de cursos y asignación del primer `coordinator`; por eso no
  existe `POST /api/v1/courses`.
- Cantidad máxima de intentos por quiz. El contrato impide más de un intento
  activo, pero deja la política total al dominio futuro.
- Límite máximo de tamaño para archivos. Los MIME del MVP sí están acotados a
  PDF, CSV, XLSX, TXT, JPEG y PNG.
