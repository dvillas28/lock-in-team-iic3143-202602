# Autoría inmutable y coordinación del libro de notas

Fecha: 2026-10-19. Estado: propuesto por plan; implementación pendiente.

## Contexto

Quiz contiene preguntas/alternativas JSONB según el modelo de Entrega 2.
Publicar debe crear GradeItem único y no agregar ítems tras primera nota publicada.
La base #90 aún no implementa intentos ni Grades; agregarlos aquí ampliaría la misión.
El contrato existente ya admite PATCH solo en estado draft.

## Decisión

Mantener PATCH solo draft y publicar como transición irreversible en esta misión.
Preguntas publicadas y política de intentos no cambian, incluso tras cancelación futura.
No agregar versiones, tablas Question/Alternative ni historial de pauta.
Questions retenidas preservan UUID enviado en PATCH; nuevas lo reciben del servidor.
Quiz.section_id es referencia reasignable en draft, dentro del mismo curso/tenant
y con permisos vigentes sobre origen/destino; Quiz.id y Section.id son inmutables.
Auditar reasignación como quiz.updated de curso (section_id NULL), evitando mostrar
datos históricos del origen a un docente que solo puede consultar el destino.

Publicación usa Course FOR UPDATE y luego Quiz; crea GradeItem con peso inicial 0,
fija publishedAt y audita en una transacción. UNIQUE por institución/quiz impide
duplicados. Repetir publicación autorizada devuelve estado existente, incluso si
posteriormente se congeló el curso, sin crear ítem ni evento.

Agregar courses.grade_items_locked_at nullable monotónico. Trigger prohíbe cambiar
un valor ya fijado; INSERT GradeItem toma el lock de Course y rechaza marcador activo.
Futura publicación de notas fija marcador junto a primera Grade publicada, bajo
mismo lock y transacción. Esa misión debe agregar enforcement DB de la relación;
no puede publicar notas ignorando el marcador ni cambiar pesos después de fijarlo.

Docente activo es obligatorio: admin dueño amplía destinatarios a curso completo;
teacher ordinario solo sus secciones. Admin/superadmin solos no conceden pauta.
Un guard estudiantil reutiliza exactamente canAuthorQuiz para impedir rendición
a quien puede consultar pauta, incluso con rol student acumulado.

Auditoría conserva metadata y contadores, nunca preguntas, instrucciones,
alternativas, respuestas correctas ni request completo. La pauta draft se
sobrescribe; publicada permanece inmutable como evidencia de evaluación.

## Alternativas descartadas

- Crear Grade/QuizAttempt ahora: desplaza trabajo de misiones posteriores.
- Consultar tabla grades todavía inexistente: impediría desplegar autoría sola.
- Comprobar congelación sin lock: permite carrera con primera nota publicada.
- Editar publicado hasta primer intento: amplía contrato y exige dependencia futura.
- Guardar pauta completa en audit y filtrarla al leer: expone secretos persistidos.

## Consecuencias y validación

Esta misión funciona sin endpoints de intentos/notas, pero su integración futura
requiere respetar el protocolo. SQL controlado prueba congelación, concurrencia,
rollback y no-op; no equivale a publicar una Grade real.
La misión de notas agregará su prueba con Grade real antes de poder cerrarse.
Preguntas publicadas no admiten correcciones; requerirían nueva especificación.
Límite HTTP heredado de 4096 bytes restringe tamaño de quiz; no se amplía aquí.
No introduce dependencias ni modifica permisos de auditoría previos.

Modelo y contrato: [plan](../../specs/20261014-235044_autoria-quizzes/plan.md) e
[integración](../../specs/20261014-235044_autoria-quizzes/contracts/academic-integration.md).
