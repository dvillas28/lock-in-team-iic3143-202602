# Implementación E2E: estado verificable

Corte:**2026-10-31**. **F1–F6 aceptadas localmente por incrementos; F7 pendiente.**
**248/248 fichas implementadas y aceptadas históricamente**, sin afirmar regresión global actual.
[F6](F6_VALIDATION.md) · [F5](F5_VALIDATION.md) · [F4](F4_VALIDATION.md) · [F3](F3_VALIDATION.md).

## Conservación y entorno

- Checkout permanente:`/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f6`.
- Código final F6:`7db63b0`; historia y commits de incrementos conservados; último run sobre8bb038b.
- `dev`:90463059015e5045d011eadd12b6403b7b492615; `main`:294eb5b4642479772a921ce56ce860c2f329abb6.
- Sin push, merge, despliegue ni producción; no depende de la copia temporal inicial.
- PostgreSQL17, Next/Nest y migraciones reales; DB por variante/retry, runtime con RLS y cleanup owned.
- F6 agrega pruebas, configuración de motores y anotaciones de tiempos; no modifica el producto.

## Evidencia por incremento

| Alcance | Evidencia | Resultado |
| --- | --- | --- |
| F1–F4 histórico, no repetido | d014cf0385019d99 / 6db9541 | 329 PASS;139 fichas |
| F5 | 2e26783d10b0fd6b +31cd7b0254fc4196 | 88 fichas/115 variantes aceptadas por corrección dirigida |
| F6 | Ocho runs listados en F6_VALIDATION | 21 fichas/68 variantes aceptadas;41 Chromium/13 Firefox/14 WebKit |

F6:76 ejecuciones,68 PASS distintos,6 fallos corregidos y2 repeticiones por protección de trazas;
ningún skip/retry local. Solo NETWORK-008 se repitió tras ese cambio de instrumentación.
Cada run F6 empezó y terminó limpio. Los ocho stacks propios se eliminaron; puertos locales cerrados.
F1–F5 y las variantes aprobadas no se repitieron, conforme a la instrucción de ahorrar ejecución.
El catálogo contiene222 fichas de navegador y26 complementarias; no confundir con512 instancias configuradas.
No hubo un único run68 PASS de F6 ni regresión completa F1–F6 tras estos cambios.
El ledger automático del último run sigue siendo parcial por selección; el ledger histórico cita cada evidencia.
Los cruces obligatorios y40/40 pares visuales priorizados están trazados en[F6_COMBINATIONS](F6_COMBINATIONS.md).

## Continuidad

- **F6 terminada; detenerse antes de F7 para revisión del usuario. F7 no iniciada.**
- Retomar desde `test/e2e-f6`; crear `test/e2e-f7` solo con nueva autorización.
- [Guía incremental](E2E_EXECUTION_JOURNAL.md): todas, por fase, navegador visible e inspector.
- Pendientes F7:automatización/estabilidad, consolidación del manual y veinte ejecuciones elegibles.
- CI remoto y protección de ramas no acreditados; push/merge continúan sin autorización.
- No declarar la suite completamente estabilizada por tener las248 fichas implementadas.
- Las limitaciones WCAG, combinatorias y de evidencia histórica permanecen explícitas.
