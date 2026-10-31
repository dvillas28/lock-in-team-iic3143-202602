# Guía incremental de ejecución E2E

Documento vivo: actualizar al aceptar cada fase. Al terminar F7, consolidar estos comandos,
requisitos y evidencias en E2E_README.md; conservar aquí el historial de resultados.
Estado normativo por fase: IMPLEMENTATION_STATUS.md y F1_VALIDATION.md/F2_VALIDATION.md/F3_VALIDATION.md.

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
| Una fase | `pnpm test:e2e:f1`, `pnpm test:e2e:f2` o `pnpm test:e2e:f3` |
| Todas las implementadas en Chromium visible | `pnpm test:e2e:visual` |
| Una fase con navegador visible | `pnpm test:e2e:f2 --headed` |
| Pausar y avanzar con el inspector | `pnpm test:e2e:step auth.smoke.spec.ts` |
| Un caso concreto | `pnpm test:e2e:f3 --grep E2E-AUTH-017` |

La ejecución normal es headless. La alternativa visual no cambia las aserciones.
El inspector ofrece controles de pausa/avance; requiere interacción humana para continuar.
El comando all incluye F1–F3:201 instancias;85/248 fichas. No acredita las fases pendientes.
No ejecutar dos runners a la vez en el mismo checkout: comparten los puertos/builds locales.
En macOS,opcionalmente:`caffeinate -i pnpm test:e2e:all` evita suspensión por inactividad durante el comando.

## Registro por fase

| Fase | Comando desde raíz | Estado |
| --- | --- | --- |
| F1 | `pnpm test:e2e:f1` | Aceptada:16 instancias Chromium al cierre original |
| F2 | `pnpm test:e2e:f2` | Aceptada:47 Chromium;61 incluyendo smoke de otros motores |
| F3 | `pnpm test:e2e:f3` | Aceptada:89 Chromium;129 con smoke Firefox/WebKit |
| F4–F7 | Pendiente | Añadir comandos/evidencias cuando se implementen |

```bash
pnpm test:e2e:f2 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --grep E2E-AUTH-017
pnpm test:e2e --project=chromium --project=firefox --project=webkit
pnpm --dir e2e coverage
pnpm --dir e2e report
```

Los filtros y comandos no crean tests faltantes. Una ficha solo aprueba sus variantes/proyectos
obligatorios; una ejecución filtrada no acredita las fichas restantes.
F3 terminó; el usuario autorizó continuar con F4. No hacer push/merge automático.

## Demostración visual y evidencia para evaluación

```bash
pnpm test:e2e:f2 --headed
pnpm test:e2e:f3 --headed --grep E2E-AUTH-011
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

## Cierre de F3 y entrega a otra persona

Código validado `4d0da34` en `test/e2e-f3`; evidencia[F3_VALIDATION](F3_VALIDATION.md).
Run `5dac3117c5e950ef`:201 PASS,0 fail/skip/flaky;85 fichas aprobadas y163 pendientes.
F3 sola exige sus tres proyectos para aprobar todas las variantes del manifest.
Retomar desde esta rama, leer[roadmap F4](../roadmap/F4.md) y crear `test/e2e-f4` tras la autorización del usuario.
Los reportes completos son locales e ignorados por Git; los commits conservan código y resumen verificable.
En otro equipo hay que transferir los commits por un medio autorizado y volver a ejecutar;
un compañero no obtiene commits locales automáticamente. No hacer push sin autorización.

## Consolidación al cierre

Tras cada fase: registrar SHA/runId, casos/variantes, comando reproducible, requisitos nuevos,
fallos conocidos y limpieza. Al cierre F7: reconciliar scripts reales con E2E_README.md,
eliminar instrucciones obsoletas de la guía principal y enlazar este historial como evidencia.
