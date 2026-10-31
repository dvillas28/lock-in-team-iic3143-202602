# Implementación E2E: estado verificable

Corte: **2026-10-31**. **F1–F5 aceptadas localmente; suite del catálogo incompleta.**
[F5](F5_VALIDATION.md) · [F4](F4_VALIDATION.md) · [F3](F3_VALIDATION.md) · [F2](F2_VALIDATION.md) · [F1](F1_VALIDATION.md).

## Conservación y entorno

- Checkout permanente: `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f5`.
- F5: commits7c69020/aef4bbf/1e57418; correctivo del harness3c709a3. Historia anterior conservada.
- `dev`:90463059015e5045d011eadd12b6403b7b492615; `main`:294eb5b4642479772a921ce56ce860c2f329abb6.
- Sin push, merge, despliegue ni producción; la ejecución no necesita la copia temporal inicial.
- ENV-01/02 resueltos: PostgreSQL17 y navegadores locales autorizados.
- Next/Nest/migraciones reales, DB por variante/retry, runtime con RLS y cleanup con ownership.
- F5 agrega pruebas y documentación; no cambia el producto ni añade dependencias/APIs públicas.

## Evidencia vigente por incremento

| Alcance | Run / SHA | Resultado |
| --- | --- | --- |
| F1–F4 histórico, no repetido | d014cf0385019d99 / 6db9541 | 329 PASS;139 fichas |
| F5 completa | 2e26783d10b0fd6b / 1e57418 | 114 PASS/1 FAIL de transporte del harness |
| Corrección solo ATTEMPT-009 | 31cd7b0254fc4196 / 3c709a3 | 1 PASS; otros114 tests sin cambios |

Ambos runs finales F5: checkout limpio al inicio/final, seed `academix-e2e-v1`, cleanup confirmado.
Aceptación F5:88 fichas y115 variantes/motores, por las dos evidencias explícitas; no un run único115 PASS.
Incluye cinco fichas smoke nuevas en Chromium/Firefox/WebKit y el ciclo completo en UC/UTFSM.
**227/248 fichas aceptadas históricamente**:203 navegador y24 complementarias; **21 pendientes**.
Esto no acredita una regresión completa F1–F5 después del cambio. Se respetó la petición de ejecutar
solo pruebas nuevas y repetir únicamente las fallidas; no se relajaron aserciones ni reintentos.
El reporte automático refleja el último run; el ledger humano conserva las distintas evidencias.

## Continuidad

- **Detenerse antes de F6 para revisión del usuario. F6 no iniciada.**
- Retomar desde `test/e2e-f5`; crear `test/e2e-f6` solo con nueva autorización.
- [Guía incremental](E2E_EXECUTION_JOURNAL.md): todas, por fase, navegador visible e inspector.
- Pendientes: F6 NETWORK/A11Y; F7 automatización, validación remota y veinte ejecuciones elegibles.
- Q02/NUL y CONTENT-016 mantienen los fixes funcionales separados y la evidencia histórica de F4.
- CI remoto y protección de ramas no acreditados; no hay permiso de push/merge.
- La suite no se declara completa; los fallos diagnósticos permanecen en los reportes de cada fase.
