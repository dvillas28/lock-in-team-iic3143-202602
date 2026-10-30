# Catálogo QUIZ

Evidencia común: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-QUIZ-001 — Listado y detalle por rol y destino](quiz-01.md#e2e-quiz-001) | FL-QUIZ-01 | P0 | regression | M |
| [E2E-QUIZ-002 — Buscar filtrar limpiar sin llamadas no previstas](quiz-01.md#e2e-quiz-002) | FL-QUIZ-01 | P2 | regression | B |
| [E2E-QUIZ-003 — Lista vacía y sin instrucciones](quiz-01.md#e2e-quiz-003) | FL-QUIZ-01 | P2 | extended | B |
| [E2E-QUIZ-004 — Pauta de publicado solo autor autorizado](quiz-01.md#e2e-quiz-004) | FL-QUIZ-01 | P0 | regression | M |
| [E2E-QUIZ-005 — Crear quiz completo con preguntas y pauta](quiz-01.md#e2e-quiz-005) | FL-QUIZ-02 | P1 | regression | B |
| [E2E-QUIZ-006 — Editar ordenar agregar y quitar preguntas](quiz-02.md#e2e-quiz-006) | FL-QUIZ-02 | P1 | regression | B |
| [E2E-QUIZ-007 — Configuración opcional y fechas exactas en PATCH mínimo](quiz-02.md#e2e-quiz-007) | FL-QUIZ-02 | P1 | regression | M |
| [E2E-QUIZ-008 — Pauta inválida y alternativas duplicadas](quiz-02.md#e2e-quiz-008) | FL-QUIZ-02 | P1 | regression | M |
| [E2E-QUIZ-009 — Puntos posiciones e identidades de pregunta](quiz-02.md#e2e-quiz-009) | FL-QUIZ-02 | P1 | extended | M |
| [E2E-QUIZ-010 — Fechas imposibles ventana invertida y maxAttempts](quiz-02.md#e2e-quiz-010) | FL-QUIZ-02 | P1 | regression | M |
| [E2E-QUIZ-011 — Mover borrador entre secciones autorizadas](quiz-03.md#e2e-quiz-011) | FL-QUIZ-02 | P0 | regression | M |
| [E2E-QUIZ-012 — Límite JSON quiz y reintento tras error](quiz-03.md#e2e-quiz-012) | FL-QUIZ-02 | P2 | extended | M |
| [E2E-QUIZ-013 — Creación con respuesta perdida](quiz-03.md#e2e-quiz-013) | FL-QUIZ-02 | P1 | regression | B |
| [E2E-QUIZ-014 — Publicar quiz crea ítem único peso cero](quiz-03.md#e2e-quiz-014) | FL-QUIZ-03 | P0 | smoke | M |
| [E2E-QUIZ-015 — Publicación repetida es no-op autorizado](quiz-03.md#e2e-quiz-015) | FL-QUIZ-03 | P1 | regression | M |
| [E2E-QUIZ-016 — Publicado no editable aunque no tenga intentos](quiz-04.md#e2e-quiz-016) | FL-QUIZ-03 | P0 | regression | M |
| [E2E-QUIZ-017 — Publicar vacío o con curso congelado](quiz-04.md#e2e-quiz-017) | FL-QUIZ-03 | P1 | regression | M |
| [E2E-QUIZ-018 — Carrera publish quiz con primera publicación de notas](quiz-04.md#e2e-quiz-018) | FL-QUIZ-03 | P0 | extended | M |
