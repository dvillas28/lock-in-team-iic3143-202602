# ADR: PostgreSQL en Neon en lugar de Render Postgres

Fecha: 2026-11-04. Estado: propuesta; migración de datos y cambio de variables pendientes del operador.
Reemplaza solo la parte de base de datos de [Desplegar en Render](deploy-on-render.md).

## Contexto

La base free de Render expira 30 días tras crearse (2026-11-21), con 14 días de gracia y sin
respaldos. El backend y el frontend siguen en Render; solo cambia dónde vive Postgres.

## Decisión

- La base pasa a un proyecto Neon (free). Backend y frontend no cambian de plataforma.
- Se usa el endpoint **directo**, no el `-pooler` (PgBouncer): pools, migraciones y seeds envían
  `options=-c lock_timeout… -c search_path=public` al conectar, y PgBouncer rechaza ese parámetro.
  `connectionConfig` rechaza hosts `-pooler` con `category: config` para fallar con claridad.
- URLs con `?sslmode=verify-full&channel_binding=require`. La política de TLS no se relaja:
  `channel_binding=require` se acepta (solo refuerza SCRAM) y cualquier otro valor se rechaza.
  El host `dpg-<id>-a` sin TLS deja de aceptarse: Render ya no aloja la base.
- `MIGRATION_DATABASE_URL` (owner de Neon) y `DATABASE_URL` (`academix_runtime`) se ingresan a mano
  en el servicio `academix-backend`; ambas con el mismo host directo y la misma base.
- `render.yaml` ya no declara `databases:`.

## Consecuencias

- Tenant y roles no cambian: RLS, `academix_runtime` sin bypass y retiro de secretos en `start.js`.
  El owner de Neon tampoco es superusuario, igual que el de Render (cubierto por `operator_maintenance`).
- Tráfico a Postgres sale a internet con TLS verificado; más latencia que la red interna de Render.
- Neon suspende el cómputo tras inactividad; el primer query tras el reposo tarda más. Se suma al
  arranque en frío del backend free.
- Sin expiración a 30 días. Revisar en el panel de Neon cuota de cómputo, tamaño y ventana de restauración.
- Seeds: `DEMO_SEED_EXPECTED_HOST` es el host directo completo de Neon y
  `DEMO_SEED_EXPECTED_DATABASE` el nombre real de la base ([guía](../DEMO_SEED_RENDER.md)).

## Plan de corte

1. Crear proyecto/base en Neon y copiar la URL directa del owner.
2. Si los datos importan, migrarlos con la [guía](../guides/render-to-neon-data-migration.md):
   esquema por migraciones y solo datos desde el dump. Si no, predeploy aplica el esquema y el seed repuebla.
3. En Render, editar `MIGRATION_DATABASE_URL` y `DATABASE_URL` y redesplegar el backend.
   Buscar `{"operation":"predeploy","outcome":"ok"}` en los logs.
4. Verificar `/ready`, iniciar sesión y, solo después, borrar `academix-db` en Render.
   Rollback: restaurar las variables anteriores mientras la base de Render exista.
