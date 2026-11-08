# Fotos de perfil: configuración S3 y recuperación

Daniel prepara la infraestructura; Matías integra. [Índice](operacion.md).
Estado: adaptador implementado; aprovisionamiento y prueba real pendientes.
Referencia: [ADR S3](../../adr/s3-for-profile-photos.md).

## Desarrollo local

AVATAR_STORAGE_DRIVER=local y AVATAR_LOCAL_DIR=.data guardan objetos bajo
`.data/avatars/{userId}/{uuid}.webp`, fuera de Git. Mantener el directorio entre
reinicios si se quiere conservar fotos. Compose monta avatar_data en /app/data,
propiedad de node; AVATAR_LOCAL_DIR apunta a esa raíz y sobrevive al reinicio del contenedor.
No usar disco local como almacenamiento productivo del contenedor Render.
Los tests usan directorios temporales y transporte S3 sustituido, sin credenciales.

## Preparación por Daniel

1. Crear un bucket dedicado en una región elegida por el equipo. Mantener los
   cuatro controles Block Public Access activos y Object Ownership con ACL deshabilitadas.
2. Usar cifrado predeterminado SSE-S3; no hacer objetos públicos ni agregar CDN.
3. Crear una identidad de aplicación con permisos mínimos bajo avatars/.
   No usar credenciales root ni las del operador de base de datos.
4. Entregar configuración mediante el gestor de secretos del despliegue.

Política de aplicación, sustituyendo NOMBRE_BUCKET sin alterar el prefijo:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::NOMBRE_BUCKET/avatars/*"
  }]
}
```

No necesita ListBucket para servir HTTP. El navegador solo accede al backend
autenticado: no requiere CORS de S3, URLs públicas ni URLs firmadas en DB.

## Variables backend y habilitación

| Variable | Valor |
| --- | --- |
| AVATAR_STORAGE_DRIVER | s3 |
| AWS_REGION | Región real del bucket |
| S3_AVATAR_BUCKET | Nombre real del bucket |
| AWS_ACCESS_KEY_ID | Identificador de credencial dedicada |
| AWS_SECRET_ACCESS_KEY | Secreto correspondiente |
| AWS_SESSION_TOKEN | Solo si se entregaron credenciales temporales |

Con configuración incompleta, la integración queda no disponible sin impedir el
arranque. No se intenta otro almacenamiento. Configuración presente con permisos,
región o conexión incorrectos produce error recuperable de esa operación.

## Prueba manual real

Con una cuenta del equipo, subir una imagen estática JPEG/PNG/WebP de hasta 2 MiB.
Comprobar normalización WebP hasta 1024×1024 y ausencia de metadatos personales.
Se rechazan animados, archivos falsos y entradas superiores a 16 megapíxeles.
Verificar que la foto persiste tras nuevo login/reinicio y solo su titular la obtiene.
Reemplazarla y eliminarla; comprobar que el perfil conserva sus demás datos.
Provocar un fallo de permisos en un entorno de prueba y comprobar que no se pierde
la foto anterior ni se informa éxito. Restaurar permisos antes de continuar.

## Objetos huérfanos y credenciales de mantenimiento

La escritura de S3 y PostgreSQL no es una transacción distribuida. El flujo intenta
eliminar el objeto nuevo si falla DB y retirar el anterior después del reemplazo.
El mantenimiento debe enumerar candidatos antiguos, comprobar referencias vigentes
en DB y eliminar únicamente objetos sin referencia; conservar auditoría mínima.
Usar margen de al menos 24 h para no competir con subidas en curso y lotes acotados.

El operador necesita, además de Get/Delete, esta autorización de enumeración:

```json
{
  "Effect": "Allow",
  "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::NOMBRE_BUCKET",
  "Condition": {"StringLike": {"s3:prefix": "avatars/*"}}
}
```

Esa credencial va al proceso de mantenimiento, fuera del servidor HTTP. El comando
accounts:cleanup y sus modos dry-run/--apply se explican en el [índice](operacion.md).
El listado recorre todas las claves válidas en orden lexicográfico, también las
recientes/referenciadas, para acotar cada lote sin bloquear huérfanos posteriores.
Continuar con --avatar-after=avatarCursor hasta recibir null; S3 usa StartAfter y
el almacenamiento local aplica el mismo orden. Reiniciar sin cursor en la próxima pasada.
No borrar por prefijo sin comprobar DB ni usar reglas de expiración para todas las fotos.

## Deshabilitar y diagnosticar

Cambiar AVATAR_STORAGE_DRIVER=disabled y reiniciar backend. No borra referencias
ni objetos; las acciones de foto quedan no disponibles. Perfil/contraseña siguen activos.
Comprobar región, bucket, política, vencimiento de credenciales y conectividad.
No registrar claves, imágenes ni respuestas crudas del proveedor.

Fuentes: [seguridad S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
y [SDK oficial](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html).
