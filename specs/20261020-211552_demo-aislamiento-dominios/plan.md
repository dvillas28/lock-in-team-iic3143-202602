# Implementation Plan: Demo institucional y aislamiento por contexto

**Branch**: `docs/demo-aislamiento-plan` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261020-211552_demo-aislamiento-dominios/spec.md`.

## Summary

Una PostgreSQL compartida, API central y contexto institucional explícito en el path; preservar reglas académicas.
Reutilizar NestJS, pg, locks, JWT, migraciones y auditoría. Añadir RLS mínima, un límite
transaccional institucional, carga demo versionada y CORS centralizado.
La operación resuelve el tenant una vez; la DB evalúa su política en cada consulta.
No se promete eliminar el coste de autorización ni sustituir locks con middleware.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje | TypeScript, Node.js 24, pnpm 9.15.9 |
| Dependencias | NestJS 12, pg 8, node-pg-migrate 9, Argon2id y JWT ya instalados |
| Persistencia | PostgreSQL 17 en CI/local y 18 desplegado; SQL compatible con ambos |
| Pruebas | node:test, c8, integración serial y contrato OpenAPI existente |
| Plataforma | Docker Compose y Railway; backend api.dvillasc.me, subdominios institucionales para frontend |
| Alcance | 2 tenants, 10 cuentas nuevas; 12 tablas tenant-owned y todos los dominios HTTP |
| Rendimiento | Pool existente max=5; un resolver por operación, sin cache ni consultas por fila añadidas |
| Restricciones | Archivos authored <150 líneas; sin ORM, ALS, proxy nuevo, sharding ni otra base |

## Constitution Check

Pre-diseño: cambio de alcance autorizado por usuario y spec; reconciliar gobernanza como requisito.
Post-diseño: PASS documental con constitución 1.5.0 y ADR de esta misión; implementación pendiente.

- Aislamiento: Slug del path validado, pertenencia activa, RLS USING/WITH CHECK y runtime sin bypass.
- Permisos: superadmin solo delega isAdmin; admin dueño y roles docentes siguen iguales.
- Historial: carga atómica con marcador y auditoría; no resetear secretos o revocaciones.
- Independencia: US1 validable por CLI; US2 con fixtures; US3 integra ambas sin exigir UI.
- Trazabilidad: CU/RF/RNF y backlog de spec; no alterar responsables.
- Tamaño: todos los documentos nuevos/modificados quedan bajo 150 líneas físicas.
- Seguridad: CI debe probar rol runtime real, no solo conexión propietaria de fixtures.

## Project Structure

### Documentation (this feature)

- [research.md](research.md): alternativas, fuentes y decisiones.
- [data-model.md](data-model.md): entidades, manifiesto y políticas.
- [contracts/http.md](contracts/http.md): URLs, rutas, CORS y consumidores.
- [contracts/persistence.md](contracts/persistence.md): contexto, RLS, credenciales y excepciones.
- [contracts/demo-deployment.md](contracts/demo-deployment.md): carga, secretos y Railway.
- [quickstart.md](quickstart.md): validación local y pública después de implementar.
- `tasks.md`: trabajo generado por speckit-tasks; no es código implementado.

### Source Code (repository root)

```text
backend/src/tenancy/{tenant.guard.ts,tenant-context.ts}
backend/src/database/{database.service.ts,config.ts,tenant-transaction.ts}
backend/src/commands/{migrate.ts,predeploy.ts,provision-runtime.ts}
backend/src/data-migrations/{demo-manifest.ts,demo-institutions.ts,operation.ts}
backend/migrations/{20261020000100_runtime_and_demo.sql,20261020000200_tenant_isolation.sql}
backend/src/{auth,institutions,courses,sections,enrollments,content,...}/
backend/test/integration/{helpers.mjs,tenant-isolation.test.mjs,demo-migration.test.mjs,...}
docs/reference/openapi/{openapi.yaml,paths/,components/}
frontend/src/lib/api/{institutions.ts,schema.d.ts}
scripts/{api-catalog-render.mjs,api-catalog.test.mjs,postdeploy-demo.mjs}
```

Mantener capas actuales. Un helper transaccional, guard de slug y política CORS bastan; no repositorio genérico.
`DatabaseService.withInstitution(actor,slug,fn)` resuelve UUID/membership y entrega un PoolClient
con contexto local. Servicios reciben ese contexto; escrituras revalidan bajo locks existentes.
`withIdentity(actor|null,fn)` delimita login, identidad activa y directorio de instituciones propias.
No entregar el pool a dominios académicos; no abrir transacciones anidadas.

## Delivery Sequence

1. Gobernanza/contratos y credenciales runtime separadas del operador.
2. US1: migración demo y predeploy opt-in, independiente de dominios públicos.
3. US2: slug/contexto, RLS y conversión de accesos SQL; ajustar prefijo plural actual al singular acordado; publicar como un corte coherente.
4. US3: contrato generado, consumidores mínimos y recorrido autenticado por dominio.
5. Configurar DNS/TLS de api.dvillasc.me, CORS y credenciales; ejecutar predeploy y smoke de ambos paths institucionales.

US2 no se despliega a medias: activar RLS antes de convertir los accesos o cambiar rutas
sin contrato rompería producción. Validar todo en una DB descartable y promover la misma imagen.

## Validation & Rollout

- Migraciones en vacía, legacy seed y poblada; replays, conflictos, fallo final y concurrencia.
- RLS sobre todas las tablas, SELECT sin filtro, WITH CHECK, no-context y credenciales reales.
- 100 operaciones UC/UTFSM concurrentes y 20 reutilizaciones tras error; roles y revocación vigentes.
- CORS de ambos frontend, preflight permitido/denegado y solicitudes sin Origin; headers no cambian tenant del path.
- Controllers, Location, regex, OpenAPI y cliente generado con /api/v1/institution/{institutionSlug}; no quitar slug.
- Predeploy con MIGRATION_DATABASE_URL; HTTP solo usa DATABASE_URL runtime y readiness verifica rol/policies.
- Verificar configuración efectiva Railway, no asumir que lee backend/railway.json automáticamente.
- La API técnica/local y pública usa el mismo path con slug; no hay tenant por defecto ni selección por Host.
- Rollback de imagen no revierte schema: no volver al backend viejo con RLS habilitada sin reversión coordinada.

## Complexity Tracking

| Cambio | Motivo | Alternativa insuficiente |
| --- | --- | --- |
| RLS + rol runtime | Impedir cruces si una query omite filtro | Middleware/índices no imponen esa barrera |
| Contexto transaccional | Evitar contaminación del pool | SET de sesión persiste entre solicitudes |
| Marcador demo | Replay sin regenerar secretos ni permisos | Seed antiguo no expresa este contrato |

No nuevos proveedores ni frameworks. Índices se añaden solo con evidencia de EXPLAIN.
