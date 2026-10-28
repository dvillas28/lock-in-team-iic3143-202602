# ADR: Catálogo público estático con Swagger UI

Fecha: 2026-10-19. Estado: aceptado para implementación local; hosting pendiente.

## Contexto

La API mantiene OpenAPI 3.1 y Redocly. El contrato anticipa rutas futuras;
los specs no acreditan por sí solos registro de controllers.
El usuario exige formato y estilos estándar de Swagger UI y rechaza fichas HTML propias.
Se mantiene la consulta pública, sin datos académicos ni ejecución de operaciones.

## Decisión

Swagger UI 5.34.0, fijado mediante swagger-ui-dist, presenta el contrato existente.
Se sirven localmente CSS, bundle JavaScript y licencias del paquete; sin CDN.
Se conservan formato, tipografía y colores oficiales del visor. Solo cabecera,
foco/contraste, reflow y movimiento reducido reciben ajustes de accesibilidad.
Esta excepción al estilo del LMS responde al requisito explícito del usuario.

Redocly sigue validando y resolviendo referencias. Se usa el dialecto base implícito
de OpenAPI 3.1, compatible con Swagger UI, sin declarar un campo redundante.
La portada solo resume login/Bearer e institución; guía extensa en documentación operativa. La disponibilidad se calcula
con metadatos Nest compilados sin instanciar servicios. Una ruta sin contrato o
contradicción de security bloquea generación. Estados, permisos y curl se incorporan
al JSON generado desde el mismo contrato; no hay otro inventario manual.

supportedSubmitMethods=[] deshabilita Try it out. validatorUrl=null evita el
validador remoto; queryConfigEnabled=false impide cambiar configuración desde URL.
persistAuthorization=false; el interceptor rechaza solicitudes de Swagger.
El visor carga solamente openapi.json local. Error HTTP/JSON muestra alert sin fichas.
[Configuración oficial](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).

Releases inmutables con HEAD y digest incluyen assets, fuentes y cambios locales.
Solo se promueve la entrada con rename atómico al terminar validación y copia.
CI adjunta artefacto completo; despliegue externo requiere aprobación separada.

## Consecuencias

Una dependencia de distribución sustituye el renderer HTML propio.
El visor requiere JavaScript; la descarga OpenAPI continúa disponible sin él.
No se añaden servicios, consultas DB, cambios de autorización ni auditoría.
Debe conservarse la release previa y publicar assets completos antes de cambiar entrada.
