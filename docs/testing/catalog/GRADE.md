# Catálogo GRADE

Evidencia común: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-GRADE-001 — Escala numérica y exigencia60](grade-01.md#e2e-grade-001) | FL-GRADE-01 | P0 | regression | M |
| [E2E-GRADE-002 — Redondeo HALF_UP y porcentaje previo a nota](grade-01.md#e2e-grade-002) | FL-GRADE-01 | P1 | extended | M |
| [E2E-GRADE-003 — Sin notas publicadas promedio null](grade-01.md#e2e-grade-003) | FL-GRADE-01 | P0 | smoke | M |
| [E2E-GRADE-004 — Publicación parcial y promedio normalizado](grade-01.md#e2e-grade-004) | FL-GRADE-01 | P0 | regression | B |
| [E2E-GRADE-005 — Peso cero publicado y promedio null](grade-01.md#e2e-grade-005) | FL-GRADE-01 | P1 | extended | B |
| [E2E-GRADE-006 — Notas ajenas no seleccionables por query](grade-02.md#e2e-grade-006) | FL-GRADE-01 | P0 | regression | M |
| [E2E-GRADE-007 — Historial de sección no reescribe nota al trasladar alumno](grade-02.md#e2e-grade-007) | FL-GRADE-01 | P0 | regression | M |
| [E2E-GRADE-008 — Libro muestra publicadas y no publicadas autorizadas](grade-02.md#e2e-grade-008) | FL-GRADE-02 | P0 | regression | M |
| [E2E-GRADE-009 — Filas separadas mismo alumno dos secciones](grade-02.md#e2e-grade-009) | FL-GRADE-02 | P1 | regression | B |
| [E2E-GRADE-010 — Filas históricas de usuarios inactivos](grade-02.md#e2e-grade-010) | FL-GRADE-02 | P1 | regression | M |
| [E2E-GRADE-011 — Libro vacío no incluye estudiantes sin Grade](grade-03.md#e2e-grade-011) | FL-GRADE-02 | P1 | regression | B |
| [E2E-GRADE-012 — Cambio filtro reinicia cursor y selección](grade-03.md#e2e-grade-012) | FL-GRADE-02 | P0 | regression | B |
| [E2E-GRADE-013 — Límites y curso ajeno en libro](grade-03.md#e2e-grade-013) | FL-GRADE-02 | P1 | extended | M |
| [E2E-GRADE-014 — Guardar pesos exactos suma100](grade-03.md#e2e-grade-014) | FL-GRADE-03 | P0 | regression | B |
| [E2E-GRADE-015 — Suma inválida colección incompleta y duplicados](grade-03.md#e2e-grade-015) | FL-GRADE-03 | P1 | regression | M |
| [E2E-GRADE-016 — Rango precisión y tipo de ponderación](grade-04.md#e2e-grade-016) | FL-GRADE-03 | P1 | extended | M |
| [E2E-GRADE-017 — No-op antes y después de freeze](grade-04.md#e2e-grade-017) | FL-GRADE-03 | P1 | regression | M |
| [E2E-GRADE-018 — Freeze en otra página o sección no visible](grade-04.md#e2e-grade-018) | FL-GRADE-03 | P0 | regression | B |
| [E2E-GRADE-019 — Carrera pesos contra primera publicación](grade-04.md#e2e-grade-019) | FL-GRADE-03 | P0 | extended | M |
| [E2E-GRADE-020 — Resultado incierto de pesos exige reconciliar](grade-04.md#e2e-grade-020) | FL-GRADE-03 | P1 | regression | B |
| [E2E-GRADE-021 — Publicar selección explícita y ver nota estudiante](grade-05.md#e2e-grade-021) | FL-GRADE-04 | P0 | smoke | B |
| [E2E-GRADE-022 — Selección vacía y rectángulo incompleto](grade-05.md#e2e-grade-022) | FL-GRADE-04 | P0 | regression | M |
| [E2E-GRADE-023 — Intento activo bloquea; cancelado no basta para nota](grade-05.md#e2e-grade-023) | FL-GRADE-04 | P0 | regression | M |
| [E2E-GRADE-024 — Último graded y valores consistentes requeridos](grade-05.md#e2e-grade-024) | FL-GRADE-04 | P0 | regression | M |
| [E2E-GRADE-025 — Replay misma clave selección canónica](grade-05.md#e2e-grade-025) | FL-GRADE-04 | P0 | regression | M |
| [E2E-GRADE-026 — Clave reutilizada selección diferente y otro curso](grade-06.md#e2e-grade-026) | FL-GRADE-04 | P0 | regression | M |
| [E2E-GRADE-027 — Otra clave sobre nota publicada](grade-06.md#e2e-grade-027) | FL-GRADE-04 | P1 | regression | M |
| [E2E-GRADE-028 — Doble clic y dos docentes publican lo mismo](grade-06.md#e2e-grade-028) | FL-GRADE-04 | P0 | extended | M |
| [E2E-GRADE-029 — Timeout tras commit y replay original](grade-06.md#e2e-grade-029) | FL-GRADE-04 | P0 | regression | B |
| [E2E-GRADE-030 — 403 definitivo o409 libera selección corregible](grade-06.md#e2e-grade-030) | FL-GRADE-04 | P1 | regression | B |
| [E2E-GRADE-031 — Publicación pierde memoria al recargar](grade-07.md#e2e-grade-031) | FL-GRADE-04 | P0 | regression | B |
| [E2E-GRADE-032 — Replay después de revocar teacher no devuelve recibo](grade-07.md#e2e-grade-032) | FL-GRADE-04 | P0 | regression | M |
