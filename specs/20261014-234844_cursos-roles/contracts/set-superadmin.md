# Migración operativa: asignar y recuperar superadmin

Completa FR-014; no es endpoint ni reutiliza el onboarding de tenant nuevo.
Artefacto objetivo: backend/src/data-migrations/set-superadmin.ts.
Ejecución tras build: node backend/dist/data-migrations/set-superadmin.js.
Solo PM/operador con acceso controlado a DB; nunca accesible desde HTTP.

## Entradas

Entorno: DATABASE_URL, SUPERADMIN_INSTITUTION_SLUG, SUPERADMIN_USER_ID,
SUPERADMIN_ENABLED (true|false), SUPERADMIN_REPLACEMENT_USER_ID opcional,
SUPERADMIN_OPERATION_ID y SUPERADMIN_OPERATOR_REF.
Validar slug, UUID, boolean exacto, operationId/operatorRef no vacíos y acotados.
No passwords ni hashes; no modificar User ni crear/reactivar membership.
Objetivo y reemplazo deben ser User y membership activos del mismo tenant.
Rechazar identificadores ajenos o inactivos sin producir cambios.

## Transacción

1. BEGIN; bloquear Users implicados por UUID, Institution FOR UPDATE y memberships
   por UUID FOR UPDATE, en ese orden y sin subir locks de SHARE a UPDATE.
2. Revalidar estado institucional, pertenencias y operación ya aplicada bajo locks.
3. Para habilitar, cambiar solo is_super_admin=true del objetivo; sirve también
   para recuperar un tenant que ya no tiene un superadmin activo.
4. Para deshabilitar, contar superadmins con User/membership activos en el tenant.
   Si el objetivo es el último, exigir reemplazo distinto y activo; habilitarlo
   y deshabilitar objetivo en esta misma transacción. Sin reemplazo, rechazar.
5. Registrar por cada cambio efectivo membership.superAdminChanged, con actor nulo,
   courseId/sectionId nulos, source=operatorMigration, operationId/operatorRef,
   before/after de flags e IDs permitidos; nunca alterar is_admin o Enrollment.
6. COMMIT; ante fallo, ROLLBACK de todos los flags y eventos. Release en finally.

La serialización por Institution cubre carreras entre migraciones de este flag,
no promete evitar desactivaciones generales de cuentas fuera del alcance.
El primer superadmin de UC/UTFSM preexistentes puede asignarse con este artefacto,
sin adoptar el tenant por onboarding ni crear un segundo tenant.

## Repetición y evidencia

Reutilizar operationId con mismos tenant, objetivo, estado y reemplazo: no-op,
incluso si después cambian los flags. Una operación nueva requiere ID nuevo.
Mismo operationId con parámetros diferentes: conflicto; registrar fingerprint
inicial normalizado sin secretos en cada evento operativo de esa operación.
Unicidad de evento (institution_id, action, operationId, resource_id) para esta
acción evita duplicación; un reemplazo puede generar dos eventos con mismo ID.
Repetición sin eventos porque no había cambios devuelve no-op según estado actual;
no se considera operación aplicada hasta que tenga eventos de cambio efectivo.
Salida solo outcome, changed, operationId e IDs; errores sanitizados/no cero.
Auditoría append-only es la evidencia de migración, no un permiso de autoservicio.

## Pruebas requeridas

- Conceder y revocar, recuperar con cero superadmins activos, preservar is_admin.
- Revocar último sin reemplazo: rechazo; con reemplazo: ambos cambios atómicos.
- Reemplazo mismo objetivo, ajeno o inactivo: rechazo sin cambios.
- Repetir operación aplicada no repone privilegios; parámetros distintos fallan.
- Dos revocaciones concurrentes no dejan cero superadmins por cambio de flag.
- Fallo en último evento revierte también el reemplazo; sin secretos en salida.
- Después del COMMIT de revocación, PUT de delegación del afectado da 403;
  del reemplazo activo funciona dentro de su tenant, sin endpoints de US2.
