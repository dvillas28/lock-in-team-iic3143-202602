# Demo institucional: operación y entrega

## Estado

Implementación y validación locales: 153/153 backend, 99.51% líneas; frontend 46/46; PostgreSQL 18 8/8.
Docker Compose, contratos/catálogo, runtime/RLS y Markdown <150 PASS. Producción NO modificada ni validada.
T042 (Render/DNS/TLS efectivo) y T044 (smoke HTTPS) requieren ejecución del operador.
Despliegue y merge no ejecutados. La PR hacia dev no habilita operaciones remotas. Evidencia local: [checklist](../../specs/20261020-211552_demo-aislamiento-dominios/checklists/implementation.md).

## Contrato y credenciales

- API central: `https://api.dvillasc.me`, puerto backend 3001.
- Frontend: `https://uc.academix.dvillasc.me` y `https://utfsm.academix.dvillasc.me`.
- Tenant: `/api/v1/institution/{institutionSlug}/...`; colección global `/api/v1/institutions`.
- Path solicita institución; identidad y pertenencia activas autorizan. Host/Origin no seleccionan tenant.
- `DATABASE_URL`: rol fijo `academix_runtime`, no propietario, sin SUPERUSER/BYPASSRLS ni membresías de roles.
- `MIGRATION_DATABASE_URL`: operador; mismo servidor/base que runtime. Nunca fallback desde HTTP.
- `AUTH_JWT_SECRET`: conservar secreto actual; no rotación automática.
- Runtime pierde variables MIGRATION/DEMO/ONBOARD/SUPERADMIN antes de cargar HTTP.
- El contenedor sigue compartiendo el entorno de Render: esto no protege ante compromiso del contenedor.

## Preparación local

Consultar [.env.example](../../.env.example) y [quickstart](../../specs/20261020-211552_demo-aislamiento-dominios/quickstart.md).
Compose ejecuta predeploy antes del arranque HTTP; usa origen local explícito `http://localhost:3000`.
Las pruebas destructivas requieren dos URLs a la misma base descartable terminada en `_test`:
`TEST_DATABASE_URL` operativa y `TEST_RUNTIME_DATABASE_URL` de academix_runtime.
No usar datos, URLs ni secretos de producción en fixtures, coverage o Compose smoke.

```bash
pnpm --dir backend build
pnpm --dir backend db:predeploy
pnpm --dir backend start
```

## Bootstrap demo

`DEMO_DATA_ENABLED=true` habilita la carga; ausente/false no exige secretos demo.
Inyectar `DEMO_OPERATOR_REF` técnico y diez secretos iniciales mediante entorno seguro:
`DEMO_{UC,UTFSM}_{SUPERADMIN,ADMIN,TEACHER,ASSISTANT,STUDENT}_PASSWORD` (8–30 caracteres Unicode).
No poner secretos en argumentos, logs, commits o artifacts.
Dos instituciones, diez identidades y diez memberships nuevas sobre una base vacía.
Solo superadmins nuevos reciben ambos flags; etiquetas teacher/assistant/student no crean matrículas.
Un marcador/fingerprint, lock advisory y una transacción cubren ambos tenants.
Replay valida IDs/email/vínculos; conserva hashes, estados, privilegios revocados e historial.
Sin marcador, colisiones de identidades no se adoptan ni promueven silenciosamente.
Legacy UC/UTFSM requiere `DEMO_ADOPT_LEGACY=true`, nombre y cuenta legacy reconocidos, sin administración previa.
Instituciones legacy inactivas permanecen inactivas; cuentas antiguas no se convierten en superadmins.
Deshabilitar demo después del bootstrap es válido. Replay no recupera cuentas eliminadas ni permisos.

## Entrega pendiente: T042

Operador, en ventana controlada y con CI aprobado:

1. Revisar imagen completa: RLS + contextos + rutas + contrato deben desplegarse juntos.
2. Confirmar Root Directory backend y Dockerfile; comando efectivo `node dist/commands/serve.js`
   (predeploy en cada arranque, plan free), healthcheck `/ready`, buildFilter `backend/**`.
   Revisar settings efectivos del servicio: modificar render.yaml en Git no acredita read-back.
3. Inyectar ambas URLs, secreto JWT vigente y configuración demo; comprobar rol runtime nuevo sin LOGIN previo.
   Primera provisión habilita LOGIN/password; siguientes verifican conexión, nunca rotan.
4. Configurar `CORS_ALLOWED_ORIGINS` como array JSON de ambos orígenes frontend HTTPS exactos.
   No mezclar localhost ni wildcard en producción.
5. Añadir `api.dvillasc.me` al backend con target port 3001; registrar los CNAME/TXT entregados
   por Render en DNS y esperar TLS válido. Los dos hosts academix pertenecen al frontend.
6. Ejecutar despliegue controlado. Predeploy: config → esquema → provisión → demo opt-in → validación runtime.
7. Registrar commit/APP_VERSION, estado predeploy, settings efectivos sin secretos, DNS/TLS y `/ready`.
   Este documento no acredita ninguno de esos pasos remotos.

## Verificación pendiente: T044

Inyectar passwords vigentes del operador en el proceso local de smoke, nunca en artifacts.

```bash
node scripts/postdeploy-demo.mjs
```

Comprueba salud/commit/versión/readiness, login/me de superadmins UC/UTFSM, acceso cruzado rechazado,
preflight de ambos frontend y origen negativo. No escribe datos por defecto.
`SMOKE_API_URL` permite entorno local/staging; por defecto usa API central HTTPS.

```bash
node scripts/postdeploy-demo.mjs --workflow
```

Workflow crea cursos, matrículas, material, quizzes, intentos y publicaciones: produce auditoría real.
Espera 62 segundos entre instituciones para respetar la cuota vigente de cinco logins/minuto.
Requiere las diez cuentas activas y admin ya delegado; falla si sus permisos fueron revocados.
Solo `SMOKE_DELEGATE_ADMIN=true` autoriza explícitamente conceder ese flag al futuro admin.
No cambia credenciales ni concede isSuperAdmin. Mantener IDs/tokens en memoria y salida sanitizada.
Registrar salida con versión/commit, ambos tenants y workflow; no confundir evidencia local con HTTPS público.

## Rollback y deuda

Corregir hacia delante. No volver a imagen antigua que usa owner/pool global o rutas plurales.
Down de las nuevas migraciones se restringe a bases `_test`; no es rollback de producción.
Mantener grants y triggers: UPDATE(id) solo habilita FOR SHARE; triggers rechazan cambios de identidad.
No hay endpoints de altas generales, invitaciones ni recuperación de superadmin por HTTP.
Esas capacidades necesitan otra misión con autorización, vinculación y auditoría explícitas.
