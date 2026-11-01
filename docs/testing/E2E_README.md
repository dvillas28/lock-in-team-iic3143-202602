# Cómo ejecutar las pruebas E2E

[Qué probamos y fases](E2E_MASTER_PLAN.md) · [Resultados y tiempos medidos](execution/VALIDATION.md).
Ejecutar desde la raíz del repositorio, en la rama acumulativa `test/e2e-f7`.

## Preparación

Requisitos: Node 24, pnpm 9, Python3 y PostgreSQL 17 local o Docker con daemon operativo.
Para PostgreSQL nativo, ejecutar como usuario normal; `initdb` no admite root.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir e2e install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers" pnpm --dir e2e exec playwright install chromium firefox webkit
```

En Linux puede ser necesario instalar también las dependencias del sistema:
`pnpm --dir e2e exec playwright install --with-deps chromium firefox webkit`.
La caché local de navegadores se detecta automáticamente.

## Todas, smoke o por fase

| Qué ejecutar | Comando |
| --- | --- |
| Todas, con los motores requeridos | `pnpm test:e2e:all` |
| Smoke en Chromium | `pnpm test:e2e:smoke` |
| Smoke en los tres motores | `pnpm test:e2e:smoke --project=chromium --project=firefox --project=webkit` |
| Regression en Chromium | `pnpm --dir e2e run test:regression` |
| F1: infraestructura y datos | `pnpm test:e2e:f1` |
| F2: entrada y navegación | `pnpm test:e2e:f2` |
| F3: permisos y universidades | `pnpm test:e2e:f3` |
| F4: cursos y contenido | `pnpm test:e2e:f4` |
| F5: ciclo académico | `pnpm test:e2e:f5` |
| F6: errores y compatibilidad | `pnpm test:e2e:f6` |
| F7: veinte rondas smoke locales | `pnpm test:e2e:stability` |

Los comandos por fase usan Chromium por defecto. Para incluir sus variantes Firefox/WebKit:

```bash
pnpm test:e2e:f6 --project=chromium --project=firefox --project=webkit
```

F7 no añade casos funcionales: mide veinte smoke completos en tres motores, con código limpio y comprometido.
Se detiene ante una ronda fallida o no comparable. Es una ejecución larga y siempre local.
En macOS, `caffeinate -i pnpm test:e2e:stability` evita suspensión por inactividad.

## Un caso, navegador visible o paso a paso

```bash
pnpm test:e2e:f6 --grep E2E-A11Y-004
pnpm test:e2e:f6 --headed --grep E2E-A11Y-004
pnpm test:e2e:f5 --headed --grep E2E-GRADE-021
pnpm test:e2e:f6 --debug --grep E2E-A11Y-002
pnpm test:e2e:f4 --headed
pnpm test:e2e:visual
```

`--grep` selecciona el caso y sus variantes del proyecto elegido; puede generar más de una instancia.
`--headed` muestra el navegador; `--debug` abre el inspector para pausar y avanzar manualmente.
`test:e2e:visual` ejecuta todo en Chromium visible. El navegador se cierra al finalizar.
Para selección libre usar `pnpm test:e2e --grep ID`; no combinar suites nombradas con grep/shard/repeat.
Los filtros no cambian las aserciones ni acreditan los casos excluidos.

## Servicios y limpieza

El comando levanta PostgreSQL 17 propio, compila backend/frontend y sirve Next en 4320.
Cada prueba recibe una base nueva con migraciones y seed, y Nest en 4321; al terminar limpia sus recursos.
No hace falta levantar backend, frontend o DB manualmente. Ejecutar un solo runner por checkout.
No cargar credenciales productivas ni apuntar a servicios o bases existentes.
Ctrl+C cancela y limpia; un resultado cancelado no aprueba.

Opcionales: `E2E_PG_BIN`, `E2E_WEB_PORT`, `E2E_API_PORT` y `PLAYWRIGHT_BROWSERS_PATH`.
Si un puerto está ocupado, elegir otro; si falta un navegador, instalar su versión fijada.
Un bloqueo del sandbox al arrancar PG/navegadores es un problema de ejecución del entorno.
Un lease existente requiere comprobar el PID/owner antes de retirarlo; no borrar el de un proceso activo.

## Reportes y demostración

```bash
pnpm --dir e2e report
pnpm --dir e2e exec playwright show-report reports/4582dbc70e312524/html
pnpm --dir e2e coverage
pnpm --dir e2e metrics 4582dbc70e312524
pnpm --dir e2e metrics reports/windows/f9a9cd53a93ee726/window.json
```

`report` abre el último HTML; el segundo comando abre la corrida completa validada si está en ese equipo.
Los archivos están en `e2e/reports/<runId>/`, ignorados por Git. Otro equipo debe copiarlos o repetir las pruebas.
`coverage` lee únicamente el último run; si fue parcial, no mostrará todo el catálogo aprobado.
Los reportes registran SHA, seed, navegador, variantes, resultados y duración.
CI solo publica el resumen seguro; HTML nativo, capturas y trazas detalladas permanecen privados.

Para mostrar que son pruebas reales: abrir un caso con `--headed`, mostrar su aserción y luego el HTML.
Playwright controla formularios y navegación; una diferencia en UI, HTTP o SQL hace fallar la prueba.
Los logs describen la ejecución. Las comprobaciones exclusivamente HTTP/SQL no muestran navegador.

## Verificar cambios del harness

```bash
pnpm --dir e2e typecheck
pnpm --dir e2e lint
pnpm --dir e2e test:harness
```

Estos checks no reemplazan ejecutar los casos funcionales afectados.
La política de GitHub Actions y sus límites están en [EXECUTION_CI](EXECUTION_CI.md).
