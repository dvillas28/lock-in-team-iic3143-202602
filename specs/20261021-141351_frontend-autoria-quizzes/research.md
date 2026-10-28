# Research: Autoría frontend de quizzes

Fecha: 2026-10-22. Investigación del código local y contratos, mediante CodeGraph.
Sin decisiones tecnológicas desconocidas pendientes.

## 1. Stack y reutilización

- Decision: Next/React/TypeScript y OpenAPI actuales; `Session.request`, `useResource`,
  `useMutation`, `Field`, `ProtectedInstitution`, shell y estilos integrados.
- Rationale: ya cubren sesión, errores, serialización de mutaciones y respuestas tardías.
- Alternatives considered: store global, librería de formularios, autosave o framework
  nuevo; innecesarios y amplían superficie de fuga de pauta.
- Evidence: `frontend/package.json`, `frontend/src/components/courses/use-resource.ts`,
  `frontend/src/components/courses/use-mutation.ts`, `frontend/src/lib/auth/session.ts`.

## 2. Permisos por destino

- Decision: teacher activo en sección destino; teacher admin dueño amplía al curso.
  Origen y destino deben autorizarse en PATCH. Admin aislado no obtiene pauta.
- Rationale: `canAuthorQuiz` exige teacher; ownership administrativo amplía alcance.
  Los permisos de contenido compartido no sirven para quizzes por sección.
- Alternatives considered: rol visual, `manage` o isAdmin aislado; sobreautorizan.
- Evidence: `backend/src/quizzes/quiz-access.ts`, `backend/src/courses/course-access.ts`,
  `docs/adr/quiz-authoring-integrity.md`.

## 3. Separación de representaciones

- Decision: lista/resumen y detalle seguro distintos de ruta de autoría explícita.
  Tipos derivados de OpenAPI y parsers que descartan campos ajenos a cada vista.
- Rationale: lista/get no llevan isCorrect; /authoring sí. Incluso teacher usa primero
  vista segura; pauta solo se solicita al abrir editor autorizado, nunca en prefetch.
- Alternatives considered: descargar siempre y ocultar respuestas; expone pauta.
- Evidence: `docs/reference/openapi/paths/quizzes.yaml`, `backend/src/quizzes/quiz-dto.ts`.

## 4. Datos editables y límites

- Decision: creación mínima con título/destino y questions vacío; configuración completa
  disponible desde US1, edición de preguntas desde US2. Validación según data-model.
- Rationale: backend permite cero preguntas en draft, pero publicar exige al menos una.
  Cada pregunta enviada ya requiere dos alternativas y exactamente una correcta.
  PATCH questions reemplaza colección; UUID existente se retiene, nueva pregunta omite id.
- Alternatives considered: guardar preguntas incompletas o inventar UUID persistidos;
  incompatibles con contrato. Texto incompleto permanece solo en formulario.
- Evidence: `backend/src/quizzes/quiz-validation.ts`, schemas quizzes OpenAPI.

## 5. Publicación e ítem de nota

- Decision: confirmar POST publish sin cuerpo; consultar `listCourseGradeItems` y
  seleccionar por quizId para mostrar ítem y peso real. Sin crear ítems desde UI.
- Rationale: publish devuelve QuizAuthoringView, sin GradeItem; listItems admite teacher
  ordinario. El peso nace 0, pero puede haber cambiado cuando se vuelve a consultar.
  Fallo de lectura secundaria no revierte ni invalida publicación confirmada.
- Alternatives considered: fabricar objeto GradeItem, mostrar siempre peso 0 o integrar
  edición de ponderaciones; falsos o fuera de alcance.
- Evidence: `backend/src/gradebook/gradebook.service.ts`, `gradebook-access.ts`,
  `docs/reference/openapi/paths/gradebook.yaml`, ADR de autoría.

## 6. Congelación y conflictos

- Decision: congelación impide publicar draft nuevo, no crearlo/editarlo. FR-010 se
  interpreta junto a US3.3 y exclusión de cambios API/DB; no agregar bloqueo local falso.
- Rationale: create/update no leen el marcador; publish sí, luego del no-op publicado.
  Course no expone marcador; un 409 no permite afirmar diagnóstico único.
  Todo publicado rechaza PATCH, incluso sin intentos; no se promete edición pospublicación.
- Alternatives considered: bloquear toda creación o inferir freeze de cualquier 409;
  divergencia del contrato. No agregar endpoint de estado ni versión optimista.
- Evidence: `backend/src/quizzes/quizzes.service.ts`, ADR de autoría.

## 7. Integridad, incertidumbre y privacidad

- Decision: datos privados solo en memoria; limpiar al invalidar autorización. Mutaciones
  manuales sin retry automático; reconciliar lecturas y bloquear envío incierto.
- Rationale: create no tiene clave idempotente y listado no demuestra identidad de alta.
  Publish sí es repetible sin nuevos timestamps, GradeItem ni eventos. Auditoría backend
  conserva metadata/contadores sin pauta; editor no persiste secretos en logs/storage/URL.
- Alternatives considered: reintentar POST, título como clave, persistir draft local,
  fusionar ediciones o serializar pauta en auditoría; duplicación o exposición.
- Evidence: ADR de autoría, `frontend/src/components/courses/use-mutation.ts`.

## 8. Verificación y UX

- Decision: node:test/jsdom existentes con matriz FR-016; navegador para foco, contraste,
  temas, 375 px y movimiento reducido. Reutilizar dialog con foco inicial en Volver.
- Rationale: fixtures hacen cada historia verificable sin frontend de rendición/notas.
- Alternatives considered: instalar runner adicional o exigir módulo de notas completo;
  no necesarios. Mocks no prueban locks, RLS ni auditoría; validar recorrido real aparte.
- Evidence: `DESIGN.md`, `mockups/13-quiz-editor.html`, `frontend/test/fixtures/course-ui.ts`.
