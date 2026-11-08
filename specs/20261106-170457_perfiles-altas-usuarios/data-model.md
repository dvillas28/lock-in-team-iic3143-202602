# Modelo técnico: cuentas y altas institucionales

[Plan](plan.md) · [Modelo completo de usuarios](../../docs/planning/perfiles/modelo-datos.md).
Migraciones aditivas. El estado implementado se acredita mediante pruebas de migración.

## Identidad global

| Entidad/campo | Regla |
| --- | --- |
| users.bio | varchar(500), nullable; vacío normalizado a null |
| users.avatar_key | varchar(512), nullable; clave interna avatars/userId/uuid.webp |
| users.credential_version | integer NOT NULL DEFAULT 0 CHECK ≥0 |
| users.name | Existente, trim no vacío, 1–200; solo dueño |
| users.updated_at | Existente; comparar expectedUpdatedAt con precisión de PostgreSQL |
| account_security_events | id, user_id, actor_user_id, action, occurred_at, metadata mínima |

No agregar tenant/role a users. No cambiar email, active ni credenciales ajenas.
Eventos de cuenta inmutables; no guardar contraseñas/hashes/códigos o bios completas.
CredentialVersion de JWT debe igualar la columna vigente en cada solicitud.

## Invitación institucional

account_invitations: id, institution_id, normalized_email, invited_name, created_by,
token_hash, expires_at, accepted_at, revoked_at, accepted_user_id, operation_key,
input_fingerprint, created_at, pii_purged_at y metadatos de última entrega.

- UNIQUE(institution_id,id), FK compuesta creador→membership; accepted_user_id→users.
- Token hash único; hash/expiración null hasta primera emisión; ambos exigidos en emisión vigente.
- Una pendiente por institución/correo normalizado; fechas validadas al operar, sin now() en índice parcial.
- Aceptación/revocación excluyentes; aceptación exige cuenta coincidente y permiso vigente del emisor.
- FORCE RLS por institución; excepción por código valida el secreto dentro de función acotada.
- Alta pendiente no crea User ni Membership. Aceptar crea Membership sin flags ni Enrollment.
- Cuenta/pertenencia inactiva o revocada no se reactiva por este flujo.

La entrega persiste delivery_status, delivery_version, delivery_key, provider_email_id,
delivery_attempts, delivery_started_at, last_delivery_at y last_delivery_error_code.
Estado correo: pending → sending → accepted/failed/quota_blocked/unknown.
Estado invitación: pending → accepted/revoked/expired; accepted del proveedor no activa.
Lease de sending: 30 s; código 24 h; reenvío separado 60 s y nueva versión/hash.
Red fuera de transacción; resultado tardío compara versión/clave antes de actualizar.

## Importación institucional

| Entidad | Datos mínimos e invariantes |
| --- | --- |
| user_imports | id, institution_id, created_by, status, fingerprint/key, total/created/skipped, created_at/expires_at/confirmed_at, pii_purged_at |
| user_import_rows | id, institution_id, import_id, row_number, name/email, validation_code, outcome, invitation_id |

UNIQUE(institution_id,id) en lote; UNIQUE(institution_id,import_id,row_number) en fila.
FK compuestas preservan lote/fila/invitación de la misma institución; FORCE RLS.
Preview 24 h; filas inmutables hasta confirmación; cambiar archivo requiere nuevo lote.
Confirmar bloquea lote y destinatarios en orden estable; revalida todas las filas;
cualquier cambio/conflicto revierte todo, incluidas invitaciones y auditoría.
importId identifica confirmación idempotente; replay no repite altas ni envíos.
El CSV original nunca se persiste: staging es información derivada, no copia binaria/codificada.

## Limpieza y evidencia

- CSV: depurar name/email/mensajes personales/fingerprint a 7 días de confirmación/expiración.
- Invitación: depurar nombre/email/hash/fingerprint a 30 días de finalización/vencimiento.
- Sin primera emisión: revocar/depurar a 30 días desde creación como default de diseño.
- Permitir null tras depuración, manteniendo estado/IDs/FK/fechas/contadores y claves opacas.
- No recuperar PII desde users para informes antiguos. Mutaciones de recurso depurado: 410.
- Auditoría/recibos mínimos permanecen; sin cascadas sobre cuentas, matrículas o historia.

## Privilegios y migración

Runtime conserva prohibición de INSERT/UPDATE arbitrario en identidad. Funciones
específicas de [seguridad](contracts/security.md) validan actor/contexto y precondiciones, realizan escritura+auditoría
atómica y no permiten SQL dinámico. Dueño NOLOGIN mínimo, search_path fijo,
EXECUTE revocado a PUBLIC; credenciales de operador fuera del servidor HTTP.
El operador necesita administrar el rol escritor existente; PG17 usa SET temporal
solo al transferir funciones y restaura sus permisos. Runtime nunca recibe esa pertenencia.
Readiness/runtime-check verifican nuevas tablas, FORCE RLS, funciones y grants.
Seeds siguen insert-only: no restituyen datos, contraseñas o permisos editados.
Rollback de aplicación no borra columnas ni revierte contraseñas cambiadas.
