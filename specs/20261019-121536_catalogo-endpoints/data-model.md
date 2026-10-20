# Modelo de artefactos

No cambia persistencia académica.

- Operación: method, path, operationId, tags, parámetros, requestBody, responses,
  security y x-permissions desde OpenAPI. x-availability se deriva del código.
- Revisión: HEAD más digest SHA-256 de contrato, fuentes backend, generador,
  configuración y assets; incluye cambios locales. Se incorpora a info y portada.
- Release: index.html, openapi.json, swagger-ui.css, swagger-ui-bundle.js, catalog-init.js,
  tokens.css, catalog.css y licencias. El JSON incluye estados, permisos y ejemplos
  generados; Swagger UI lo presenta sin duplicar un inventario.
- Entrada estable: index.html redirige a release completa mediante ruta relativa.

Estados: staging → validada → release → entrada promovida. Error antes de promover
conserva entrada previa. Releases anteriores permanecen disponibles para rollback.
No hay usuarios, sesiones ni datos de institución en estos artefactos.
