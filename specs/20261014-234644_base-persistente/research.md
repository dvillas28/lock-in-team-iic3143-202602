# Research: Base persistente

Fecha: 2026-10-15. Estado: decisiones resueltas para esta misión.
Investigación separada de persistencia y seed; resultados consolidados aquí.

## Acceso a datos y migraciones

**Decisión**: pg 8.23.1 + node-pg-migrate 9.0.0, SQL explícito y PostgreSQL 17.
**Razón**: tres tablas iniciales; acceso directo a constraints compuestas futuras,
sin generar otro modelo de dominio. Un Pool HTTP y Client por CLI, consultas parametrizadas
y mismo cliente durante cada transacción, cerrado/liberado en finally según Client/Pool.
**Alternativas**: Prisma/TypeORM agregan capa/modelos innecesarios ahora; un
migrador propio obligaría a implementar historia, exclusión mutua y recuperación.

Fuentes: [pg](https://node-postgres.com/),
[transacciones](https://node-postgres.com/features/transactions),
[runner v9](https://raw.githubusercontent.com/salsita/node-pg-migrate/v9.0.0/docs/src/api.md).
El runner fija dirección up, singleTransaction=true, checkOrder=true,
noLock=false y migrationsTable=pgmigrations; usa el bloqueo del migrador.
La documentación web anuncia también versiones preliminares: usar la referencia
etiquetada v9 para esta implementación, no flags de versiones alpha.
Las versiones publicadas se contrastaron con el registro oficial:
[pg](https://registry.npmjs.org/pg/latest),
[migrador](https://registry.npmjs.org/node-pg-migrate/latest).

## Credenciales sin login anticipado

**Decisión**: argon2 0.45.1, variante Argon2id, salida PHC completa, sal aleatoria
de al menos 16 bytes, memoryCost=19456 KiB, timeCost=2 y parallelism=1.
Respetar longitud 8–30 del modelo y no truncar el hash de máximo 255.
**Razón**: el modelo ya requiere Argon2id; hash y verify se reutilizan en identidad.
**Alternativas**: node:crypto exige mantener formato/verificación PHC propios;
bcrypt cambiaría la decisión de datos existente. No crear auth ni API de hashing.

La biblioteca ofrece binarios Alpine; probar hash/verify en la imagen final
antes de aceptar compatibilidad. No agregar compiladores a runtime.
Fuentes: [node-argon2](https://github.com/ranisalt/node-argon2),
[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[versión publicada](https://registry.npmjs.org/argon2/latest).

## Seed y claves demo

**Decisión**: CLI opt-in de operador, UUID de usuarios versionados, institutions
resueltas por slug, memberships por pareja institución/persona.
**Razón**: email no tiene unicidad global acordada; no usarlo como clave de upsert.
Un Client con transacción y advisory lock coordina los seed concurrentes. Verificar
colisiones antes de insertar y no modificar filas existentes ni reactivar estados.
**Alternativas**: seeds en migraciones mezclan estructura/datos; upsert con UPDATE
podría reemplazar credenciales o revocaciones. No usar roles académicos todavía.

Fuentes: [constraints PostgreSQL 17](https://www.postgresql.org/docs/17/ddl-constraints.html),
[locks transaccionales](https://www.postgresql.org/docs/17/explicit-locking.html),
[INSERT](https://www.postgresql.org/docs/17/sql-insert.html).

## Arranque, readiness y empaquetado

**Decisión**: conservar GET /health como liveness; agregar GET /ready con 200/503.
Al arrancar, validar conexión y columnas/constraints de la base mínima antes de
escuchar; no migrar desde un hook de Nest.
Fijar sslmode explícito en la URL entregada a pg evita heredar la política TLS
de PGSSLMODE; rechazar no-verify y NODE_TLS_REJECT_UNAUTHORIZED=0.
Compose secuencia migración → seed opt-in → proceso HTTP.
Railway ejecuta migración en pre-deploy; seed se ejecuta por operador.
**Razón**: preparar estructura no depende de iniciar tráfico y fallos de DB no
se confunden con un proceso vivo. No cambiar consumidores frontend de /health.
**Alternativas**: hacer /health dependiente de DB altera semántica existente;
ejecutar migraciones sin exclusión desde cada réplica permite carreras.

El runner final elimina npm/pnpm: copiar SQL a /app/migrations y usar comandos
node compilados; pg, migrador y argon2 deben ser dependencias productivas.
Fuentes: [pre-deploy Railway](https://docs.railway.com/deployments/pre-deploy-command),
[healthchecks](https://docs.railway.com/deployments/healthchecks).

## Operación y recuperación

**Decisión**: cambios aditivos compatibles con versión anterior; rollback de app
no ejecuta down ni elimina tablas. Ensayar dump/restore completo en DB separada.
**Razón**: las tres tablas y credenciales son datos durables; un down inicial
sería destructivo. No hay restore individual por institución.
**Alternativas**: no introducir infraestructura de backup propia sin necesidad.

Railway documenta snapshots y PITR, pero habilitación, compatibilidad y retención
deben verificarse en el entorno real. La spec no declara recuperación aprobada
sin evidencia; configurar lo disponible y registrar cualquier brecha RNF5.
Fuentes: [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html),
[PITR Railway](https://docs.railway.com/volumes/point-in-time-recovery),
[recuperación Railway](https://docs.railway.com/guides/postgres-backups-restores).

## Límites resueltos

- Revocación se persiste sin reactivarse: enforcement HTTP se verifica en identidad.
- Concurrencia aquí significa migraciones/seed; no intentos ni notas.
- AuditEvent necesita curso; seed deja log operativo, no auditoría ficticia.
- Datos demo no implican docente/estudiante: Enrollment corresponde a cursos-roles.
- El plan usa cinco usuarios/seis memberships; detalle en el contrato demo.
