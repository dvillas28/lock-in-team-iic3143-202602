# Catálogo AUTH

Evidencia común: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-AUTH-001 — Login correcto de cada perfil](auth-01.md#e2e-auth-001) | FL-AUTH-01 | P0 | smoke | B |
| [E2E-AUTH-002 — Credenciales erróneas indistinguibles](auth-01.md#e2e-auth-002) | FL-AUTH-01 | P0 | smoke | B |
| [E2E-AUTH-003 — Usuario inactivo](auth-01.md#e2e-auth-003) | FL-AUTH-01 | P0 | regression | M |
| [E2E-AUTH-004 — Campos vacíos y correo inválido](auth-01.md#e2e-auth-004) | FL-AUTH-01 | P1 | regression | M |
| [E2E-AUTH-005 — Correo normalizado y password exacta](auth-01.md#e2e-auth-005) | FL-AUTH-01 | P1 | extended | B |
| [E2E-AUTH-006 — Límites de login y JSON malformado](auth-02.md#e2e-auth-006) | FL-AUTH-01 | P2 | extended | H |
| [E2E-AUTH-007 — Cuota real y enfriamiento visible](auth-02.md#e2e-auth-007) | FL-AUTH-01 | P1 | regression | M |
| [E2E-AUTH-008 — Login de usuario sin memberships](auth-02.md#e2e-auth-008) | FL-AUTH-01 | P1 | regression | M |
| [E2E-AUTH-009 — Token no enviado a rutas públicas](auth-02.md#e2e-auth-009) | FL-AUTH-01 | P0 | regression | M |
| [E2E-AUTH-010 — SPA conserva sesión; reload la pierde](auth-02.md#e2e-auth-010) | FL-AUTH-02 | P0 | smoke | B |
| [E2E-AUTH-011 — Logout limpia información y peticiones](auth-03.md#e2e-auth-011) | FL-AUTH-02 | P0 | smoke | B |
| [E2E-AUTH-012 — URL profunda permitida vuelve tras login](auth-03.md#e2e-auth-012) | FL-AUTH-02 | P1 | regression | B |
| [E2E-AUTH-013 — Retorno fuera de allowlist](auth-03.md#e2e-auth-013) | FL-AUTH-02 | P0 | extended | B |
| [E2E-AUTH-014 — Deep link material y autoría usa fallback vigente](auth-03.md#e2e-auth-014) | FL-AUTH-02 | P2 | regression | B |
| [E2E-AUTH-015 — Visitar login con sesión activa](auth-03.md#e2e-auth-015) | FL-AUTH-02 | P2 | regression | B |
| [E2E-AUTH-016 — Expiración cliente a 900 segundos](auth-04.md#e2e-auth-016) | FL-AUTH-02 | P0 | regression | B |
| [E2E-AUTH-017 — JWT inválido manipulado o vencido en API](auth-04.md#e2e-auth-017) | FL-AUTH-02 | P0 | extended | H |
| [E2E-AUTH-018 — Headers Bearer ambiguos](auth-04.md#e2e-auth-018) | FL-AUTH-02 | P1 | extended | H |
| [E2E-AUTH-019 — Dos pestañas con memoria independiente](auth-04.md#e2e-auth-019) | FL-AUTH-02 | P1 | extended | B |
| [E2E-AUTH-020 — Foco no borra borradores](auth-04.md#e2e-auth-020) | FL-AUTH-02 | P0 | regression | B |
| [E2E-AUTH-021 — Login200 sin directorio confirmado no abre privado](auth-05.md#e2e-auth-021) | FL-AUTH-01 | P0 | regression | B |
| [E2E-AUTH-022 — Password Unicode se limita por bytes](auth-05.md#e2e-auth-022) | FL-AUTH-01 | P2 | extended | H |
