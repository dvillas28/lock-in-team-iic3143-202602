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

`scripts/provision-avatar-s3.sh` aplica estos pasos en us-east-1 para prod y test
y guarda las keys fuera del repo, sin imprimirlas. El mismo bucket y usuario sirven
`academic/materials/` con una declaración separada ([guía](../academic-files/s3.md));
en test solo `avatars/` expira a los 7 días.

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

Los comandos de limpieza solo enumeran y borran. En prod usan el usuario IAM
`academix-maintenance-prod`, creado por el script: `s3:ListBucket` condicionado a
`avatars/*` y `academic/materials/*`, y `s3:DeleteObject` sobre esos prefijos.
No puede leer ni escribir objetos. En test se usa `academix-backend-test`.

Esa credencial nunca va a Render ni al servidor HTTP: el operador la guarda en su
gestor de secretos y la mantiene inactiva entre usos. Render Free no ofrece shell
ni cron jobs, así que la limpieza se ejecuta desde la máquina del operador:

1. Activar la key: `aws iam update-access-key --user-name academix-maintenance-prod
   --access-key-id <id> --status Active`.
2. Cargar `s3-maintenance-prod.env`, `MIGRATION_DATABASE_URL` de prod y
   `ACCOUNT_MAINTENANCE_OPERATOR_REF`; compilar con `pnpm --dir backend build`.
3. Ejecutar en dry-run, revisar el resultado y repetir con `--apply`
   (accounts:cleanup según el [índice](operacion.md); academic:cleanup según su guía).
4. Desactivar la key con el mismo comando y `--status Inactive`. Registrar fecha,
   operador y resultado en el registro operativo.
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
