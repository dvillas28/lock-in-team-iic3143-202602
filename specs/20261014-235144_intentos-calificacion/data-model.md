# Data Model: Intentos y Grade vigente

PostgreSQL 17, schema public; UUID y timestamptz(6); ON DELETE RESTRICT.
Quizzes y grade_items pertenecen a autoría; T001 verificó el [handoff](contracts/handoff.md).

## quiz_attempts

id uuid PK; institution_id,course_id,quiz_id,section_id,student_id uuid NOT NULL;
attempt_number integer NOT NULL CHECK >0; status varchar(16) NOT NULL;
started_at timestamptz NOT NULL; submitted_at,cancelled_at timestamptz NULL;
answers jsonb NOT NULL DEFAULT '[]'; score_points numeric(8,2) NULL;
score_percent numeric(5,2) NULL; grade_value numeric(3,1) NULL;
start_key text NOT NULL; submit_key text NULL.
Status SQL: in_progress/submitted/graded/cancelled; API mapea inProgress.

grade_value amplía el catálogo para conservar el resultado histórico exacto;
alinear docs/deliveries/2/06-data-model-part-2.md y 12-data-catalog-part-1.md.
answers: [{questionId,alternativeId}] en progreso; al calificar, cada respuesta
incluye isCorrect/pointsAwarded. Preguntas omitidas dan cero; [] es válido.
No duplicar preguntas en answers; validación servidor contra pauta inmovilizada.
Corrección de omisiones se deriva de questions inmutable; no inventar alternativeId.

Constraints:
- FK(institution_id,quiz_id,course_id) → quizzes(institution_id,id,course_id).
- FK(institution_id,section_id,course_id) → sections(institution_id,id,course_id).
- FK(institution_id,student_id) → institution_memberships(institution_id,user_id).
- UNIQUE(institution_id,quiz_id,student_id,attempt_number).
- UNIQUE(institution_id,id,quiz_id,student_id,section_id), destino de FK Grade.
- UNIQUE parcial(institution_id,quiz_id,student_id) WHERE status='in_progress'.
- UNIQUE(institution_id,student_id,start_key); UNIQUE parcial equivalente
  sobre submit_key WHERE submit_key IS NOT NULL.
- CHECK jsonb_typeof(answers)='array'; score_points >=0; score_percent 0..100;
  grade_value 1..7; longitudes claves 1..200 caracteres.
- CHECK de coherencia de estado/timestamps/resultados: in_progress sin fechas
  terminales/resultados/submit_key; cancelled solo cancelled_at y sin resultados;
  graded con submitted_at, submit_key y todos los resultados, sin cancelled_at.
- submitted requiere submitted_at/submit_key, sin cancelled_at ni resultados;
  es solo transitorio dentro tx: trigger de constraint diferible reconsulta
  estado final por id al COMMIT (no usa NEW de la transición intermedia) y rechaza
  submitted persistido; no hay entrega pendiente ni worker.

Trigger BEFORE UPDATE/DELETE impide borrar intentos o alterar identidades,
contexto, número, start_key y started_at. Desde graded/cancelled prohíbe cambios;
permitir in_progress → in_progress/submitted/graded/cancelled y submitted → graded.
Reglas de pauta, último intento y permisos se aplican bajo lock en servicio y tests.
Trigger freeze_attempted_quiz protege questions/max_attempts/contexto desde el primer intento.
Índice UNIQUE de serie sirve MAX(attempt_number) por tenant/quiz/student.
No índice especulativo para listado académico diferido.

## grades

id uuid PK; institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id uuid;
todos NOT NULL. score_percent numeric(5,2) NOT NULL CHECK 0..100;
grade_value numeric(3,1) NOT NULL CHECK 1..7; published_at timestamptz NULL;
created_at,updated_at timestamptz NOT NULL.
- UNIQUE(institution_id,grade_item_id,student_id).
- FK(institution_id,grade_item_id,quiz_id) → grade_items(institution_id,id,quiz_id).
- FK(institution_id,attempt_id,quiz_id,student_id,section_id) →
  quiz_attempts(institution_id,id,quiz_id,student_id,section_id).
