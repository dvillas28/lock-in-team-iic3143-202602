# Arquitectura propuesta para automatización

Propuesta para ramas posteriores; no archivos ejecutables añadidos ahora.
Playwright Test+TypeScript se ajusta a Next/Nest y permite navegador, contextos múltiples y HTTP
del mismo entorno. Mantener node:test/jsdom/c8 actuales; no migrarlos ni llamar E2E a sus mocks.
No existe infraestructura de navegador automatizada que debamos conservar.

## Organización futura

```text
e2e/
  package.json / pnpm-lock.yaml / playwright.config.ts
  specs/{public,auth,tenant,rbac,courses,content,quizzes,attempts,grades,audit}/
  fixtures/{test,environment,actors,manifest,network}.ts
  data/{seed,profiles,verify}.ts
  helpers/{login,navigate,api,assert-persistence,barrier}.ts
  pages/{course-workspace,quiz-editor,grade-publication}.ts
  runner/{preflight,start,stop,run,report}.ts
  reports/ / test-results/ (ignorados)
docs/testing/ (este plan, matrices y fichas)
```

Paquete independiente porque repo no tiene workspace. Nueva dependencia principal @playwright/test
con versión fijada al implementar; browser binaries de la misma versión. tsx/pg solo si los scripts
de runner/seed lo necesitan; reutilizar capacidades existentes antes de introducir otra dependencia.
No monorepo framework, servicio remoto de pruebas, BDD ni PageObjectbase genérico.
Page helpers pequeños para editor, selección publicación y navegación; las aserciones permanecen
legibles en el test. Métodos representan acción de negocio, no cientos de wrappers click/fill.

## Entorno y ciclo de vida

1. Preflight fail-closed de [datos](E2E_TEST_DATA.md), crear PG17 exclusivo, migrar/provisionar runtime.
2. Fijar API y origins de NEXT_PUBLIC antes de compilar frontend; backend compilado una sola vez/job.
3. Arrancar Next standalone con sus static/public según Dockerfile existente; / y assets listos.
4. Por test/variante: namespace propio, seedperfil, arrancar/reiniciar API con mismo puerto/secreto del job,
   esperar /ready200 y verificar build SHA/manifest antes de abrir contexto nuevo.
5. Login UI, navegar con Next Link/controles en el documento vivo. `page.goto` posterior equivale a
   navegación de documento y borra Session; usarlo solo donde el caso espera relogin.
6. Comparar persistencia por API de actor autorizado o SQL operador controlado; cerrar contextos.
7. Teardown final elimina exclusivamente infraestructura propia. Retry usa namespace nuevo.

Un worker por stack, fullyParallel false inicialmente; otros shards tienen DB/API/frontend propios.
Rate limit memoria por instancia: reiniciar API **entre** tests, no dentro del flujo salvo prueba reinicio.
Máximo cinco logins/proceso; parametrizar matrices por actor para no agotar cuota. API probes usan
token del login real capturado solo en RAM del runner, no realizan login adicional ni lo imprimen.
RATE conserva proceso y prueba cuota real. No usar spoof de X-Forwarded-For ni desactivar throttler.
Si se aumenta workers, duplicar también frontend/config API por stack y medir costo de build; no
compartir un API global reiniciado mientras otro test trabaja. Shard aislado es primera vía de paralelismo.
Esto es una adaptación propia al código AcademiX, no una exigencia de Playwright.

## Fixtures y autenticación

Fixture test-scoped retorna entorno/manifest/actores y factory de BrowserContext limpio por actor.
MULTI conserva UserUUID entre dos tenants de su namespace; sesiones de documentos separadas.
Ningún storageState de usuario real ni inyección de JWT a ventana/React; memoria Session no se restaura
con cookies/localStorage. Helpers login rellenan labels y esperan Mis cursos o error esperado de contexto.
Staff y estudiante del mismo caso usan contextos separados. Cada test autentica, sin depender de setup
de otro test; la cuenta no comparte curso mutable con tests vecinos.
Tokens sintéticos inválidos/vencidos solo companionHTTP; autenticar navegador siempre con backend real.

