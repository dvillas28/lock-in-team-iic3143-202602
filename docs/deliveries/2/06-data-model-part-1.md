# Modelo de datos

AcademiX utiliza una PostgreSQL compartida. `institutions.id` es la raíz del
tenant lógico y `institution_id` aparece en toda tabla académica tenant-owned.
`users` es global; `institution_memberships` relaciona identidades con las
Institutions a las que pueden acceder.

Modelo lógico con tipos PostgreSQL y límites acordados. Identidad y cursos/roles
usan NestJS, pg y node-pg-migrate con DDL versionado, sin ORM.

El catálogo tabular exportable se mantiene en
[12-data-catalog.md](12-data-catalog.md). Ese anexo enumera tablas, columnas,
tipos, PK/FK, nulabilidad y descripción para usarlo como planilla o insumo del
informe.

## Principios transversales

- UUID es la PK interna de Institution y de los recursos del dominio.
- `institutions.slug` es globalmente único y legible, pero no se usa como FK.
- Toda tabla tenant-owned declara `institution_id NOT NULL`.
- Cada tabla tenant-owned expone una clave candidata
  `unique (institution_id, id)` para relaciones compuestas.
- Las FK entre tablas tenant-owned incluyen `institution_id`.
- Las FK hacia User comprueban la pareja `(institution_id, user_id)` contra
  `institution_memberships` cuando la relación exige pertenencia institucional.
- Las unicidades académicas incluyen Institution cuando otras Institutions
  pueden reutilizar el mismo valor.
- Los índices comienzan por `institution_id` cuando el acceso real está scoped
  por Institution o respalda una FK/constraint compuesta.
- RLS implementada protege omisiones de filtro; runtime sin bypass.

## Entidades globales e institucionales

### institutions

Raíz de cada tenant lógico.

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | uuid | PK, globalmente único |
| slug | varchar(63) | único global, requerido |
| name | varchar(200) | requerido |
| active | boolean | requerido, default true |
| created_at | timestamptz(6) | requerido |
| updated_at | timestamptz(6) | requerido |

UC y UTFSM usan slugs `uc` y `utfsm`. Seed insert-only no promueve privilegios;
onboarding y recuperación son migraciones de datos operativas separadas.

### users

Identidades globales. El `sub` del JWT resuelve `users.id`; no se toma una
identidad desde el body de un request académico.

Campos: `id uuid PK`, `email varchar(254)`, `password_hash varchar(255)`,
`name varchar(200)`, `active boolean`,
`created_at timestamptz(6)`, `updated_at timestamptz(6)`.

Login local resuelve email normalizado mediante índice único lower(btrim(email));
JWT sub identifica User global, sin roles administrativos en sus claims.

`password_hash` es obligatorio para la autenticación local propuesta. Almacena
el hash Argon2id codificado completo, con algoritmo, parámetros y salt, con un
máximo de 255 caracteres. La contraseña ingresada admite entre 8 y 30 caracteres;
esa longitud se valida antes del hashing y no describe la longitud del hash.
El hash no se trunca ni se incluye en respuestas de API, logs o auditoría.
Referencia: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
Autenticación local implementada en identidad-acceso; no modifica privilegios.

### institution_memberships

Pertenencia base de un User a una Institution. No almacena roles académicos.

Campos: `id uuid PK`, `institution_id uuid FK`, `user_id uuid FK`,
`active boolean`, `is_admin boolean DEFAULT false`, `is_super_admin boolean DEFAULT false`,
`created_at timestamptz(6)`, `updated_at timestamptz(6)`.

Reglas:

- `unique (institution_id, user_id)` mantiene una relación estable que puede
  activarse o desactivarse sin duplicarla;
- `(institution_id, id)` es único para referencias institution-aware;
- índice `(user_id, active, institution_id)` para listar Institutions visibles;
- toda operación académica exige membership activa;
- is_super_admin delega solo is_admin dentro del tenant, con evento institucional;
- is_admin habilita creación y administración solo de cursos propios.

## Entidades tenant-owned

### courses

Ramos semestrales concretos.

Campos: `id uuid PK`, `institution_id uuid FK`, `code varchar(32)`, `name varchar(200)`,
`term varchar(16)`, `created_by uuid`, `created_at timestamptz(6)`.

Reglas:

- `unique (institution_id, code, term)`;
- `unique (institution_id, id)`;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- created_by es dueño único inmutable, derivado del actor; administrar exige is_admin;
- índice `(institution_id, created_by, id)` para listados de dueño.
- crear Course, su primera Section y el Enrollment `teacher` del creador ocurre
  en una transacción con eventos; revocar luego al último teacher conserva curso.

### sections

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `code varchar(32)`,
`capacity integer nullable`, `created_at timestamptz(6)`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- `unique (institution_id, course_id, code)`;
- `capacity >= 0` cuando exista;
- `(institution_id, id, course_id)` es único para relaciones que también
  comprueban el Course.


Enrollment.role es dominio cerrado teacher/student/assistant, varchar(16)+CHECK.
Se conserva frente a enum SQL: mismo rechazo, sin migración por formato.
[Reglas de matrícula](06-data-model-part-2.md).
