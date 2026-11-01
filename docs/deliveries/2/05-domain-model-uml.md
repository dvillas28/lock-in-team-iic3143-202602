# Modelo de dominio en UML

La pauta de Entrega 2 pide representar los conceptos fundamentales mediante un
diagrama de clases. Las clases siguientes son conceptos del problema, no clases
definitivas de implementación. El modelo se divide para mantener legibilidad.

## Identidad, institución y contenido

```mermaid
classDiagram
  direction LR

  class Institution
  class User
  class InstitutionMembership {
    boolean is_admin
    boolean is_super_admin
  }
  class Course
  class Section
  class Enrollment {
    role teacher_student_assistant
  }
  class CourseModule
  class Material

  Institution "1" -- "0..*" InstitutionMembership : habilita
  User "1" -- "0..*" InstitutionMembership : pertenece
  Institution "1" -- "0..*" Course : ofrece
  InstitutionMembership "1" -- "0..*" Course : propietario
  Course "1" -- "0..*" Section : contiene
  Section "1" -- "0..*" Enrollment : tiene
  User "1" -- "0..*" Enrollment : participa
  Course "1" -- "0..*" CourseModule : organiza
  CourseModule "1" -- "0..*" Material : contiene
```

`User` es global. `InstitutionMembership` habilita el acceso base a una
Institution, mientras Enrollment concentra los roles académicos contextuales:
`teacher`, `assistant` y `student`. Todas las clases académicas son
tenant-owned por una Institution aunque el diagrama omita relaciones repetidas
para evitar ruido visual.

## Evaluaciones, notas y trazabilidad

```mermaid
classDiagram
  direction LR

  class Institution
  class Course
  class Section
  class User
  class Quiz
  class QuizAttempt
  class GradeItem
  class Grade
  class AuditEvent

  Institution "1" -- "0..*" Course : delimita
  Course "1" -- "0..*" Quiz : evalua
  Section "0..1" -- "0..*" Quiz : delimita
  Quiz "1" -- "1..*" QuestionJson : contiene pauta

  Quiz "1" -- "0..*" QuizAttempt : recibe
  User "1" -- "0..*" QuizAttempt : rinde
  Section "1" -- "0..*" QuizAttempt : contextualiza

  Quiz "1" -- "0..1" GradeItem : pondera
  Course "1" -- "0..*" GradeItem : agrupa
  GradeItem "1" -- "0..*" Grade : produce
  QuizAttempt "1" -- "0..1" Grade : determina
  User "1" -- "0..*" Grade : recibe
  Section "1" -- "0..*" Grade : contextualiza

  Course "0..1" -- "0..*" AuditEvent : registra
  User "0..1" -- "0..*" AuditEvent : realiza
```

Quiz, QuizAttempt, GradeItem, Grade y AuditEvent conservan `institution_id`. Las
FK compuestas comprueban que las relaciones del diagrama pertenecen a la misma
Institution. Las preguntas y alternativas son conceptos anidados dentro del JSON
de Quiz, no tablas independientes en el MVP.

Auditoría opcional refleja eventos institucionales y operaciones sin actor HTTP.
QuestionJson es pauta conceptual validada al publicar; borradores incompletos
son posibles. No hay tabla de preguntas. Reglas físicas y conceptuales:
[relaciones contrastadas](06-data-model-relations.md).