## Selectores y esperas

- Preferir getByRole/getByLabel con nombre accesible; scoped por formulario/dialog/fila del recurso.
- Ejemplos: botón Continuar, heading Mis cursos, form Crear material, dialog Confirmar publicación,
  radio por alternativa dentro del fieldset de pregunta, Gestionar nombre+rol del fixture.
- Resolver UUID por manifest/respuesta; no indexar `nth(0)` sobre orden aleatorio ni clases de estilo.
- Si falta selector estable, documentar hallazgo y proponer cambio mínimo en rama funcional posterior;
  no modificar componentes en esta rama. Usar data-testid solo para ambigüedad real e inmutable.
- Autoespera con expect visible/enabled/URL y waitForResponse registrado antes del click; DB polling
  acotado de invariant. No waitForTimeout/networkidle como señal de consistencia.
- Barreras para concurrencia/retener respuesta real; validar precondición antes de liberar. No exigir
  ganador específico por scheduling; afirmar serialización y resultado legal.
- Presupuesto inicial test60s, acción10s, expect10s; RATE120s; entorno/fault120s. Setup global5min.
  Ventanas con margen no sustituyen pruebas de frontera exacta a nivel SQL/HTTP controlado.

## Red y mocks justificados individualmente

Backend, DB, auth, permisos, cálculo y persistencia siempre reales en E2E crítico.
Inyectar solo request específico para timeout/offline/200malformado/500UX y pérdida de respuesta
**después** de route.fetch real cuando se prueba commit incierto. Identificar la modalidad en reporte.
Sin servicios externos de storage/SSO implementados: no crear mocks ficticios de ellos.
HTMLMarkdown usa host sentinel controlado por runner para detectar request prohibido, sin visitar terceros.
CaídaDB y atomicidad se ejecutan en clonstack exclusivo; nunca sobre stack compartido concurrente.

## Proyectos, evidencia y diagnóstico

Proyectos propuestos: chromium-regression, chromium-mobile, firefox-smoke, webkit-smoke;
un mismo ID se expande por proyecto/actor/tenant con sufijo, sin duplicar ID de catálogo.
Reporters line+JUnit+HTML/blob cuando haya shards; manifest de ejecución incluye SHA, versión
browser, esquema, seedversion y IDs/estado, no env completos ni URLs con passwords.
Screenshot al fallo con datos sintéticos y máscaras de login; video off por defecto, opt-in sintético
para diagnosticar flake tras evaluación de secretos. Conservar timeline de pasos con campos allowlist.

Trazas Playwright pueden incluir headers Bearer y cuerpos login. Configurar trace off en privados
hasta disponer de redacción validada. Públicos sin credenciales pueden usar retain-on-failure.
No subir trace/HAR/raw network de privados. Una tarea posterior puede producir trace sanitizada
eliminando Authorization, login bodies, tokens de respuestas y snapshots de credenciales antes de
publicar; si no garantiza sanitización, mantener deshabilitado y usar screenshots+timeline seguro.
No afirmar que screenshot masking también limpia la red de una traza.

Clasificar fallo: setup/infra, producto, contrato, fixture, selector, tiempo o flake. Adjuntar último
estado autorizado y comparación de invariantes, evitando volcar filas completas/secretos.
Retries local0, CI máximo1 con nuevo namespace; falla en primer intento y pasa en segundo se reporta
inestable, no verde estable. P0 flakey bloquea madurez y requiere resolución; no retry infinito.

## Soporte oficial consultado

[Best practices](https://playwright.dev/docs/best-practices): contextos aislados y locators observables.
[Authentication](https://playwright.dev/docs/auth): storageState y sensibilidad del estado autenticado.
[Retries](https://playwright.dev/docs/test-retries): distinguir passed/flaky/failed; política del plan más estricta para P0.
[Sharding](https://playwright.dev/docs/test-sharding): reparto y fusión de reportes; aislamiento DB es decisión de este plan.
[Trace Viewer](https://playwright.dev/docs/trace-viewer-intro): diagnóstico interactivo; política de secretos propia arriba.
