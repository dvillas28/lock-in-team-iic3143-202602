# Guía incremental de ejecución E2E

Documento vivo: actualizar al aceptar cada fase. Al terminar F7, consolidar estos comandos,
requisitos y evidencias en E2E_README.md; conservar aquí el historial de resultados.
Estado normativo por fase: IMPLEMENTATION_STATUS.md y F1_VALIDATION.md/F2_VALIDATION.md.

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
El comando all incluye F3 en desarrollo; no equivale a248 casos ni acredita las fases pendientes.
No ejecutar dos runners a la vez en el mismo checkout: comparten los puertos/builds locales.

## Registro por fase

| Fase | Comando desde raíz | Estado |
| --- | --- | --- |
| F1 | `pnpm test:e2e:f1` | Aceptada:16 instancias Chromium al cierre original |
| F2 | `pnpm test:e2e:f2` | Aceptada:47 Chromium;61 incluyendo smoke de otros motores |
| F3 | `pnpm test:e2e:f3` | Parcial:20 variantes AUTH aprobadas; matrices F3 restantes pendientes |
| F4–F7 | Pendiente | Añadir comandos/evidencias cuando se implementen |

```bash
pnpm test:e2e:f2 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f3 --grep E2E-AUTH-017
pnpm test:e2e --project=chromium --project=firefox --project=webkit
pnpm --dir e2e coverage
pnpm --dir e2e report
```

Los filtros y comandos no crean tests faltantes. Una ficha solo aprueba sus variantes/proyectos
obligatorios; una ejecución filtrada no acredita las fichas restantes.
F3 se detendrá para revisión del usuario antes de F4. No hacer push/merge automático.

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

## Consolidación al cierre

Tras cada fase: registrar SHA/runId, casos/variantes, comando reproducible, requisitos nuevos,
fallos conocidos y limpieza. Al cierre F7: reconciliar scripts reales con E2E_README.md,
eliminar instrucciones obsoletas de la guía principal y enlazar este historial como evidencia.
