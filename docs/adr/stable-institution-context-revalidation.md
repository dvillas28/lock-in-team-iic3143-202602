# Contexto institucional estable y errores locales

Estado: aceptado. Fecha: 2026-10-26.

## Problema

Reemplazar el contexto antes de cada `/me` desmonta vistas y pierde trabajo.
Propagar un 403/404 secundario al contexto bloquea recursos ajenos al error.

## Decisión

Session deduplica consultas del mismo slug y conserva la referencia del contexto
cuando la respuesta validada de identidad y permisos es idéntica. Los eventos de
foco, visibilidad y pageshow se agrupan; no consultan mientras la página está oculta.
Cambiar de tenant o permisos crea una nueva frontera e invalida respuestas anteriores.
Una respuesta 401, expiración o pérdida confirmada de membership limpia acceso.

Errores 403/404 de recursos disparan revalidación sin convertir un `/me` exitoso en
error institucional. El consumidor conserva el error del recurso. `/me` no inicia
revalidaciones recursivas. Fallos transitorios conservan lectura y muestran aviso;
la frontera HTTP bloquea nuevas escrituras hasta revalidar exitosamente.
Un GET denegado elimina los datos de ese recurso y su página retenida; un fallo
temporal posterior no puede recuperar una copia previamente denegada.
Identidades malformadas fallan cerradas; no se reutiliza una identidad no validada.

## Consecuencias

Sin polling, storage privado ni nuevo proveedor de caché. La vigencia académica
sigue siendo responsabilidad del backend en cada operación. Un reintento nunca
reenvía una mutación automáticamente. Operaciones inciertas conservan cuerpo y clave
mientras permanezca el mismo contexto autorizado.
