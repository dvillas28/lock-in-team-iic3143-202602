# Arquitectura de la suite E2E

Paquete independiente Playwright Test + TypeScript en `e2e/`, con lockfile propio.
El producto usa Next, Nest y PostgreSQL 17 reales; las pruebas unitarias e integración existentes se conservan.
[Comandos](E2E_README.md) · [Datos](E2E_TEST_DATA.md) · [CI](EXECUTION_CI.md).

## Código relevante

| Ubicación | Responsabilidad |
| --- | --- |
| `e2e/specs/` | Escenarios y aserciones observables por ID de catálogo. |
| `e2e/data/case-variants.ts` | Actor, universidad, nivel y proyectos obligatorios por variante. |
| `e2e/data/seed.ts`, `profiles.ts`, `phase-*.ts` | Datos iniciales y preparación académica específica. |
| `e2e/fixtures/environment.ts`, `test.ts` | DB/API por test, contextos y limpieza. |
| `e2e/helpers/` | Navegación, API, SQL operador, contenido, seguridad, notas y concurrencia. |
| `e2e/runner/run.ts`, `postgres.ts`, `process.ts` | Preflight, servicios, señales y teardown. |
| `e2e/runner/suites.ts`, `assessment.ts` | Selección autoritativa y gates de ejecución. |
| `e2e/runner/artifacts.ts`, `safe-reporter.ts` | Reportes públicos verificados y diagnóstico privado. |
| `e2e/runner/ci-policy.ts`, `ci-result.ts` | Detección de cambios y resultado agregado por evento. |
| `e2e/runner/stability.ts`, `metrics.ts` | Ventana local de veinte rondas y percentiles. |

Los helpers representan acciones pequeñas; las aserciones permanecen en los tests.
No hay servicios externos de testing, APIs públicas de preparación ni un framework de Page Objects genérico.

## Ciclo de ejecución

1. Preflight rechaza destinos externos y credenciales heredadas; toma un lease exclusivo.
2. Crea PostgreSQL 17 propio, fija origins locales y compila backend/frontend.
3. Sirve Next standalone. Cada caso/variante/retry obtiene DB migrada, seed y Nest propios.
4. Verifica invariantes de fixture, abre contexto limpio y realiza login UI real cuando corresponde.
5. Ejecuta acciones y comprueba UI/HTTP/persistencia; otra lectura confirma las escrituras pertinentes.
6. Cierra contextos/Nest y elimina exclusivamente la base registrada. Finalmente limpia el cluster y lease.
7. Evalúa el JSON real de Playwright y exporta resultados; ausencia o selección incompleta no aprueba.

Un worker por stack y `fullyParallel:false`. Los jobs remotos de motores tienen stacks separados.
Reiniciar Nest entre casos restablece su cuota de login; no se desactiva el throttler ni RLS.
Las carreras de un mismo caso comparten deliberadamente su stack y usan barreras controladas.

## Autenticación y selectores

Session vive en memoria React: recargar exige autenticarse otra vez.
Después del login, la navegación habitual usa enlaces/controles SPA; `page.goto` se reserva para escenarios de recarga.
`storageState` no restaura esa sesión. No se inyectan JWT en React, cookies o localStorage.
Cada actor tiene contexto separado; los probes HTTP reutilizan el token del login real solo en RAM.
JWT inválidos o vencidos se usan únicamente en las comprobaciones que prueban ese rechazo.

Se prefieren `getByRole` y `getByLabel`, acotados por formulario, diálogo o recurso.
Las respuestas se esperan desde antes del click; las lecturas SQL usan polling acotado de invariantes.
Los IDs proceden del manifest o de respuestas reales. No se depende del orden aleatorio de filas.
Las carreras comprueban un resultado legal y serialización, sin imponer un ganador del scheduler.

## Fallos inyectados y navegadores

Los flujos críticos mantienen auth, backend, cálculo y DB reales.
Las pruebas de red interceptan únicamente la petición afectada; una respuesta perdida tras commit usa `route.fetch` real.
Los modos simulados quedan identificados en el escenario. No se crean servicios externos ficticios.

Proyectos: `chromium`, `firefox`, `webkit` y el perfil opcional `mobile`.
El manifest define qué variantes de los tres motores son obligatorias; F6 también configura viewport/tema dentro del caso.
El catálogo completo acredita383 Chromium,64 Firefox y65 WebKit; no todas las fichas se triplican.
Timeout general90s, acciones/expect10s y navegación20s, con excepciones explícitas por escenario.
Los presupuestos globales por suite están en la política de CI.

## Evidencia y seguridad

JSON, JUnit y HTML nativo se guardan localmente por runId, con SHA, seed y navegador.
Las trazas privadas empiezan tras login, excluyen nuevos logins y se sanitizan antes de adjuntarse al fallo.
Las capturas enmascaran credenciales; video permanece deshabilitado.
El bundle público excluye trazas, capturas, HTML nativo, cuerpos HTTP y logs internos.
El escáner y los checksums se verifican antes de publicar y al agregar resultados.

Retries: cero locales, uno en CI solo para diagnóstico; un resultado flaky no pasa el gate.
El resumen distingue cancelación, infraestructura, limpieza y fallos de tests/harness.
El diagnóstico específico de producto, contrato, fixture o selector requiere revisar la aserción y evidencia privada.
