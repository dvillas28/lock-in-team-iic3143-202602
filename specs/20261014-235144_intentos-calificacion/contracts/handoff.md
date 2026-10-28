# Handoff: autoría → intentos → notas

Este contrato fija interfaces requeridas; autoría verificada sobre PR #94 da8b59b.

## Gate de autoría (antes de implementar Foundation)

La misión [autoría-quizzes](../../20261014-235044_autoria-quizzes/spec.md) entrega:
- public.quizzes con institution_id/id/course_id y UNIQUE compuesto; section_id
  NULL = curso, de otro modo sección del mismo curso/tenant; published_at,
  opens_at,closes_at,max_attempts y questions JSONB.
- public.grade_items con id/institution_id/quiz_id/course_id y UNIQUE
  (institution_id,quiz_id), (institution_id,id,quiz_id); publicación crea uno.
- questions [{id UUID,position,prompt,points,alternatives:[{id,text,isCorrect}]}].
  IDs estables; puntos positivos exactos con hasta dos decimales; suma positiva
  ≤999999.99, compatible con score_points numeric(8,2). No redondear puntos al guardar.
- Un predicado reutilizable de acceso vigente a pauta, utilizado por autoría e
  intentos. Teacher activo y scope efectivo; admin sin teacher no basta.
- Edición/publicación toma Course FOR UPDATE antes de Quiz. Desde primer
  intento congela questions, alternativas, puntajes y max_attempts. Edición
  concurrente con start respeta ese lock, aunque el intento se cancele después.

T001 confirma nombres/migraciones reales y registra alineación en plan/research.
Si autoría no existe, se implementa primero en su misión; no crear un fake de
producción, no redefinir su esquema ni marcar este gate completo con fixtures.
Fixtures SQL de tests pueden usar su esquema solo después de aplicar su migración.

## Consumidor notas/publicación

La misión [notas](../../20261014-235244_notas-publicacion-auditoria/spec.md) recibe:
quiz_attempts terminales con sección histórica y grades vigentes no publicadas.
Puede publicar solo graded y sin in_progress del estudiante/quiz seleccionado.
Pesos/publicación/listado de intentos/libro no se implementan en esta misión.

Publicador debe adquirir contexto del actor y Course FOR UPDATE, luego Enrollment,
Quiz, Attempt y Grade (UUID ascendente en conjuntos) antes de revalidar selección,
pesos, roles, ausencia de activos y estado de notas. No pedir locks de User o
membership de estudiantes después del curso: lecturas de resultados no necesitan
identidad activa de destinatarios; si su contrato los requiere, bloquear antes.
Si existe intento activo: 409 y rollback, nunca cancelación implícita.
Con nota publicada: no nuevos inicios ni cambios a esa Grade ni envíos nuevos.
Replay de un envío confirmado puede devolver su recibo sin mutar la nota.

## Validación cruzada

Aquí: prueba SQL controlada de publicación, con mismo lock Course y chequeo de
activos, compite contra start/submit/cancel. No equivale a probar endpoint futuro.
En notas: repetir carreras contra endpoint real y flujo identidad→curso→quiz→
intento→nota→publicación en UC/UTFSM; conservar negativos de esta misión.

GET intento declara anyOf de DTO student/teacher/assistant según permisos;
las vistas académicas pueden coincidir cuando no hay corrección.
listQuizAttempts existente en OpenAPI se implementará en notas con paginación,
filtros y misma proyección assistant sin isCorrect/pointsAwarded.

## Interfaz real confirmada en T001

Migración 20261019000100_quiz_authoring.sql; canAuthorQuiz en quiz-access.ts.
QuizzesService requiere draft para editar; publicados quedan congelados antes
del primer intento. Intentos añade freeze SQL desde el primer intento y conserva
Course FOR UPDATE como prefijo común. No cambiar SQL de autoría ya aplicado.
Intentos migra con 20261019000200_attempts_grades.sql. Publicación HTTP, pesos,
listQuizAttempts y su AssistantView siguen pendientes de la misión de notas;
esta entrega solo verifica el protocolo con publicación SQL controlada.
