# Catálogo TENANT

Evidencia común: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-TENANT-001 — UC no accede UTFSM sin membresía](tenant-01.md#e2e-tenant-001) | FL-TENANT-01 | P0 | smoke | M |
| [E2E-TENANT-002 — Identidad con roles distintos entre instituciones](tenant-01.md#e2e-tenant-002) | FL-TENANT-01 | P0 | smoke | B |
| [E2E-TENANT-003 — Path prevalece sobre Host Origin headers y body](tenant-01.md#e2e-tenant-003) | FL-TENANT-01 | P0 | extended | H |
| [E2E-TENANT-004 — Slug inválido inexistente e institución inactiva](tenant-01.md#e2e-tenant-004) | FL-TENANT-01 | P0 | extended | M |
| [E2E-TENANT-005 — Revocación membership con JWT vigente](tenant-01.md#e2e-tenant-005) | FL-TENANT-01 | P0 | regression | M |
| [E2E-TENANT-006 — Desactivar UC conserva acceso UTFSM](tenant-02.md#e2e-tenant-006) | FL-TENANT-01 | P0 | regression | M |
| [E2E-TENANT-007 — Volver entre subdominios y BFCache](tenant-02.md#e2e-tenant-007) | FL-TENANT-01 | P0 | regression | B |
| [E2E-TENANT-008 — Lecturas de UUID UTFSM bajo UC](tenant-02.md#e2e-tenant-008) | FL-TENANT-02 | P0 | smoke | M |
| [E2E-TENANT-009 — Escrituras hacia UUID cruzados](tenant-02.md#e2e-tenant-009) | FL-TENANT-02 | P0 | smoke | M |
| [E2E-TENANT-010 — Relación cruzada en cuerpos de escrituras](tenant-02.md#e2e-tenant-010) | FL-TENANT-02 | P0 | regression | M |
| [E2E-TENANT-011 — Mismo rol en curso ajeno del mismo tenant](tenant-03.md#e2e-tenant-011) | FL-TENANT-02 | P0 | regression | M |
| [E2E-TENANT-012 — Curso y padres incoherentes en URL frontend](tenant-03.md#e2e-tenant-012) | FL-TENANT-02 | P0 | regression | B |
| [E2E-TENANT-013 — Cursor de otro tenant actor o filtro](tenant-03.md#e2e-tenant-013) | FL-TENANT-02 | P0 | regression | M |
| [E2E-TENANT-014 — Contexto RLS ausente y pool reutilizado](tenant-03.md#e2e-tenant-014) | FL-TENANT-02 | P0 | extended | H |
| [E2E-TENANT-015 — Respuesta UC tardía tras cambio de identidad](tenant-03.md#e2e-tenant-015) | FL-TENANT-02 | P0 | regression | B |
