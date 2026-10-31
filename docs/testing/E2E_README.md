# Ejecutar el harness E2E

Estado actual: **F1 y F2 aceptadas localmente;31 fichas de 248 aprobadas; suite incompleta**.
[Evidencia F2](execution/F2_VALIDATION.md) · [Estado](execution/IMPLEMENTATION_STATUS.md).

## Checkout permanente y ejecución por fase

Ruta `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f2`; `dev` y `main` intactas.
Trabajo comprometido localmente, sin push ni merge. La copia temporal anterior queda de respaldo.

```bash
cd /Users/julian/lock-in-team-iic3143-202602
pnpm test:e2e:f2
pnpm test:e2e:f2 --project=chromium --project=firefox --project=webkit
pnpm --dir e2e report
```

F2: 47 instancias Chromium; 61 con smoke Firefox/WebKit. Para ver Chromium, añadir `--headed`.
F1: `pnpm test:e2e:f1`; acumulado F1+F2: `pnpm test:e2e` (58 Chromium;72 con los tres proyectos).
La caché `e2e/.cache/browsers` se detecta automáticamente; PLAYWRIGHT_BROWSERS_PATH explícita prevalece.
Reportes en `e2e/reports/`, ignorados por Git; no se requieren archivos de `/private/tmp`.
El runner crea y limpia su stack local. F3–F7 quedan pendientes por revisión fase a fase del usuario.

## Requisitos e instalación

Node24, pnpm9, Python3 y PostgreSQL17 local o Docker operativo. El runner crea su propio cluster;
no acepta una URL de base existente ni credenciales demo. Linux/macOS, usuario no root para initdb.
En Windows usar un entorno Linux con Docker. No necesita secretos de producción.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir e2e install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers" pnpm --dir e2e exec playwright install chromium firefox webkit
pnpm --dir e2e typecheck
pnpm --dir e2e lint
pnpm --dir e2e test:harness
```

En CI Linux, usar `playwright install --with-deps chromium` para dependencias del navegador.
Playwright y sus binarios deben tener la misma versión. Los lockfiles siguen separados.

## Variables y aislamiento

- `E2E_PG_BIN`: directorio opcional de binarios PostgreSQL17 (`initdb`, `postgres`, `pg_ctl`).
- `E2E_WEB_PORT`/`E2E_API_PORT`: puertos locales libres, por defecto4320/4321.
- `PLAYWRIGHT_BROWSERS_PATH`: ubicación opcional de binarios; usar el mismo valor al instalar y ejecutar.
- `CI`: retries1 y prohibición de `.only`; local retries0.
- `E2E_BASE_URL`, `E2E_API_URL`, `E2E_DATABASE_URL`, `E2E_RUNTIME_DATABASE_URL`: **prohibidas**.

No cargar `.env` productivo. El runner elimina credenciales heredadas y genera passwords/JWT efímeros.
UC/UTFSM se sirven como uc.localhost/utfsm.localhost. El portal usa localhost; API127.0.0.1.
Configura orígenes públicos antes de compilar Next; no usar un build configurado para producción.

## Preparación, seed y servicios

El comando de ejecución hace preflight, cluster nuevo, build backend/frontend y servidor Next.
Cada test crea una base*_test exclusiva, aplica predeploy/migraciones/provision-runtime existentes,
ejecuta seed E2E y arranca Nest con academix_runtime. No se desactiva RLS ni constraints.
La seed contiene dos instituciones, perfiles institucionales/académicos, multirol, cursos,
secciones, matrículas, módulos, Markdown y quizzes draft/publicados. Helpers preparan intentos/notas
por API real; los perfiles ACTIVE/PUBLISHABLE/HISTORY y ensure se validaron en F1 con PostgreSQL17.
`ensure` no repone privilegios ni ediciones. No ejecutar manualmente la seed sobre una DB ajena.

## Comandos

```bash
pnpm --dir e2e run test
pnpm --dir e2e run test:smoke
pnpm --dir e2e run test:regression
pnpm --dir e2e run test:extended
pnpm --dir e2e run test --grep E2E-AUTH-001
pnpm --dir e2e run test --grep E2E-COURSE-
pnpm --dir e2e run test:headed
pnpm --dir e2e run test:ui
pnpm --dir e2e test:list
pnpm --dir e2e coverage
pnpm --dir e2e report
```

Los filtros solo ejecutan tests que existan: COURSE y otros módulos siguen pendientes.
Smoke/regression/extended son selecciones disponibles, no evidencia de cobertura completa.
Usar `run test` al pasar flags para que pnpm los entregue al runner.
Proyectos adicionales: `--project=firefox`, `--project=webkit`, `--project=mobile`;
instalar cada navegador antes. Chromium ejecutó F1/F2; Firefox/WebKit ejecutaron el smoke de entrada de F2.
Desde la raíz del checkout permanente, usar `PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers"`
como prefijo del comando. Las ejecuciones requieren permisos para PG y procesos de navegador.

## Depuración y reportes

HTML/JUnit/JSON en e2e/reports/<runId>; latest.json identifica la última ejecución.
No reutiliza resultados de ejecuciones anteriores. En el directorio del run, screenshots enmascaradas y trazas sanitizadas adjuntas al fallo.
La traza privada empieza después de login para no capturar password/token de respuesta.
`coverage` genera un ledger de los248 IDs del catálogo, distinguiendo definición y resultado real.
Declarar variantes en e2e/data/case-variants.ts y conservar el sufijo ` / variante @suite`;
una ficha sin todas las variantes ejecutadas no se aprueba. Una variante flaky permanece visible.
No compartir raw HAR, dump de env, tokens ni trazas sin sanitizar.
No usar `page.goto` tras login para navegación SPA: recargar pierde Session en memoria.
El helper sigue enlaces reales; no inyecta tokens en React/storage.

## CI y limpieza

[e2e.yml](../../.github/workflows/e2e.yml) prepara paquetes, navegador, validaciones y runner local.
PR selecciona smoke; pushdev regression; schedule extended/motores; dispatch permite ejecución manual.
Es configuración preparada, sin ejecución remota verificada ni cambio de branch protection.
El resultado actual no acredita las22 fichas smoke ni la suite del catálogo; faltan implementaciones.
Un worker por stack evita reiniciosAPI cruzados. Los jobs de motores tienen stacks independientes.
La paralelización de una misma instancia se mantiene deshabilitada hasta validar F1.

Al terminar, cerrar contextos/Nest y borrar solo la base registrada para runId; finalmente parar
el cluster propio. Un marker o label incorrecto impide limpieza. No DELETE/TRUNCATE de historia.
Si se mata el runner externamente y queda un recurso, verificar su owner/runId antes de retirarlo.

## Problemas frecuentes

- `shmget Operation not permitted`: sandbox impide arrancar PostgreSQL. Habilitar entorno apropiado;
  no conectar otra base como fallback. Docker es alternativa solo si está disponible.
- `bootstrap_check_in Permission denied`: sandbox impide arrancar Chromium; no es un fallo del LMS.
- Browser executable ausente: instalar los binarios de la versión fijada y revisar BROWSERS_PATH.
- Puerto ocupado: elegir E2E_WEB_PORT/API_PORT libres antes del build; no terminar procesos ajenos.
- 429: no compartir el procesoAPI entre tests; máximo5 logins/IP/min. No desactivar throttler.
- Error de tipos/schema/seed: conservar error y diagnosticar fixture; no relajar permisos/RLS.
