# Catálogo ADMIN

Evidencia común: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-ADMIN-001 — Listar miembros activos institucionales](admin-01.md#e2e-admin-001) | FL-ADMIN-01 | P0 | extended | H |
| [E2E-ADMIN-002 — Conceder isAdmin habilita crear curso](admin-01.md#e2e-admin-002) | FL-ADMIN-01 | P0 | regression | M |
| [E2E-ADMIN-003 — Revocar delegación y repetir no-op](admin-01.md#e2e-admin-003) | FL-ADMIN-01 | P0 | regression | M |
| [E2E-ADMIN-004 — Admin y roles académicos no delegan](admin-01.md#e2e-admin-004) | FL-ADMIN-01 | P0 | extended | H |
| [E2E-ADMIN-005 — Target otra institución inactivo o ausente](admin-01.md#e2e-admin-005) | FL-ADMIN-01 | P0 | extended | H |
| [E2E-ADMIN-006 — Flags independientes y delegación propia](admin-02.md#e2e-admin-006) | FL-ADMIN-01 | P0 | regression | M |
| [E2E-ADMIN-007 — Onboarding inicial repetible sin reset de credenciales](admin-02.md#e2e-admin-007) | FL-ADMIN-02 | P1 | extended | O |
| [E2E-ADMIN-008 — Recuperación superadmin controlada y auditada](admin-02.md#e2e-admin-008) | FL-ADMIN-02 | P0 | extended | O |
| [E2E-ADMIN-009 — Revocar último superadmin exige reemplazo](admin-02.md#e2e-admin-009) | FL-ADMIN-02 | P0 | extended | O |
| [E2E-ADMIN-010 — Onboarding colisión y operación repetida con input distinto](admin-02.md#e2e-admin-010) | FL-ADMIN-02 | P1 | extended | O |
| [E2E-ADMIN-011 — Revocación concurrente de superadmin y delegación](admin-03.md#e2e-admin-011) | FL-ADMIN-02 | P0 | extended | M |
