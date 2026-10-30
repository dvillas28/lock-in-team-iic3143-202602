# Catálogo ENROLL

Evidencia común: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-ENROLL-001 — Buscar por nombre correo mayúsculas y Unicode](enroll-01.md#e2e-enroll-001) | FL-ENROLL-01 | P1 | regression | B |
| [E2E-ENROLL-002 — Búsqueda vacía y sin coincidencias](enroll-01.md#e2e-enroll-002) | FL-ENROLL-01 | P2 | regression | M |
| [E2E-ENROLL-003 — Caracteres especiales son literales](enroll-01.md#e2e-enroll-003) | FL-ENROLL-01 | P1 | extended | M |
| [E2E-ENROLL-004 — Directorio excluye revocados inactivos y UTFSM](enroll-01.md#e2e-enroll-004) | FL-ENROLL-01 | P0 | regression | M |
| [E2E-ENROLL-005 — Permiso de búsqueda requiere teacher institucional](enroll-01.md#e2e-enroll-005) | FL-ENROLL-01 | P0 | regression | M |
| [E2E-ENROLL-006 — Paginación y búsqueda tardía](enroll-02.md#e2e-enroll-006) | FL-ENROLL-01 | P1 | regression | B |
| [E2E-ENROLL-007 — Asignar participante existente y persistir](enroll-02.md#e2e-enroll-007) | FL-ENROLL-02 | P1 | regression | B |
| [E2E-ENROLL-008 — Asignación duplicada es idempotente](enroll-02.md#e2e-enroll-008) | FL-ENROLL-02 | P1 | regression | M |
| [E2E-ENROLL-009 — Roles acumulados distintos](enroll-02.md#e2e-enroll-009) | FL-ENROLL-02 | P0 | regression | B |
| [E2E-ENROLL-010 — Cambio de rol conserva predecesor histórico](enroll-02.md#e2e-enroll-010) | FL-ENROLL-02 | P1 | regression | B |
| [E2E-ENROLL-011 — Cambio hacia rol activo existente](enroll-03.md#e2e-enroll-011) | FL-ENROLL-02 | P1 | regression | M |
| [E2E-ENROLL-012 — Revocar mediante confirmación](enroll-03.md#e2e-enroll-012) | FL-ENROLL-02 | P0 | regression | B |
| [E2E-ENROLL-013 — Autorrevocación último teacher permitido](enroll-03.md#e2e-enroll-013) | FL-ENROLL-02 | P0 | regression | M |
| [E2E-ENROLL-014 — Reactivar matrícula por API sin UI](enroll-03.md#e2e-enroll-014) | FL-ENROLL-02 | P1 | regression | M |
| [E2E-ENROLL-015 — Payload estricto y rol inválido](enroll-03.md#e2e-enroll-015) | FL-ENROLL-02 | P2 | regression | M |
| [E2E-ENROLL-016 — Rol en matrícula inactiva y no-op](enroll-04.md#e2e-enroll-016) | FL-ENROLL-02 | P2 | regression | M |
| [E2E-ENROLL-017 — Dos asignaciones concurrentes mismo rol](enroll-04.md#e2e-enroll-017) | FL-ENROLL-02 | P1 | extended | M |
| [E2E-ENROLL-018 — Páginas de historial y actor revocado](enroll-04.md#e2e-enroll-018) | FL-ENROLL-02 | P1 | regression | M |
| [E2E-ENROLL-019 — Diálogo y PATCH pendiente al cambiar sección](enroll-04.md#e2e-enroll-019) | FL-ENROLL-02 | P0 | extended | B |
