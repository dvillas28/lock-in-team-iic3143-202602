# Modelo de dominio en UML

La pauta de Entrega 2 pide representar los conceptos fundamentales mediante
el formato de un **diagrama de clases UML**. Las clases de abajo son conceptos
del problema, no tablas ni clases definitivas de implementación. Se divide el
mismo modelo en dos vistas para que las multiplicidades sean legibles en una
presentación. Las reglas se desarrollan en el
[modelo de dominio](05-domain-model.md) y su persistencia en el
[modelo de datos](06-data-model.md).

## Contexto académico y contenido

```mermaid
classDiagram
  direction LR

  class Tenant
  class User
  class Course
  class CourseMembership
  class Section
  class Enrollment
  class CourseModule
  class Material

  Tenant "1" -- "0..*" User : registra
  Tenant "1" -- "0..*" Course : ofrece
  Course "1" -- "0..*" CourseMembership : tiene
  User "1" -- "0..*" CourseMembership : coordina
  Course "1" -- "0..*" Section : contiene
  Section "1" -- "0..*" Enrollment : tiene
  User "1" -- "0..*" Enrollment : participa
  Course "1" -- "0..*" CourseModule : organiza
  CourseModule "1" -- "0..*" Material : contiene
```

`CourseMembership` expresa la coordinación de curso. `Enrollment` expresa
los roles `teacher`, `assistant` y `student` por sección; una persona puede
tener varios roles activos, incluso dentro de la misma sección. Las
asociaciones con `Tenant` son conceptuales: el registry y los datos
académicos viven en bases de datos separadas.

## Evaluaciones, notas y trazabilidad

```mermaid
classDiagram
  direction LR

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

Un `Quiz` puede ser para todo el curso o para una sección. Cada intento
conserva la sección donde se inició. `Grade` representa la nota vigente,
determinada por el último intento calificado y publicada explícitamente.
`Alternative` es un concepto anidado en la pregunta, aunque se persista como
JSONB. `AuditEvent` registra cambios académicos dentro del tenant.
