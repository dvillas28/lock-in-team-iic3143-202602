# Modelo de dominio

## Límites

El tenant es una universidad. En el MVP se prueban dos: `uc` y `utfsm`.

Cada tenant tiene datos académicos propios. El registry central solo sabe que
tenants existen y dónde está su base de datos.

## Entidades del registry

### Tenant

Universidad registrada en la plataforma.

Responsabilidades:

- identificar tenant por `slug`;
- indicar si está activo;
- entregar `database_url` al backend.

No contiene cursos, usuarios ni notas.

## Entidades del tenant

### User

Persona dentro de una universidad.

Puede ser estudiante en una sección y ayudante en otra mediante `Enrollment`.

### Course

Ramo de una universidad, por ejemplo "Ingeniería de Software" con sigla
`DDAA12`.

Agrupa secciones, módulos, material, quizzes y libro de notas.

### Section

Paralelo/sección de un curso.

Define el contexto concreto donde participan estudiantes, docentes y ayudantes.

### Enrollment

Vínculo usuario-sección-rol.

Reemplaza RBAC complejo en el MVP. Roles permitidos:

- `teacher`;
- `student`;
- `assistant`.

### CourseModule

Unidad de organización de contenido del curso.

Ejemplos: semana, unidad, tema o bloque docente.

### Material

Contenido publicado en un módulo.

Puede ser:

- markdown renderizado;
- archivo en object storage.

### Quiz

Evaluación de alternativas asociada a un curso o sección.

Tiene ponderación indirecta mediante `GradeItem`.

### Question

Pregunta dentro de un quiz.

Contiene enunciado, puntaje y alternativas posibles.

Las alternativas viven anidadas en la pregunta para evitar una tabla extra en el
MVP. Cada alternativa tiene identificador local, texto y marca de respuesta
correcta.

### QuizAttempt

Intento de un estudiante para un quiz.

Estados mínimos:

- `in_progress`;
- `submitted`;
- `graded`.

Incluye las respuestas elegidas como JSON anidado. Esto deja el intento como
snapshot del envío del estudiante y evita una tabla `answers` en el MVP.

### GradeItem

Evaluación ponderada dentro del libro de notas.

Para el MVP se vincula a un quiz.

### Grade

Nota calculada para un estudiante en un `GradeItem`.

Puede estar oculta o publicada. La publicación controla visibilidad.

## Relaciones principales

```txt
Course 1 -> N Section
Section 1 -> N Enrollment
User 1 -> N Enrollment
Course 1 -> N CourseModule
CourseModule 1 -> N Material
Course 1 -> N Quiz
Quiz 1 -> N Question
Quiz 1 -> N QuizAttempt
Quiz 1 -> 1 GradeItem
GradeItem 1 -> N Grade
User 1 -> N Grade
```

## Reglas de dominio

- Un usuario accede a un curso solo si tiene `Enrollment` en una sección del
  curso.
- Un docente administra un curso si tiene rol `teacher` en una sección del
  curso.
- Un estudiante responde quizzes solo si tiene rol `student` en la sección.
- Un ayudante no publica notas en el MVP.
- Material oculto no es visible para estudiantes.
- Un quiz finalizado genera o actualiza una nota calculada.
- Una nota publicada no debe cambiar silenciosamente.

## Decisión sobre auditoría

La auditoría histórica queda fuera del MVP.

Trade-off:

- se reduce complejidad de implementación;
- se pierde trazabilidad fina de cambios académicos;
- para compensar, el MVP debe evitar ediciones silenciosas de notas publicadas
  y documentar cualquier cambio manual.
