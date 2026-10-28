# Implementation Plan: Cursos, secciones, roles y auditoría mínima

**Branch actual**: `feat/identidad-acceso` | **Prevista**: `feat/cursos-roles`
**Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)
**Status**: Implementado; validación y evidencia en docs/backend/courses-roles-validation.md.
**Input**: `specs/20261014-234844_cursos-roles/spec.md`.

## Summary

Agregar is_admin e is_super_admin a InstitutionMembership; crear y administrar cursos propios
sin confundir ese privilegio con Enrollment. Reutilizar created_by como dueño
inmutable, NestJS y SQL directo. Entregar consulta US1, gestión US2 y delegación US3.
Respetar cambios locales de identidad-acceso; no moverlos ni confirmarlos.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Language/Version | TypeScript 5.9.3, Node 24, pnpm 9.15.9 |
| Primary Dependencies | NestJS 12.1.0, pg 8.23.1, node-pg-migrate 9.0.0 existentes |
| Storage | PostgreSQL 17 compartida; nuevas migraciones SQL sin ORM |
| Testing | node:test/assert, HTTP real, PostgreSQL exclusiva, c8 existente |
| Target Platform | Node/Docker, monolito modular HTTP |
| Project Type | Backend API; frontend solo tipos y pruebas de consumidor |
| Performance Goals | Consultas filtradas en SQL; paginación 20/default, máximo 100 en participantes/audit |
| Constraints | Sin RLS, caches ni colas; autorización vigente y auditoría atómica |
| Scale/Scope | Demo UC/UTFSM; tres historias, un dueño por curso, sin transferencia |

No se promete SLO numérico nuevo. Pool y timeouts actuales se conservan; validar
planes/índices de consultas reales sin agregar infraestructura especulativa.
No nuevas dependencias. Identidad-acceso debe estar operativa antes de implementar.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS con la decisión confirmada.

| Gate | Evidencia |
| --- | --- |
| Tenant isolation | institution_id en tablas/FK; estados vigentes y filtros por actor |
| Roles/admin | is_admin institucional + created_by; teacher por sección; superadmin tenant sin acceso académico implícito |
| Audit/history | Eventos append-only; cambios y snapshots en la misma transacción |
| Entregabilidad | US1 con fixtures SQL; US2 añade gestión; US3 delegación con fixtures sin depender de US2 |
| Checked changes | Pruebas explícitas de dos tenants, revocación, concurrencia y rollback |
| Documentación | Artefactos <150 líneas; enlazar contratos específicos |
| Traceability | CU-03/04, RF8–12/25–26, RNF1–4; PREP-10, BE-09–14 |
| Complexity | Dos booleanos, ownership existente; sin coordinador ni tablas de permisos |

Constitución 1.4.0 permite onboarding PM y delegación institucional acotada.
No habilita administración general de usuarios, cursos ajenos ni privilegios globales.
AuditEvent admite contexto institucional y origen operativo para migraciones del PM;
los cambios HTTP siempre llevan actor autenticado. Ver contracts/onboarding.md.
Módulos, quizzes, notas y publicación se implementan en sus misiones.

## Project Structure

### Documentation (this feature)

- [research.md](research.md): decisiones resueltas e investigación local.
- [data-model.md](data-model.md): entidades, índices e invariantes.
- [contracts/http.md](contracts/http.md): DTO y rutas.
- [contracts/authorization.md](contracts/authorization.md): matriz y concurrencia.
- [contracts/onboarding.md](contracts/onboarding.md): onboarding, miembros existentes y delegación US3.
- [contracts/set-superadmin.md](contracts/set-superadmin.md): recuperación operativa y reemplazo.
- [quickstart.md](quickstart.md): guía ejecutable posterior a implementación.
- [tasks.md](tasks.md): trabajo por historia y verificaciones.
- [ADR](../../docs/adr/institution-admin-and-course-ownership.md): decisión duradera.

### Source Code (repository root)

```text
backend/migrations/20261016000100_courses_roles.sql
backend/src/courses/courses.service.ts / courses.controller.ts
backend/src/courses/course-access.ts
backend/src/sections/sections.service.ts / sections.controller.ts
backend/src/enrollments/enrollments.service.ts / enrollments.controller.ts
backend/src/audit/audit.service.ts / audit.controller.ts
backend/src/data-migrations/onboard-institution.ts / set-superadmin.ts
backend/src/institutions/membership-admin.service.ts / membership-admin.controller.ts
backend/src/institutions/institutions.service.ts
backend/src/database/database.service.ts / backend/src/app.module.ts
backend/test/integration/course-fixtures.mjs
backend/test/integration/courses-read.test.mjs
backend/test/integration/courses-write.test.mjs
backend/test/integration/enrollments.test.mjs
backend/test/integration/course-integrity.test.mjs
backend/test/integration/membership-admin.test.mjs
backend/test/integration/onboarding.test.mjs / superadmin-recovery.test.mjs
backend/test/integration/course-audit.test.mjs
frontend/src/lib/api/schema.d.ts / frontend/test/api.test.ts
docs/reference/openapi/paths/{courses,sections,audit,platform}.yaml
docs/reference/openapi/components/schemas/{courses,sections,tenancy,audit}.yaml
```

**Structure Decision**: servicios específicos con DatabaseService.pool y SQL
parametrizado. course-access recibe Pool/PoolClient según lectura/transacción;
no cachea privilegios. Auditoría recibe el mismo PoolClient de cada escritura.
Controladores registrados en AppModule; guard y filtro Problem existentes.
Compartir solo resolución de scope, DTO explícitos y autorización requerida.

## Execution and Verification

1. Confirmar identidad y migrador; actualizar fuentes y contratos divergentes.
2. Foundation: migración, invariantes y autorización; fixtures académicos de prueba.
3. US1: cursos/secciones visibles, /me con isAdmin y Enrollments vigentes.
4. US3: onboarding PM, delegación sobre miembros provisionados y recuperación.
5. US2: creación, configuración, secciones, roles y auditoría; pruebas con fixtures.
6. Cada historia sincroniza OpenAPI, tipos y pruebas antes de su cierre.
7. Integrar onboarding→delegación→creación→revocación; validar migraciones y negativos.

SC-001 exige lectura/escritura/relaciones cruzadas rechazadas en UC/UTFSM.
SC-002 exige rollback al fallar auditoría y snapshots sanitizados e inmutables.
SC-003 exige unicidad concurrente, no-op repetido y conservación de otros roles.
SC-004 exige onboarding repetible y delegación solo por superadmin del tenant.
La gestión docente de contenido compartido se documenta, no se implementa aquí.
Backlog mantiene responsables actuales. No registrar secretos en evidencia.

## Complexity Tracking

Sin violaciones. Se amplía AuditEvent con contexto institucional para auditar
los privilegios y onboarding sin tablas duplicadas ni curso ficticio.
