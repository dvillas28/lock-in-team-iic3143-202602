# Modelo relacional: ERD 2

```mermaid
erDiagram

  QUIZ_ATTEMPTS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    uuid quiz_id FK "NOT NULL"
    uuid section_id FK "NOT NULL"
    uuid student_id FK "NOT NULL"
    integer attempt_number "NOT NULL"
    varchar(16) status "NOT NULL"
    timestamptz(6) started_at "NOT NULL"
    timestamptz(6) submitted_at "NULL"
    timestamptz(6) cancelled_at "NULL"
    jsonb answers "NOT NULL"
    numeric(8,2) score_points "NULL"
    numeric(5,2) score_percent "NULL"
    numeric(3,1) grade_value "NULL"
    text start_key "NOT NULL 1..200"
    text submit_key "NULL 1..200"
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

  GRADE_PUBLICATIONS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid course_id FK "NOT NULL"
    uuid actor_user_id FK "NOT NULL"
    text idempotency_key "NOT NULL 1..200"
    jsonb request "NOT NULL privado"
    integer published_count "NOT NULL positivo"
    timestamptz(6) published_at "NOT NULL"
  }

  AUDIT_EVENTS {
    uuid id PK "NOT NULL"
    uuid institution_id FK "NOT NULL"
    uuid actor_user_id FK "NULL solo migracion operativa auditada"
    varchar(64) action "NOT NULL"
    varchar(32) resource_type "NOT NULL"
    uuid resource_id "NOT NULL; referencia polimorfica sin FK"
    uuid course_id FK "NULL solo evento institucional"
    uuid section_id FK "NULL"
    timestamptz(6) occurred_at "NOT NULL"
    jsonb changes "NOT NULL"
  }

  INSTITUTIONS ||--o{ INSTITUTION_MEMBERSHIPS : "institution_id"
  COURSES ||--o{ GRADE_PUBLICATIONS : "institution_id+course_id"
  INSTITUTION_MEMBERSHIPS ||--o{ GRADE_PUBLICATIONS : "institution_id+actor_user_id"
  USERS ||--o{ INSTITUTION_MEMBERSHIPS : "user_id"
  INSTITUTION_MEMBERSHIPS ||--o{ COURSES : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ ENROLLMENTS : "institution_id+user_id"
  INSTITUTION_MEMBERSHIPS ||--o{ MATERIALS : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ QUIZZES : "institution_id+created_by"
  INSTITUTION_MEMBERSHIPS ||--o{ QUIZ_ATTEMPTS : "institution_id+student_id"
  INSTITUTION_MEMBERSHIPS ||--o{ GRADES : "institution_id+student_id"
  INSTITUTION_MEMBERSHIPS |o--o{ AUDIT_EVENTS : "institution_id+actor_user_id"
  COURSES ||--o{ SECTIONS : "institution_id+course_id"
  COURSES ||--o{ COURSE_MODULES : "institution_id+course_id"
  COURSES ||--o{ QUIZZES : "institution_id+course_id"
  COURSES ||--o{ GRADE_ITEMS : "institution_id+course_id"
  COURSES |o--o{ AUDIT_EVENTS : "institution_id+course_id"
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
