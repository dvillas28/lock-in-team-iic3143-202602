# F3 — Seguridad funcional validada

Corte 2026-10-31. **F3 aceptada localmente; F4 autorizada como próxima fase.**
Checkout permanente `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f3`.
No hubo cambios de producto, push, merge, despliegue ni conexión a producción.

## Evidencia reproducible

| Run | Código | Alcance | Resultado |
| --- | --- | --- | --- |
| c6c1afa828674c77 | 5e4a4d2 | F3 antes de agregar recuperación visual de cursor | 128 PASS:88 Chromium,20 Firefox,20 WebKit |
| d9ed0d3db8a710d8 | 5e4a4d2 + cambios locales | Recuperación visual de cursor | 1 PASS; diagnóstico, checkout con cambios |
| c59234af761096c3 | 4d0da34 | Regresión previa; timeout de fixture RBAC-009/WebKit | 200 PASS,1 FAIL; no aceptado |
| 24f137d72ff05e14 | 4d0da34 | RBAC-009/WebKit,repeat-each=2,namespaces distintos | 2 PASS; retries0 |
| 5dac3117c5e950ef | 4d0da34 | Regresión F1–F3 y recuperación de cursor | 201 PASS:147 Chromium,27 Firefox,27 WebKit |

Los runs completos aprobados son limpios al inicio/final y exit0; cero fail/skip/flaky.
El run previo fallido se conserva:timeout de60s durante setup,antes de aserciones; no se aumentaron límites.
El run final usa `caffeinate -i pnpm test:e2e:all` para evitar suspensión por inactividad en macOS.
La causa del bloqueo inicial no se deduce solo de la repetición; estabilidad sostenida sigue pendiente de F7.
Cada run usa cluster y bases nuevas, con nombres vinculados a runId y namespace de variante.
La variante visual se repitió en la regresión; las matrices F3 se repitieron en entornos nuevos.
El primer intento visual351fe41f50214d22 falló por un selector: nombre y correo comparten rowheader.
Se corrigió para exigir ambos exactamente; se conservaron el rechazo HTTP400 y las aserciones de estado.
Los diagnósticos previos no sustituyen las ejecuciones finales ni se suman como cobertura adicional.

SHA ejecutado `4d0da34409031ce0ffdab2d7b8deb66996fe0bc8`; seed `academix-e2e-v1`; Playwright1.64.1.
Reportes locales ignorados: `e2e/reports/5dac3117c5e950ef/` con HTML, JSON, JUnit, run y coverage.
El resultado acumulado tiene151 instancias de navegador y50 complementarias HTTP/SQL/operación.
**85/248 fichas aprobadas**:64 navegador,21 complementarias;163 pendientes.
F3 aporta54 fichas y129 instancias:89 Chromium y20 smoke por cada motor adicional.
Las seis variantes HTTP de TENANT-013 son complementarias; browser-recovery verifica la UI aparte.

## Tareas cerradas y límites de la evidencia

| Roadmap | Casos / evidencia concreta |
| --- | --- |
| T01–T02 | 11 AUTH:JWT/header inválido, usuario inactivo, cuota real, logout, expiración, pestañas y foco/borrador |
| T03 | TENANT-001…007:identidad global, memberships, roles por institución, slug y navegación entre orígenes |
| T04 | TENANT-008…012:17 lecturas por cinco perfiles en ambas direcciones;23 mutaciones cruzadas y relaciones de cuerpos |
| T05 | TENANT-013…015:seis cursores actor/tenant/filtros, recuperación visible,20 lecturas concurrentes y respuestas tardías200/401 |
| T06 | RBAC-001…013:owner sin teacher, teacher ordinario, assistant/student, multirol y revocaciones |
| T07 | ADMIN-001…011:delegación, flags independientes, onboarding/replay/colisión, últimoSA y carrera con locks |
| T08 | AUDIT-003/004/005/008:historia propia/ajena filtrada, cursor tras revocación y ausencia de pautas/secretos |

Las denegaciones comparan snapshots ordenados de tablas académicas, flags, publicaciones e historia.
La delegación confirma flags,creador y teacher inicial; la edición UTFSM se relee y no altera UC.
La delegación concurrente comprueba flags/eventos según su orden.
Las operaciones privilegiadas usan los comandos existentes solo tras verificar ownership del entorno.
Revisión lms-reviewer:tenant,roles,privacidad,persistencia y regresión sin hallazgos bloqueantes conocidos.
Typecheck, lint y11 tests del harness PASS; no se relajaron aserciones ni aumentaron retries.
Teardown de casos/runner terminó sin error; carpetas del cluster propio eliminadas y puertos locales cerrados.
La selección smoke de F3 se ejecuta también en Firefox/WebKit; no equivale a compatibilidad académica completa F6.

## Ejecutar o retomar

```bash
pnpm test:e2e:f3
pnpm test:e2e:f3 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --headed --grep E2E-RBAC-009
pnpm test:e2e:all
pnpm --dir e2e coverage
pnpm --dir e2e report
```

F3 sin proyectos ejecuta89 instancias Chromium; para todas sus variantes requeridas usar los tres proyectos.
Guía incremental:[E2E_EXECUTION_JOURNAL.md](E2E_EXECUTION_JOURNAL.md); requisitos en[E2E_README](../E2E_README.md).
Próxima fase:[F4](../roadmap/F4.md), desde este estado validado en una rama `test/e2e-f4`.
El usuario autorizó continuar con F4 tras este cierre el2026-10-31. CI remoto, branch protection y ventana de20 runs siguen pendientes de F7.
