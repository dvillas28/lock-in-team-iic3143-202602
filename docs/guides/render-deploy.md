# Desplegar AcademiX en Render (plan free)

Pasos manuales en Render, GitHub y DNS para la migración desde Railway.
La decisión está en el [ADR](../adr/deploy-on-render.md); los servicios, en `render.yaml`.
Esta guía no acredita un despliegue ejecutado.

## Antes de mergear

Nada de esto despliega; se puede hacer mientras la PR está en revisión.

1. **Cuenta y repositorio.** Entrar a <https://dashboard.render.com> con GitHub.
   En el workspace (Hobby, gratis), conectar la GitHub App de Render y darle acceso
   al repositorio `lock-in-team-iic3143-202602`.
2. **API key.** Account Settings → API Keys → Create API Key.
   En GitHub: Settings → Secrets and variables → Actions → New repository secret
   `RENDER_API_KEY`. No pegarla en issues, chats ni commits.
3. **Secretos que se van a pedir.** Prepararlos en un gestor de contraseñas:
   - `AUTH_JWT_SECRET`: el de Railway si se puede recuperar; si no, `openssl rand -base64 32`
     (las sesiones antiguas caducan, nada más).
   - Clave nueva para `academix_runtime`: `openssl rand -hex 24`. Solo hex, para no
     tener que codificarla dentro de la URL.
4. **Datos de Railway.** Si Railway vuelve y los datos importan, sacar un `pg_dump` antes de apagarlo.
   Sin dump, la base de Render parte vacía.
5. **Mergear** la PR siguiendo [git-flow](git-flow.md) hasta `main`, con CI en verde.
   El primer Release en `main` no encuentra IDs de servicio y salta el paso de `APP_VERSION`.

## Después de mergear a main

### 1. Crear el Blueprint

1. Dashboard → **New** → **Blueprint**. Elegir el repositorio y la rama `main`;
   la ruta del archivo es `render.yaml`.
2. Render muestra `academix-db`, `academix-backend` y `academix-frontend`, todos en Free.
   Revisar que ninguno diga un plan pagado.
3. Pide los valores `sync: false`:
   - `AUTH_JWT_SECRET`: el del paso 3 de arriba.
   - `DATABASE_URL`: todavía no existe la base. Poner
     `postgres://academix_runtime:pendiente@dpg-pendiente-a/academix`.
4. **Apply.** Se crean los tres recursos. El frontend debería quedar *Live*; el backend
   falla en el primer arranque porque `DATABASE_URL` es provisoria. Es lo esperado.

### 2. Completar la URL de runtime

1. Abrir `academix-db` → **Connect** → **Internal**. Copiar el host: lo que va
   entre `@` y el siguiente `/` o `:`, con forma `dpg-xxxxxxxxxxxx-a`.
2. Abrir `academix-backend` → **Environment** → editar `DATABASE_URL`:
   `postgres://academix_runtime:<clave hex>@dpg-xxxxxxxxxxxx-a/academix`.
   Mismo host y misma base que la URL interna; no agregar `sslmode`.
3. **Save, rebuild, and deploy** (o Save y luego **Manual Deploy → Deploy latest commit**).
4. En **Logs** del backend debe aparecer `{"operation":"predeploy","outcome":"ok"}` y luego
   el servicio queda *Live*. Si aparece `"category":"config"`, revisar la URL;
   si aparece un error de permisos al crear `academix_runtime`, detenerse y avisar:
   el usuario de Render no tendría `CREATEROLE` y hay que replantear la base.

### 3. Conectar Release con los servicios

1. En cada servicio, copiar su ID (`srv-...`, visible en la URL del dashboard).
2. GitHub → Settings → Secrets and variables → Actions → pestaña **Variables**:
   `RENDER_BACKEND_SERVICE_ID` y `RENDER_FRONTEND_SERVICE_ID`.
3. Opcional: en Environment de cada servicio, crear `APP_VERSION` con el último tag sin `v`
   (por ejemplo `0.4.0`) y redesplegar. Desde el próximo release lo fija el workflow.
4. Borrar el secret `RAILWAY_TOKEN`; ya no se usa.

### 4. Dominios y DNS

1. En `academix-frontend` → **Settings** → **Custom Domains** deben estar
   `uc.academix.dvillasc.me` y `utfsm.academix.dvillasc.me`; en el backend, `api.dvillasc.me`.
2. En el proveedor DNS de `dvillasc.me`, reemplazar los registros de Railway por los
   CNAME que muestra Render (apuntan a `academix-frontend.onrender.com` y
   `academix-backend.onrender.com`). Borrar los TXT/CNAME viejos de Railway.
3. Volver a Render y pulsar **Verify** en cada dominio. Esperar el certificado *Issued*.

### 5. Verificar

```bash
curl -s https://api.dvillasc.me/health
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.dvillasc.me/ready
```

- `/health` muestra `commit` con el SHA de `main` y `/ready` responde 200.
- Abrir `https://uc.academix.dvillasc.me/login` y `https://utfsm.academix.dvillasc.me/login`.
  Si el navegador reporta CORS, revisar que ambos dominios estén verificados con HTTPS.
- En **Settings → Build & Deploy** de cada servicio, Auto-Deploy debe decir
  *After CI Checks Pass*.
- Cuentas de prueba: ver [bootstrap demo](../backend/demo-tenant-bootstrap.md);
  `DEMO_DATA_ENABLED` está en `false`.

## Mantención del plan free

- La primera visita tras 15 minutos sin tráfico tarda cerca de un minuto: el backend
  despierta y corre predeploy. Abrir la API antes de una demo.
- La base free expira 30 días después de crearse, con 14 días de gracia y sin respaldos.
  Anotar la fecha. Solo puede haber una base free activa: antes de que venza, eliminar
  `academix-db`, pulsar **Manual Sync** en el Blueprint (la vuelve a crear vacía), repetir
  la sección 2 con el host nuevo y redesplegar el backend.
- Si un deploy de `main` no parte, revisar en GitHub que todos los checks del commit estén
  en verde: Render no despliega si alguno falla.
