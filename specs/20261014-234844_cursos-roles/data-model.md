# Data Model: Cursos, roles y auditoría

Todas las tablas usan UUID; fechas timestamptz(6). SQL público parametrizado.
Modelo implementado mediante migración nueva; evidencia en docs/backend/courses-roles-validation.md.

## InstitutionMembership (extensión)

Agregar is_admin e is_super_admin boolean NOT NULL DEFAULT false mediante nueva migración.
Conservar UNIQUE(institution_id,user_id) y estados/timestamps existentes.
No roles académicos aquí. is_admin cambia por superadmin del tenant con auditoría;
is_super_admin solo por migración operativa controlada. No hay herencia entre flags.
No permitir su escritura desde requests académicos ni claims JWT.

## Course

id, institution_id, code varchar(32), name varchar(200), term varchar(16),
created_by uuid, created_at; todos NOT NULL.
UNIQUE(institution_id,id), UNIQUE(institution_id,code,term).
FK(institution_id,created_by) -> institution_memberships(institution_id,user_id).
created_by inmutable en API y trigger DB; no hay transferencia.
Cadenas trim, no vacías; códigos y periodo sensibles a mayúsculas tras trim.
Índice de listado por (institution_id,created_by,id); unicidad cubre code/term.

## Section

id, institution_id, course_id, code varchar(32), capacity integer nullable,
created_at; demás campos NOT NULL.
FK(institution_id,course_id) -> courses(institution_id,id), DELETE RESTRICT.
UNIQUE(institution_id,id), UNIQUE(institution_id,id,course_id),
UNIQUE(institution_id,course_id,code). CHECK(capacity IS NULL OR capacity>=0).
No mover una sección entre cursos ni eliminarla físicamente.

## Enrollment

id, institution_id, section_id, user_id, role varchar(16), active boolean,
created_at; todos NOT NULL. role IN ('teacher','student','assistant').
UNIQUE(institution_id,id); FK(institution_id,section_id) -> sections;
FK(institution_id,user_id) -> institution_memberships(institution_id,user_id).
Unicidad parcial (institution_id,section_id,user_id,role) WHERE active.
Índices (institution_id,user_id,active,section_id) y
(institution_id,section_id,active,id) para visibilidad y participantes paginados.
No cascade delete. Inactividad conserva fila y referencias.
Último teacher puede desactivarse; curso y ownership permanecen, sin transferencia
ni reactivación automática. La presencia docente obligatoria se valida al crear.
Cambiar role: desactivar origen y crear sucesor o devolver destino ya activo.
Origen histórico no cambia user/section/role; trigger DB impide alterarlos.
Reactivar fila inactiva con active=true exige membresía activa y no duplicar rol.
Si ya hay otro activo igual, 409; jamás reemplazarlo silenciosamente.

## AuditEvent

id, institution_id, actor_user_id nullable, action varchar(64), resource_type varchar(32),
resource_id uuid, course_id uuid nullable, section_id uuid nullable,
occurred_at, changes jsonb; demás campos NOT NULL. actor_user_id nulo solo en
membership.onboarded/superAdminChanged con origen y operación del PM en changes.after.
FK institucional de actor a membership; FK(institution_id,course_id) -> courses;
FK(institution_id,section_id,course_id) -> sections(institution_id,id,course_id).
CHECK: section_id requiere course_id; course_id nulo solo si
resource_type='institutionMembership' y action IN ('membership.adminChanged',
'membership.superAdminChanged','membership.onboarded').
CHECK: actor nulo solo para membership.onboarded o membership.superAdminChanged
con source=operatorMigration y operationId/operatorRef no vacíos;
resto exige actor_user_id válido. CHECK de evidencia operativa usa predicado
IS TRUE (no permitir que campos JSON ausentes/null eludan la restricción).
Índice parcial único de onboarding por institution_id.
Para ese tipo, validar resource_id contra membership de la institución en trigger;
para Course/Section/Enrollment validar recurso y contexto en la transacción.
Índice (institution_id,course_id,occurred_at,id) para historial y cursor.
Sin UPDATE/DELETE: trigger rechaza ambos para todo evento; no endpoint de escritura.
Recurso polimórfico: API/CLI controla IDs; DB protege las relaciones explícitas.
Sin secretos, SQL, hashes de credenciales, email, tokens ni payloads completos en changes.
Snapshots permitidos: curso code/name/term/createdBy; sección code/capacity;
enrollment id/userId/sectionId/role/active; membership id/userId/isAdmin/isSuperAdmin y source/operatorRef/operationId;
inputFingerprint en onboarding y operaciones de superadmin compara input inicial
sin credenciales. Para superAdminChanged: unicidad por institution_id, action,
changes.after.operationId y resource_id; eventos del reemplazo comparten operationId.
Cambios sin diferencia no generan evento nuevo.

## Transacciones y concurrencia

Orden global de locks: User por UUID → Institution → memberships por UUID →
Course → Enrollment, igual en HTTP y migraciones. Tomar modo definitivo desde
el primer lock; no subir SHARE a UPDATE. Operación que cambia flags toma
memberships FOR UPDATE; recuperación de último superadmin, Institution FOR UPDATE.
Toda escritura académica: BEGIN, identidad/institución/memberships activas bajo
FOR SHARE (orden global anterior), curso FOR UPDATE,
Enrollments que autorizan FOR SHARE, autorización vigente, validación, mutación,
eventos, COMMIT. Locks sobre User/Institution de actor y destinatario protegen
también su revocación concurrente; no basta bloquear solo membership.
Usar PoolClient único y release en finally; fallo implica ROLLBACK.
Creación de curso bloquea membership actor antes de insertar course+section+teacher.
Delegación HTTP bloquea memberships actor/destino FOR UPDATE en orden estable,
revalida is_super_admin y audita en la misma tx; una revocación operativa de
superadmin usa locks compatibles. Ver contracts/onboarding.md para bootstrap.
Revocar estados mediante UPDATE espera transacciones previas; petición iniciada
tras COMMIT observa revocación. Lecturas usan JOIN en cada consulta, sin cache.
Locks serializan escrituras de un curso; UNIQUE parcial protege duplicados SQL.
Reintento de alta ya activa devuelve existente; código de curso/sección repetido
produce 409. No reintentos automáticos de operaciones no idempotentes.

## Migración y bootstrap

Migración 20261016000100_courses_roles.sql agrega dos booleanos y cuatro tablas.
Datos previos obtienen false; no promover todos los docentes ni inferir admin.
No modificar migraciones aplicadas. Conservar usuarios/memberships existentes.
Seed sigue insert-only, sin cursos ni promociones; fixtures test aislados cubren
owners distintos, roles múltiples, dos secciones y admin UC/no-admin UTFSM.
Onboarding PM usa migración de datos versionada y controlada del contrato
contracts/onboarding.md; crea/reutiliza identidad sin resetear passwords ni flags.
Rollback operativo de esquema con datos académicos no se ejecuta automáticamente.
