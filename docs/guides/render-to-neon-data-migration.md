# Migrar los datos de Render Postgres a Neon

Procedimiento ensayado el 2026-11-04 en una base de ensayo de Neon (conteos, RLS y arranque verificados).
Decisión en el [ADR de Neon](../adr/neon-database.md). Requiere cliente PostgreSQL **17**
(`pg_dump`/`pg_restore`; con 16 falla con "unsupported version (1.16)"). Las claves se leen con
`read -rs` y `PGPASSWORD`; no van en el historial ni en el repo. El dump contiene datos y hashes: guardarlo fuera de Git y borrarlo al final.

Por qué no basta `pg_restore` completo:
- Las políticas `operator_maintenance` quedan en el dump con el nombre literal del owner de Render
  (`academix_owner`), que no existe en Neon. El esquema sale de las migraciones, el dump aporta solo datos.
- `FORCE ROW LEVEL SECURITY` impide que el owner sin superusuario lea `audit_events` con `pg_dump`.
- `pg_dump` no ordena los datos por claves foráneas, y varios triggers de usuario validan inserciones.

## Variables

```bash
export PATH=/usr/lib/postgresql/17/bin:$PATH   # si hay varias versiones instaladas
CONN="host=<host-externo-render> port=5432 dbname=<db real> user=academix_owner sslmode=verify-full sslrootcert=system"
NEON="host=<host-directo-neon> port=5432 dbname=<academix o base de ensayo> user=neondb_owner sslmode=verify-full sslrootcert=system"
```

## 1. Dump de Render (sin tráfico de escritura)

Quitar `FORCE` solo afecta al owner: el rol `academix_runtime` sigue sujeto a RLS. Devolverlo siempre.

```bash
read -rs -p "Clave Render: " PGPASSWORD; export PGPASSWORD; echo
psql "$CONN" -Atc "SELECT format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY;', n.nspname, c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND c.relforcerowsecurity AND n.nspname='public'" > /tmp/no_force.sql
sed 's/ NO FORCE/ FORCE/' /tmp/no_force.sql > /tmp/force.sql
psql "$CONN" -v ON_ERROR_STOP=1 -f /tmp/no_force.sql
pg_dump "$CONN" --format=custom --no-owner --no-privileges --file="$HOME/academix-render.dump"; rc=$?
psql "$CONN" -v ON_ERROR_STOP=1 -f /tmp/force.sql
echo "dump exit=$rc"; unset PGPASSWORD; rm -f /tmp/*force.sql
```

## 2. Esquema en Neon desde las migraciones

La base debe estar vacía (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;` en una de ensayo).

```bash
cd backend && pnpm build
MIGRATION_DATABASE_URL='postgresql://neondb_owner:<clave>@<host-directo>/<db>?sslmode=verify-full' \
DATABASE_URL='postgresql://academix_runtime:<clave hex>@<host-directo>/<db>?sslmode=verify-full' \
AUTH_JWT_SECRET=x node dist/commands/predeploy.js   # {"operation":"predeploy","outcome":"ok"}
```

## 3. Cargar solo datos, en orden de claves foráneas

```bash
read -rs -p "Clave Neon: " PGPASSWORD; export PGPASSWORD; echo
pg_restore --list "$HOME/academix-render.dump" | grep -v pgmigrations > /tmp/restore.list
python3 scripts/order-restore-list.py /tmp/restore.list /tmp/restore.ordered.list "$NEON"
psql "$NEON" -Atc "SELECT format('ALTER TABLE %I.%I DISABLE TRIGGER USER;', n.nspname, c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal)" > /tmp/trg_off.sql
sed 's/ DISABLE / ENABLE /' /tmp/trg_off.sql > /tmp/trg_on.sql
psql "$NEON" -v ON_ERROR_STOP=1 -f /tmp/trg_off.sql
pg_restore --data-only --no-owner --no-privileges --single-transaction --exit-on-error \
  --use-list=/tmp/restore.ordered.list --dbname="$NEON" "$HOME/academix-render.dump"; rc=$?
psql "$NEON" -v ON_ERROR_STOP=1 -f /tmp/trg_on.sql
echo "restore exit=$rc"
```

`pgmigrations` se excluye porque las migraciones ya la llenaron. Regenerar `trg_off.sql` en cada corte.
`DISABLE TRIGGER USER` no requiere superusuario; `--disable-triggers` de `pg_restore` sí.

## 4. Verificar

- `restore exit=0` y triggers sin desactivar: `SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgenabled <> 'O'` da `0`.
- Conteos por tabla iguales en Render y Neon (excepto `pgmigrations`). Las tablas con `FORCE` ocultan filas al
  owner de Render: volver a leer con `NO FORCE` como en el paso 1, o comparar con el dump.
- `relforcerowsecurity` y las políticas coinciden con un esquema recién migrado; `operator_maintenance` va `TO neondb_owner`.
- El backend arranca contra esa base (predeploy `ok`, `/ready` 200) y un usuario real inicia sesión.

Luego seguir el [plan de corte](../adr/neon-database.md#plan-de-corte).