- FK(institution_id,student_id) → institution_memberships(institution_id,user_id).
- Índice(institution_id,student_id,published_at), según futura lectura propia.
- BEFORE UPDATE/DELETE protege identidad y no permite DELETE ni cambios tras
  published_at no NULL; publicar exige mantener todos los demás campos intactos,
  salvo updated_at. SQL del servicio comprueba intento graded y mayor número.

Un graded posterior sustituye attempt_id/section_id/resultado de Grade no publicada,
conservando id/created_at y auditando before/after. No comparar mejores notas.
Cancelación nunca inserta ni actualiza Grade. Publicación no es endpoint de esta misión.

## Transiciones, locks e historia

in_progress → in_progress (save), cancelled o submitted → graded (submit en tx).
Cancelar repetido es no-op; guardar terminal/conflicto de envío da 409.
El estado submitted no se expone por HTTP porque no existe commit intermedio.

Prelectura localiza contexto sin conceder permiso. lockContext(actor,slug) toma
User/Institution/membership vigentes; courseScope(...,true) bloquea Course antes
de Enrollment. Teacher cancelando no exige membership activa del estudiante:
su revocación no debe bloquear el cierre docente de un abandono.
Después: Quiz FOR UPDATE → Attempt FOR UPDATE → Grade FOR UPDATE, orden UUID
si varias filas; revalidar contexto, permisos, pauta, publicación y reloj tras locks.
Publicación/autoría deben seguir el mismo prefijo y bloquear Course primero.
No elevar SHARE a UPDATE ni adquirir locks de identidades después de Course.

Con lock Course, iniciar asigna COALESCE(MAX(attempt_number),0)+1; valida máximo
contando todos los iniciados. Sin borrar intentos, números nunca se reutilizan.
Primer intento bloquea edición de pauta mediante el mismo Course lock de autoría.
Start replay busca clave antes de reglas de nuevo inicio, tras autorización vigente;
compara quiz y sección originales. Clave distinta con activo existente → 409.
Submit replay busca clave de actor/tenant y exige mismo attempt_id y submit_key
original. Un graded con otra clave, libre o ligada a otro intento, produce 409
sin almacenar alias ni modificar resultados/eventos; solo la clave original
puede recuperar el recibo. Una clave ligada a otro intento siempre produce 409.
Replay tras cierre/publicación no vuelve a guardar ni calificar; revocación sí deniega.

PUT reemplaza answers completo; dos saves serializados dejan último commit.
Save vs submit/cancel: si save gana, terminal usa esas respuestas; si pierde, 409.
Submit vs cancel: exactamente una transición terminal y sus eventos.
Start vs publish: si inicia primero, publicación debe rechazar por activo;
si publica primero, start da 409. Submit vs publish: resultado serializado,
sin Grade publicada sobrescrita ni intento activo para selección publicada.

Acciones: attempt.started, attempt.answersSaved, attempt.cancelled,
attempt.graded y grade.created/updated (según inserción o cambio efectivo).
AuditService allowlist quizAttempt: id/quizId/studentId/sectionId/attemptNumber/
status/startedAt/submittedAt/cancelledAt. Grade: id/gradeItemId/studentId/sectionId/
attemptId/scorePercent/grade/publishedAt. Evento lleva curso y sección históricos.
Nada de answers, aciertos, pauta, claves, emails o tokens en eventos/logs.
Replay/cancel repetido/save idéntico no crean evento. Fallo de cualquier evento
revierte intento, resultados, Grade y claves; mismo request puede reintentarse.

## Migración y recuperación

20261019000200_attempts_grades.sql confirmado, posterior a
20261019000100_quiz_authoring.sql. No crear quizzes/grade_items aquí ni editar SQL aplicado.
Probar instalación vacía, upgrade con datos académicos y migración repetida.
Rollback de operación es transaccional; no ejecutar down destructivo en datos reales.
