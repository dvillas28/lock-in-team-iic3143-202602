# Modelo de datos

AcademiX utiliza una PostgreSQL compartida. `institutions.id` es la raíz del
tenant lógico y `institution_id` aparece en toda tabla académica tenant-owned.
`users` es global; `institution_memberships` relaciona identidades con las
Institutions a las que pueden acceder.

Este es un modelo lógico con tipos PostgreSQL y límites de cadenas acordados. El repositorio todavía no elige ORM, herramienta de
migraciones ni DDL ejecutable.

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
- RLS no forma parte del MVP.

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

UC y UTFSM usan los slugs `uc` y `utfsm` en la misma tabla. Su bootstrap futuro
será idempotente y separado de las migraciones.

### users

Identidades globales. El `sub` del JWT resuelve `users.id`; no se toma una
identidad desde el body de un request académico.

Campos: `id uuid PK`, `email text`, `password_hash varchar(255)`,
`name varchar(200)`, `active boolean`,
`created_at timestamptz(6)`, `updated_at timestamptz(6)`.

El modelo actual autentica por `sub`, no por email. Por eso esta revisión no
introduce una nueva promesa de unicidad global de email; deberá alinearse con el
proveedor de identidad cuando se diseñe autenticación.

`password_hash` es obligatorio para la autenticación local propuesta. Almacena
el hash Argon2id codificado completo, con algoritmo, parámetros y salt, con un
máximo de 255 caracteres. La contraseña ingresada admite entre 8 y 30 caracteres;
esa longitud se valida antes del hashing y no describe la longitud del hash.
El hash no se trunca ni se incluye en respuestas de API, logs o auditoría.
Referencia: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
El flujo de autenticación y su implementación permanecen pendientes.

### institution_memberships

Pertenencia base de un User a una Institution. No almacena roles académicos.

Campos: `id uuid PK`, `institution_id uuid FK`, `user_id uuid FK`,
`active boolean`, `created_at timestamptz(6)`, `updated_at timestamptz(6)`.

Reglas:

- `unique (institution_id, user_id)` mantiene una relación estable que puede
  activarse o desactivarse sin duplicarla;
- `(institution_id, id)` es único para referencias institution-aware;
- índice `(user_id, active, institution_id)` para listar Institutions visibles;
- toda operación académica exige membership activa;
- cambios de estado generan AuditEvent cuando exista un contexto académico que
  corresponda auditar.

## Entidades tenant-owned

### courses

Ramos semestrales concretos.

Campos: `id uuid PK`, `institution_id uuid FK`, `code varchar(32)`, `name varchar(200)`,
`term varchar(16)`, `created_by uuid`, `created_at timestamptz(6)`.

Reglas:

- `unique (institution_id, code, term)`;
- `unique (institution_id, id)`;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- índice `(institution_id, term, code)` para listados institucionales.
- crear Course, su primera Section y el Enrollment `teacher` del creador ocurre
  en una sola transacción para evitar cursos sin docente responsable.

### sections

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `code varchar(32)`,
`capacity integer nullable`, `created_at timestamptz(6)`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- `unique (institution_id, course_id, code)`;
- `capacity >= 0` cuando exista;
- `(institution_id, id, course_id)` es único para relaciones que también
  comprueban el Course.

### enrollments

Tabla pivote académica. Una fila indica que un User pertenece a una Section de
un Course de una Institution con un rol específico. No almacena `course_id`
porque Section ya pertenece a Course; las consultas obtienen el Course mediante
la FK de Section. Se conserva `institution_id` para scope, índices y FK
institution-aware.

Campos: `id uuid PK`, `institution_id uuid`, `section_id uuid`,
`user_id uuid`, `role text`, `active boolean`, `created_at timestamptz(6)`.

Reglas:

- `role in ('teacher', 'student', 'assistant')`;
- FK `(institution_id, section_id)` referencia Section;
- FK `(institution_id, user_id)` referencia InstitutionMembership;
- único parcial
  `(institution_id, section_id, user_id, role) WHERE active`;
