# Ejecutar la seed y guardar los datos en PostgreSQL de Render

**Dónde:** todos los comandos de esta guía se ejecutan en una terminal de tu computador,
**desde la raíz de este repositorio**. No se ejecutan en el frontend ni dentro de PostgreSQL.
El backend usa Render Free, sin Shell/SSH/jobs; por eso se conecta desde tu computador
([limitaciones oficiales](https://render.com/docs/free)). Los datos se guardan en la base
remota indicada en `MIGRATION_DATABASE_URL`, aunque el comando se ejecute localmente.
Esta guía no acredita una ejecución en producción.

## 1. Confirmar que el código correcto está desplegado

1. Entrar a [Render](https://dashboard.render.com) → servicio **academix-backend**.
2. El equipo debe haber revisado, integrado y desplegado este cambio. En **Events**, el
   último deploy debe estar **Live** y contener `backend/src/seeds/presentation.ts`.
3. Abrir una terminal en el repositorio y ejecutar:

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
node --version
pnpm --version
```

La raíz debe ser este repositorio y el SHA debe coincidir con el deploy que se quiere
usar. Se requieren Node **24** y pnpm **9.15.9**. Si no coinciden, detenerse y corregirlo.
En Render, `/ready` debe responder 200; predeploy ya debe haber aplicado las migraciones.
Mantener `DEMO_DATA_ENABLED=false`; esta seed no utiliza el bootstrap anterior.

## 2. Obtener la conexión a la base correcta

1. En Render, abrir **academix-db** → **Connect** → **External Database URL**.
2. Copiar la conexión del **propietario**, no la de `academix_runtime`.
3. Confirmar por separado el **hostname** y **Database** en la ficha de la base.
4. Autorizar temporalmente la IP de tu computador en la configuración de acceso externo.
   No abrir el acceso a todas las IPs.
5. La URL debe usar `sslmode=verify-full`. Si ya contiene otro `sslmode`, reemplazarlo;
   no agregar dos parámetros iguales. No desactivar TLS.

## 3. Preparar un archivo privado de configuración

Ejecutar esto una vez; el archivo queda fuera del repositorio:

```bash
umask 077
mkdir -p "$HOME/.academix-demo"
chmod 700 "$HOME/.academix-demo"
nano "$HOME/.academix-demo/seed.env"
```

En el editor, pegar estas **cuatro líneas** y reemplazar todos los marcadores `<...>`:

```dotenv
MIGRATION_DATABASE_URL=<External Database URL del propietario, con sslmode=verify-full>
DEMO_SEED_EXPECTED_HOST=<hostname confirmado en Render, sin protocolo ni puerto>
DEMO_SEED_EXPECTED_DATABASE=<nombre de la base confirmado en Render>
DEMO_OPERATOR_REF=equipo-presentacion-2026-10
```

En nano: **Ctrl+O**, Enter, **Ctrl+X** para guardar y salir. Después:

```bash
chmod 600 "$HOME/.academix-demo/seed.env"
```

No agregar contraseñas de las diez cuentas demo. La seed usa las cuentas existentes,
conserva sus credenciales y no necesita conocerlas. No compartir este archivo ni su URL.

## 4. Instalar, compilar y comprobar sin escribir datos

Desde la misma raíz del repositorio:

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend build
node --env-file="$HOME/.academix-demo/seed.env" backend/dist/seeds/presentation.js check
node --env-file="$HOME/.academix-demo/seed.env" backend/dist/seeds/presentation.js preview
```

**Antes de continuar:** ambos comandos deben terminar sin error. Revisar que
`target.database` y `target.operator` correspondan a la base y propietario de Render.
Primera ejecución: `outcome` es `ready`; el campo `inserts` describe las filas que se crearán.
Si ya se aplicó, `outcome` es `alreadyApplied` y se verifica lo existente.
Estos dos comandos usan transacciones de solo lectura: todavía no cargan datos.

Si falta una cuenta, membership, permiso o migración, **detenerse** y revisar el
[diagnóstico y solución](DEMO_SEED_RENDER_ALTERNATIVES.md#errores-y-recuperación).
En particular, Admin necesita `is_admin`; la seed nunca lo concede automáticamente.

## 5. Tener un respaldo antes de cargar

Render Postgres Free no tiene backups administrados. Seguir los comandos de
[respaldo previo](DEMO_SEED_RENDER_ALTERNATIVES.md#respaldo-previo-en-render-free)
y confirmar que se dispone de un respaldo válido de **esta misma base**.
No continuar con `apply` hasta completar este paso.

## 6. Ejecutar la carga: este comando guarda los datos

Con el respaldo confirmado, ejecutar **exactamente** desde la raíz:

```bash
DEMO_SEED_ALLOW_PRODUCTION=academix-presentation-v1 node --env-file="$HOME/.academix-demo/seed.env" backend/dist/seeds/presentation.js apply
```

Esperar a que termine. Éxito: `outcome: "applied"`, `verification.changedRecords: {}`
y código de salida 0. Comprobar el código inmediatamente después:

```bash
echo $?
```

El **0** confirma que terminó correctamente. El comando hace `COMMIT` en PostgreSQL:
los datos quedan guardados en Render. No hay que ejecutar otro comando para guardarlos.
Si devuelve `alreadyApplied`, la carga ya existía y se preservó; no se duplicó ni reinició.
La habilitación explícita solo dura ese comando. No ponerla en el arranque del backend.

## 7. Confirmar lo que quedó guardado

```bash
node --env-file="$HOME/.academix-demo/seed.env" backend/dist/seeds/presentation.js verify
```

Debe finalizar con código 0, `outcome: "alreadyApplied"` y estos conteos en `summary`:

| Campo | UC | UTFSM |
| --- | ---: | ---: |
| courses / sections | 3 / 4 | 3 / 4 |
| users ficticios / enrollments | 8 / 25 | 6 / 23 |
| course_modules / materials | 9 / 18 | 9 / 18 |
| quizzes / grade_items | 7 / 6 | 7 / 6 |
| quiz_attempts / grades | 16 / 14 | 12 / 10 |
| grade_publications | 1 | 1 |

Inicialmente `changedRecords` debe estar vacío. Después de cambios hechos en la demo,
puede informar diferencias: no las sobrescribe. Si `verify` falla, revisar el diagnóstico;
no borrar registros ni ejecutar una limpieza para forzar la carga.

## 8. Probar en la aplicación y cerrar la operación

Abrir [UC](https://uc.academix.dvillasc.me/login) y
[UTFSM](https://utfsm.academix.dvillasc.me/login); seguir [DEMO_GUIDE](DEMO_GUIDE.md),
que enumera las diez cuentas y los recorridos por rol. Sus claves las conserva el equipo.
Retirar la autorización temporal de IP y eliminar el archivo privado cuando termine
la operación; conservar el respaldo en almacenamiento privado del equipo.
Más opciones: [Docker, Render de pago y recuperación](DEMO_SEED_RENDER_ALTERNATIVES.md).
