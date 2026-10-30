# Catálogo OPS

Evidencia común: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-OPS-001 — Health readiness y arranque migrado](ops-01.md#e2e-ops-001) | FL-OPS-01 | P1 | extended | O |
| [E2E-OPS-002 — DB cae readiness503 y operación sin éxito parcial](ops-01.md#e2e-ops-002) | FL-OPS-01 | P0 | regression | M |
| [E2E-OPS-003 — Runtime inseguro no sirve tráfico](ops-01.md#e2e-ops-003) | FL-OPS-01 | P0 | extended | O |
| [E2E-OPS-004 — Seed repetible sin duplicados ni restaurar revocados](ops-01.md#e2e-ops-004) | FL-OPS-01 | P0 | extended | O |
| [E2E-OPS-005 — Persistencia tras reiniciar backend y nueva sesión](ops-01.md#e2e-ops-005) | FL-OPS-01 | P0 | regression | M |
| [E2E-OPS-006 — FK compuestas e historia inmutable en DB](ops-02.md#e2e-ops-006) | FL-OPS-01 | P0 | extended | O |
| [E2E-OPS-007 — Fallo transaccional en calificación no deja submitted](ops-02.md#e2e-ops-007) | FL-OPS-01 | P0 | extended | O |
| [E2E-OPS-008 — Guard de destino rechaza producción antes de preparar datos](ops-02.md#e2e-ops-008) | FL-OPS-01 | P0 | extended | O |
| [E2E-OPS-009 — Restauración baseline de suite sin borrar historia por test](ops-02.md#e2e-ops-009) | FL-OPS-01 | P1 | extended | O |
