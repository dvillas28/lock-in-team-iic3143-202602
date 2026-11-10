# S3 privado para entregas de Tareas

AcademiX usa el bucket académico existente configurado en el backend con
`S3_ACADEMIC_BUCKET`, `AWS_REGION` y `ACADEMIC_STORAGE_DRIVER=s3`. El SDK usa
la cadena de credenciales AWS vigente en el entorno. En desarrollo,
`ACADEMIC_STORAGE_DRIVER=local` usa `ACADEMIC_LOCAL_DIR` o `.data`.

Las claves se generan en el backend y tienen esta forma:

```text
academic/submissions/<institución>/<curso>/<tarea>/<estudiante>/<intento>/<archivo>
```

Cada segmento variable es un UUID. PostgreSQL guarda el nombre de descarga y
el SHA-256. S3 valida el checksum en `PutObject` y el backend vuelve a verificar
los bytes antes de descargarlos. El servidor usa SSE-S3 (`AES256`), escrituras
condicionales y entrega binarios por una ruta autenticada con `Cache-Control:
no-store`. Mantén S3 Block Public Access activo. [PutObject y checksum](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html)

## Permisos del rol de la aplicación

Agregar a los permisos existentes del backend, con el nombre de bucket del
entorno correspondiente. Para otra partición, sustituir también `aws`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssignmentSubmissionObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<S3_ACADEMIC_BUCKET>/academic/submissions/*"
    }
  ]
}
```

`PutObject` crea los archivos, `GetObject` los lee y `DeleteObject` compensa
cargas parciales confirmadas. El flujo HTTP funciona con estos permisos sobre
objetos. Las operaciones se resuelven por clave exacta y la restricción se
expresa en el ARN. [Acciones de S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-management.html)

## Limpieza operativa

La limpieza usa un operador con acceso global a las referencias de
PostgreSQL y permiso de listar el prefijo. Otorga este permiso al rol que
ejecuta el mantenimiento. El modo de aplicación también requiere
`s3:DeleteObject` en el ARN de objetos anterior.

```json
{
  "Effect": "Allow",
  "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::<S3_ACADEMIC_BUCKET>",
  "Condition": {
    "StringEquals": {"s3:prefix": "academic/submissions/"}
  }
}
```

El prefijo de la solicitud de listado es fijo, incluso al paginar.
[Restricción de ListBucket por prefijo](https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazon-s3-policy-keys.html)

1. Usar el entorno de prueba con su bucket, sus variables de backend y la
   conexión operativa existente `MIGRATION_DATABASE_URL`.
2. Ejecutar `pnpm --dir backend academic:cleanup --submissions --batch=100`.
   El resultado informa los objetos inspeccionados y los huérfanos de más de
   24 horas. Para continuar, pasar el cursor con `--after=<cursor>`.
3. Para eliminar el lote inspeccionado, repetir con `--apply` y el mismo
   cursor de entrada. Cada eliminación vuelve a comprobar la referencia. En
   buckets versionados, el borrado normal crea un marcador. La purga de
   versiones antiguas se gestiona por separado.
   [DeleteObject y versionado](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html)

## Verificación en un bucket de pruebas

- Entregar un archivo sintético desde una cuenta estudiante, descargarlo
  como estudiante y docente de la sección y comparar ambos hashes con
  `shasum -a 256`. El intento y la fecha aparecen en el historial.
- Intentar la misma descarga sin sesión, como otro estudiante y desde una
  sección o institución ajena. Se espera 401, 403 o 404 según el contexto.
- Si falta configuración, se espera 503 `INTEGRATION_NOT_CONFIGURED`. Si
  S3 devuelve `AccessDenied`, falla o entrega bytes que no coinciden, se
  espera 503 `SUBMISSION_STORAGE_UNAVAILABLE`. El archivo no se confirma
  como enviado si una carga falla. Las entregas solo de texto funcionan
  sin acceso a S3.
- Si el rol puede subir pero no borrar, pueden quedar objetos privados tras
  un fallo parcial. El recolector los detecta cuando el operador cuenta con
  los permisos y transcurre la ventana de seguridad.
