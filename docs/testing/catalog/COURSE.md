# Catálogo COURSE

Evidencia común: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-COURSE-001 — Mis cursos refleja usuario tenant y periodo](course-01.md#e2e-course-001) | FL-COURSE-01 | P1 | smoke | B |
| [E2E-COURSE-002 — Dashboard sin cursos](course-01.md#e2e-course-002) | FL-COURSE-01 | P1 | regression | B |
| [E2E-COURSE-003 — Identificadores inválidos e inexistentes](course-01.md#e2e-course-003) | FL-COURSE-01 | P2 | extended | M |
| [E2E-COURSE-004 — Revocación última matrícula retira curso](course-01.md#e2e-course-004) | FL-COURSE-01 | P0 | regression | M |
| [E2E-COURSE-005 — Dashboard error recupera sin mezclar identidad](course-01.md#e2e-course-005) | FL-COURSE-01 | P2 | regression | B |
| [E2E-COURSE-006 — Crear curso sección y teacher inicial atómicos](course-02.md#e2e-course-006) | FL-COURSE-02 | P1 | smoke | B |
| [E2E-COURSE-007 — Crear duplicado por code y periodo](course-02.md#e2e-course-007) | FL-COURSE-02 | P1 | regression | B |
| [E2E-COURSE-008 — Editar metadatos con PATCH mínimo](course-02.md#e2e-course-008) | FL-COURSE-02 | P1 | regression | B |
| [E2E-COURSE-009 — No-op no duplica auditoría](course-02.md#e2e-course-009) | FL-COURSE-02 | P2 | regression | M |
| [E2E-COURSE-010 — Límites metadatos y body estricto](course-02.md#e2e-course-010) | FL-COURSE-02 | P2 | extended | M |
| [E2E-COURSE-011 — Creación incierta no se repite automáticamente](course-03.md#e2e-course-011) | FL-COURSE-02 | P1 | regression | B |
| [E2E-COURSE-012 — Dos creaciones simultáneas con misma clave natural](course-03.md#e2e-course-012) | FL-COURSE-02 | P2 | extended | M |
| [E2E-COURSE-013 — Metadatos con NUL](course-03.md#e2e-course-013) | FL-COURSE-02 | P2 | extended | H |
