# Modelo de dominio

[Diagrama de clases UML del dominio](05-domain-model-uml.md).

## Límites

AcademiX usa una PostgreSQL compartida. `Institution` representa al tenant
lógico y `institution_id` delimita todos los datos académicos tenant-owned. UC
y UTFSM son dos Institutions dentro de la misma base.

`User` es global. Una persona puede acceder a varias Institutions mediante
`InstitutionMembership`. Los roles académicos viven en las secciones mediante
`Enrollment`; no existe un RBAC completo ni un coordinador separado en el MVP.

## Identidad y contexto institucional

### Institution

Entidad raíz que representa una institución académica. Tiene UUID interno,
slug legible globalmente único, nombre, estado y timestamps mínimos. El UUID se
usa en las relaciones; cambiar el slug no reescribe las FK.

El slug del path identifica el contexto solicitado, pero no otorga acceso.

### User

Identidad global autenticada. El `sub` del JWT resuelve un único User, que puede
participar en varias Institutions. Sus datos de identidad no se duplican por
institución.

### InstitutionMembership

Relación entre User e Institution que indica si el User puede entrar al contexto
institucional. No contiene roles de curso o sección. Una membership activa es
precondición para cualquier operación académica dentro de la Institution.

## Entidades académicas tenant-owned

Todas las entidades de esta sección llevan `institution_id` y deben pertenecer
a la misma Institution que sus relaciones.

### Course

Ramo semestral concreto, por ejemplo “Ingeniería de Software” en `2026-2`.
Agrupa secciones, módulos, material, quizzes y libro de notas. Código y periodo
son únicos dentro de la Institution, no globalmente.

### Section

Paralelo de un Course. Hereda su contexto académico, pero conserva
`institution_id` explícito para que PostgreSQL pueda impedir una relación
cruzada mediante FK compuesta.

### Enrollment

Relación central User-Section-rol. Une a una persona con una sección específica
de un curso dentro de una Institution. Desde Enrollment se responde:

- a qué Institution pertenece el contexto, por `institution_id`;
- a qué Course pertenece, transitivamente por Section;
- en qué Section participa;
- con qué rol académico participa.

Los roles permitidos son `teacher`, `student` y `assistant`. Requiere
InstitutionMembership activa y admite varios roles distintos para la misma
persona en una sección, pero no duplica el mismo rol activo.

`teacher` es el rol docente administrativo del MVP. Un docente con rol activo en
una sección puede crear y administrar contenido, quizzes, notas y configuración
del curso dentro del alcance operativo acordado. `assistant` apoya el seguimiento
académico sin administrar la configuración central. `student` consume material,
rinde quizzes y consulta sus notas publicadas.

### CourseModule y Material

CourseModule organiza el contenido de un Course. Material pertenece a un módulo
y contiene markdown o metadatos de un archivo. En el MVP, módulos y materiales
tienen alcance de curso: todas las secciones de ese curso ven el mismo contenido
publicado. La Section solo determina si el usuario pertenece al Course mediante
Enrollment.

Cuando existan binarios, usarán Railway Bucket o storage S3-compatible
equivalente, con namespace por Institution y acceso mediado por el backend.

Solo el contenido publicado es visible para estudiantes autorizados.

### Quiz

Un Quiz tiene alcance de Course o de una Section del mismo Course. Define un
máximo positivo de intentos o `null` para intentos ilimitados. Las preguntas y
alternativas forman una pauta JSON anidada en el Quiz, visible únicamente en
vistas autorizadas.

Al publicar se valida la pauta. Después del primer intento no se modifican
preguntas, alternativas, respuestas correctas, puntajes ni política de intentos.

### QuizAttempt

Intento de un estudiante. Conserva Institution, Course y Section históricas,
número secuencial, respuestas y corrección. Sus estados son `in_progress`,
`submitted`, `graded` y `cancelled`; `submitted` es transitorio durante la
transacción de envío y calificación.

Solo existe un intento `in_progress` por Institution, estudiante y Quiz. Un
intento cancelado es terminal, cuenta para el máximo, no genera nota y no
bloquea la publicación. Quien puede consultar la pauta no puede rendir ese Quiz.

El último intento `graded` por número determina la nota vigente mientras no
esté publicada. No se permiten nuevos intentos tras publicar esa nota.

### GradeItem y Grade

GradeItem representa una evaluación ponderada del Course: por ejemplo “Quiz 1”
con peso 20 %. Es parte de la estructura del libro de notas y existe una vez por
evaluación.

Grade representa el resultado de un estudiante en un GradeItem: por ejemplo
“Sofía obtuvo 6.2 en Quiz 1”. Conserva Section y QuizAttempt para saber desde
qué sección e intento salió esa nota. En otras palabras, GradeItem define qué se
evalúa y cuánto pesa; Grade guarda la nota concreta de cada estudiante.

La escala chilena, redondeo `HALF_UP`, promedio parcial y bloqueo tras publicar
se mantienen como reglas del MVP. Una corrección de una nota publicada requiere
un flujo explícito futuro; nunca una sobrescritura silenciosa.

### AuditEvent

Evento inmutable con Institution, actor global, acción, recurso, Course, Section
opcional, fecha y valores anterior/posterior sanitizados. Se escribe en la misma
transacción que el cambio y nunca incluye secretos, claves internas ni pautas.

## Relaciones principales

```txt
User 1 -> N InstitutionMembership <- N Institution
Institution 1 -> N Course
Course 1 -> N Section
Section 1 -> N Enrollment <- N User
Course 1 -> N CourseModule -> N Material
Course 1 -> N Quiz; Section 0..1 -> N Quiz
Quiz 1 -> questions jsonb
Quiz 1 -> N QuizAttempt <- N User
Section 1 -> N QuizAttempt
Quiz 1 -> 0..1 GradeItem -> N Grade
QuizAttempt 1 -> 0..1 Grade vigente
Section 1 -> N Grade
Course 1 -> N AuditEvent
```

Cada relación tenant-owned incluye la Institution de ambos extremos en su
invariante de persistencia.

## Resolución y autorización

Para `/api/v1/institutions/{institutionSlug}/...`:

1. validar JWT y resolver User global;
2. resolver Institution por slug;
3. responder `404` si no existe o no es visible;
4. validar InstitutionMembership activa;
5. validar Enrollment y permisos específicos;
6. ejecutar la operación bajo `institution_id`;
7. confirmar cambio y auditoría atómicamente cuando corresponda.

Una Institution o recurso externo al scope se trata como no visible (`404`). Un
recurso visible sobre el cual falta permiso produce `403`.

## Reglas de integridad

- Toda entidad académica tiene `institution_id`.
- Las FK tenant-owned incluyen `institution_id` para impedir cruces.
- User es global, pero Enrollment y autorías académicas solo pueden
  referenciarlo si existe InstitutionMembership correspondiente.
- Quiz y Section deben pertenecer al mismo Course e Institution.
- Grade debe corresponder al mismo estudiante, Section, Quiz, GradeItem e
  Institution que QuizAttempt.
- Las ponderaciones finales de un Course suman 100 %. La primera publicación
  bloquea nuevos ítems y cambios de ponderación.
- Las vistas estudiantiles muestran solo notas propias publicadas y omiten pauta.
- Los índices siguen accesos reales y comienzan por `institution_id` cuando el
  scope institucional forma parte del filtro.
- RLS queda fuera del MVP; puede evaluarse como defensa futura.
