# S3 privado para fotos de perfil en producción

Fecha: 2026-11-06. Estado: elección de S3 y responsable confirmados; implementación pendiente.
El usuario asignó a Daniel el levantamiento de S3 y a Matías la implementación.
Objetivo declarado: semana del 2 al 8 de noviembre de 2026, America/Santiago.

## Decisión

- Producción: almacenar fotos en un bucket privado de Amazon S3. Desarrollo:
  archivos locales del backend fuera de Git, con volumen si se usa Docker.
- Mantener una operación pequeña de almacenamiento con implementaciones local/S3;
  el flujo de usuario no cambia por entorno y no requiere un framework nuevo.
- Frontend envía imagen al backend; este autentica al titular, valida/procesa,
  guarda objeto y luego actualiza users.avatar_key. DB conserva la referencia,
  no bytes/base64 ni una URL arbitraria o firmada con vencimiento.
- Clave generada por backend bajo avatars/{userId}/{uuid}; el perfil es global,
  sin introducir una copia de la foto por cada pertenencia institucional.
- Acceso inicialmente propio, mediante backend autorizado; una ampliación de
  visibilidad requiere permiso/contrato explícito. No hacer público el bucket.
- Conservar foto anterior si falla subida/DB y documentar limpieza recuperable
  de objetos huérfanos. PostgreSQL y S3 no comparten una transacción.

La propuesta de tamaño/formato/procesado sigue en
[datos y seguridad](../planning/perfiles/datos-seguridad.md); la spec debe fijarla.
Controles de bucket privado según [AWS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html).

## Responsabilidades y preparación operativa

Daniel prepara bucket/región y permisos acotados para guardar, leer y eliminar
fotos, con acceso público bloqueado y entrega de configuración por canal seguro.
No se identifica aquí su cuenta GitHub ni se asignan permisos AWS por inferencia.
Matías integra backend/frontend, variables por entorno, migraciones, auditoría,
pruebas de reemplazo/eliminación y documentación de operación.

Bucket, región y mecanismo concreto de credenciales quedan por materializar con
Daniel; nunca secretos en repositorio ni NEXT_PUBLIC. No provisionar infraestructura
ni almacenar fotos durante esta preparación. CORS de S3 no es necesario para el
flujo inicial de acceso exclusivamente backend; revisar si se agrega acceso directo.

## Trazabilidad y límites

CU-21, RF45–47, RNF11/12/14–17 y [USR-02](../planning/perfiles/issues/USR-02.md).
La tarea permanece Todo hasta implementarse; una asignación no prueba despliegue.
La estimación de la feature sigue siendo preliminar y debe revisarse contra el
objetivo semanal, sin convertirla automáticamente en un compromiso de capacidad.
Esta decisión no habilita material académico binario, CDN ni workers.
