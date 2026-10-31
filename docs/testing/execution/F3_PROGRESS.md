# F3 — Registro incremental

**F3 aceptada localmente.** El cierre y los resultados vigentes están en[F3_VALIDATION.md](F3_VALIDATION.md).
Este archivo conserva el historial del incremento inicial; no describe trabajo pendiente actual.

## Hitos

- c4ffa10:11 fichas AUTH,20 variantes; run8108476f612f48ed limpio,20 PASS.
- c49b74f:AUTH-020 exige una revalidación GET me200 observada; diagnóstico08f752880ad15431,1 PASS.
- a48c882:helpers de snapshots,operaciones con ownership e historia owner/student.
- 5e4a4d2:matrices completas TENANT/RBAC/ADMIN/AUDIT; runc6c1afa828674c77 limpio,128 PASS en tres motores.
- 4d0da34:recuperación visual de cursor además de sus seis comprobaciones HTTP.
- Cierre:regresión F1–F3,201 PASS y85 fichas aprobadas,con evidencia en F3_VALIDATION.

Los fallos de diagnóstico provinieron de selectores,fixtures o expectativas del test; se corrigieron
sin reducir aserciones. No se necesitó una corrección funcional del producto en esta fase.
La cuota real se valida con su espera de recuperación; no se incrementaron reintentos.

## Continuidad

Leer IMPLEMENTATION_STATUS.md y E2E_EXECUTION_JOURNAL.md antes de retomar.
F4 autorizada tras aceptar F3. No push/merge ni producción.
