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

## Visualización local

Instala las dependencias con `pnpm install` y ejecuta:

```bash
pnpm docs:api
```

Redocly CLI levanta una previsualización web generada exclusivamente desde
`openapi.yaml` y sus referencias en `http://127.0.0.1:8080`. Para validar el
contrato sin iniciar el preview:

```bash
pnpm docs:api:lint
```

La configuración recomendada de Redocly vive en `redocly.yaml`. Se omite la
regla de licencia porque el repositorio aún no declara una.

## Decisiones pendientes

- Emisor, audiencia, expiración y provisioning de identidades JWT; el MVP
  académico debe resolverlos antes de habilitar sus endpoints.
- Los cursos demo y su primera pertenencia `coordinator` se aprovisionan
  juntos; por eso no existe `POST /api/v1/courses`.
- `maxAttempts: null` permite intentos ilimitados; un entero positivo limita
  los intentos iniciados. El último intento calificado determina la nota vigente
  mientras esta no esté publicada.
- Límite máximo de tamaño para archivos. Los MIME del MVP sí están acotados a
  PDF, CSV, XLSX, TXT, JPEG y PNG.
