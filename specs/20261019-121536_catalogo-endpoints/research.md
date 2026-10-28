# Research: catálogo

## Contrato único

Decision: usar lint y bundle dereferenced de Redocly ya instalado.
Rationale: mantiene OpenAPI 3.1 y referencias existentes como fuente única.
Decision de revisión: Swagger UI 5.34.0 con assets locales y presentación oficial.
Rationale: formato estándar pedido por el usuario; sustituye fichas HTML propias.
Alternatives: renderer propio rechazado por apariencia; CDN añade dependencia remota.
Consola deshabilitada con supportedSubmitMethods=[]; validatorUrl=null evita
validación remota, queryConfigEnabled=false impide cambiar configuración por URL.
[Configuración oficial](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).

## Disponibilidad

Decision: analizar metadatos Nest de controllers compilados registrados en AppModule.
Rationale: los specs no prueban que una ruta esté registrada. Las rutas ausentes
se muestran planificadas; una ruta registrada sin contrato bloquea generación.
Alternatives: lista manual deriva; iniciar el servidor requiere DB; importar clases no lo requiere.
Extractor recorre módulos importados y rechaza rutas de tipos no soportados.
Si aparecen esas formas, ampliar extractor antes de publicar.

## Publicación

Decision: releases inmutables con revisión Git y digest del árbol de entradas.
Rationale: cambios locales quedan identificados sin fingir un commit limpio.
Validar y escribir todo antes de reemplazar atómicamente entrada estable.
Alternatives: sobrescribir archivos activos deja versiones parciales ante fallos.
CI genera artefacto descargable; ningún proveedor nuevo ni despliegue automático.

## Seguridad y accesibilidad

Decision: componentes Swagger UI, enlaces profundos, foco visible y CSS oficial.
Tokens existentes solo para cabecera y ajustes de accesibilidad.
Ejemplos sintéticos del contrato; sin fetch académico ni credenciales persistidas.
Rationale: lectura sin servicios; solo HTML/JS/CSS/JSON locales.
Carga inválida muestra un alert y no monta fichas parciales; requiere JavaScript.
Alternatives: aplicación nueva añade estado, dependencias y superficie innecesaria.

## Base de publicación

El checkout original de la misión solo registraba 19 rutas. Los PR del catálogo
se publican sobre ad00b3b, implementación de notas/libro de #98, que incorpora
las misiones backend del stack previo. Verificar de nuevo disponibilidad en esta
base antes de afirmar conteos; no copiar snapshots antiguos del contrato/backend.
