# F7 — Registro incremental

Rama `test/e2e-f7`, acumulativa desde F6 (`9e7945d`). Sin producción, push, merge ni despliegues.
El usuario autorizó explícitamente veinte rondas smoke y una corrida completa, aunque repitan casos previos.

## Implementación

- Selección por catálogo:smoke22 fichas/153 variantes-motores; extended248/512.
- Control de ejecución:no PASS con resultados vacíos,omitidos,inestables,interrumpidos o incompletos.
- Workflow PRsmoke en tres motores; pushdev regressionChromium; schedule/dispatch según selección.
- Agregador verifica SHA,proyectos,variantes,checksums y resultados; no skippedverde.
- Publicación allowlist:resumen,HTML estático,JUnit y checksums; credenciales detectadas bloquean exportación.
- Playwright HTML/trazas/capturas quedan locales; no se suben artifacts privados.
- Lease exclusivo, señales de cancelación y cleanup de arranques parciales; un worker por stack.
- Caché solo pnpm y compiladorNext con SHA/config local fijo; sin cache de DB/JWT/build standalone.
- Shards1:motores ya aislados por job; no habilitar2–4 sin benchmark remoto.
- Ventana de estabilidad exige20 runIds diferentes, mismo SHA/seed/entorno/selección, checkout limpio.

## Validación pendiente

Typecheck,lint,unitarios de automatización,ensayo de cancelación,corrida512 y veinte smoke153.
Las ejecuciones deben registrar SHA limpio y conservar cualquier fallo; no declarar estabilidad por colección.
CI remoto/protección de ramas permanecen sin verificar mientras siga prohibido el push.
Se respeta la preferencia del usuario de una única PR acumulativa; no se creará una PR separada automáticamente.
