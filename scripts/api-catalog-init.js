/* API central api.dvillasc.me; slug in path. Catalog reads only the bundled description. */
(async () => {
  try {
    const response = await fetch('./openapi.json', {credentials:'omit'});
    if (!response.ok) throw new Error('OpenAPI unavailable');
    const spec = await response.json();
    if (spec.openapi !== '3.1.0' || !spec.paths || !spec.info?.['x-source-revision']) throw new Error('Invalid OpenAPI');
    window.ui = SwaggerUIBundle({
      spec,
      dom_id: '#swagger-ui',
      layout: 'BaseLayout',
      deepLinking: true,
      filter: true,
      displayOperationId: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
      supportedSubmitMethods: [],
      tryItOutEnabled: false,
      validatorUrl: null,
      queryConfigEnabled: false,
      persistAuthorization: false,
      requestInterceptor: () => { throw new Error('Catálogo de solo lectura'); },
    });
  } catch {
    document.getElementById('swagger-ui').replaceChildren();
    const error = document.getElementById('catalog-error');
    error.textContent = 'No se pudo cargar el catálogo completo. Recarga la página o descarga OpenAPI.';
    error.hidden = false;
  }
})();
