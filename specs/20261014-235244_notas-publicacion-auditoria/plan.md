# Implementation Plan: Libro de notas, publicación y auditoría

**Branch actual**: `feat/notas-publicacion-auditoria` | **Base**: `cf7ef53`
**Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)
**Status**: Implementado; cierre pendiente por bloqueo heredado #96; ver docs/backend/gradebook-validation.md.
**Input**: `specs/20261014-235244_notas-publicacion-auditoria/spec.md`.

## Summary

Cerrar el flujo backend con ponderaciones globales, publicación atómica explícita,
libro académico, notas propias e historial sanitizado. Reutilizar NestJS/pg,
Course lock, Grade de intentos y AuditService existentes. Sin nuevas dependencias.
Publicar no califica ni cancela; solo fija published_at en Grades ya calificadas.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Language/Version | TypeScript 5.9.3, Node 24, pnpm 9.15.9 |
| Primary Dependencies | NestJS 12.1.0, pg 8.23.1, node-pg-migrate 9.0.0 existentes |
| Storage | PostgreSQL 17; GradeItem/Grade existentes tras integrar dependencias; recibos nuevos |
| Testing | node:test/assert, HTTP real, PostgreSQL exclusiva, c8 existentes |
| Target Platform | Monolito modular Node/Docker |
| Project Type | Backend API; frontend solo tipos y prueba de consumidor |
| Performance Goals | SQL filtrado tenant/curso/sección y paginación existente; sin SLO nuevo |
| Constraints | NUMERIC exacto, una tx por escritura, no borrar historia ni publicar parcialmente |
| Scale/Scope | Dos historias P1; UC/UTFSM, múltiples secciones, roles acumulados y 16 CU |

Pesos NUMERIC(5,2), suma SQL exacta 100; promedio round(NUMERIC,1), HALF_UP.
No ampliar timeouts/pool/límite JSON existentes. Sin UI, exportación, corrección
manual, recorrección, workers, colas, RLS ni nuevos proveedores.

## Constitution Check

Gates de diseño conservados. Dependencias reales integradas desde `cf7ef53`,
incluidas autoría `da8b59b` y módulos `e34499e`; aceptación ejecutada y documentada.

| Gate | Evidencia |
| --- | --- |
| Tenant | institution_id, FK compuestas, filtros SQL, UC/UTFSM y revocación |
| Roles | Teacher activo obligatorio en notas; pesos además admin dueño; assistant lectura |
| Admin UI/domain | ADR vigente reconciliado; ownership amplía alcance, superadmin no da docencia |
| Historia | Grade publicada inmutable, pesos congelados, recibos y eventos append-only |
| Independencia | US1 publica fixtures calificadas; US2 lee fixtures sin ejecutar US1 |
| Checked changes | Negativos, rollback, replay, carreras HTTP y logs de fallos sanitizados; health/deploy sin datos académicos |
| Docs | Artefactos separados por responsabilidad, cada uno <150 líneas |
| Trazabilidad | CU-10/11/12/13/16; RF21–26/29; RNF1–4/9; BE-26–32, DOC-15 |
| Complejidad | Un ledger de recibos para idempotencia persistida; lock Course ya existente |

[ADR de permisos](../../docs/adr/institution-admin-and-course-ownership.md):
auditoría conserva admin dueño aun sin teacher; teacher ordinario solo sus eventos
de sección. La configuración de pesos es evaluación: teacher activo + admin dueño.
Los responsables del backlog se conservan. No quedan aclaraciones funcionales abiertas.

## Project Structure

### Documentation (this feature)

- [research.md](research.md): decisiones y diferencias con contrato actual.
- [data-model.md](data-model.md): restricciones, recibos, locks y transiciones.
- [contracts/http.md](contracts/http.md): rutas, entradas, errores y proyecciones.
- [contracts/authorization.md](contracts/authorization.md): alcance e historia.
- [quickstart.md](quickstart.md): validación ejecutable tras implementar.
- [tasks.md](tasks.md): fases y tareas por historia.
- ADR a crear: `docs/adr/grade-publication-and-weight-freeze.md`.

### Source Code (repository root)

```text
backend/migrations/20261019000300_grade_publication.sql
backend/src/gradebook/gradebook.service.ts / gradebook.controller.ts
backend/src/gradebook/gradebook-access.ts / gradebook-validation.ts
backend/src/gradebook/gradebook-dto.ts
backend/src/attempts/attempts.service.ts / attempts.controller.ts / attempt-dto.ts
backend/src/quizzes/quizzes.service.ts (confirmar ruta real de autoría)
backend/src/audit/audit.service.ts / audit.controller.ts
backend/src/courses/course-access.ts
backend/src/app.module.ts / database/database.service.ts
backend/test/gradebook-validation.test.mjs / audit.test.mjs
backend/test/integration/gradebook-*.test.mjs / gradebook-fixtures.mjs
backend/test/integration/academic-flow.test.mjs
docs/reference/openapi/paths/gradebook.yaml / quizzes.yaml / audit.yaml
docs/reference/openapi/components/schemas/grades.yaml / quizzes.yaml / audit.yaml
frontend/src/lib/api/schema.d.ts / frontend/test/api.test.ts
```

Fecha de migración propuesta: confirmar orden libre posterior a intentos/autoría.
No recrear sus tablas ni modificar SQL ya aplicado. Reutilizar AuditController;
no agregar otro endpoint de historial. Usar SQL parametrizado y PoolClient único.
Cambios compartidos alcanzan autoría (freeze de nuevos ítems), intentos (bloqueo
tras publicación y listado), auditoría (allowlists), readiness, contrato y consumidor.

## Execution and Verification

1. Integrar dependencias reales y confirmar nombres, locks y DTO antes de Foundation.
2. Foundation: constraints/ledger, autorización, validación, fixtures y registro.
3. US1: reemplazo completo de pesos, publicación y replay auditados; probar carreras.
4. US2: libro, notas propias, listado de intentos e historial con fixtures propias.
5. Integrar identidad→quiz→intento→nota→publicación en UC/UTFSM y los 16 CU.
6. Ejecutar quickstart y registrar evidencia real en docs/backend/gradebook-validation.md.

MVP incremental US1; entrega completa requiere ambas historias y negativos sin omitir.
No confundir el estado de otro worktree con código disponible en este checkout.

## Complexity Tracking

Sin violaciones. grade_publications conserva respuesta y selección canónica para
replay durable; Grade sola no identifica request ni su timestamp original.
No tabla genérica de idempotencia ni nuevas capas de repositorio.

Migración adicional `20261019000400_validate_publication_history.sql`: valida
publicaciones preexistentes (pesos, resultado graded, último intento y ausencia
de activos), falla sin reparar historia inválida. Se añade después de 003 para
conservar la migración ya ejecutada en la DB exclusiva durante desarrollo.
