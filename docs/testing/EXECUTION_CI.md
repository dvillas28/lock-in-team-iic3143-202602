# Ejecución local y automatización propuestas

Ningún workflow o script se implementa en esta rama.
[CI actual](../../.github/workflows/ci.yml) corre PR/main/dispatch, integraciónPG17, c8, Docker/Trivy,
Sonar y CI result; no navegador ni pushdev regresión/schedule. [Release](../../.github/workflows/release.yml)
etiqueta dev y publica main/APP_VERSION Render; no usar esos jobs para mutar datos E2E.
Board/reviewer son auxiliares; no sustituyen QA ni la revisión humana observada en issue154.

## Comandos y contrato futuro del runner

Existentes, solo preparación/validación por equipo al implementar en entorno permitido:

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir backend build
pnpm --dir frontend build
```

El build frontend necesita origins/API correctos en entorno **antes** de ejecutarlo.
No copiar .env productivo ni ejecutar db:seed demo contra DATABASE_URL heredada.
Comandos siguientes son **propuestos, aún no existen**:

```bash
pnpm --dir e2e install --frozen-lockfile
pnpm --dir e2e exec playwright install --with-deps chromium
pnpm --dir e2e run test:smoke
pnpm --dir e2e run test:regression
pnpm --dir e2e run test:extended
pnpm --dir e2e run report
```

Scripts test:* deben ejecutar runner preflight→stack→seed→tests→teardown, no Playwright suelto
que pueda usar un servidor productivo por variable. Modo headed/UI/debug también pasa preflight.
Los scopes son tags@smoke/@regression/@extended enlazados a IDs; grep/tags no se infieren del título.
H/O conservan nivel integración en reporte separado, aunque se orquesten desde mismo paquete.
Runner configura vars E2E_DB/E2E_RUNTIME/E2E_ORIGINS explícitas; no fallback silencioso a DATABASE_URL.

## Pipeline propuesto (rama posterior)

| Evento | Selección | Dependencias / criterio |
| --- | --- | --- |
|pull_request a dev/main |22fichas smoke + variantes seguridad del recurso modificado |Build/contrato/contexto listos; P0 obligatorio; jobaggregator estable |
|push dev |smoke+regression Chromium |DB/namespaces nuevos; suite funcional por rol; sin deploy/productivo |
|schedule diario03:00UTC |extended Chromium + smokecrítico Firefox/WebKit y375px |Stack por matriz; no comparte DB con CI integración |
|workflow_dispatch |suite y SHA explícitos con modos permitidos |Siempre destino aislado; sin entrada libre de URL externa |

Si pathfilter no selecciona E2E, publicar estado explícito con alcance; cambios auth/tenant/DB/API/
capabilities/lockfile/runner disparan seguridad completa. Docs-only puede saltar navegador con motivo.
Nuevo agregador e2e-result falla si job necesario falló, fue cancelado o faltó; no skipped verde accidental.
Proponer check requerido en protección dev/main solo después de estabilizar; no cambiar protección ahora.
GatePR incluye smoke académico aunque F5 lo implemente después: hasta entonces check es informativo
y no afirmar suite completa. F2 habilita subset con cobertura pendiente explícita; F5 cierra smoke de22.

## Preparación de cada job

1. Checkout SHA de PR/evento; pnpm9.15.9 y Node24 como CI actual; installs congelados de paquetes separados.
2. PG17 en servicio/stack exclusivo, DB*_test; dos usuarios/credenciales efímeras, runtime sin bypass.
3. Runner crea ownershipmanifest/sentinel, máscara variables sensibles; predeploy/migraciones existentes.
4. Build app con configuración local, browser binaries versión fijada y verificación /ready/health/manifest.
5. Seedperfil por caso, servidor/API exclusivo; reiniciar API entre variantes evita cuota compartida.
6. Ejecutar catálogo seleccionado y registrar ID/variante/estado; teardown en finally aunque falle setup/test.
7. Publicar JUnit/HTML/blob sanitizados con if always y sin dumps/env/logintraces; resumen de cobertura.

No correr backend integration y E2E en la misma DB. Reutilizar imágenes/cache de pnpm/build cuando
hash/version/config coincidan; no cachear volúmenesSQL, JWT, manifests de credenciales o reportes privados.
Shards inicialmente1, luego2–4 tras medir; cada shard suPG/API/Next. Workers1 por stack.
Concurrencia GitHub por PR con cancel-in-progress true; cancelar debe ejecutar teardown de recursos propios.
TimeoutjobPR25min, regression45min, extended90min como presupuestos iniciales, no mediciones.

## Secretos, artifacts y evidencia

No secretos de producción o Render en E2E. Credenciales PostgreSQL/JWT/passwords efímeras por run.
ForkPR funciona con stack local sin repo secrets; no pull_request_target con código no confiable.
Permisos mínimos contentsread; artifacts solo lo necesario, no tokens para comentar issues/PR.
Retención propuesta: éxitoJUnit/resumen7d; falloHTML/screenshots/timeline14d; extendedhistórico30d
solo métricas agregadas. Trazas públicas7d; privadas prohibidas hasta sanitización validada.
Retención efectiva se verifica con límites/políticaActions del repo al implementar; no se presume cuota.
Retriesmáximo1 con namespace nuevo; P0 flaky o failed bloquea merge; P1 crítico también.
Quarantine requiere issue/owner/caducidad<=7d y cobertura alternativa; nunca esconder aislamientoP0.
Si falla infraestructura, bloquear/no concluir PASS y permitir rerun explícito; no relajar aserciones.

## Tiempo y costo: hipótesis para medir

Ficha no equivale a test parametrizado:22smoke incluye matrices roles/tenant/recursos y ejecuta más instancias.
Objetivo inicialPR10–20min incluyendo build/setup; Chromiumregression20–40min;
extended45–90min con multi-browser y RATE. Estos rangos pueden excederse con parametrización exhaustiva.
Instrumentar duración por fixture/login/test y reportar p50/p95; reducir selección solo con evidencia de cobertura.
Meta posterior smoke<=12min y regression<=30min tras cache/sharding; no compromisos sin benchmark.

Ejemplo de capacidad, no factura:20PR/día×15min +1regression×30min +3jobs nocturnos×45min
=465minrunner/día, ~10230min/22días. Sharding reduce tiempo pared pero aumenta setup y minutos totales.
Duplicar suite por cada pushdev adicional suma su duración; calcular sobre frecuencia real del equipo.
Costo=ΣminutosfacturablesporOS×tarifaefectiva−cuotaincluida, sujeto al planGitHub vigente;
no fijar precios ni asumir minutosgratis ilimitados. No se propone servicio de pago nuevo.
Límites de costo/tiempo se revisan tras20–30runs; mantener controlesP0 aunque se difieran variantesP3.

Guía oficial de orquestación/shards:
[Playwright CI](https://playwright.dev/docs/ci),
[sharding/report merging](https://playwright.dev/docs/test-sharding).
