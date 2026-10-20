# Data Model: Base persistente

Fuente: [modelo vigente](../../docs/deliveries/2/06-data-model.md).
Solo tres tablas de dominio; pgmigrations pertenece a la herramienta.

## Institution — institutions

| Campo | PostgreSQL | Reglas |
| --- | --- | --- |
| id | uuid | PK; estable, generado antes de insertar |
| slug | varchar(63) | NOT NULL, UNIQUE global |
| name | varchar(200) | NOT NULL, no vacío |
| active | boolean | NOT NULL, default true |
| created_at | timestamptz(6) | NOT NULL, default now() |
| updated_at | timestamptz(6) | NOT NULL, default now() |

Validar slug normalizado lowercase ASCII: letras/números y guiones internos,
1–63 caracteres, sin guiones al inicio/final. UC=uc; UTFSM=utfsm.
UUID y slug no se confunden: las FK referencian UUID.
No implementar cambios de slug/estado mediante HTTP en esta misión.

## User — users

| Campo | PostgreSQL | Reglas |
| --- | --- | --- |
| id | uuid | PK global; estable, sin duplicación por institución |
| email | varchar(254) | NOT NULL; sin unicidad global nueva |
| password_hash | varchar(255) | NOT NULL; PHC Argon2id completo |
| name | varchar(200) | NOT NULL, no vacío |
| active | boolean | NOT NULL, default true |
| created_at | timestamptz(6) | NOT NULL, default now() |
| updated_at | timestamptz(6) | NOT NULL, default now() |

El manifiesto versionado se verifica en pruebas; SQL impone límites y checks.
La CLI valida las contraseñas recibidas del entorno antes de conectar.
Contraseña de entrada: 8–30 caracteres Unicode; nunca persistirla.
El hash usa sal aleatoria; comprobar el valor codificado sin truncarlo.
No agregar username, proveedor externo ni índices de login especulativos.

## InstitutionMembership — institution_memberships

| Campo | PostgreSQL | Reglas |
| --- | --- | --- |
| id | uuid | PK estable desde la primera inserción |
| institution_id | uuid | NOT NULL, FK → institutions.id |
| user_id | uuid | NOT NULL, FK → users.id |
| active | boolean | NOT NULL, default true |
| created_at | timestamptz(6) | NOT NULL, default now() |
| updated_at | timestamptz(6) | NOT NULL, default now() |

Constraints obligatorias:
- UNIQUE(institution_id, user_id): relación estable, incluso desactivada.
- UNIQUE(institution_id, id): referencia tenant-aware futura.
- FK con ON DELETE RESTRICT y ON UPDATE RESTRICT, sin cascadas.
- Índice (user_id, active, institution_id) para listar instituciones accesibles.

La PK UUID global no reemplaza las claves compuestas. La pareja institucional
permite FK académicas futuras, pero no expresa active: esa condición se valida
en autorización al implementar identidad/cursos.

## Relaciones y scope

User 1 → N InstitutionMembership ← N Institution.
Una membership no contiene roles; no crear Course, Enrollment o AuditEvent.
Nunca usar institution_id recibido de cliente para seed: el operador usa
slugs del manifiesto y resuelve UUID desde la base.

Esta misión prueba unicidad y FK sobre sus tres tablas; las FK cruzadas de
entidades académicas todavía no existen y se prueban con sus propias specs.

## Estados e historia

Institution/User/Membership nacen activos salvo fixture de prueba explícito.
El seed inserta faltantes y conserva campos, hashes, estados y timestamps
existentes. No reactiva, actualiza ni elimina filas.
Desactivación efectiva de acceso se implementará en identidad; cambios sensibles
académicos se auditarán desde cursos-roles, sin relajar AuditEvent.course_id.

Un conflicto de UUID/identidad o email demo ya usado por otro UUID falla sin
reutilizar un usuario arbitrario. Esto protege seed; no agrega unicidad
global de email a la tabla.

## Evolución de esquema

Una migración inicial crea constraints e índices en transacción y el migrador
mantiene pgmigrations. Usar up explícito; down inicial debe rechazar ejecución
destructiva. Solo entornos de test descartables pueden recrearse íntegramente.
Cambios siguientes son aditivos y preservan lectura de la versión anterior.
Actualizaciones futuras de registros deben fijar updated_at explícitamente;
no agregar triggers de auditoría o de timestamps que hoy no se usan.
