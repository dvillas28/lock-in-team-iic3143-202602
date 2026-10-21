# Data Model: Instituciones demo y contexto de persistencia

## Entidades existentes

| Entidad | Alcance | Decisión |
| --- | --- | --- |
| institutions | Metadatos globales | UUID PK; slug único resuelto desde parámetro de ruta |
| users | Identidad global | Email normalizado único; hash Argon2id; sin rol académico global |
| institution_memberships | Institucional | FK compuesta; flags is_admin/is_super_admin independientes |
| courses / sections | Institucional | Creador inmutable; FK institución/curso/sección existentes |
| enrollments | Institucional | Roles teacher/assistant/student; historial conservado |
| course_modules / materials | Institucional | Visibilidad/publicación existentes |
| quizzes / grade_items | Institucional | Pauta, pesos y publicación existentes |
| quiz_attempts / grades | Institucional | Intento propio, evaluación y publicación existentes |
| grade_publications / audit_events | Institucional | Historia y eventos append-only preservados |

Aplicar ENABLE y FORCE RLS a las 12 tablas tenant-owned anteriores, incluida memberships.
No agregar institution_id a users ni convertir slug en FK.
Inventario verificable: memberships, courses, sections, enrollments, course_modules,
materials, quizzes, grade_items, quiz_attempts, grades, grade_publications, audit_events.

## Contexto efímero

TenantRequest: actor UUID verificado y slug validado proveniente exclusivamente del path institucional.
InstitutionContext: actor, institutionId, slug y membership activa resueltos por withInstitution.
Ambos son internos, no DTO aceptado desde body/header/query; no persistirlos en conexiones.
actor_id e institution_id se fijan con set_config transaction-local, sobre el mismo client.
Sin tenant no hay filas tenant-owned, salvo SELECT de memberships propias con actor local.
La excepción no aplica a DML ni cuando institution_id está establecido.
No asumir que un contexto inicial reemplaza locks de autorización durante escrituras.

## Nueva entidad operativa: demo_data_runs

| Campo | Regla |
| --- | --- |
| version | PK estable, inicialmente demo-institutions-v1 |
| input_fingerprint | Hash de manifiesto/operación normalizados, sin secretos |
| operator_ref | Identidad técnica de ejecución acotada, nunca contraseña |
| result | IDs finales de instituciones/users/memberships; sin hashes ni emails |
| applied_at | Fecha de commit operativo |

Tabla global operativa sin grants al runtime. Su marcador y las diez altas se confirman juntos.
Advisory lock único del dataset serializa versiones; row locks conservan orden User → Institution → Membership.
Mismatch de fingerprint/version conocida falla; replay válido verifica IDs y no modifica estado.
Borrar una identidad después de aplicar no autoriza recrearla por replay: conflicto operativo.

## Manifiesto v1

| Institución | Cuenta | Email | Rol inicial |
| --- | --- | --- | --- |
| UC | superadmin | superadmin.uc@academix.example | ambos flags true |
| UC | admin | admin.uc@academix.example | miembro sin flags |
| UC | teacher | teacher.uc@academix.example | miembro sin enrollment |
| UC | assistant | assistant.uc@academix.example | miembro sin enrollment |
| UC | student | student.uc@academix.example | miembro sin enrollment |
| UTFSM | superadmin | superadmin.utfsm@academix.example | ambos flags true |
| UTFSM | admin | admin.utfsm@academix.example | miembro sin flags |
| UTFSM | teacher | teacher.utfsm@academix.example | miembro sin enrollment |
| UTFSM | assistant | assistant.utfsm@academix.example | miembro sin enrollment |
| UTFSM | student | student.utfsm@academix.example | miembro sin enrollment |

Fijar UUIDs de users/memberships en demo-manifest.ts, namespace distinto al seed legacy.
Institución nueva tiene ID estable; adopción compatible conserva el ID real existente en el marcador.
Las diez identidades son nuevas: no reutilizar demo-multi ni transformar cuentas previas en superadmins.
No actualizar nombre/email/hash/active de una cuenta existente; conflicto de identidad se reporta sanitizado.
En base poblada no exigir totales globales 10/10 ni borrar cuentas legacy.

## Estado y auditoría

Demo pendiente → aplicada es atómico. Aplicada → replay es read-only; no recuperación implícita.
Fallo → sin marker ni altas parciales; no revertir migraciones de esquema ya confirmadas.
Nuevo evento membership.demoProvisioned, actor nulo solo para migrador, source operatorMigration,
operationId/operatorRef/fingerprint y snapshot permitido de IDs/flags; ampliar CHECK de forma acotada.
Las promociones/revocaciones posteriores usan membership.adminChanged y superAdminChanged actuales.
La carga no toca cursos, contenido, matrículas, intentos ni calificaciones existentes.

## Índices y privilegios

Reutilizar índices existentes por institución y FK compuestas. Medir EXPLAIN con runtime/RLS
para courses, enrollments y gradebook; añadir índice solo si el lookup real lo necesita.
Privilegios runtime por tabla/columna; memberships UPDATE solo is_admin/updated_at, sin altas ni is_super_admin.
Users/institutions read-only para identidad; prohibir DDL, TRUNCATE y lectura de demo_data_runs.
La matriz SQL y límites exactos están en [persistence](contracts/persistence.md).
