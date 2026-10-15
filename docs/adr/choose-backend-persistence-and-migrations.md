# Persistencia backend con pg y node-pg-migrate

Fecha: 2026-10-15.

## Estado

Aceptado e implementado para US1/US2 de base-persistente; cierre operativo pendiente.

## Contexto

AcademiX ya usa NestJS/TypeScript, Node 24 y PostgreSQL 17 local.
El modelo exige constraints compuestas institution-aware, transacciones e
historial de migraciones. La primera misión solo agrega tres tablas.
La imagen productiva elimina gestores de paquetes y conserva dist/node_modules.

## Decisión

- pg 8.23.1 con Pool HTTP y Client por CLI; SQL explícito parametrizado.
- node-pg-migrate 9.0.0 con SQL versionado, bloqueo y transacción del lote.
- Comandos compilados ejecutables con node; SQL copiado en imagen final.
- Migración separada de seed; Railway usa pre-deploy y Compose secuencia
  preparación antes de iniciar HTTP.
- Seed demo opt-in y transaccional, sin modificar credenciales/estados previos.
  Dataset y ejecución viven en seed.ts; no hay una capa seed adicional.
- Migraciones de datos se reservan para cambios requeridos por toda instalación;
  la demo opcional con contraseñas del entorno no pertenece al historial de esquema.
- argon2 0.45.1 para PHC Argon2id requerido por el modelo; no implementar formato
  de contraseña propio ni anticipar autenticación.
- Mantener /health y agregar /ready para disponibilidad de persistencia.
- Fijar TLS desde la URL y rechazar overrides inseguros del entorno; assertions sin secretos.
- Evolución aditiva y rollback de aplicación; no down destructivo sobre datos.

No agregar ORM, repositorio genérico, servicios adicionales ni tablas futuras.

## Alternativas consideradas

Prisma y TypeORM agregan un segundo modelo/capa que tres tablas no necesitan.
SQL directo con migrador propio traslada al equipo bloqueo, historia y recuperación.
Argon2 nativo exige encoding/verificación propios; bcrypt cambia el modelo vigente.
Migrar o sembrar sin separación desde hooks HTTP mezcla operación y tráfico.

## Consecuencias

El equipo escribe SQL y mantiene sus tipos/test de integración.
Las reglas de scope no las impone un ORM: cada operación académica futura debe
incluir institution_id, membership y rol, junto a constraints de base.
La imagen debe incluir migrador y binarios Argon2 compatibles con Alpine.
Una dependencia menor no elimina la obligación de verificar sus actualizaciones.

No se cambia el [ADR multi-tenant](adopt-shared-postgresql-multitenancy.md).
[Investigación y fuentes](../../specs/20261014-234644_base-persistente/research.md)
justifican versiones, transacciones y operación.
