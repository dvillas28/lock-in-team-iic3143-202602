# Contrato propuesto: altas por CSV

Estado: planificación; CU-20, RF35–44/47–56, RNF11–16/18–20.
Autoriza admin OR superadmin vigente de la institución. No es una matrícula masiva.
Dependencias: [requisitos](requisitos.md), [datos](modelo-datos.md), [backlog](backlog.md).

## Plantilla

```csv
name,email
Ana Pérez,ana.perez@universidad.cl
Diego Soto,diego.soto@universidad.cl
"Soto, Camila",camila.soto@universidad.cl
```

`name`: obligatorio, trim, 1–200 caracteres. `email`: obligatorio, trim/lower,
máximo 254 y mismo formato del login. Único global al activar, no por institución.
UTF-8, BOM opcional, separador coma, comillas dobles con escape CSV estándar,
saltos LF/CRLF; usar parser probado, nunca split(','). Rechazar UTF-8 inválido.
Cabeceras exactas name,email en ese orden; rechazar faltantes, extras y repetidas.
Ignorar líneas completamente vacías; validar ambos campos en cualquier fila con datos.
Límite propuesto: 100 filas de datos, 256 KiB, control por stream aunque falte Content-Length.
Rechazar archivo vacío, solo cabecera, filas con columnas de más/menos y comillas mal cerradas.
**Archivo efímero, confirmado:** parser/upload solo en memoria acotada; descartar bytes
al terminar o fallar. Sin temporales en disco, S3, DB, logs o copia codificada del original.

La institución viene del path validado y del permiso del actor. No se aceptan
institution_id, tenant, userId, password, roles, isAdmin ni isSuperAdmin en el archivo.
No exigir que el dominio del correo coincida con la institución: no existe esa regla actual.
Nombre/correo bastan; descripción y foto las completa cada titular posteriormente.

## Flujo frontend

1. En Usuarios institucionales, elegir Crear usuario o Importar CSV.
2. Descargar plantilla; elegir archivo y solicitar Validar archivo.
3. Mostrar número de fila, nombre, correo normalizado, estado y mensaje accionable;
   resumen de válidas/errores/ya miembros. Nunca revelar otras instituciones.
4. Si hay errores, confirmar queda deshabilitado y se ofrece corregir/subir otro archivo.
5. Si es válido, confirmar explícitamente el número de altas pendientes que se crearán.
6. Mostrar recibo y envío por fila; despachar luego con Resend y recuperar estado por ID.

Preview no realiza altas; puede guardar staging normalizado con TTL para confirmar.
Renderizar texto seguro, tabla con cabeceras, foco/aria-live y scroll móvil accesible.

## Clasificación y duplicados

| Situación al validar | Resultado |
| --- | --- |
| Nombre/correo inválido o duplicado normalizado dentro del archivo | Error por fila; bloquea confirmación completa |
| Membership activa del tenant y User activo | Ya pertenece; omitir sin escritura ni evento nuevo |
| Invitación vigente del tenant al mismo correo | Ya pendiente; omitir; no rotar su código |
| Membership revocada del tenant | Conflicto; no reactivar automáticamente |
| Correo sin pertenencia activa visible en ese tenant | Alta pendiente; no distinguir cuenta global nueva/existente |

No hacer upsert que reescriba nombre, email, hash o active de users existentes.
User inactivo se comprueba internamente al aceptar; no revelar esa condición global
durante preview/emisión. Las altas no resetean credenciales ni privilegios previos.
Un lote sin altas nuevas puede confirmar un recibo con cero creadas y filas omitidas.

## Persistencia y confirmación

`user_imports` guarda institución, actor, estado, fingerprint, expiración y totales.
`user_import_rows` guarda número de fila, name/email normalizados, validación,
resultado e invitation_id del mismo tenant. Son datos extraídos, no el archivo;
su limpieza sigue la [política aprobada de 7/30 días](retencion.md). El original no se almacena.
La vista previa es inmutable; cambiar datos requiere otro lote. Fingerprint no es
un permiso: todos los GET/POST autorizan el tenant y el actor administrativo vigente.

Confirmar bloquea el lote, revalida permiso activo y estado, y compara de nuevo las
precondiciones de todas las filas. Si cambió clasificación o hubo conflicto de
unicidad concurrente, rollback completo con 409 y nueva vista previa.
Bloquear destinatarios en orden estable y apoyarse en unicidades para evitar carreras
entre formulario, otros CSV y activaciones en distintas instituciones.
Invitaciones + resultados de filas + recibo + auditoría se confirman en una transacción;
User/membership se crean después, individualmente, durante la activación de cada titular.

`importId` identifica la confirmación idempotente; confirmar ya confirmado devuelve
el mismo recibo sin repetir escrituras. Reintento de upload usa clave por actor/tenant
y fingerprint: mismo cuerpo conserva lote; cuerpo distinto con misma clave da 409.
Subir intencionalmente otra vez el mismo archivo no duplica invitaciones activas
ni memberships. No confundir deduplicación de personas con idempotencia de la petición.

El recibo tiene importId, fecha, total, creadas/omitidas y estados por fila, sin
contraseñas/códigos/hashes. [Resend](correo-resend.md) envía después del commit,
en solicitudes cortas coordinadas por UI; no dentro de la transacción de 100 filas.
Cuota/fallo deja pendientes; cerrar pestaña pausa y permite continuar al volver.
accepted no implica entregado/activado; unknown requiere reenvío explícito que rota código.
Confirmar otra vez no reenvía; los informes nunca recuperan el secreto original.

## API orientativa

Todas las rutas bajo `/api/v1/institution/{slug}` y con no-store:

| Método/ruta | Resultado |
| --- | --- |
| POST /user-imports/preview | Multipart limitado; crea staging y devuelve filas/errores/importId |
| GET /user-imports/{importId} | Estado y filas/resultados del lote autorizado, paginados |
| POST /user-imports/{importId}/confirm | Sin filas editables en body; confirma preview vigente |

Mantener JSON ≤4096 bytes; excepciones multipart solo en upload CSV/avatar.
Ampliar errores seguros por fila y el tratamiento 413/415 sin reflejar contenido crudo.
Reportes exportados neutralizan fórmulas CSV y no contienen códigos de activación.
Staging sin confirmar expira en 24 h; limpiar PII/fingerprint del lote a los 7 días
desde confirmación o expiración. Invitaciones tienen plazo propio de 30 días;
conservar recibo mínimo/FK según [política](retencion.md), sin borrar auditoría.
Tras depurar, GET devuelve recibo sin PII y confirmación/replay mutante responde 410;
no reconstruir filas con datos de users ni volver a crear/enviar por una clave antigua.

## Pruebas específicas

Unicode/BOM, CRLF, comas entre comillas, UTF-8 inválido, cabeceras/columnas erróneas,
límites sin Content-Length, correos con mayúsculas/espacios, repetidos, archivo vacío,
inyección de fórmulas, replay, confirmación doble, expiración, permiso revocado,
institución cruzada y rollback ante fallo de una fila/auditoría o carrera de unicidad.
Medir el máximo de 100 filas contra timeouts reales antes de fijar el límite final.
Verificar que éxito, error, cancelación y exceso de tamaño no dejan archivos/bytes persistidos.
Probar cuota/rate de Resend, caída entre commit y envío y reanudación sin repetir accepted;
la atomicidad garantiza invitaciones DB, no la entrega simultánea de todos los correos.
Probar cortes de 7 días, doble limpieza y carrera con confirmación; conservar recibos/FK sin PII.