- índices `(institution_id, user_id, active)` y
  `(institution_id, section_id, role, active)`;
- `teacher` administra curso y sección dentro del MVP; `assistant` apoya
  seguimiento académico sin administrar configuración; `student` consume el
  flujo estudiantil;
- desactivar o cambiar un rol no elimina su evidencia histórica y genera
  auditoría.

### course_modules

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `title varchar(200)`,
`position integer`, `published_at timestamptz(6) nullable`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- `unique (institution_id, course_id, position)`;
- no tiene `section_id`: el módulo pertenece al Course completo;
- estudiantes ven solo módulos publicados de cursos autorizados.

### materials

Markdown o metadatos de un archivo externo.

Campos: `id uuid PK`, `institution_id uuid`, `module_id uuid`, `title varchar(200)`,
`kind text`, `markdown_body text nullable`, `storage_key text nullable`,
`mime_type text nullable`, `size_bytes bigint nullable`,
`published_at timestamptz(6) nullable`, `created_by uuid`.

Reglas:

- FK `(institution_id, module_id)` referencia CourseModule;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- no tiene `section_id`: el material publicado es común para todas las secciones
  del Course del módulo;
- `kind in ('markdown', 'file')`;
- markdown exige cuerpo y excluye campos de archivo;
- file exige metadatos, MIME permitido y `size_bytes >= 0`;
- el futuro `storage_key` usa namespace interno por Institution, no se expone a
  clientes ni auditoría;
- el backend valida InstitutionMembership y matrícula antes de servir contenido.

### quizzes

Quiz de Course o de una Section del mismo Course.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`,
`section_id uuid nullable`, `title varchar(200)`, `instructions text nullable`,
`opens_at timestamptz(6) nullable`, `closes_at timestamptz(6) nullable`,
`max_attempts integer nullable`, `published_at timestamptz(6) nullable`,
`created_by uuid`, `questions jsonb`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, section_id, course_id)` referencia Section cuando existe;
- FK `(institution_id, created_by)` referencia InstitutionMembership;
- `max_attempts IS NULL OR max_attempts > 0`;
- `opens_at < closes_at` cuando ambos existen;
- `(institution_id, id, course_id)` es único para relaciones posteriores;
- `questions` es un arreglo JSON con `id` local, `position`, `prompt`, `points`
  y `alternatives`;
- cada pregunta tiene `points > 0`;
- cada pregunta contiene al menos dos alternativas, IDs locales únicos y
  exactamente una correcta;
- los IDs de pregunta y alternativa son estables dentro del Quiz y se usan en
  `quiz_attempts.answers`;
- pauta y campos de corrección nunca aparecen en la vista estudiantil,
  auditoría o logs;
- tras el primer intento se inmovilizan pauta, puntajes y política de intentos.

### quiz_attempts

Conserva Institution, Course y Section históricas.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `quiz_id uuid`,
`section_id uuid`, `student_id uuid`, `attempt_number integer`, `status text`,
`started_at timestamptz(6)`, `submitted_at timestamptz(6) nullable`,
`cancelled_at timestamptz(6) nullable`, `answers jsonb`,
`score_points numeric(8,2) nullable`, `score_percent numeric(5,2) nullable`.

Reglas:

- `status in ('in_progress', 'submitted', 'graded', 'cancelled')`;
- FK `(institution_id, quiz_id, course_id)` referencia Quiz;
- FK `(institution_id, section_id, course_id)` referencia Section;
- FK `(institution_id, student_id)` referencia InstitutionMembership;
- `unique (institution_id, quiz_id, student_id, attempt_number)`;
- `(institution_id, id, quiz_id, student_id, section_id)` es único para Grade;
- único parcial
  `(institution_id, quiz_id, student_id) WHERE status = 'in_progress'`;
- iniciar valida membership, Enrollment student, scope, ventana, máximo, acceso a
  pauta y ausencia de nota publicada;
- `score_percent between 0 and 100` cuando exista;
- cancelación conserva número, no crea Grade y genera AuditEvent;
- respuestas y corrección quedan inmutables al calificar.

### grade_items

