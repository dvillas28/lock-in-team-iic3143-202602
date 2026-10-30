# Catálogo RBAC

Evidencia común: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-RBAC-001 — Superadmin solo no obtiene permisos académicos](rbac-01.md#e2e-rbac-001) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-002 — Admin ajeno no administra todos los cursos](rbac-01.md#e2e-rbac-002) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-003 — Owner sin teacher mantiene solo administración](rbac-01.md#e2e-rbac-003) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-004 — Teacher no admin escribe academia propia](rbac-01.md#e2e-rbac-004) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-005 — Assistant solo seguimiento autorizado](rbac-01.md#e2e-rbac-005) | FL-RBAC-01 | P0 | smoke | M |
| [E2E-RBAC-006 — Estudiante solo recorrido propio](rbac-02.md#e2e-rbac-006) | FL-RBAC-01 | P0 | smoke | M |
| [E2E-RBAC-007 — Revocar isAdmin conserva docencia](rbac-02.md#e2e-rbac-007) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-008 — Owner teacher amplía a sección distinta](rbac-02.md#e2e-rbac-008) | FL-RBAC-01 | P0 | regression | M |
| [E2E-RBAC-009 — Teacher más student con acceso a pauta no rinde](rbac-02.md#e2e-rbac-009) | FL-RBAC-02 | P0 | smoke | M |
| [E2E-RBAC-010 — Teacher S2 student S1 sin pauta de Q1 puede rendir](rbac-02.md#e2e-rbac-010) | FL-RBAC-02 | P0 | regression | M |
| [E2E-RBAC-011 — Assistant y student acumulan capacidades diferenciadas](rbac-03.md#e2e-rbac-011) | FL-RBAC-02 | P0 | regression | M |
| [E2E-RBAC-012 — Revocación de teacher con cursor y sesión vigentes](rbac-03.md#e2e-rbac-012) | FL-RBAC-02 | P0 | regression | M |
| [E2E-RBAC-013 — Parámetros visuales no escalan rol](rbac-03.md#e2e-rbac-013) | FL-RBAC-02 | P0 | regression | M |
