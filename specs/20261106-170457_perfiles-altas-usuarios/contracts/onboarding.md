# Contrato de invitaciones e importaciones

[OpenAPI](../../../docs/reference/openapi/paths/accounts.yaml) · [Política de limpieza](../../../docs/planning/perfiles/retencion.md).
Institución del path; User/institución/membership activos e isAdmin OR isSuperAdmin.
No crea Enrollment ni flags; delegar admin sigue siendo exclusivo de superadmin.

## Invitaciones

Rutas administrativas bajo /api/v1/institution/{institutionSlug}:

| Método/ruta | Entrada | Salida |
| --- | --- | --- |
| GET /invitations | cursor/limit opcionales | items, nextCursor |
| POST /invitations | name/email, Idempotency-Key | 201 AccountInvitation |
| POST /invitations/{id}/send | Idempotency-Key | AccountInvitation |
| POST /invitations/{id}/resend | Idempotency-Key nueva; confirmación UI | AccountInvitation |
| POST /invitations/{id}/revoke | Sin identidad/tenant editable | AccountInvitation |

AccountInvitation: id, name/email nullable tras depurar, status, deliveryStatus,
createdAt, expiresAt/acceptedAt/revokedAt nullable. Nunca token/hash/clave interna/proveedor crudo.
Status: pending/accepted/revoked/expired. Delivery: pending/sending/accepted/failed/quota_blocked/unknown.
Misma clave/cuerpo recupera resultado; clave para otro contenido produce 409.
Código 32 bytes base64url, hash SHA-256 único; 24 h desde emisión, un uso.
Reenvío explícito rota código/versión; cooldown 60 s. Sending vencido 30 s → unknown.
Resend idempotencia 24 h dentro de ejecución con mismo cuerpo/código/clave;
máximo dos intentos en presupuesto 8 s; resultado tardío nunca pisa versión nueva.
Sin mail configurado: 503 INTEGRATION_NOT_CONFIGURED, sin emitir/rotar, estado pendiente conservado.

## Activación

- POST /api/v1/auth/invitations/activate público: token/password/confirmPassword → 204.
- Identidad existente: 409 INVITATION_LOGIN_REQUIRED; login inline y aceptación autenticada.
- POST /api/v1/me/invitations/accept: token, cuenta/correo coincidente → 204.
- Nunca sobreescribir identidad existente ni reactivar inactivos/revocados.
- Fragmento /activate#token=… a memoria y replaceState; abrir/GET no consume.
- Cuenta nueva realiza login explícito después; códigos no van a logs o almacenamiento web.

## CSV

| Ruta institucional | Entrada/salida |
| --- | --- |
| POST /user-imports/preview | Multipart file + Idempotency-Key; 201 UserImport |
| GET /user-imports/{importId} | UserImport autorizado |
| POST /user-imports/{importId}/confirm | JSON {}; UserImport confirmado |

UserImport: id, status, expiresAt, confirmedAt nullable, totalRows, createdCount,
skippedCount y rows. Cada fila: rowNumber, name/email nullable, validationCode,
outcome nullable e invitationId nullable. Con invitación agrega deliveryStatus,
invitationStatus y deliveryVersion para continuar solo pendientes no ambiguos.
Validation: valid/already_member/already_pending/invalid_name/invalid_email/duplicate/revoked_membership.
UTF-8 name,email exactos, BOM/comillas/CRLF permitidos; ≤100 filas y 256 KiB.
Archivo original efímero. Preview 24 h no crea altas; cualquier fila inválida bloquea lote.
Confirmación atómica revalida scope y todas las precondiciones; conflicto: 409 y nueva preview.
Recibo recuperable por importId; repetir confirmación no duplica ni reenvía.
Después del commit, UI envía secuencialmente con progreso, pausa y continuación.
Accepted/unknown nunca se reenvían por continuación automática. Cierre de pestaña pausa.
PII CSV 7 días e invitaciones 30; recibo/FK mínimos permanecen. Tras depurar: mutaciones 410.
