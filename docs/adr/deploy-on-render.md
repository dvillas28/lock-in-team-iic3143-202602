# ADR: Desplegar en Render en lugar de Railway

Fecha: 2026-10-22. Estado: configuración en repositorio; despliegue y DNS pendientes del operador.
Reemplaza la plataforma de despliegue supuesta por la [Entrega 2](../deliveries/2/README.md)
y por [persistencia y migraciones](choose-backend-persistence-and-migrations.md).
Pasos del operador: [guía de despliegue en Render](../guides/render-deploy.md).

## Contexto

El despliegue en Railway está caído, junto con la PostgreSQL que alojaba.
El equipo decidió cambiarse a Render y pidió que el pipeline CI/CD cambie lo mínimo.
Las imágenes Docker, CI, Trivy, Sonar y el versionado de Release no dependen de la plataforma.
Los únicos acoplamientos eran `railway.json`, el CLI de Railway en Release, el host privado
`*.railway.internal` aceptado sin TLS y la variable `RAILWAY_GIT_COMMIT_SHA` de `/health`.

## Decisión

- Un Blueprint `render.yaml` en la raíz declara backend, frontend y PostgreSQL 17.
- Mismos Dockerfiles, puertos (3001/3000) y healthchecks (`/ready`, `/`).
  `buildFilter` reemplaza `watchPatterns`.
- `autoDeployTrigger: checksPass` reemplaza "Wait for CI": Render despliega `main`
  solo cuando todos los checks del commit pasan, incluido el workflow Release.
- Release fija `APP_VERSION` con `PUT /v1/services/{id}/env-vars/APP_VERSION`.
  Necesita el secret `RENDER_API_KEY` y las variables `RENDER_BACKEND_SERVICE_ID`
  y `RENDER_FRONTEND_SERVICE_ID`. Actualizar por API no despliega por sí solo.
- `/health` informa `RENDER_GIT_COMMIT`.
- Sin TLS solo se acepta el host interno de Render Postgres (`dpg-<id>-a`), que resuelve
  únicamente dentro de su red privada. Hosts externos siguen exigiendo `verify-full`.
- `MIGRATION_DATABASE_URL` sale del Blueprint (`fromDatabase`); `DATABASE_URL` de
  `academix_runtime` se ingresa manualmente con el mismo host y base.
- Solo instancias free, por falta de presupuesto. El plan free no tiene `preDeployCommand`:
  `dist/commands/serve.js` ejecuta predeploy en un proceso hijo y, si termina bien, carga
  `start.js`, que sigue retirando los secretos operativos antes del HTTP.
- El workspace Hobby incluye dos dominios propios; ambos van al frontend (`uc.academix`,
  `utfsm.academix`). La API queda en `https://academix-backend.onrender.com`, sin dominio propio.

## Consecuencias

- Tenant y roles no cambian: RLS, rol runtime sin bypass y retiro de secretos en `start.js` se conservan.
- Cada arranque (deploy o vuelta tras 15 min sin tráfico) corre predeploy: el lock advisory
  lo serializa y es idempotente, pero alarga el arranque en frío (~1 min en free).
- Las 750 horas free al mes se comparten entre backend y frontend; al agotarse se suspenden.
- La base free expira 30 días tras crearse (2026-11-21 si se crea hoy), con 14 días de gracia;
  sin respaldos. Antes de esa fecha: recrearla y redesplegar, o migrar a una base sin expiración.
- La base nueva parte vacía. Predeploy aplica esquema y provisiona runtime; la demo es opt-in.
  Si se recupera un dump de Railway, restaurarlo antes del primer despliegue.
- Hay que verificar que el usuario propietario de Render pueda crear `academix_runtime`.
- DNS de `uc.academix` y `utfsm.academix` debe apuntar a Render; TLS lo emite Render.
- Specs, OpenAPI y guías históricas siguen nombrando `api.dvillasc.me`: es el destino previsto,
  no el desplegado. Recuperarlo cuesta US$0,25/mes por dominio extra. Un cuarto dominio
  (`academix.dvillasc.me`, spec de dominios y CORS) tampoco cabe en el plan gratuito.
- Conservar `AUTH_JWT_SECRET` si es recuperable; si no, las sesiones vigentes caducan.
- Rollback: Render permite redeploy de un deploy anterior; revertir ambos servicios
  juntos si cambió el contrato de la API.
- Registros de evidencia anteriores que mencionan Railway quedan como historia.

## Alternativas descartadas

Esperar a Railway deja la demo caída sin plazo. Instancias pagadas: sin presupuesto.
Encadenar comandos en `dockerCommand` depende de cómo Render separa argumentos.
Otra base gratuita sin expiración agrega una cuenta y TLS `verify-full` hacia afuera;
queda como opción si recrear la base de Render cada 30 días resulta inviable.
