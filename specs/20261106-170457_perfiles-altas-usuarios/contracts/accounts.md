# Contrato de cuenta global y foto

[OpenAPI](../../../docs/reference/openapi/paths/accounts.yaml) es el contrato ejecutable.
Todas las operaciones privadas exigen User activo y Bearer; sin membership obligatoria.
Respuestas no-store/nosniff; cuerpos JSON ≤4096 bytes, excepción multipart solo avatar.

## Perfil

| Operación bajo /api/v1 | Entrada | Salida |
| --- | --- | --- |
| GET /me | Sin userId/tenant | OwnProfile |
| PATCH /me | name, bio nullable, expectedUpdatedAt | OwnProfile |
| POST /me/password | currentPassword, newPassword, confirmPassword | 204, nuevo login |
| GET /me/avatar | Sin clave/URL | image/webp o 404 si no tiene |
| PUT /me/avatar | Multipart file y expectedUpdatedAt | OwnProfile |
| DELETE /me/avatar | JSON expectedUpdatedAt | OwnProfile |

OwnProfile: id, email, name, bio, hasAvatar, updatedAt y capabilities.
capabilities contiene avatar e invitationEmail (boolean); configuración no concede permisos.
updatedAt/expectedUpdatedAt mantienen seis dígitos de microsegundos de PostgreSQL.
El actor deriva del JWT; rechazar campos adicionales y ediciones obsoletas con 409.
Nombre 1–200 trim; bio texto plano ≤500. Sin cambios efectivos no se emite evento.

## Credenciales

Nueva contraseña ≥12 caracteres y ≤128 bytes UTF-8; confirmación coincidente.
Verificar actual con Argon2id y controlar intentos. Error actual: 400 de campo;
401 se reserva para sesión inválida y provoca logout del cliente.
Hash nuevo, incremento de credential_version y evento confirman juntos.
Guard exige credentialVersion entero vigente, issuer/audience/algoritmo/TTL existentes.
Despliegue invalida JWT anteriores sin claim. No agrega refresh tokens ni Redis.

## Foto

JPEG/PNG/WebP estático ≤2 MiB, entrada ≤16 MP; salida WebP ≤1024×1024 sin metadatos.
La foto es propia y global. DB guarda clave interna generada, nunca bytes/base64/URL.
Upload precede a cambio de referencia; fallo de DB intenta borrar objeto nuevo;
foto anterior permanece hasta confirmar. Eliminación posterior es recuperable por operador.
Frontend obtiene Blob por cliente autenticado, crea URL temporal y la libera
al cambiar de foto/cuenta o desmontar. No incluir JWT en URL o persistir el Blob.

## Integración ausente

AVATAR_STORAGE_DRIVER=disabled|local|s3; dev local, producción disabled por defecto.
Producción no admite fallback local. MAIL_DELIVERY_MODE=disabled|resend|fake;
fake solo tests y mensajes en memoria. Sin credenciales, capacidad false.
Operación afectada devuelve 503 INTEGRATION_NOT_CONFIGURED sin mutación ni éxito falso.
Perfil/contraseña, autenticación, funciones académicas y /ready siguen disponibles.
Errores con proveedor configurado se informan como fallo de operación recuperable.
