# Guía incremental de ejecución E2E

Documento vivo: actualizar al aceptar cada fase. Al terminar F7, consolidar estos comandos,
requisitos y evidencias en E2E_README.md; conservar aquí el historial de resultados.
Estado normativo por fase: IMPLEMENTATION_STATUS.md y F1_VALIDATION.md/F2_VALIDATION.md/F3_VALIDATION.md/F4_VALIDATION.md/F5_VALIDATION.md/F6_VALIDATION.md.

## Preparación en otro equipo

Obtener la rama de trabajo y leer AGENTS.md. Requisitos: Node24, pnpm9, Python3,
PostgreSQL17 local o Docker operativo. Nunca configurar una base de producción/existente.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir e2e install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers" pnpm --dir e2e exec playwright install chromium firefox webkit
```

El runner crea PostgreSQL, aplica migraciones y seed, compila Next/Nest y limpia sus recursos.
Desde un agente, el sandbox puede requerir autorización para PG/navegadores; desde terminal normal
se aplican los permisos del usuario. El runner detecta automáticamente la caché local de navegadores.

## Elegir cómo ejecutar

| Necesidad | Comando desde raíz |
| --- | --- |
| Todas las pruebas implementadas y motores configurados | `pnpm test:e2e:all` |
| Una fase | `pnpm test:e2e:f1`, `pnpm test:e2e:f2`, `pnpm test:e2e:f3`, `pnpm test:e2e:f4`, `pnpm test:e2e:f5` o `pnpm test:e2e:f6` |
| Todas las implementadas en Chromium visible | `pnpm test:e2e:visual` |
| Una fase con navegador visible | `pnpm test:e2e:f6 --headed` |
| Pausar y avanzar con el inspector | `pnpm test:e2e:step content.spec.ts --grep E2E-CONTENT-008` |
| Un caso concreto | `pnpm test:e2e:f4 --grep E2E-CONTENT-008` |

La ejecución normal es headless. La alternativa visual no cambia las aserciones.
El inspector ofrece controles de pausa/avance; requiere interacción humana para continuar.
El comando all incluye512 instancias configuradas de F1–F6; no fue ejecutado tras F6.
Evidencia histórica:248/248 fichas; F5/F6 se validaron por incrementos; NETWORK-008 tuvo además repetición por protección de trazas.
No ejecutar dos runners a la vez en el mismo checkout: comparten los puertos/builds locales.
En macOS,opcionalmente:`caffeinate -i pnpm test:e2e:all` evita suspensión por inactividad durante el comando.

## Registro por fase

| Fase | Comando desde raíz | Estado |
| --- | --- | --- |
| F1 | `pnpm test:e2e:f1` | Aceptada:16 instancias Chromium al cierre original |
| F2 | `pnpm test:e2e:f2` | Aceptada:47 Chromium;63 con smoke actual (61 al cierre histórico) |
| F3 | `pnpm test:e2e:f3` | Aceptada:89 Chromium;129 con smoke Firefox/WebKit |
| F4 | `pnpm test:e2e:f4` | Aceptada:92 Chromium;126 con smoke Firefox/WebKit |
| F5 | `pnpm test:e2e:f5` | Aceptada por incrementos:103 Chromium;115 con smoke Firefox/WebKit |
| F6 | `pnpm test:e2e:f6` | Aceptada por incrementos:41 Chromium;68 con Firefox/WebKit |
| F7 | Pendiente | Automatización,estabilidad y consolidación |

```bash
pnpm test:e2e:f2 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f4 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f5 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --grep E2E-AUTH-017
pnpm test:e2e --project=chromium --project=firefox --project=webkit
pnpm --dir e2e coverage
pnpm --dir e2e report
```

Los filtros y comandos no crean tests faltantes. Una ficha solo aprueba sus variantes/proyectos
obligatorios; una ejecución filtrada no acredita las fichas restantes.
F6 terminó; detenerse para revisión del usuario antes de F7. No hacer push/merge automático.

## Demostración visual y evidencia para evaluación

```bash
pnpm test:e2e:f5 --headed --grep E2E-GRADE-021
pnpm test:e2e:f5 --debug --grep E2E-ATTEMPT-018
pnpm --dir e2e report
```

`--headed` abre el navegador real y permite observar formularios, navegación y resultados.
Las comprobaciones HTTP/SQL no tienen interacción visual: se identifican como complementarias.
El navegador se cierra al terminar; no se deja un servidor de demostración permanente.

Respuesta sugerida al profesor: «Playwright controla un navegador real contra Next, Nest y PostgreSQL.
Cada prueba contiene aserciones de UI, estado HTTP o persistencia. Si el resultado no coincide,
el proceso termina con fallo. Los logs describen la ejecución; no determinan por sí solos el éxito».

Mostrar el código de una aserción, ejecutar con navegador visible y abrir el reporte HTML.
Cada run conserva results.json, junit.xml y run.json con SHA, seed, resultado y duración;
los reportes HTML permiten inspeccionar los pasos. Las trazas de fallo privadas comienzan tras login
y se sanitizan antes de adjuntarlas; no compartir tokens, HAR ni credenciales.
Las capturas/trazas complementan las aserciones, no garantizan por sí solas cobertura completa.

## Cierre de F4 y entrega a otra persona

Código validado `6db9541` en `test/e2e-f4`; evidencia[F4_VALIDATION](F4_VALIDATION.md).
Run `d014cf0385019d99`:329 PASS,0 fail/skip/flaky;139 fichas aprobadas y109 pendientes.
F3 y F4 exigen sus tres proyectos para acreditar todas las variantes del manifest.
Las correcciones funcionales NUL y bloqueo de publicación están en commits/ramas fix separados.
Retomar desde esta rama y leer[roadmap F5](../roadmap/F5.md),tras nueva autorización del usuario.
Los reportes completos son locales e ignorados por Git; los commits conservan código y resumen verificable.
En otro equipo se deben transferir los commits por un medio autorizado y repetir los comandos;
un compañero no recibe commits locales automáticamente. No hacer push sin autorización.

## Consolidación al cierre

Tras cada fase: registrar SHA/runId, casos/variantes, comando reproducible, requisitos nuevos,
fallos conocidos y limpieza. Al cierre F7: reconciliar scripts reales con E2E_README.md,
eliminar instrucciones obsoletas de la guía principal y enlazar este historial como evidencia.

## Validación acotada de F5

Solo se ejecutaron los cuatro archivos nuevos:quizzes,attempts,grades,academic-audit.
Run2e26783d10b0fd6b:114 PASS/1 FAIL; correctivo31cd7b0254fc4196:solo ATTEMPT-009,1 PASS.
No hubo un único run115 PASS ni regresión completa de fases antiguas. Ver F5_VALIDATION.md.
Para ahorrar ejecución al depurar:`pnpm test:e2e:f5 --grep E2E-ATTEMPT-009`.

## F6: ejecución acotada y demostración

```bash
pnpm test:e2e:f6 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f6 --headed --grep E2E-A11Y-004
pnpm test:e2e:f6 --debug --grep E2E-A11Y-002
pnpm test:e2e:f6 --grep E2E-NETWORK-003
pnpm --dir e2e exec playwright show-report reports/600966c85750d479/html
```

F6_VALIDATION.md conserva ocho runs:68 variantes/motores aprobados; no hubo un único run68 PASS.
No se repitieron F1–F5. Reportes locales ignorados por Git; otro equipo debe copiarlos o recrearlos
con los comandos de la rama permanente. La guía se consolidará al cerrar F7.
