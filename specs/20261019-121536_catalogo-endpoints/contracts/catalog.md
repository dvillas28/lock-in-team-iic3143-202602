# Contrato público del catálogo

- Entrada estable `/index.html`, sin sesión; Swagger UI estándar con filtro, dominios y enlaces profundos.
- Release inmutable `releases/<revision>/index.html` y `openapi.json` descargable.
- OpenAPI 3.1 contiene `info.x-source-revision` y operaciones `x-availability`.
- Estados: implementada si registrada en aplicación actual; planificada en otro caso.
- `x-permissions` declara condiciones por operación; security declara Bearer o público.
- Parámetros y schemas íntegros muestran restricciones, nullable y required.
- Ejemplos JSON/curl sintéticos seleccionables y copiables; no hay ejecución HTTP.
- Generación falla con diagnóstico ante contrato, referencia o cobertura inválidos.
- Entrada estable solo cambia después de completar y validar release.
- Swagger UI carga openapi.json local; carga inválida muestra alert y no monta fichas parciales.
- Sin Try it out, validador remoto, configuración por query ni autorización persistida.
- Formato y estilos oficiales del visor; assets locales completos con licencias.
