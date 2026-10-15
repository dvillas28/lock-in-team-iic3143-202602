# Contract: Operación de persistencia

Estado: contrato a implementar, no comandos ya disponibles.
Operador autorizado mediante acceso al entorno/CLI; ninguna ruta pública da DDL,
bootstrap o modificación de instituciones/usuarios/memberships.

## Comandos

| Propósito | Desarrollo, desde raíz | Imagen final, en /app |
| --- | --- | --- |
| Migrar | pnpm --dir backend db:migrate | node dist/platform/database/migrate.js |
| Demo | pnpm --dir backend db:bootstrap | node dist/platform/database/bootstrap.js |
| Integración | pnpm --dir backend test:integration | CI, fuera del runner productivo |

Los scripts db:* ejecutan programas compilados; ejecutar pnpm --dir backend build
primero. El runner de migración resuelve /app/migrations desde su ubicación,
sin depender del cwd. SQL viaja en imagen y migrador es dependencia productiva.
No ofrecer comando down productivo ni crear migrador alternativo.

## Variables y validación

| Variable | Contrato |
| --- | --- |
| DATABASE_URL | Obligatoria para app/migración/bootstrap; URL PostgreSQL válida |
| DEMO_BOOTSTRAP_ENABLED | Ausente/false: bootstrap omitido; true: habilitado; otro valor: error |
| DEMO_UC_PASSWORD | Obligatoria solo con demo habilitada |
| DEMO_UTFSM_PASSWORD | Igual |
| DEMO_MULTI_PASSWORD | Igual |
| DEMO_REVOKED_PASSWORD | Igual |
| DEMO_INACTIVE_PASSWORD | Igual |
| TEST_DATABASE_URL | Obligatoria únicamente para integración; DB dedicada terminada en _test |

No hay default de contraseña demo. Conservar secretos en .env no versionado o
variables del entorno Railway. .env.example contiene claves vacías y demo false.
Validar las cinco contraseñas, incluso al repetir; longitudes 8–30 antes de
conectar/escribir. No recibirlas por flags, URLs impresas o archivos versionados.

Producción usa conexión privada PostgreSQL. Si se usa transporte público, exigir
TLS con CA válida; nunca resolver certificados inválidos desactivando validación.
Parsear configuración sin imprimir DATABASE_URL, password_hash o entrada secreta.

## Migración

Usar runner node-pg-migrate 9 con schema public, tabla pgmigrations,
singleTransaction=true, checkOrder=true, noLock=false y dirección up.
No modificar migraciones ya aplicadas. Si otro migrador tiene lock, fallar;
el operador reintenta después de terminar el primero, sin deshabilitar el lock.
Configurar conexión 5 s, lock_timeout 10 s y statement_timeout 30 s por conexión
de migración: evitar esperas ilimitadas; todo error devuelve salida no cero.
Una migración fallida revierte DDL e historia del lote pendiente.

## Bootstrap

Ver [dataset y algoritmo](demo-dataset.md).
Requiere migración aplicada; nunca crea tablas ni llama al migrador.
Transacción sobre un solo cliente, advisory lock fijo exclusivo de demo,
lock_timeout 10 s, statement_timeout 15 s y liberación/cierre siempre.
La exclusión coordina otras ejecuciones bootstrap; constraints protegen clientes
que no participan del lock. Una colisión detectada revierte todos los inserts.

## Salida y errores

- Exit 0: migración aplicada/sin pendientes, demo creada/sin cambios u omitida.
- Exit 1: entrada inválida, conexión, esquema, lock, colisión o escritura fallida.
- Resumen estructurado: operation, outcome, cantidades creadas/existentes y duración.
- Error sanitizado: operation y categoría estable config/connection/schema/lock/conflict.
- Nunca SQL con valores, entorno, emails, credenciales, hash o cadena de conexión.

## Arranque e integración

Nest valida DB y estructura mínima antes de escuchar: tablas/columnas y claves
de la migración inicial disponibles, permitiendo migraciones aditivas posteriores.
Error de arranque: cerrar Pool y salir no cero en ≤30 s, sin escuchar HTTP.
Registrar error sanitizado y escuchar errores asíncronos del Pool.
En SIGTERM/SIGINT, cerrar Pool mediante lifecycle hooks y enableShutdownHooks.

Compose ejecuta migración → bootstrap → exec HTTP; el bootstrap false es no-op.
Si algún comando falla, HTTP no inicia. Compose espera postgres healthy y sondea
/ready del backend antes de iniciar frontend; las variables demo pasan explícitas.
Railway: pre-deploy=node dist/platform/database/migrate.js; CMD inicia solo HTTP.
Cambiar healthcheckPath de Railway a /ready y conservar PORT/timeout existentes.
Bootstrap Railway es acción explícita de operador con la misma imagen/entorno;
no se ejecuta en cada deploy ni se supone que pnpm está instalado.

## Recuperación

Migraciones aditivas permiten rollback de aplicación sin revertir esquema.
Ensayar pg_dump -Fc y pg_restore --no-owner --no-acl sobre la base compartida
completa en destino vacío separado, con clientes PostgreSQL 17 y secretos fuera
de argumentos/logs. Dumps protegidos contienen hashes: nunca versionarlos.
Comparar identidades/cantidades/constraints y probar readiness antes de cutover.
No restaurar encima de la fuente ni usar down como estrategia de recuperación.
Verificar snapshots/PITR/retención del entorno real; registrar RPO/RTO medidos y
brechas, no declarar capacidad habilitada solo porque Railway la documenta.

