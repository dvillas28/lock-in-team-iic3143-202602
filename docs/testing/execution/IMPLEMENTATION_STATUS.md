# Implementación E2E: estado verificable

Corte local: **2026-10-31**. **Trabajo parcial; AUTH-001 aprobada, F1 sin aceptación.**
[Una ficha de 248 aprobada](COVERAGE.md) · [Cómo ejecutar](../E2E_README.md).

## Rama y conservación del trabajo

- Base `test/e2e-master-plan`, SHA1978e2e; el plan no estaba integrado en dev9046305.
- Rama `test/e2e-implementation` en `/Users/julian/lock-in-team-iic3143-202602` (checkout permanente).
- Se usó inicialmente `/private/tmp/academix-e2e-implementation` por restricciones de escritura en `.git`.
  La rama se importó localmente al repositorio permanente con ejecución autorizada; copia temporal conservada.
- Checkout permanente activo en `test/e2e-implementation`; `dev` sigue en
  `90463059015e5045d011eadd12b6403b7b492615`. Commits anteriores y corrección70412b9 conservados.
- Commits previos conservados; sin merge, push, PR, despliegue ni conexiones a DB existente/productiva.
- Sin cambios en frontend, backend, contrato, migraciones ni workflows anteriores.

## Implementación existente

- [Paquete Playwright/TypeScript](../../../e2e/package.json), lockfile separado, lint y typecheck.
- [Configuración](../../../e2e/playwright.config.ts): Chromium inicial, motores alternativos,
  un worker/stack, retries0 local/1 CI, timeout90s y esperas por estado/respuesta.
- [Runner](../../../e2e/runner/run.ts): PG17 nuevo, build Next/Nest, Next standalone,
  orígenes UC/UTFSM locales; Nest real por caso, sin mocks del backend ni token inyectado en React.
  La ruta standalone usa `relativeAppDir` del build; los assets se copian junto al servidor generado.
- [Fixture](../../../e2e/fixtures/environment.ts): DB exclusiva por caso/retry, predeploy existente,
  rol academix_runtime sin desactivar RLS, ownership antes de limpiar; ejecutada por AUTH-001.
- [Seed](../../../e2e/data/seed.ts): 2 instituciones, 23 actores, membresías multirol/contexto,
  7 cursos, 9 secciones, matrículas, 4 módulos, 3 Markdown, 8 quizzes y GradeItems.
  Inserción validada contra PG17; helpers de intentos/notas/publicaciones aún sin validar.
- [Guard y sanitización](../../../e2e/unit/guard.test.ts): destinos construidos por runner,
  URLs ajenas rechazadas, credenciales heredadas eliminadas, comprobación previa de ownership.
- [Reportes](../../../e2e/runner/coverage.ts): HTML/JSON/JUnit por runId; trazas postlogin,
  redacción de credenciales antes de adjuntar y screenshots enmascaradas. Sin videos de credenciales.
- [AUTH-001](../../../e2e/specs/auth.smoke.spec.ts): 5 variantes SA/AO/T1/AS1/ST1 aprobadas,
  login UI real, contrato login, me/directorio autorizados, identidad, cursos y sesión solo RAM.
- [Workflow nuevo](../../../.github/workflows/e2e.yml): smoke PR, regression dev, extended programado,
  artifacts14d. **No ejecutado en GitHub**; protección de ramas sin configurar.

## Entorno: ENV-01 y ENV-02 resueltos para ejecución autorizada

El sandbox ordinario sigue restringiendo procesos: el primer intento del 31oct falló al crear
el socket IPC de tsx (`listen EPERM`), antes de iniciar el runner. La sesión actual permite solicitar
escalación; las ejecuciones autorizadas pudieron iniciar PostgreSQL17 y Chromium.

- **ENV-01:** cluster PG17 nuevo, migraciones/provision-runtime y seed ejecutados por cada variante.
- **ENV-02:** Chromium156.0.8078.4 arrancó y cerró en check independiente y ejecutó el LMS.
- Chromium y reportes anteriores se copiaron a `e2e/.cache/browsers` y `e2e/reports` del checkout
  permanente, ambos ignorados. Usar `PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers"` desde su raíz.
  La ejecución actual no depende de archivos temporales; la caché predeterminada tenía otra versión.
- Primer run autorizado `afc3407c188ca3e5`: fallo de harness al buscar standalone en ruta incorrecta.
  Se corrigió exclusivamente el runner y se añadió diagnóstico del proceso Next en readiness.
- Estos resultados no acreditan ejecución con permisos ordinarios ni soporte Firefox/WebKit/Docker.

## Ejecución y métricas

[Registro de comandos y resultados](LOCAL_VALIDATION.md).
AUTH-001 aprueba sus cinco variantes en dos stacks nuevos; HTML/JSON/JUnit conservados localmente.
Ambos runs parten de e4679a6 con corrección local del runner (`dirty=true`):
`fca369872c1f358e` y `2d52bab34d20749d`. No se atribuye el resultado al commit sin esa corrección.

**Por run: E2E ejecutados5; aprobados5; fallidos0; omitidos0; flaky0.**
Son cinco variantes de **una ficha**, no cinco fichas. Typecheck, lint y nueve unitarios pasan.
Los unitarios del harness no se suman a E2E ni completan OPS-008.

Estado exhaustivo: [casos01](CASES_01.md), [02](CASES_02.md), [03](CASES_03.md), [04](CASES_04.md).
Una ficha aprobada; OPS-008 parcial; Q02 sin aclarar; 245 fichas restantes pendientes.
Login/visibilidad inicial comprobados para cinco roles UC; aislamiento adversarial UC↔UTFSM pendiente.

## Qué falta para reanudar

1. Completar OPS-001…009 y perfiles ACTIVE/PUBLISHABLE/HISTORY; verificar ensure/replay.
2. Probar escenario negativo representativo, ownership adversarial y limpieza ante fallos;
   las dos repeticiones positivas no sustituyen esos criterios de aceptación F1.
3. Validar helpers de intentos/notas/publicaciones contra API/runtime reales.
4. Aceptar F1 antes de implementar F2–F6, conservando IDs y defectos funcionales visibles.
5. Ejecutar workflow y estabilizar F7. El YAML preparado no equivale a CI validado.

Se cumplió el paso de desbloquear y ejecutar AUTH-001; **no se avanzó a F2**.
La estimación284–432h del plan sigue como referencia histórica; no se afirma avance por horas.