Evaluaciones ponderadas del libro de notas. Un GradeItem define que un Quiz
cuenta como ítem evaluado del Course, con un peso porcentual. No representa una
nota de estudiante.

Campos: `id uuid PK`, `institution_id uuid`, `course_id uuid`, `quiz_id uuid`,
`title varchar(200)`, `weight_percent numeric(5,2)`, `created_at timestamptz(6)`.

Reglas:

- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, quiz_id, course_id)` referencia Quiz;
- `unique (institution_id, quiz_id)`;
- `(institution_id, id, quiz_id)` es único para Grade;
- `weight_percent between 0 and 100`;
- el reemplazo de ponderaciones es atómico y debe sumar 100 % antes de publicar;
- después de la primera Grade publicada no se agregan ítems ni cambian pesos.

### grades

Nota vigente por estudiante y GradeItem. Una fila representa el resultado de un
estudiante en un ítem evaluado, derivado desde un QuizAttempt.

Campos: `id uuid PK`, `institution_id uuid`, `grade_item_id uuid`,
`quiz_id uuid`, `student_id uuid`, `section_id uuid`, `attempt_id uuid`,
`score_percent numeric(5,2)`, `grade_value numeric(3,1)`,
`published_at timestamptz(6) nullable`, `created_at timestamptz(6)`,
`updated_at timestamptz(6)`.

Reglas:

- `unique (institution_id, grade_item_id, student_id)`;
- FK `(institution_id, grade_item_id, quiz_id)` referencia GradeItem;
- FK `(institution_id, attempt_id, quiz_id, student_id, section_id)` referencia
  QuizAttempt;
- FK `(institution_id, student_id)` referencia InstitutionMembership;
- `score_percent between 0 and 100`;
- `grade_value between 1.0 and 7.0`, a un decimal;
- índice `(institution_id, student_id, published_at)` para la vista propia;
- el último intento graded actualiza una Grade no publicada y genera auditoría;
- una Grade publicada es inmutable.

### audit_events

Historial académico inmutable y tenant-owned.

Campos: `id uuid PK`, `institution_id uuid`, `actor_user_id uuid`,
`action text`, `resource_type text`, `resource_id uuid`, `course_id uuid`,
`section_id uuid nullable`, `occurred_at timestamptz(6)`, `changes jsonb`.

Reglas:

- FK `(institution_id, actor_user_id)` referencia InstitutionMembership;
- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, section_id, course_id)` referencia Section cuando existe;
- actualización y borrado están prohibidos por permisos de persistencia o un
  mecanismo equivalente que se definirá con la implementación;
- índice `(institution_id, course_id, occurred_at DESC)`;
- `resource_id` es polimórfico y se valida dentro de la operación de dominio;
- changes omite JWT, credenciales, claves de almacenamiento y pauta;
- evento y cambio académico se confirman en la misma transacción.

## Cálculo del libro de notas

1. `score_percent = 100 * score_points / sum(question.points)` con dos decimales
   y `HALF_UP`.
2. Hasta 60 %, `grade_value = 1 + score_percent * 3 / 60`; sobre 60 %,
   `grade_value = 4 + (score_percent - 60) * 3 / 40`, a un decimal.
3. El promedio parcial usa solo Grades publicadas:
   `sum(grade_value * weight_percent) / sum(weight_percent)`.
4. Sin ponderación publicada el promedio es `null`.
5. El backend calcula el promedio; no se almacena como columna derivada.

## Transacciones críticas

- Crear Course: insertar Course, primera Section y Enrollment `teacher` del
  creador con la misma `institution_id`.
- Iniciar intento: bloquear la serie
  `(institution_id, quiz_id, student_id)`, validar permisos y asignar número.
- Finalizar intento: inmovilizar respuestas, calificar, actualizar Grade no
  publicada y registrar AuditEvent en una transacción.
- Cancelar intento: cambiar estado, fijar fecha y auditar sin alterar Grade.
- Publicar Grades: validar scope, intentos, ponderaciones y ausencia de intentos
  activos; publicar y auditar atómicamente.
