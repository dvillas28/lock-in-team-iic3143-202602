# Catálogo NETWORK

Evidencia común: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-NETWORK-001 — 401 en request privado cierra sesión](network-01.md#e2e-network-001) | FL-NETWORK-01 | P0 | regression | M |
| [E2E-NETWORK-002 — 403/404 secundario no derriba contexto válido](network-01.md#e2e-network-002) | FL-NETWORK-01 | P1 | regression | B |
| [E2E-NETWORK-003 — /me temporal 503 conserva lectura y bloquea escritura](network-01.md#e2e-network-003) | FL-NETWORK-01 | P0 | regression | B |
| [E2E-NETWORK-004 — Payload200 inválido no parece lista vacía](network-01.md#e2e-network-004) | FL-NETWORK-01 | P1 | regression | B |
| [E2E-NETWORK-005 — Error500 sanitizado y recuperación](network-01.md#e2e-network-005) | FL-NETWORK-01 | P1 | regression | B |
| [E2E-NETWORK-006 — Timeout privado15s y desconexión](network-02.md#e2e-network-006) | FL-NETWORK-01 | P1 | regression | B |
| [E2E-NETWORK-007 — Offline tras carga y vuelta online](network-02.md#e2e-network-007) | FL-NETWORK-01 | P2 | regression | B |
| [E2E-NETWORK-008 — Respuesta401 vieja no cierra sesión nueva](network-02.md#e2e-network-008) | FL-NETWORK-01 | P0 | extended | B |
| [E2E-NETWORK-009 — Códigos400409422 distinguidos sin borrar borrador](network-02.md#e2e-network-009) | FL-NETWORK-02 | P1 | regression | M |
| [E2E-NETWORK-010 — Cuerpo4096 y media415 transversales](network-02.md#e2e-network-010) | FL-NETWORK-02 | P1 | extended | H |
| [E2E-NETWORK-011 — Error incierto no se reintenta por foco o back](network-03.md#e2e-network-011) | FL-NETWORK-02 | P0 | regression | B |
| [E2E-NETWORK-012 — Problem HTTP no filtra detalles sensibles](network-03.md#e2e-network-012) | FL-NETWORK-02 | P0 | extended | H |
| [E2E-NETWORK-013 — CORS real permite solo orígenes configurados](network-03.md#e2e-network-013) | FL-NETWORK-01 | P0 | regression | M |
