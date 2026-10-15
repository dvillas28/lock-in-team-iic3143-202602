# Implementation Plan: Base persistente y datos demo

**Branch**: `feat/base-persistente` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)
**Status**: Diseño listo para generar tareas; implementación y evidencia pendientes.

## Summary

Incorporar una PostgreSQL compartida al backend existente. Persistir Institution,
User global y Membership; migrar estructura separadamente del bootstrap demo.
Elegir SQL parametrizado con pg y migraciones node-pg-migrate, sin ORM.
US1 entrega arranque verificable y datos durables; US2 agrega demo repetible sobre
esa base, comprobable con fixtures sin depender de autenticación todavía.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, NestJS 12.1.0 existentes |
| Dependencias nuevas | pg 8.23.1, node-pg-migrate 9.0.0, argon2 0.45.1; @types/pg en desarrollo |
| Persistencia | PostgreSQL 17, schema public; una URL y un Pool por proceso |
| Migraciones | SQL versionado, runner compilado, historia pgmigrations |
| Pruebas | node:test y assert existentes; integración real contra PostgreSQL 17 |
| Plataforma | Docker Compose y Railway con la imagen Node 24 Alpine existente |
| Tipo de proyecto | Monolito modular NestJS + frontend Next.js existente |
| Objetivos | Arranque sin DB falla en ≤30 s; /ready responde en ≤5 s incluso con fallo |
| Alcance medible | 3 tablas de dominio; demo vacía: 2 instituciones, 5 usuarios, 6 memberships |
| Límites | Sin login, endpoints académicos, RLS, storage ni tablas futuras |

Fijar versiones exactas y lockfile al implementar; no instalar paquetes en esta fase.
Un Pool con máximo 5 conexiones, conexión/cola 2 s, consultas 2 s y cierre en shutdown.
Readiness usa presupuesto menor: conexión/cola 2 s y consulta 2 s, total ≤5 s.
No usar credenciales o identidades recibidas desde HTTP para ejecutar bootstrap.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS para esta misión.

| Gate | Evidencia de diseño |
| --- | --- |
| Aislamiento | Membership tiene institution_id; claves/FK y consultas explícitas; User global |
| Permisos | Solo operador ejecuta CLI; ninguna ruta permite alta o cambios de roles |
| Integridad/historia | Transacciones, no borrados/cascadas; bootstrap conserva existentes |
| Auditoría | Log operativo sanitizado; sin inventar AuditEvent que requiere Course |
| Entregabilidad | US1 base vacía durable; US2 bootstrap sobre esa base |
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
- tasks.md se genera después mediante speckit-tasks; no pertenece a esta fase.

### Source Code (repository root)

Rutas propuestas; solo existen las aplicaciones y archivos base indicados.

```text
backend/
  migrations/<timestamp>_institutional-foundation.sql
  src/platform/database/
    database.module.ts
    database.service.ts
    migrate.ts
    bootstrap.ts
    demo-data.ts
  src/platform/health/readiness.controller.ts
  src/app.module.ts                         # importar DatabaseModule
  src/platform/platform.module.ts          # registrar readiness
  src/main.ts                              # shutdown y error de arranque
  test/integration/persistence.test.mjs
  test/integration/bootstrap.test.mjs
  test/integration/readiness.test.mjs
  package.json / pnpm-lock.yaml / Dockerfile / railway.json
docker-compose.yml / .env.example / .github/workflows/ci.yml
docs/reference/openapi/openapi.yaml / paths/platform.yaml
```

**Structure Decision**: DatabaseModule exporta una única conexión compartida.
SQL permanece junto a su operación; no agregar interfaces/repositorios genéricos.
Integración usa una DB exclusiva de test, sin requerir DB para los tests actuales.

## Execution and Verification

1. US1: migración inicial, conexión Nest y readiness; persistencia local/imagen.
2. US2: CLI bootstrap opt-in, dataset estable, rollback e idempotencia concurrente.
3. Integración: Compose, pre-deploy Railway, recuperación y evidencias.
4. Mantener /health y su contrato/consumidores; /ready no retorna metadatos.
5. CI usa servicio PostgreSQL 17 y test:integration además de checks existentes;
   datos/contraseñas se generan dentro del test, sin secretos productivos.
6. Validar imagen final: migrador, SQL y Argon2id funcionan sin npm/pnpm.

| Requisitos | Validación exigida |
| --- | --- |
| FR-001/002 | Persistir/reiniciar; dos institutions para una identidad; unicidades/FK |
| FR-003 | Migración repetida; error revierte lote; bootstrap sin mezclar estructura |
| FR-004/007 | Dataset exacto; variables obligatorias; sin secretos ni rutas nuevas de alta |
| FR-005 | Colisiones, FK inválida y error inducido no confirman cambios parciales |
| FR-006 | Arranque local/imagen; recuperación en DB separada; evidencia Railway real |
| SC-001/002 | Dos ejecuciones y concurrencia conservan IDs, hashes, estados y cantidades |
| SC-003 | Reinicio durable local y Railway; no sustituir por una prueba mock |

## Complexity Tracking

Sin violaciones. /ready distingue disponibilidad de persistencia sin modificar
el contrato de /health. El migrador runtime y Argon2id son necesarios para operar
la imagen y crear credenciales válidas; el bootstrap no añade un servicio.

## Planning Validation

- Documentos <150 líneas, enlaces locales y resolución Spec Kit verificados.
- Contrato OpenAPI válido; warning esperado por no declarar 4xx en una sonda
  sin parámetros que usa exclusivamente 200/503.
- Sin implementación, migraciones ejecutadas, provisión Railway ni pruebas de
  integración todavía; su evidencia es requisito de cierre, no de este diseño.

