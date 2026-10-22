# Probar login por dominio en producción — Issue #80

Esta guía describe la configuración requerida; no acredita un despliegue ejecutado.
La [prueba local con Docker](login-session-testing.md) no modifica Render ni su base.

## Dominios y recorrido

| Dirección | Servicio | Resultado |
| --- | --- | --- |
| `https://uc.academix.dvillasc.me` | Frontend, puerto 3000 | Portada con enlace al login |
| `https://utfsm.academix.dvillasc.me` | Mismo frontend | Portada con enlace al login |
| `https://api.dvillasc.me` | Backend, puerto 3001 | API compartida |

Al abrir `https://uc.academix.dvillasc.me/login`, el frontend resuelve `uc` del origin HTTPS exacto configurado.
Después de autenticar, comprueba la membresía y abre directamente UC, incluso para
una persona con membresías en ambas instituciones. No pasa primero por el selector.
La dirección final conserva `https://uc.academix.dvillasc.me/courses`.
En UTFSM ocurre lo mismo con `utfsm`. La raíz `/` no redirige automáticamente al login.

El flujo HTTP vigente es login global `POST /api/v1/auth/login`, directorio
`GET /api/v1/institutions` y contexto `GET /api/v1/institution/uc/me` en la API central.
El último endpoint exige JWT, usuario activo, institución activa y membresía activa.
El dominio no concede permisos. Host y path institucional distintos bloquean la vista.
No existe selector ni botón Instituciones. `/institutions` redirige a `/courses` sin
mostrar contenido. Abrir otro subdominio exige autenticarse porque el JWT está en memoria.

## Configuración de los servicios

La plataforma es Render ([ADR](../adr/deploy-on-render.md)); `render.yaml` declara servicios,
dominios y valores no secretos. Los pasos indican qué revisar o ingresar en el dashboard.

1. Desplegar los cambios del frontend y backend como versiones compatibles.
2. Ambos dominios institucionales están en el frontend y `api.dvillasc.me` en el backend.
   Configurar en DNS los registros que indique Render; esperar DNS y certificado HTTPS válidos.
3. Configurar `NEXT_PUBLIC_API_URL=https://api.dvillasc.me` en la construcción del frontend.
   El Dockerfile lo recibe como build argument; cambiarlo requiere reconstruir la imagen.
   NEXT_PUBLIC_INSTITUTION_ORIGINS ausente usa los dos origins HTTPS de la tabla;
   si se declara, debe ser JSON origin→slug válido y completo, sin paths ni slugs duplicados.
   Una variable presente vacía bloquea acceso; no usar valor vacío como default.
4. Configurar `API_URL` del servidor frontend hacia el backend: puede usarse
   `https://api.dvillasc.me` o su dirección privada efectiva dentro de Render.
5. `MIGRATION_DATABASE_URL` viene de la base del Blueprint. Ingresar `DATABASE_URL` con el rol
   `academix_runtime` en el mismo host interno y base; HTTP usa solo runtime.
   Configurar `AUTH_JWT_SECRET`
   como base64 canónico de al menos 32 bytes aleatorios. Mantener el secreto entre despliegues;
   rotarlo invalida los tokens firmados con el anterior. Nunca usar variables `NEXT_PUBLIC_*` para secretos.
6. Configurar exactamente el siguiente valor en el backend y redesplegarlo:

```text
CORS_ALLOWED_ORIGINS=["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"]
```

Comprobar la configuración efectiva de raíz, Dockerfile y comando del servicio.
En el plan free, `render.yaml` arranca con `node dist/commands/serve.js`: ejecuta predeploy en otro proceso
y luego `start.js`, que retira secretos operativos del proceso HTTP.
Predeploy aplica esquema, provisiona runtime y valida RLS; la nueva demo es opt-in.
CORS permite al navegador consumir la API; JWT y membresía siguen autorizando cada solicitud.
En production, CORS exige ambos orígenes institucionales y solo admite HTTPS;
una configuración ausente, incompleta o con HTTP impide arrancar el backend.

## Cuentas para probar

Los valores del `.env` local no se transmiten a Render. Una cuenta de Docker
no existe en producción hasta que se aprovisione en esa base.
Para una demo autorizada, un operador puede configurar las cinco variables `DEMO_*_PASSWORD`
de la [tabla local](login-session-testing.md#3-ingresar-desde-el-navegador) en el entorno remoto
y ejecutar `node dist/seeds/demo.js` dentro del servicio backend, con acceso a su base.
Las claves deben tener 8–30 caracteres; no pasarlas por argumentos ni compartirlas en logs.
Este seed existente crea dos instituciones y cinco usuarios si faltan; repetirlo preserva
contraseñas, estados y membresías existentes. Cambiar una variable no resetea una cuenta.
Su ejecución es manual y modifica esa base: no forma parte de probar la PR localmente.

## Comprobación del despliegue

1. Verificar HTTPS válido en ambos frontend y respuestas 200 en `/health` y `/ready` de la API.
2. Abrir el login UC con la cuenta multiinstitución: debe abrir UC sin selector inicial.
3. Cerrar sesión y repetir en UTFSM: debe abrir UTFSM directamente.
4. En el dominio UTFSM, ingresar con la cuenta exclusiva UC: no debe mostrar contenido UTFSM.
5. En el dominio UC, probar `/institutions/utfsm`: debe rechazar el contexto de dominio incompatible.
6. Recargar una vista autenticada: debe pedir login; cerrar sesión debe funcionar aun sin API.
7. En Network verificar login 200, directorio 200 y `/me` 200 para una membresía válida;
   una membresía ausente/inactiva devuelve 404. No compartir JWT, Authorization ni cuerpos de login.

El preflight se puede comprobar sin credenciales; repetir cambiando el Origin por UTFSM:

```bash
curl -i -X OPTIONS https://api.dvillasc.me/api/v1/auth/login \
  -H 'Origin: https://uc.academix.dvillasc.me' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Debe responder 204 con `Access-Control-Allow-Origin` igual al origen permitido.
Con `Origin: https://example.invalid`, no debe incluir esa cabecera.

## Dependencias y límites

El PR #125 implementó el contrato singular, RLS, credenciales separadas y la nueva demo
opt-in de diez cuentas. Esta rama integra esos cambios sin revertir su seguridad.
Consultar [operación de la demo](../backend/demo-tenant-bootstrap.md) para ese bootstrap,
la adopción de datos legacy y los pasos de despliegue/validación pública aún operativos.
No hay refresh token, revocación individual del JWT ni SSO entre subdominios.
La aprobación del Quality Gate de esta rama queda **PENDIENTE DE VALIDACIÓN EN CI**.
