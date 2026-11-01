# Respaldo, alternativas y errores de la seed en Render

Procedimiento principal: [ejecutar y guardar la seed](DEMO_SEED_RENDER.md).
Los ejemplos son para terminal bash/zsh en macOS o Linux; no contienen secretos reales.

## Respaldo previo en Render Free

Render Free requiere un respaldo propio ([documentación oficial](https://render.com/docs/postgresql-backups)).
Necesitas herramientas cliente PostgreSQL **17**, incluyendo `pg_dump` y `pg_restore`.
En macOS con Homebrew: `brew install postgresql@17`; luego
`export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"` en Apple Silicon, o
`export PATH="/usr/local/opt/postgresql@17/bin:$PATH"` en Intel. Comprobar:

```bash
pg_dump --version
pg_restore --version
```

Ambos deben ser versión 17. En la misma terminal del procedimiento principal:

```bash
umask 077
nano "$HOME/.academix-demo/pg_service.conf"
```

Pegar y completar con el mismo destino de `seed.env`; guardar con Ctrl+O, Enter, Ctrl+X:

```ini
[academix-demo]
host=<hostname externo de Render>
port=5432
dbname=<nombre de la base>
user=<usuario propietario>
sslmode=verify-full
sslrootcert=system
```

El almacén de certificados del sistema se usa según [libpq 17](https://www.postgresql.org/docs/17/libpq-connect.html#LIBPQ-CONNECT-SSLROOTCERT).

Crear el archivo de contraseña con `nano "$HOME/.academix-demo/pgpass"`.
Escribir una sola línea, sustituyendo los cinco campos por los datos reales:

```text
HOST_EXTERNO:5432:NOMBRE_DB:USUARIO_PROPIETARIO:CONTRASEÑA_POSTGRES
```

Es la contraseña de **PostgreSQL**, no una contraseña de cuenta AcademiX. En este archivo,
escapar `:` como `\:` y `\` como `\\` si aparecen dentro de la contraseña.
Guardar, salir y ejecutar:

```bash
chmod 600 "$HOME/.academix-demo/pg_service.conf" "$HOME/.academix-demo/pgpass"
demo_backup_file=$(mktemp "$HOME/.academix-demo/before-demo.dump.XXXXXX")
PGSERVICEFILE="$HOME/.academix-demo/pg_service.conf" PGPASSFILE="$HOME/.academix-demo/pgpass" pg_dump --dbname=service=academix-demo --format=custom --no-owner --file="$demo_backup_file"
pg_restore --list "$demo_backup_file" > "$demo_backup_file.contents"
ls -lh "$demo_backup_file"
```

Los comandos deben terminar con código 0 y el dump debe tener contenido. La lista verifica
que el archivo se puede leer; **no sustituye una prueba de restauración**. El responsable
operativo debe confirmar que el respaldo permite recuperar en una base nueva aislada.
El nombre aleatorio evita sobrescribir respaldos anteriores; registrar la ruta mostrada.
El dump contiene datos y hashes: conservarlo privadamente, fuera de Git.
Al terminar, eliminar los archivos de secretos `seed.env`, `pgpass` y `pg_service.conf`:

```bash
rm -i "$HOME/.academix-demo/seed.env" "$HOME/.academix-demo/pgpass" "$HOME/.academix-demo/pg_service.conf"
```

Conservar el dump en el lugar privado acordado. Volver al paso 6 del procedimiento principal.

## Alternativa Docker desde el computador del operador

Mismo commit que el backend desplegado. Usar el `seed.env` del procedimiento principal.
Desde la raíz, reemplazar instalación/compilación Node por:

```bash
docker build -t academix-demo-seed ./backend
docker run --rm --env-file "$HOME/.academix-demo/seed.env" academix-demo-seed node dist/seeds/presentation.js check
docker run --rm --env-file "$HOME/.academix-demo/seed.env" academix-demo-seed node dist/seeds/presentation.js preview
```

Después de confirmar el respaldo, ejecutar y verificar:

```bash
docker run --rm --env-file "$HOME/.academix-demo/seed.env" -e DEMO_SEED_ALLOW_PRODUCTION=academix-presentation-v1 academix-demo-seed node dist/seeds/presentation.js apply
docker run --rm --env-file "$HOME/.academix-demo/seed.env" academix-demo-seed node dist/seeds/presentation.js verify
```

No arranca el servidor: ejecuta el script de la imagen contra el PostgreSQL remoto.

## Alternativas con compute de pago en Render

Free no ofrece Shell/SSH/jobs. Si el equipo cambia a un plan compatible de pago:

- Shell del backend en `/app`: configurar las cuatro variables del procedimiento, con
  la URL **interna** del propietario y hostname interno esperado. Ejecutar
  `node dist/seeds/presentation.js check` y `node dist/seeds/presentation.js preview`.
  Después del respaldo: `DEMO_SEED_ALLOW_PRODUCTION=academix-presentation-v1 node dist/seeds/presentation.js apply`;
  al terminar: `node dist/seeds/presentation.js verify`. La imagen no incluye pnpm/npm.
- CLI: `render login`, luego `render ssh academix-backend --ephemeral`; ejecutar los mismos
  comandos dentro de `/app`. Es un entorno aislado con facturación por duración
  ([Shell/planes oficiales](https://render.com/docs/ssh)).
- One-off jobs usan la imagen desplegada y las variables del servicio; son de pago
  ([documentación](https://render.com/docs/one-off-jobs)). Con el ID real del backend en
  `RENDER_BACKEND_SERVICE_ID`, ejecutar un job por fase; ejemplo de apply:

```bash
render jobs create "$RENDER_BACKEND_SERVICE_ID" --start-command 'DEMO_SEED_ALLOW_PRODUCTION=academix-presentation-v1 node dist/seeds/presentation.js apply'
```

Antes, crear jobs con `check`/`preview`; después, uno con `verify`. Revisar estados/logs
en **One-off Jobs** ([opciones CLI](https://render.com/docs/cli-reference#jobs)).
No convertir la seed en comando de build, predeploy o arranque.

## Errores y recuperación

| Diagnóstico | Acción antes de repetir |
| --- | --- |
| `config` / expected host/database | Revisar las cuatro líneas de `seed.env`, URL/TLS y valores del dashboard |
| `explicit_production_opt_in_required` | Usar el comando completo del paso 6, con su prefijo de habilitación |
| `migration_operator_required` | Usar el propietario de migraciones, no `academix_runtime` |
| `schema` / `pending_migrations` / archivos ausentes | Revisar SHA, build y carpeta migrations; corregir el despliegue y su predeploy |
| `connection` | Revisar IP autorizada, disponibilidad de DB, credenciales PostgreSQL y certificado TLS |
| `account_missing_or_inactive` | Revisar el tenant/rol indicado; no duplicar cuentas ni resetear claves |
| `membership_missing_or_inactive` | El equipo debe revisar esa membresía; la seed no la crea ni reactiva |
| `required_permission_missing` | Admin requiere `is_admin`; Superadmin requiere `is_super_admin` |
| `lock` | Esperar que termine la operación concurrente y repetir check |
| `unowned_*` / `conflict` | Revisar ID/código/email ocupado, sin borrar datos ni marcadores para forzar la carga |
| `managed_records_missing` / `managed_ownership_changed` / `ledger_*` | Detenerse y revisar el historial operativo y la versión aplicada |
| `seed_not_applied` al verificar | No existe un commit de esta seed; revisar la ejecución de apply |

Si el bootstrap histórico dejó Admin sin `is_admin`, un Superadmin autorizado debe
concederlo mediante `PUT /api/v1/institution/{slug}/memberships/{membershipId}/course-admin`,
cuerpo `{"isAdmin":true}`. Esta autorización es externa a la seed; no exige cambiar hashes.
No hay pantalla específica de memberships: [alcance por rol](DEMO_GUIDE.md).

Fallo antes de escribir: sin cambios. Fallo dentro de la transacción: rollback de ambos
tenants. Si se pierde conexión durante commit, ejecutar `verify`; el ledger se confirma
junto a los datos. No hay escrituras externas, correos ni archivos subidos que recuperar.
`changedRecords` informa ediciones conservadas; no las restaura.

Recuperación excepcional: restaurar dump/PITR en una **base nueva**, validar y cambiar
conexiones mediante el proceso del equipo. Nunca restaurar encima ni limpiar producción
automáticamente. En Postgres de pago, Recovery permite export/PITR según el plan.
