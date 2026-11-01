# Política de GitHub Actions E2E

Implementación: [.github/workflows/e2e.yml](../../.github/workflows/e2e.yml).
Validada localmente; ejecución remota y protección de ramas pendientes. Sin push ni merge.

## Cuándo corre

| Evento | Suite | Motores | Selección actual |
| --- | --- | --- | --- |
| PR hacia dev/main | Smoke | Chromium | 22 casos / 51 instancias |
| Push a dev | Regression | Chromium | 178 casos / 253 instancias |
| Semanal: lunes 03:00 UTC | Extended | Chromium, Firefox, WebKit | 248 casos / 512 instancias |
| workflow_dispatch | Smoke, regression o extended | Los tres motores | Según la selección |

Las veinte rondas de estabilidad se ejecutan localmente; ningún evento remoto las dispara.
La concurrencia conserva la cancelación de ejecuciones anteriores de la misma PR; la condición del job
respeta la [semántica de cancelación de GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation).
El cron semanal sustituye al diario; los schedules requieren el workflow en la rama predeterminada,
según [GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Detección de cambios

No hay `paths` ni `paths-ignore` que omitan el workflow completo.
El job `changes` obtiene el diff completo: base…head para PR y before…after para push.
Usa nombres separados por NUL y desactiva detección de renombres para incluir también el archivo eliminado.

- Solo documentación en docs/specs, README, Markdown raíz o mockups: permite omitir Playwright.
- Frontend, backend, e2e, dependencias, migraciones, runtime y workflows: ejecuta E2E.
- Los archivos del catálogo en `docs/testing/catalog/` también ejecutan: son entrada del runner.
- Archivos/extensiones desconocidos, incluso dentro de docs/specs/mockups, diff vacío, SHA ausente o error del detector: ejecuta por precaución.
- Schedule y dispatch siempre ejecutan su selección, aunque no haya cambios recientes.

La razón queda en el summary. El detector no necesita instalar pnpm ni navegadores.
Detector y agregador desactivan la caché automática de setup-node; pnpm aún no está instalado en ese paso.
Si falla el detector, `!cancelled()` permite ejecutar Playwright y respeta la cancelación de una PR anterior.

## Check E2E result

El job conserva nombre estable, `if: always()` y dependencia de detección y Playwright.
Solo acepta una omisión si detección terminó correctamente con `documentation-only` y Playwright fue omitido.
Cuando se requiere ejecución, exige job exitoso y todos los bundles esperados del evento.
Fallos, cancelaciones, jobs ausentes, proyectos incorrectos, variantes incompletas o SHA distinto fallan.
El agregador también valida checksums, seed y entorno consistentes; no acepta resultados inestables.
Un retry que recupera el test conserva clasificación flaky y no vuelve verde el gate.
La semántica de dependencias sigue la [referencia oficial](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds).

Este es el check que debe requerirse en la protección de ramas. La configuración remota no se modificó.
La validación local cubre documentación, código, cambios mixtos, renombres, detección fallida y estados del gate.

## Aislamiento y artifacts

Un worker por stack, un job por motor. Cada job crea PostgreSQL 17, Next/Nest y DB nuevas por caso/retry.
No se usan secretos productivos; checkout con contents:read y persist-credentials:false.
La caché contiene pnpm y frontend/.next/cache con SHA, OS, Node y configuración local fija.
No incluye DB, JWT, credenciales ni build standalone. Sharding adicional permanece deshabilitado.

Solo se suben summary.json, summary.md, index.html estático, JUnit y manifest de checksums.
El escáner rechaza secretos conocidos, JWT, URLs PostgreSQL con credenciales y claves privadas.
La verificación rechaza archivos extra y symlinks. HTML nativo, capturas, trazas y bodies quedan privados.
Retención configurada: siete días si pasa, catorce si falla. Falta de artifacts requeridos es error.
La cuota, retención efectiva y ejecución Docker de GitHub aún no están verificadas remotamente.

## Timeouts y mediciones

| Suite | Timeout Playwright | Timeout job |
| --- | --- | --- |
| Smoke PR | 20min | 25min |
| Regression push | 35min | 45min |
| Extended semanal | 75min | 90min |
| Dispatch | Según suite | 90min |

Son presupuestos máximos, no duraciones esperadas. Detección tiene un presupuesto de cinco minutos.
Las [mediciones locales](execution/VALIDATION.md) son de macOS: smoke en tres motores p50=6m30s,
p95=11m11s; catálogo completo=20m50s. No se midieron aún jobs remotos ni smoke Chromium aislado.
