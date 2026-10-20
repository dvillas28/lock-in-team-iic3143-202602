# Research: Autoría y publicación de quizzes

Fecha: 2026-10-19. Evidencia del repositorio en base e34499e; sin stack nuevo.

## R1. Base de trabajo integrada

- Decisión actualizada 2026-10-20: rama documental sobre origin/dev @ 52aa9ee (#90).
- Razón: #85/#86/#87/#89/#90 ya están integrados; dev contiene los prerequisitos.
- La base inicial fue feat/modulos-material-api @ e34499e, antes de su integración.
- Mantener worktree separado para no mezclar cambios locales sin confirmar.
- Evidencia: estados y bases consultados con gh pr view/list; prerequisitos
  técnicos reales en app.module.ts, course-access.ts y migración de módulos.
- Dependencia funcional: cursos-roles; módulos/material es base de integración,
  no relación obligatoria entre Quiz y CourseModule.

## R2. Modelo agregado

- Decisión: quizzes.questions JSONB, con IDs estables; grade_items separado.
- Razón: modelo vigente ya agrupa preguntas/alternativas en Quiz.
- Alternativas: tablas Question/Alternative añaden relaciones no solicitadas.
- Evidencia: docs/deliveries/2/06-data-model-part-2.md y part-3.md.
- Guardar borrador vacío permite preparar metadata; publicar exige preguntas.
  Cada pregunta suministrada debe estar completa y ser válida.

## R3. Alcance académico

- Decisión: teacher activo + admin dueño permite curso completo y cualquier sección;
  teacher ordinario solo quizzes de secciones propias. Flags solos no dan pauta.
- Razón: ownership amplía alcance, sin sustituir Enrollment teacher.
- Alternativas: docente de cualquier sección para todo quiz confundiría contenido
  compartido con evaluación restringida.
- Evidencia: ADR institution-admin-and-course-ownership y contrato de cursos-roles.
- Un teacher ordinario no obtiene pauta global; su Enrollment vigente permite
  lectura global publicada. Si además es student destinatario, puede rendirlo.

## R4. Inmutabilidad e identidad

- Decisión: PATCH solo draft; permite reasignar section_id, sin unpublish ni delete.
  Aclaración del usuario: Section.id es identidad inmutable; Quiz.section_id es FK
  editable con permiso sobre origen y destino, sin cambiar curso ni institución.
- Razón: contrato vigente ya rechaza cambios de quiz publicado. Primer intento
  solo puede existir tras publicación; no hace falta tabla de intentos aquí.
- Alternativas: edición publicada hasta primer intento requeriría ampliar contrato.
- Evidencia: paths/quizzes.yaml updateQuiz, FR-008 y spec intentos-calificacion.
- QuestionUpdate necesita id UUID opcional: omitido crea ID; enviado debe existir
  en ese borrador. QuestionCreate sigue sin id; alternativas conservan id textual.
  No regenerar IDs de preguntas retenidas por reemplazar el arreglo.

## R5. Congelación del libro sin tablas futuras

- Decisión: courses.grade_items_locked_at nullable monotónico; Course FOR UPDATE
  serializa publish con futura primera publicación de Grade.
- Razón: grades no existe en la base; consultar tabla ausente rompería esta misión.
- Alternativas: crear grades/quiz_attempts anticipadamente excede el alcance;
  omitir FR-005 dejaría integridad pendiente.
- Trigger impide revertir/cambiar marcador ya fijado; trigger de INSERT GradeItem
  bloquea Course y rechaza libro congelado. API traduce ese conflicto a 409.
- Consumidor futuro fija marcador en la MISMA tx que primera Grade.published_at.
  Esa misión agregará validación DB que impida publicar Grade sin fijarlo.
- Esta misión prueba protocolo con SQL controlado, no una publicación real de nota.

## R6. Publicación e idempotencia

- Decisión: una tx para validar, publicar, insertar GradeItem con peso inicial 0 y
  auditar; UNIQUE(institution_id,quiz_id). Repetir publicado es 200 sin efecto.
- Razón: FR-004/005 exige unicidad; retry publicado conserva éxito aun congelado.
- Alternativas: comprobar congelación antes del no-op rompería repetición legítima.
- Fallo de auditoría revierte todo. No-op revalida permisos; no genera evento nuevo.

## R7. Pauta y auditoría

- Decisión: proyección positiva para vista segura y allowlist de metadata en audit.
- Razón: audit actual filtra solo campos raíz; guardar questions filtraría pauta.
- Alternativas: borrar únicamente isCorrect es frágil ante campos futuros.
- Evidencia: backend/src/audit/audit.service.ts snapshot y FR-006.
- Historial guarda metadata y questionCount/totalPoints; nunca questions, instrucciones,
  prompt, alternativas, isCorrect, body HTTP ni pauta previa. Borrador se sobrescribe;
  pauta publicada se preserva inmutable, sin historial paralelo de respuestas.

## R8. Consumidores posteriores y límites

- Decisión: guard de elegibilidad y protocolo de locks exportados/documentados ahora;
  endpoints de intentos, cálculo y publicación de notas se implementan después.
- Razón: FR-007 debe compartir exactamente el predicado de acceso a pauta.
- Alternativas: simular endpoints futuros o prometer aceptación completa ahora.
- Mantener body 4096 bytes, timeouts y dependencias existentes; rechazar exceso 413.
- Sin incógnitas bloqueantes; límites y compromisos futuros visibles en plan/contrato.
- El spec distingue cierre local de FR-005/007 de aceptación con Grade/intento
  reales; los specs consumidores enlazan el contrato y exigen esas pruebas.
