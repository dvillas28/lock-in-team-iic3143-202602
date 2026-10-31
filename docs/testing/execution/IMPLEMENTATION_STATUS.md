# Implementación E2E: estado verificable

Corte local: **2026-10-30**. **Trabajo parcial; suite NO completada, F1 bloqueada.**
No existe una ejecución E2E aprobada. [Cobertura real](COVERAGE.md) · [Cómo ejecutar](../E2E_README.md).

## Rama y conservación del trabajo

- Base `test/e2e-master-plan`, SHA1978e2e; el plan no estaba integrado en dev9046305.
- Rama nueva `test/e2e-implementation` en `/private/tmp/academix-e2e-implementation`.
- Se usó una copia Git aislada porque `.git` del checkout original está en solo lectura.
- Checkout original `/Users/julian/lock-in-team-iic3143-202602`: dev, sin cambios del trabajo E2E.
- No merge, push, PR, despliegue ni conexiones a DB existente/productiva.
- No cambios en frontend, backend, contrato, migraciones ni workflows anteriores.

## Implementación existente

- [Paquete Playwright/TypeScript](../../../e2e/package.json), lockfile separado, lint y typecheck.
- [Configuración](../../../e2e/playwright.config.ts): Chromium inicial, motores alternativos,
  un worker/stack, retries0 local/1 CI, timeout90s y esperas por estado/respuesta.
- [Runner](../../../e2e/runner/run.ts): PG17 nuevo, build Next/Nest, Next standalone,
  orígenes UC/UTFSM locales; Nest real por caso, sin mocks del backend ni token inyectado en React.
- [Fixture](../../../e2e/fixtures/environment.ts): DB exclusiva por caso/retry, predeploy existente,
  rol academix_runtime sin desactivar RLS, ownership antes de limpiar; todavía sin validación SQL real.
- [Seed](../../../e2e/data/seed.ts): 2 instituciones, 23 actores, membresías multirol/contexto,
  7 cursos, 9 secciones, matrículas, 4 módulos, 3 Markdown, 8 quizzes y GradeItems.
  Intentos/notas/publicaciones se preparan mediante helpers de API; no se ha probado esa preparación.
- [Guard y sanitización](../../../e2e/unit/guard.test.ts): destinos construidos por runner,
  URLs ajenas rechazadas, credenciales heredadas eliminadas, comprobación previa de ownership.
- [Reportes](../../../e2e/runner/coverage.ts): HTML/JSON/JUnit por runId; trazas postlogin,
  redacción de credenciales antes de adjuntar y screenshots enmascaradas. Sin videos de credenciales.
- [AUTH-001](../../../e2e/specs/auth.smoke.spec.ts): 5 variantes SA/AO/T1/AS1/ST1,
  login UI real, contrato login, me/directorio autorizados, identidad, cursos y sesión solo RAM.
- [Workflow nuevo](../../../.github/workflows/e2e.yml): smoke PR, regression dev, extended programado,
  artifacts14d. YAML analizado; **no ejecutado en GitHub**, ni protección de ramas configurada.

Estas piezas son código inicial revisable; su existencia no acredita reproducibilidad ni seed válida.
El resultado de `test:list` solo acredita colección de cinco instancias Chromium de una ficha.

## Bloqueos reales

**ENV-01 — PostgreSQL17 no puede arrancar en este sandbox.**
`initdb` falla con `could not create shared memory segment: Operation not permitted`;
`shmget(..., size=56, 03600)`. Docker CLI existe, pero no hay daemon operativo ni Docker.app.
El runner se detiene antes de migraciones, seed, Next/Nest y Playwright. No se conectó otra DB.

**ENV-02 — Chromium descargado no puede arrancar.**
El check independiente de proceso falla con `bootstrap_check_in ... Permission denied (1100)`
en `mach_port_rendezvous_mac.cc`. No ejecutó páginas del LMS. Tampoco acredita soporte de otros motores.

Se necesita un entorno autorizado que permita PG17/Docker y procesos de navegador.
No basta con una URL productiva ni un cambio de fixtures. No se intentó eludir el sandbox.
Responsable externo: habilitación del entorno por usuario/plataforma; sin plazo confirmado.

## Ejecución y métricas

[Registro de comandos y resultados](LOCAL_VALIDATION.md).
Run `9900ff56afef226e`, fuente1074cab, fase postgres, exit1 en **1,194s** de preparación.
Documentación local pendiente al correr (dirty=true); código del harness/spec estaba comprometido.
**E2E ejecutados0; aprobados0; fallidos0; omitidos0; ejecución de infraestructura fallida1.**
Un error anterior a collection no se presenta como cinco tests fallidos ni cinco omitidos.
Nueve unitarios del harness pasan; no se suman a E2E ni completan OPS-008.

Estado exhaustivo: [casos01](CASES_01.md), [02](CASES_02.md), [03](CASES_03.md), [04](CASES_04.md).
Una ficha implementada bloqueada; otra parcialmente implementada; Q02 sin aclarar;
245 fichas restantes pendientes. Ningún permiso ni aislamiento ha sido validado por esta suite.

## Qué falta para reanudar

1. Resolver ENV-01/02 y ejecutar el comando AUTH-001 sin modificar producto.
2. Depurar seed/migraciones, runtime, selectores y teardown a partir de resultados reales.
3. Completar OPS-001…009 y perfiles ACTIVE/PUBLISHABLE/HISTORY del plan; verificar ensure/replay.
4. Repetir caso positivo/negativo y limpieza en stacks nuevos; recién entonces aceptar F1.
5. Implementar F2–F6 completas, conservando todos los IDs y defectos funcionales visibles.
6. Ejecutar workflow y estabilizar F7. El YAML preparado no equivale a CI validado.

La regla del usuario prohíbe avanzar a la siguiente fase sin un E2E real funcionando.
Por eso no se escribieron cientos de tests sin posibilidad de ejecutarlos ni se redujo el catálogo.
La estimación284–432h del plan sigue siendo referencia histórica; no se afirma avance porcentual por horas.
