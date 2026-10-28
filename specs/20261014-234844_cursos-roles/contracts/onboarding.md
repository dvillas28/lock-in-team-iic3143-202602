# Onboarding PM y delegación institucional (US3)

## Alcance

InstitutionMembership incorpora is_super_admin e is_admin independientes.
Superadmin puede listar miembros activos y cambiar is_admin dentro de su tenant.
No accede a cursos ajenos, pauta o notas, ni concede is_super_admin por HTTP.
No hay superadmin global, invitaciones ni administración general de personas.

## Migración de datos del onboarding

Artefacto versionado: backend/src/data-migrations/onboard-institution.ts,
compilado y ejecutado explícitamente por el PM/operador; no arranca con HTTP,
no forma parte del seed demo ni modifica migraciones de schema ya aplicadas.
Usa la DB compartida y la misma versión de schema de cursos-roles.
Cada onboarding conserva operationId y operatorRef no secretos para trazabilidad.
Es una migración de datos parametrizada, no un endpoint de provisioning.

Entradas validadas: institutionSlug, institutionName, initialUserId UUID,
initialUserEmail, initialUserName, operationId, operatorRef.
Usar entorno ONBOARD_INSTITUTION_SLUG, ONBOARD_INSTITUTION_NAME,
ONBOARD_USER_ID, ONBOARD_USER_EMAIL, ONBOARD_USER_NAME, ONBOARD_OPERATION_ID,
ONBOARD_OPERATOR_REF y ONBOARD_INITIAL_PASSWORD (solo para identidad nueva).
Tras build ejecutar node backend/dist/data-migrations/onboard-institution.js;
no imprimir valores del entorno en errores.
Credenciales de DB y contraseña inicial nueva solo por entorno seguro; nunca
argumentos CLI, archivo versionado, logs, snapshots o respuestas del proceso.
Para User nuevo, exigir contraseña válida según identidad-acceso y hash Argon2id
con parámetros existentes. User existente se resuelve por UUID/email normalizado
coincidentes y activo; no cambiar nombre, hash, password ni estado de esa identidad.
Misma persona puede ser inicial en otra institución sin duplicar User.
Una colisión UUID/email o tenant preexistente no reconocido produce conflicto.

Transacción única: lock advisory por slug, validar identidades/colisiones,
crear Institution, crear o reutilizar User, crear membership con ambos flags true,
insertar AuditEvent membership.onboarded, COMMIT. Fallo revierte todas las altas.
Evento: actorUserId=null, courseId=null, sectionId=null, recurso=membership;
changes.before=null y after permitido con IDs/flags/origen operatorMigration,
source=operatorMigration, operationId/operatorRef e inputFingerprint SHA-256
del input inicial sin credenciales. Nunca aparenta usuario autenticado.
CHECK exige evidencia operativa para onboarding y cambios operativos de superadmin;
solo esas acciones admiten actor nulo. HTTP nunca genera eventos sin actor.
Unicidad parcial de evento de onboarding por institution_id evita doble bootstrap.

Repetir operationId y fingerprint inicial identifica evento ya aplicado y devuelve
alreadyApplied sin mutar filas, credentials, timestamps o flags vigentes.
Si parámetros estructurales difieren, rechazar; cambios posteriores legítimos del
nombre o email no se revierten. Evento conserva snapshot inicial no secreto.
No volver a promover is_admin/is_super_admin tras revocación aunque se repita.
No adoptar silenciosamente una institución existente sin evento de onboarding.
Para fixtures existentes UC/UTFSM, una migración operativa distinta y revisada
valida IDs y agrega primer superadmin explícitamente sin crear otro tenant.

Asignación, revocación y recuperación posterior usan la migración operativa
[set-superadmin.md](set-superadmin.md), con implementación y pruebas propias.
No se reutiliza onboard-institution para adoptar un tenant existente ni recuperar
permisos: su repetición siempre es no-op.

## Precondición para delegar a otras personas

Antes de delegar, PM verifica que cada destinatario tenga User y membership activos
en ese tenant y entrega sus UUID al responsable institucional. Esos registros
provienen del proceso operativo de altas de identidad/pertenencia, mediante
migraciones de datos revisadas de la institución; no del endpoint de delegación.
Este proceso externo debe estar completado antes del uso productivo de US3;
no se presume que exista un importador o endpoint de altas en esta misión.
Si falta una identidad/pertenencia, PM resuelve esa precondición fuera de este
alcance; PUT devuelve 404 y no crea ni reactiva registros. Tests independientes
provisionan estos destinatarios con fixtures explícitos, nunca usando US2.

## API protegida de delegación

Base: /api/v1/institutions/{institutionSlug}; Bearer, no-store y Problem comunes.

| Método / ruta | operationId | Resultado |
| --- | --- | --- |
| GET /memberships | listInstitutionMemberships | 200 página de miembros activos |
| PUT /memberships/{membershipId}/course-admin | setInstitutionCourseAdmin | 200 MembershipAdmin |

Cada ruta exige User/Institution/membership activos e is_super_admin vigente,
revalidados desde DB; no inferir autorización del JWT ni de flags enviados.
GET: limit 1..100/default 20, cursor validado y scoped al tenant/actor; orden
(created_at,id). Devuelve items,nextCursor,hasMore con solo miembros y User activos.
MembershipAdmin: id,user:{id,name,email,active},isAdmin,isSuperAdmin,active.
Flags camelCase, isSuperAdmin readOnly. Lista no concede acceso a cursos.
PUT: body exacto {isAdmin:boolean}; rechazar cualquier otro campo, incluyendo
isSuperAdmin, role, userId o institutionId. membershipId UUID del path.
Usuario/membership destino deben existir y estar activos en ese tenant; sin alta.

401 identidad inválida; 404 tenant inaccesible o membership ajena/inactiva;
403 actor miembro visible sin superadmin; 400 body/UUID/cursor inválido.
200 mismo estado es no-op; cambio real actualiza is_admin/updated_at y registra
membership.adminChanged con actor autenticado y snapshot permitido, todo atómico.
Error de auditoría implica rollback; DB caída 503 y otros fallos 500 sanitizados.
Lock User/Institution/memberships actor/destino en orden estable; revalidar flags
dentro de la transacción. Revocación operativa de superadmin usa orden compatible;
una operación iniciada tras COMMIT de revocación ya no puede delegar.
Superadmin puede cambiar su propio is_admin; eso no cambia is_super_admin.

## Validación

Probar onboarding nuevo/existente User, repetición y concurrencia, colisiones,
fallo final de evento, ausencia de secretos y nunca reponer privilegios.
Probar SQL directo con actor nulo y evidencia operativa ausente/null: CHECK rechaza.
Con fixtures de UC/UTFSM, delegar/revocar, repetir PUT, atacar membershipId ajeno,
forjar isSuperAdmin y probar admin/teacher sin delegación. Verificar rollback y
revocación concurrente; is_admin habilita US2 solo en el tenant correspondiente.
