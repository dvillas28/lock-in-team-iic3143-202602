# Implementation Plan: Base persistente y datos demo

**Branch**: `feat/base-persistente` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)
**Status**: US1/US2 implementadas; T025–T030 pendientes. [Evidencia local](../../docs/backend/base-persistente-validation.md).

## Summary

Incorporar una PostgreSQL compartida al backend existente. Persistir Institution,
User global y Membership; migrar estructura separadamente del seed demo.
Elegir SQL parametrizado con pg y migraciones node-pg-migrate, sin ORM.
US1 entrega arranque verificable y datos durables; US2 agrega demo repetible sobre
esa base, comprobable con fixtures sin depender de autenticación todavía.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, NestJS 12.1.0 existentes |
| Dependencias nuevas | pg 8.23.1, node-pg-migrate 9.0.0, argon2 0.45.1; @types/pg en desarrollo |
| Persistencia | PostgreSQL 17, schema public; una URL; Pool HTTP y Client por CLI |
| Migraciones | SQL versionado, runner compilado, historia pgmigrations |
| Pruebas | node:test y assert existentes; integración real contra PostgreSQL 17 |
| Plataforma | Docker Compose y Railway con la imagen Node 24 Alpine existente |
| Tipo de proyecto | Monolito modular NestJS + frontend Next.js existente |
| Objetivos | Arranque sin DB falla en ≤30 s; /ready responde en ≤5 s incluso con fallo |
| Alcance medible | 3 tablas de dominio; demo vacía: 2 instituciones, 5 usuarios, 6 memberships |
| Límites | Sin login, endpoints académicos, RLS, storage ni tablas futuras |

Versiones y lockfile fijados para US1/US2; no se agregan proveedores ni ORM.
Un Pool con máximo 5 conexiones, conexión/cola 2 s, consultas 2 s y cierre en shutdown.
Readiness usa presupuesto menor: conexión/cola 2 s y consulta 2 s, total ≤5 s.
No usar credenciales o identidades recibidas desde HTTP para ejecutar seed.
La URL fija la política TLS efectiva; rechazar overrides que desactiven validación.
Probar entradas inválidas con URL válida y cero conexiones; assertions sin valores sensibles.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS para esta misión.

| Gate | Evidencia de diseño |
| --- | --- |
| Aislamiento | Membership tiene institution_id; claves/FK y consultas explícitas; User global |
| Permisos | Solo operador ejecuta CLI; ninguna ruta permite alta o cambios de roles |
| Integridad/historia | Transacciones, no borrados/cascadas; seed conserva existentes |
| Auditoría | Log operativo sanitizado; sin inventar AuditEvent que requiere Course |
| Entregabilidad | US1 base vacía durable; US2 seed sobre esa base |
| Complejidad | Reusar Nest, node:test y Compose; sin ORM/repositorio genérico |
| Documentación | Archivos <150 líneas y referencias por responsabilidad |
| Aclaraciones | Sin bloqueos propios; admin docente es dependencia de misiones posteriores |

## Project Structure

### Documentation (this feature)

- [research.md](research.md): decisiones y fuentes verificadas.
- [data-model.md](data-model.md): tablas, constraints y estados.
- [contracts/operations.md](contracts/operations.md): comandos, entorno y errores.
- [contracts/demo-dataset.md](contracts/demo-dataset.md): identidades demo y algoritmo.
- [contracts/readiness.openapi.yaml](contracts/readiness.openapi.yaml): nuevo contrato /ready.
- [quickstart.md](quickstart.md): validación después de implementar.
- [ADR](../../docs/adr/choose-backend-persistence-and-migrations.md): decisión duradera.
- [tasks.md](tasks.md): T001–T024 implementadas; integración y cierre pendientes.

### Source Code (repository root)

Estructura de US1/US2; la modificación de CI corresponde a T025 pendiente.

```text
backend/
  migrations/<timestamp>_institutional-foundation.sql
  src/database/config.ts                   # URL/TLS y errores sanitizados
  src/database/database.service.ts         # único Pool y lifecycle
  src/health/health.controller.ts          # /health y /ready
  src/commands/migrate.ts
  src/seeds/demo.ts                         # dataset y carga manual
  src/app.module.ts                        # servicio y controlador
  src/main.ts                              # shutdown y error de arranque
  test/database-config.test.mjs
  test/integration/persistence.test.mjs
  test/integration/seed.test.mjs
  test/integration/readiness.test.mjs
  package.json / pnpm-lock.yaml / Dockerfile / railway.json
docker-compose.yml / .env.example / .github/workflows/ci.yml
docs/reference/openapi/openapi.yaml / paths/platform.yaml
```

**Structure Decision**: AppModule registra un único DatabaseService y HealthController.
Sin módulo de wiring, carpeta platform ni modelos/repositorios anticipados.
La migración SQL define el esquema; integración verifica tipos, defaults y constraints.
Arranque y /ready solo resuelven las tablas/columnas requeridas con una consulta
sin filas; no detectan cambios manuales de tipos, defaults, índices o constraints.
Seed manual en seeds/demo.ts, sin framework, bandera ni ejecución al arrancar.
Un Client y transacción; auxiliares locales para institución, usuario y membership.
Integración usa una DB exclusiva de test, sin requerir DB para los tests actuales.

## Execution and Verification

1. US1: migración inicial, conexión Nest y readiness; persistencia local/imagen.
2. US2: CLI seed manual, dataset estable, rollback e idempotencia concurrente.
3. Integración: Compose, pre-deploy Railway, recuperación y evidencias.
4. Mantener /health y su contrato/consumidores; /ready no retorna metadatos.
5. T025 agregará PostgreSQL 17 y test:integration a CI junto a checks existentes;
   datos/contraseñas se generan dentro del test, sin secretos productivos.
6. Validar imagen final: migrador, SQL y Argon2id funcionan sin npm/pnpm.

| Requisitos | Validación exigida |
| --- | --- |
| FR-001/002 | Persistir/reiniciar; dos institutions para una identidad; unicidades/FK |
| FR-003 | Migración repetida; error revierte lote; seed sin mezclar estructura |
| FR-004/007 | Dataset exacto; variables obligatorias; sin secretos ni rutas nuevas de alta |
| FR-005 | Colisiones, FK inválida y error inducido no confirman cambios parciales |
| FR-006 | Arranque local/imagen; recuperación en DB separada; evidencia Railway real |
| SC-001/002 | Dos ejecuciones y concurrencia conservan IDs, hashes, estados y cantidades |
| SC-003 | Reinicio durable local y Railway; no sustituir por una prueba mock |

## Complexity Tracking

Sin violaciones. /ready distingue disponibilidad de persistencia sin modificar
el contrato de /health. El migrador runtime y Argon2id son necesarios para operar
la imagen y crear credenciales válidas; el seed no añade un servicio.

## Validation

- Documentos <150 líneas, enlaces locales y resolución Spec Kit verificados.
- Contrato OpenAPI válido; warning esperado por no declarar 4xx en una sonda
  sin parámetros que usa exclusivamente 200/503.
- El diseño inicial no ejecutó implementación ni provisión. US1/US2 ahora cuentan
  con evidencia local; Railway, CI y recuperación siguen pendientes en T025–T030.
