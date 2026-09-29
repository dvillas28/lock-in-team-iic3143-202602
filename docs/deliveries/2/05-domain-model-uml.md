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
  class InstitutionMembership
  class Course
  class CourseMembership
  class Section
  class Enrollment
  class CourseModule
  class Material

  Institution "1" -- "0..*" InstitutionMembership : habilita
  User "1" -- "0..*" InstitutionMembership : pertenece
  Institution "1" -- "0..*" Course : ofrece
  Course "1" -- "0..*" CourseMembership : tiene
  User "1" -- "0..*" CourseMembership : coordina
  Course "1" -- "0..*" Section : contiene
  Section "1" -- "0..*" Enrollment : tiene
  User "1" -- "0..*" Enrollment : participa
  Course "1" -- "0..*" CourseModule : organiza
  CourseModule "1" -- "0..*" Material : contiene
```

`User` es global. `InstitutionMembership` habilita el acceso base, mientras
CourseMembership y Enrollment conservan los roles académicos contextuales.
Todas las clases académicas son tenant-owned por una Institution aunque el
diagrama omita relaciones repetidas para evitar ruido visual.

## Evaluaciones, notas y trazabilidad

```mermaid
classDiagram
  direction LR

  class Institution
  class Course
  class Section
  class User
  class Quiz
  class Question
  class Alternative
  class QuizAttempt
  class GradeItem
  class Grade
  class AuditEvent

  Institution "1" -- "0..*" Course : delimita
  Course "1" -- "0..*" Quiz : evalua
  Section "0..1" -- "0..*" Quiz : delimita
  Quiz "1" -- "0..*" Question : contiene
  Question "1" -- "2..*" Alternative : ofrece

  Quiz "1" -- "0..*" QuizAttempt : recibe
  User "1" -- "0..*" QuizAttempt : rinde
  Section "1" -- "0..*" QuizAttempt : contextualiza

  Quiz "1" -- "0..1" GradeItem : pondera
  Course "1" -- "0..*" GradeItem : agrupa
  GradeItem "1" -- "0..*" Grade : produce
  QuizAttempt "1" -- "0..1" Grade : determina
  User "1" -- "0..*" Grade : recibe
  Section "1" -- "0..*" Grade : contextualiza

  Course "1" -- "0..*" AuditEvent : registra
  User "1" -- "0..*" AuditEvent : realiza
```

Quiz, Question, QuizAttempt, GradeItem, Grade y AuditEvent conservan
`institution_id`. Las FK compuestas comprueban que las relaciones del diagrama
pertenecen a la misma Institution. Alternative continúa como concepto anidado en
Question aunque se persista como JSONB.
