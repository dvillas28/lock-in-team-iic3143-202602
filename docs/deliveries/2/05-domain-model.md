# Modelo de dominio

## Límites

El tenant es una universidad. En el MVP se prueban dos: `uc` y `utfsm`.
Cada tenant tiene datos académicos propios en una DB separada. El registry
central solo sabe qué tenants existen y dónde está su base de datos. El header
`x-tenant` selecciona la DB; la identidad autenticada y las pertenencias
persistidas determinan qué puede hacer el usuario dentro de ella.

## Entidades del registry

### Tenant

Universidad registrada en la plataforma. Se identifica por `slug`, indica si
está activa y entrega al backend la ubicación secreta de su DB. No contiene
cursos, usuarios ni notas.

## Entidades del tenant

### User

Persona dentro de una universidad. El `sub` del JWT identifica su registro en
la DB seleccionada. Puede tener varios roles, incluso en una misma sección;
los permisos se comprueban para la operación, curso y sección concretos.

### Course

Ramo semestral concreto de una universidad, por ejemplo "Ingeniería de
Software" en `2026-2`. Agrupa secciones, módulos, material, quizzes y libro de
notas.

### CourseMembership

Pertenencia de un usuario a un curso con rol `coordinator`. El coordinador
administra el curso completo, incluidas sus secciones, material, evaluaciones,
ponderaciones y notas. Puede haber más de un coordinador por curso. El primer
coordinador se asigna durante el aprovisionamiento inicial del curso; no se
deduce de ser docente de alguna sección.

### Section

Paralelo/sección de un curso. Define el contexto concreto de estudiantes,
docentes y ayudantes.

### Enrollment

Vínculo usuario-sección-rol. Los roles permitidos son `teacher`, `student` y
`assistant`. Un usuario puede tener distintos roles en distintas secciones y
más de un rol activo en la misma sección. `teacher` habilita operaciones
docentes de esa sección, pero no otorga coordinación del curso completo.

### CourseModule y Material

Un módulo organiza el contenido de curso. Un material pertenece a un módulo y
contiene markdown o la referencia a un archivo en object storage. Solo el
contenido publicado es visible para estudiantes inscritos en el curso.

### Quiz y Question

Un quiz de alternativas tiene alcance de curso o de una sección concreta y una
ponderación mediante `GradeItem`. Define `max_attempts`: un número positivo
limita los intentos por estudiante y quiz; `null` permite intentos ilimitados.
Cada pregunta tiene puntaje y alternativas con identificadores locales únicos,
al menos dos opciones y exactamente una correcta. La pauta se entrega solo a
vistas docentes autorizadas; la vista de estudiante omite `is_correct`.

Al publicar el quiz se valida toda la pauta. Después de iniciado el primer
intento no se pueden cambiar preguntas, alternativas, respuesta correcta ni
puntajes: el intento debe seguir siendo interpretable con la misma pauta.

### QuizAttempt

Intento de un estudiante para un quiz. Guarda la sección donde participaba al
iniciarlo como snapshot inmutable, un número secuencial por estudiante y quiz,
las respuestas elegidas y la corrección como JSON. Sus estados son
`in_progress`, `submitted` y `graded`; el envío y la calificación automática
ocurren en una transacción, por lo que `submitted` es transitorio.

Puede existir un solo intento `in_progress` por estudiante y quiz. El usuario
que puede consultar la pauta de ese quiz no puede rendirlo, aunque también
tenga rol `student`. El límite, cuando existe, cuenta todos los intentos
iniciados. De los intentos `graded`, el de mayor `attempt_number` determina la nota vigente. No se permiten nuevos
intentos una vez publicada la nota de ese estudiante para el quiz.

### GradeItem y Grade

`GradeItem` representa la evaluación ponderada del libro de notas y se
vincula a un quiz del mismo curso. `Grade` es la nota vigente de un estudiante
para ese ítem y su sección, derivada del último intento calificado. Conserva
`attempt_id` para señalar exactamente el intento que la originó. La publicación
controla la visibilidad del puntaje y la nota para el estudiante.

El porcentaje de puntaje se convierte a nota chilena: hasta 60 %, se usa
`1 + porcentaje × 3 / 60`; sobre 60 %, se usa
`4 + (porcentaje - 60) × 3 / 40`. Se redondea a un decimal con `HALF_UP`.
El promedio parcial usa solo notas publicadas:
`sum(nota × ponderación) / sum(ponderaciones publicadas)`, con el mismo
redondeo; si el denominador es cero, no hay promedio (`null`).

### AuditEvent

Evento académico inmutable con actor, acción, recurso, curso, sección opcional,
fecha y valores anterior/posterior sanitizados. Registra cambios de roles,
material, quizzes, ponderaciones y publicación de notas, así como cambios de
nota aún no publicada por un nuevo intento. Se escribe en la misma transacción
que la operación académica. Nunca contiene secretos, claves de almacenamiento
ni la pauta de respuestas.

## Relaciones principales

```txt
Course 1 -> N CourseMembership <- N User
Course 1 -> N Section
Section 1 -> N Enrollment <- N User
Course 1 -> N CourseModule -> N Material
Course 1 -> N Quiz; Section 0..1 -> N Quiz
Quiz 1 -> N Question
Quiz 1 -> N QuizAttempt <- N User
Section 1 -> N QuizAttempt
Quiz 1 -> 0..1 GradeItem -> N Grade
QuizAttempt 1 -> 0..1 Grade vigente
Section 1 -> N Grade
Course 1 -> N AuditEvent
```

## Reglas de autorización e integridad

- Toda operación académica requiere JWT válido, tenant activo y usuario activo
  en la DB seleccionada. `x-tenant` no autentica ni autoriza.
- Un coordinador puede actuar sobre todo su curso. Un docente solo sobre sus
  secciones; un ayudante no publica notas. Tener varios roles no amplía el
  alcance del rol de sección a todo el curso.
- Un estudiante responde quizzes solo con `student` activo en la sección del
  intento. Un quiz de sección debe pertenecer al mismo curso que esa sección;
  uno de curso puede ser respondido desde cualquiera de sus secciones.
- Una nota solo puede apuntar a un intento del mismo estudiante, sección y
  quiz que el `GradeItem`. No se publica una nota sin intento calificado.
- Las ponderaciones finales de un curso suman 100 %. Publicar la primera
  nota exige esa suma y que todos los ítems del libro estén definidos.
  Desde la primera nota publicada no pueden agregarse ítems ni cambiarse las ponderaciones; tampoco
  puede cambiarse el valor de una nota publicada.
  Una corrección posterior requiere un flujo explícito, con nueva decisión de
  dominio y auditoría; nunca una sobrescritura silenciosa.
- La publicación exige que no haya intentos `in_progress` para las notas
  seleccionadas; así no congela una nota mientras el estudiante responde.
- La publicación de notas y sus eventos de auditoría son atómicos. Las vistas
  estudiantiles muestran solo notas propias publicadas y no revelan la pauta.