- Cambiar ponderaciones: bloquear el libro de la Institution y Course, validar
  suma y ausencia de publicaciones, persistir y auditar.

## Migraciones y backfills

- Existe una sola secuencia de migraciones para la PostgreSQL compartida.
- No se coordinan schemas ni versiones entre bases por Institution.
- La herramienta de migraciones se elegirá en un plan posterior.
- Un backfill futuro filtra explícitamente por `institution_id`, es idempotente
  cuando corresponde y usa lotes cuando el volumen lo requiere.
- Un backfill nunca infiere ni mezcla la Institution mediante datos del cliente.

## Backup y recuperación

Backup y point-in-time recovery cubren la PostgreSQL compartida completa.
Export/import lógico de una Institution puede evaluarse en el futuro, pero
restore independiente no es una capacidad del MVP.

## ERD Mermaid

```mermaid
erDiagram
  direction LR
  INSTITUTIONS {
    uuid id PK "NOT NULL"
    varchar(63) slug "NOT NULL"
    varchar(200) name "NOT NULL"
    boolean active "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
    timestamptz(6) updated_at "NOT NULL"
  }

  USERS {
    uuid id PK "NOT NULL"
    text email "NOT NULL"
    varchar(255) password_hash "NOT NULL"
    varchar(200) name "NOT NULL"
    boolean active "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
    timestamptz(6) updated_at "NOT NULL"
  }

  INSTITUTION_MEMBERSHIPS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid user_id FK "NOT NULL"
    boolean active "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
    timestamptz(6) updated_at "NOT NULL"
  }

  COURSES {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    varchar(32) code "NOT NULL"
    varchar(200) name "NOT NULL"
    varchar(16) term "NOT NULL"
    uuid created_by FK "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
  }

  SECTIONS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    varchar(32) code "NOT NULL"
    integer capacity "NULL"
    timestamptz(6) created_at "NOT NULL"
  }

  ENROLLMENTS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid section_id FK "NOT NULL"
    uuid user_id FK "NOT NULL"
    text role "NOT NULL"
    boolean active "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
  }

  COURSE_MODULES {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    varchar(200) title "NOT NULL"
    integer position "NOT NULL"
    timestamptz(6) published_at "NULL"
  }

  MATERIALS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid module_id FK "NOT NULL"
    varchar(200) title "NOT NULL"
    text kind "NOT NULL"
    text markdown_body "NULL"
    text storage_key "NULL"
    text mime_type "NULL"
    bigint size_bytes "NULL"
    timestamptz(6) published_at "NULL"
    uuid created_by FK "NOT NULL"
  }

  QUIZZES {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    uuid section_id FK "NULL"
    varchar(200) title "NOT NULL"
    text instructions "NULL"
    timestamptz(6) opens_at "NULL"
    timestamptz(6) closes_at "NULL"
    integer max_attempts "NULL"
    timestamptz(6) published_at "NULL"
    uuid created_by FK "NOT NULL"
    jsonb questions "NOT NULL"
  }

  QUIZ_ATTEMPTS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    uuid quiz_id FK "NOT NULL"
    uuid section_id FK "NOT NULL"
    uuid student_id FK "NOT NULL"
    integer attempt_number "NOT NULL"
    text status "NOT NULL"
    timestamptz(6) started_at "NOT NULL"
    timestamptz(6) submitted_at "NULL"
    timestamptz(6) cancelled_at "NULL"
    jsonb answers "NOT NULL"
    numeric(8,2) score_points "NULL"
    numeric(5,2) score_percent "NULL"
  }

  GRADE_ITEMS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    uuid quiz_id FK "NOT NULL"
    varchar(200) title "NOT NULL"
    numeric(5,2) weight_percent "NOT NULL"
    timestamptz(6) created_at "NOT NULL"
  }

  GRADES {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid grade_item_id FK "NOT NULL"
    uuid quiz_id FK "NOT NULL"
    uuid student_id FK "NOT NULL"
    uuid section_id FK "NOT NULL"
    uuid attempt_id FK "NOT NULL"
    numeric(5,2) score_percent "NOT NULL"
    numeric(3,1) grade_value "NOT NULL"
    timestamptz(6) published_at "NULL"
    timestamptz(6) created_at "NOT NULL"
    timestamptz(6) updated_at "NOT NULL"
  }

  AUDIT_EVENTS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid actor_user_id FK "NOT NULL"
    text action "NOT NULL"
    text resource_type "NOT NULL"
    uuid resource_id "NOT NULL; referencia polimorfica sin FK"
    uuid course_id FK "NOT NULL"
    uuid section_id FK "NULL"
    timestamptz(6) occurred_at "NOT NULL"
    jsonb changes "NOT NULL"
  }

  INSTITUTIONS ||--o{ INSTITUTION_MEMBERSHIPS : "institution_id"
  INSTITUTIONS ||--o{ COURSES : "institution_id"
  INSTITUTIONS ||--o{ SECTIONS : "institution_id"
  INSTITUTIONS ||--o{ ENROLLMENTS : "institution_id"
  INSTITUTIONS ||--o{ COURSE_MODULES : "institution_id"
  INSTITUTIONS ||--o{ MATERIALS : "institution_id"
  INSTITUTIONS ||--o{ QUIZZES : "institution_id"
  INSTITUTIONS ||--o{ QUIZ_ATTEMPTS : "institution_id"
  INSTITUTIONS ||--o{ GRADE_ITEMS : "institution_id"
  INSTITUTIONS ||--o{ GRADES : "institution_id"
  INSTITUTIONS ||--o{ AUDIT_EVENTS : "institution_id"
  USERS ||--o{ INSTITUTION_MEMBERSHIPS : "user_id"
  INSTITUTION_MEMBERSHIPS ||--o{ COURSES : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ ENROLLMENTS : "institution_id+user_id"
  INSTITUTION_MEMBERSHIPS ||--o{ MATERIALS : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ QUIZZES : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ QUIZ_ATTEMPTS : "institution_id+student_id"
  INSTITUTION_MEMBERSHIPS ||--o{ GRADES : "institution_id+student_id"
  INSTITUTION_MEMBERSHIPS ||--o{ AUDIT_EVENTS : "institution_id+actor_user_id"
  COURSES ||--o{ SECTIONS : "institution_id+course_id"
  COURSES ||--o{ COURSE_MODULES : "institution_id+course_id"
  COURSES ||--o{ QUIZZES : "institution_id+course_id"
  COURSES ||--o{ GRADE_ITEMS : "institution_id+course_id"
  COURSES ||--o{ AUDIT_EVENTS : "institution_id+course_id"
  SECTIONS ||--o{ ENROLLMENTS : "institution_id+section_id"
  COURSE_MODULES ||--o{ MATERIALS : "institution_id+module_id"
  SECTIONS |o--o{ QUIZZES : "institution_id+section_id+course_id"
  SECTIONS ||--o{ QUIZ_ATTEMPTS : "institution_id+section_id+course_id"
  SECTIONS |o--o{ AUDIT_EVENTS : "institution_id+section_id+course_id"
  QUIZZES ||--o{ QUIZ_ATTEMPTS : "institution_id+quiz_id+course_id"
  QUIZZES ||--o| GRADE_ITEMS : "institution_id+quiz_id+course_id"
  GRADE_ITEMS ||--o{ GRADES : "institution_id+grade_item_id+quiz_id"
  QUIZ_ATTEMPTS ||--o| GRADES : "institution_id+attempt_id+quiz_id+student_id+section_id"
```

El ERD incluye las 13 tablas, 111 columnas y todas las FK. Solo se marcan PK y FK;
las unicidades simples y compuestas, CHECK e índices parciales se detallan en el
catálogo. Los contratos JSON y decisiones pendientes están en
[12-data-catalog.md](12-data-catalog.md). No existe todavía DDL ejecutable.

Versiones independientes: [Mermaid](data-catalog/academix-er.mmd),
[SVG](data-catalog/academix-er.svg) y [PDF](data-catalog/academix-er.pdf).
