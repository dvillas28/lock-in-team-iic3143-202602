# Catálogo AUDIT

Evidencia común: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-AUDIT-001 — Historia before after actor tenant y recurso](audit-01.md#e2e-audit-001) | FL-AUDIT-01 | P1 | regression | B |
| [E2E-AUDIT-002 — Teacher solo sección histórica owner teacher global](audit-01.md#e2e-audit-002) | FL-AUDIT-01 | P0 | regression | M |
| [E2E-AUDIT-003 — Owner student sin teacher no ve grade](audit-01.md#e2e-audit-003) | FL-AUDIT-01 | P0 | smoke | M |
| [E2E-AUDIT-004 — Owner pierde teacher manteniendo cursor](audit-01.md#e2e-audit-004) | FL-AUDIT-01 | P0 | regression | M |
| [E2E-AUDIT-005 — Student assistant y superadmin sin curso no consultan](audit-01.md#e2e-audit-005) | FL-AUDIT-01 | P0 | regression | M |
| [E2E-AUDIT-006 — Filtros completos y fechas imposibles](audit-02.md#e2e-audit-006) | FL-AUDIT-01 | P1 | extended | M |
| [E2E-AUDIT-007 — Paginación estable y fallo siguiente página](audit-02.md#e2e-audit-007) | FL-AUDIT-01 | P1 | regression | B |
| [E2E-AUDIT-008 — Snapshots nunca contienen pauta ni credenciales](audit-02.md#e2e-audit-008) | FL-AUDIT-01 | P0 | regression | M |
| [E2E-AUDIT-009 — Snapshots Markdown como texto escapado](audit-02.md#e2e-audit-009) | FL-AUDIT-01 | P0 | regression | B |
| [E2E-AUDIT-010 — No-op y operación fallida no emiten eventos](audit-02.md#e2e-audit-010) | FL-AUDIT-01 | P1 | regression | M |
