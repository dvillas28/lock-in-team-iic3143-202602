# Evidencia local y estado de validación

Corte: 2026-10-31. F1–F7 implementadas localmente en `test/e2e-f7`.
No hubo producción, push, merge, despliegue ni cambios a protección de ramas.
[Qué probamos](../E2E_MASTER_PLAN.md) · [Cómo ejecutar](../E2E_README.md).

## Corrida completa

- Fuente probada: `3724107049f6bc6731ffd20a68695120fe102076`, checkout limpio al inicio y al final.
- Run: `4582dbc70e312524`, extended, **512 PASS / 248 casos**, cero fallos, skip o retries.
- Chromium383, Firefox64, WebKit65; 454 instancias navegador y58 complementarias.
- Duración total:1.250,456s (**20m50s**). Duración individual p50=1.365ms, p95=3.315ms.
- macOS arm64, Node 24.9.0, Playwright 1.64.1, PostgreSQL 17.11 Homebrew, seed `academix-e2e-v1`.
- Motores declarados: Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2; revisiones en summary.json.
- GatePASS, cleanup=true, sin clusters propios, lease ni listeners en 4320/4321 tras terminar.

## Veinte rondas de estabilidad

Ventana `f9a9cd53a93ee726`: veinte runIds distintos, mismo SHA anterior, seed, entorno y selección.
Cada ronda creó stack nuevo; todas empezaron/terminaron limpias y eliminaron sus recursos propios.
**3.060 PASS**, cero fallos, omitidos, reintentos o inestables; primer intento100%, también P0.
Alcance:22 casos smoke,153 combinaciones por ronda,51 por motor. No son veinte catálogos completos.

| Ronda | Run | Resultado | Total medido |
| --- | --- | --- | --- |
| 1 | `45663731ba77d54f` | 153/153 | 408.124s |
| 2 | `c4d5bad44435db63` | 153/153 | 392.915s |
| 3 | `911ecb73e2d5dca4` | 153/153 | 399.441s |
| 4 | `da2de18fb6f0243e` | 153/153 | 407.520s |
| 5 | `0b017b08bf625e47` | 153/153 | 670.821s |
| 6 | `35122efdc1a94917` | 153/153 | 663.535s |
| 7 | `e6cef97edb79fdac` | 153/153 | 702.058s |
| 8 | `1d21d161e7f8a0e1` | 153/153 | 510.794s |
| 9 | `b0857cd12d9c77fc` | 153/153 | 382.742s |
| 10 | `6490533d14f0c5f2` | 153/153 | 372.271s |
| 11 | `1ec9d8bbb7d6757f` | 153/153 | 375.951s |
| 12 | `7ff81de65fa38068` | 153/153 | 408.797s |
| 13 | `db93d42db862e7b9` | 153/153 | 386.216s |
| 14 | `de518a0457b856be` | 153/153 | 377.538s |
| 15 | `54589305ea47215c` | 153/153 | 382.556s |
| 16 | `7b8e5ccf93a060b7` | 153/153 | 375.389s |
| 17 | `2c1d638676f7659c` | 153/153 | 381.220s |
| 18 | `c26bcbb399453200` | 153/153 | 549.980s |
| 19 | `7a1f378ddd7954ed` | 153/153 | 374.687s |
| 20 | `51dad51a7347e8d9` | 153/153 | 390.473s |

Tiempo por ronda:p50=390,473s (6m30s), p95=670,821s (11m11s), máximo702,058s (11m42s).
Suma de duraciones de las veinte rondas:8.913,028s (2h28m33s), sin contabilizar pausas del controlador.
Duración individual de test:p50=1.452ms, p95=4.153ms; setup p95=1.986ms, login739ms, cleanup90ms.
Percentiles por rango más cercano; observaciones ausentes no se convierten en cero.
Son mediciones locales, distintas de los timeouts y de los futuros tiempos de GitHub Actions.

## Controles adicionales de F7

- Typecheck, lint y26 unitarios del harness:PASS; los13 afectados se revalidaron tras el último ajuste de CI.
- YAML y estructura de eventos/gates:PASS; no sustituye una ejecución real de GitHub Actions.
- Detección probada con documentación, código, mixtos, desconocidos, errores y renombres reales en Git.
- Gate probado con omisión documental, fallos, cancelaciones, jobs ausentes, SHA/proyectos/variantes incorrectos.
- Bundles de los21 runs positivos verificados por checksum y allowlist; prueba adversarial de secretos/symlinks.
- Cancelación tras arrancar PG:run `8b7aa2120fba5210`, exit1 esperado, cancelled=true, cleanup=true.
- Cancelación durante build:run `c6c5942303db6a63`, exit1 esperado, cero descendientes/build/lease retenidos.
- Los ensayos de cancelación no cuentan como aprobaciones funcionales ni rondas elegibles.

La política de CI, métricas offline y endurecimientos posteriores están en `8fe7c6d`, `2a6f5eb` y `ac87958`.
Detectan cambio de HEAD durante un run, detienen antes ventanas no comparables y limpian volúmenes Docker propios.
Se validaron con checks dirigidos; **no se atribuye la corrida512 ni la ventana20 a esos SHAs posteriores**.
No cambiaron el producto ni las aserciones funcionales. Docker remoto sigue pendiente.

## Historial esencial de F1–F6

| Fase | Evidencia de cierre original | Resultado y límite |
| --- | --- | --- |
| F1 | `882298137195cca0`, `c76306a0e684865a`; SHA05fb1af | Dos runs16 PASS, stacks nuevos. |
| F2 | `c41540ab4f22ea26`; SHA23d7ebb | Regresión F1+F2:72 PASS. |
| F3 | `5dac3117c5e950ef`; SHA4d0da34 | Regresión201 PASS; timeout previo conservado en diagnóstico. |
| F4 | `d014cf0385019d99`; SHA6db9541 | Regresión329 PASS,139 casos. |
| F5 | `2e26783d10b0fd6b`, `31cd7b0254fc4196` | 114 PASS/1 fallo del harness y correctivo1 PASS; no run115 PASS. |
| F6 | Cierre9e7945d; ocho runs registrados en Git | 68 variantes distintas aprobadas,6 fallos del harness corregidos y2 repeticiones de trazas; no run68 PASS. |

Correcciones funcionales separadas de F4: `5b9c242` (NUL→HTTP400, sin persistencia parcial)
y `d5d85b2` (bloqueo de publicación tras escritura incierta), incorporadas mediante cherry-pick local.
Los registros intermedios completos están en Git hasta `8fe7c6d`, por ejemplo:
`git show 8fe7c6d:docs/testing/execution/F6_VALIDATION.md`.
La corrida completa F7 reemplaza la anterior limitación de aceptación solo por incrementos.

## Límites y continuidad

Los reportes completos permanecen en `e2e/reports/<runId>/`, ignorados por Git; copiarlos o reproducirlos.
Métricas: `reports/f7-full-metrics.json` y `reports/f7-stability-metrics.json`, relativas a e2e.
El primer run remoto `41261462330` falló en setup-node del detector: caché automática de pnpm sin pnpm instalado.
Se desactivó esa caché en detector/agregador; revalidación remota, protección y retención efectiva pendientes.
No se repitieron todos los unitarios históricos del producto. El diagnóstico antiguo TEST-01 del subprocess DST
permanece en el historial de LOCAL_VALIDATION.md; no se afirma resuelto por pasar E2E.
`dev` sigue en90463059015e5045d011eadd12b6403b7b492615; `main` en294eb5b4642479772a921ce56ce860c2f329abb6.
La revisión posterior será una única PR acumulativa; no se creó ni publicó automáticamente.
