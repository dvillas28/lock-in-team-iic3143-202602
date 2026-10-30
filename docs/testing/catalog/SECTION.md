# Catálogo SECTION

Evidencia común: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-SECTION-001 — Secciones según ownership y matrículas](section-01.md#e2e-section-001) | FL-SECTION-01 | P1 | regression | M |
| [E2E-SECTION-002 — Crear sección vacía y editar](section-01.md#e2e-section-002) | FL-SECTION-01 | P1 | regression | B |
| [E2E-SECTION-003 — Validación de capacidad y duplicado](section-01.md#e2e-section-003) | FL-SECTION-01 | P2 | extended | M |
| [E2E-SECTION-004 — Buscar sección mantiene selección sin coincidencias](section-01.md#e2e-section-004) | FL-SECTION-01 | P2 | regression | B |
| [E2E-SECTION-005 — Cambio de sección descarta respuesta tardía](section-01.md#e2e-section-005) | FL-SECTION-01 | P0 | regression | B |
| [E2E-SECTION-006 — Capacidad no es cuota de inscripción vigente](section-02.md#e2e-section-006) | FL-SECTION-01 | P2 | extended | M |
