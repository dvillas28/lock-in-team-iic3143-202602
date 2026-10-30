# Catálogo ATTEMPT

Evidencia común: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-ATTEMPT-001 — Inicio real y navegación al intento](attempt-01.md#e2e-attempt-001) | FL-ATTEMPT-01 | P0 | smoke | B |
| [E2E-ATTEMPT-002 — Reanudar tras reload con ID conocido](attempt-01.md#e2e-attempt-002) | FL-ATTEMPT-01 | P0 | regression | B |
| [E2E-ATTEMPT-003 — Doble clic iniciar](attempt-01.md#e2e-attempt-003) | FL-ATTEMPT-01 | P0 | extended | B |
| [E2E-ATTEMPT-004 — Start replay obtiene recibo y luego estado actual](attempt-01.md#e2e-attempt-004) | FL-ATTEMPT-01 | P1 | regression | M |
| [E2E-ATTEMPT-005 — Segundo activo y maxAttempts agotado](attempt-01.md#e2e-attempt-005) | FL-ATTEMPT-01 | P0 | extended | M |
| [E2E-ATTEMPT-006 — Intentos ilimitados y numeración tras cancelaciones](attempt-02.md#e2e-attempt-006) | FL-ATTEMPT-01 | P1 | extended | M |
| [E2E-ATTEMPT-007 — Ventana futura cerrada y límites ausentes](attempt-02.md#e2e-attempt-007) | FL-ATTEMPT-01 | P0 | regression | M |
| [E2E-ATTEMPT-008 — Pertenencia destino y nota publicada](attempt-02.md#e2e-attempt-008) | FL-ATTEMPT-01 | P0 | regression | M |
| [E2E-ATTEMPT-009 — Clave start ausente inválida o reutilizada](attempt-02.md#e2e-attempt-009) | FL-ATTEMPT-01 | P1 | extended | H |
| [E2E-ATTEMPT-010 — Start simultáneo con claves distintas](attempt-02.md#e2e-attempt-010) | FL-ATTEMPT-01 | P0 | extended | M |
| [E2E-ATTEMPT-011 — Guardar reemplaza respuestas y persiste](attempt-03.md#e2e-attempt-011) | FL-ATTEMPT-02 | P0 | regression | B |
| [E2E-ATTEMPT-012 — Guardar vacío requiere confirmación](attempt-03.md#e2e-attempt-012) | FL-ATTEMPT-02 | P1 | extended | B |
| [E2E-ATTEMPT-013 — Pregunta alternativa inválida y respuesta duplicada](attempt-03.md#e2e-attempt-013) | FL-ATTEMPT-02 | P1 | regression | M |
| [E2E-ATTEMPT-014 — Guardado no cambia cuota ni genera Grade](attempt-03.md#e2e-attempt-014) | FL-ATTEMPT-02 | P1 | regression | M |
| [E2E-ATTEMPT-015 — Guardar después del cierre](attempt-03.md#e2e-attempt-015) | FL-ATTEMPT-02 | P0 | regression | M |
| [E2E-ATTEMPT-016 — PUT perdido bloquea envío y cancelación](attempt-04.md#e2e-attempt-016) | FL-ATTEMPT-02 | P0 | regression | B |
| [E2E-ATTEMPT-017 — Guardar simultáneamente desde dos contextos](attempt-04.md#e2e-attempt-017) | FL-ATTEMPT-02 | P2 | extended | M |
| [E2E-ATTEMPT-018 — Enviar guarda borrador antes del POST](attempt-04.md#e2e-attempt-018) | FL-ATTEMPT-03 | P0 | smoke | M |
| [E2E-ATTEMPT-019 — Entrega parcial y vacía califica omisiones cero](attempt-04.md#e2e-attempt-019) | FL-ATTEMPT-03 | P1 | extended | M |
| [E2E-ATTEMPT-020 — Último graded reemplaza mejor nota previa](attempt-04.md#e2e-attempt-020) | FL-ATTEMPT-03 | P0 | regression | M |
| [E2E-ATTEMPT-021 — Reenvío misma clave y clave distinta](attempt-05.md#e2e-attempt-021) | FL-ATTEMPT-03 | P0 | regression | M |
| [E2E-ATTEMPT-022 — Submit sin cuerpo y clave reutilizada en otro intento](attempt-05.md#e2e-attempt-022) | FL-ATTEMPT-03 | P1 | extended | H |
| [E2E-ATTEMPT-023 — Dos envíos simultáneos misma clave](attempt-05.md#e2e-attempt-023) | FL-ATTEMPT-03 | P0 | extended | M |
| [E2E-ATTEMPT-024 — Carrera submit cancelar](attempt-05.md#e2e-attempt-024) | FL-ATTEMPT-03 | P0 | extended | M |
| [E2E-ATTEMPT-025 — Enviar fuera de plazo sin mutación parcial](attempt-05.md#e2e-attempt-025) | FL-ATTEMPT-03 | P0 | regression | M |
| [E2E-ATTEMPT-026 — Recibo perdido admite replay en misma página](attempt-06.md#e2e-attempt-026) | FL-ATTEMPT-03 | P0 | regression | B |
| [E2E-ATTEMPT-027 — Recarga durante envío exige consulta posterior](attempt-06.md#e2e-attempt-027) | FL-ATTEMPT-03 | P0 | regression | B |
| [E2E-ATTEMPT-028 — Cancelar propio no cambia Grade anterior](attempt-06.md#e2e-attempt-028) | FL-ATTEMPT-04 | P0 | regression | M |
| [E2E-ATTEMPT-029 — Teacher cancela sección histórica aun student revocado](attempt-06.md#e2e-attempt-029) | FL-ATTEMPT-04 | P0 | regression | M |
| [E2E-ATTEMPT-030 — Cancelar replay y estados terminales](attempt-06.md#e2e-attempt-030) | FL-ATTEMPT-04 | P1 | regression | M |
| [E2E-ATTEMPT-031 — Seguimiento paginado y filtros históricos](attempt-07.md#e2e-attempt-031) | FL-ATTEMPT-04 | P1 | regression | B |
| [E2E-ATTEMPT-032 — Cancelación perdida y GET fallido conserva éxito 204](attempt-07.md#e2e-attempt-032) | FL-ATTEMPT-04 | P1 | regression | B |
