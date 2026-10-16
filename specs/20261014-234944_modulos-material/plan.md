# Implementation Plan: Módulos y material compartido

**Branch actual**: `feat/modulos-material-api` | **Prevista**: `feat/modulos-material`
**Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)
**Status**: Implementado y verificado localmente; ver [evidencia](../../docs/backend/modules-material-validation.md).
**Input**: `specs/20261014-234944_modulos-material/spec.md`.

## Summary

Extender el monolito con módulos ordenados y material markdown compartidos por
curso. Docentes activos de cualquier sección gestionan el contenido común;
ayudantes/estudiantes requieren publicación de módulo e ítem para leer.
Reutilizar autenticación, acceso vigente, SQL y auditoría de cursos-roles.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Language/Version | TypeScript 5.9.3, Node 24, pnpm 9.15.9 |
| Primary Dependencies | NestJS 12.1.0, pg 8.23.1, node-pg-migrate 9.0.0 existentes |
| Storage | PostgreSQL 17; nueva migración SQL, sin ORM |
| Testing | node:test/assert, HTTP real, PostgreSQL exclusiva, c8 existente |
| Target Platform | Monolito modular Node/Docker, backend HTTP |
| Project Type | Backend API; frontend limitado a contrato/tipos/pruebas de consumidor |
| Performance Goals | Filtrado SQL por tenant/curso/publicación; sin SLO numérico nuevo |
| Constraints | Sin binarios, render HTML, RLS, cachés, colas ni dependencias nuevas |
| Scale/Scope | Dos historias P1; fixtures UC/UTFSM, dos secciones por curso |

Mantener pool/timeouts y límite HTTP existentes. Títulos 1–200 caracteres tras
trim; cuerpo markdown no blanco, máximo 10000 caracteres, sin NUL.
Listados de módulos completos para reordenar; material ordenado estable por id.
La representación markdown es una cadena JSON inerte, sin renderizador en esta misión.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS; prerequisito de implementación
explícito: identidad-acceso y cursos-roles deben estar operativos, no solo planeados.

| Gate | Evidencia |
| --- | --- |
| Tenant isolation | institution_id y FK compuestas; acceso vigente en cada consulta |
| Roles/admin | Teacher activo de alguna sección escribe; flags admin no sustituyen rol |
| Audit/history | Mutación y snapshots before/after en la misma tx; historial append-only |
| Independencia | Foundation registra servicios/controladores y sincroniza contrato/tipos; US1/US2 con fixtures propias |
| Checked changes | Negativos de dos tenants, revocación, XSS, concurrencia y rollback |
| Documentación | Artefactos menores de 150 líneas |
| Traceability | CU-14/05/06; RF13–16/25–26; RNF1–4; BE-21–23 y parte BE-24 |
| Complexity | Dos tablas, servicios concretos, locks de curso y reutilización de auditoría |

Permisos reconciliados en el [ADR vigente](../../docs/adr/ui-admin-non-admin-experiences.md):
docente no admin también escribe contenido compartido. No cambia ownership ni
scope de secciones, notas, participantes o auditoría de la misión anterior.
RF15 y parte de archivos de RF14 quedan P2; conservar responsables del backlog.

## Project Structure

### Documentation (this feature)

- [research.md](research.md): decisiones y evidencia local.
- [data-model.md](data-model.md): invariantes, publicación y locks.
- [contracts/http.md](contracts/http.md): rutas, DTO y errores.
- [contracts/authorization.md](contracts/authorization.md): matriz y contenido seguro.
- [quickstart.md](quickstart.md): comprobaciones ejecutables tras implementar.
- [tasks.md](tasks.md): implementación por historia.
- [ADR](../../docs/adr/shared-markdown-publication.md): publicación y representación.

### Source Code (repository root)

```text
backend/migrations/20261016000200_modules_material.sql
backend/src/modules/modules.service.ts / modules.controller.ts
backend/src/materials/materials.service.ts / materials.controller.ts
backend/src/content/content-access.ts / content-validation.ts
backend/src/courses/course-access.ts
backend/src/audit/audit.service.ts
backend/src/app.module.ts / database/database.service.ts
backend/test/content-validation.test.mjs
backend/test/integration/content-fixtures.mjs
backend/test/integration/modules-write.test.mjs / materials-write.test.mjs
backend/test/integration/content-integrity.test.mjs
backend/test/integration/content-read.test.mjs / content-revocation.test.mjs
backend/test/integration/content-contract.test.mjs
frontend/src/lib/api/schema.d.ts / frontend/test/api.test.ts
docs/reference/openapi/paths/sections.yaml / materials.yaml
docs/reference/openapi/components/schemas/courses.yaml / materials.yaml
docs/reference/openapi/openapi.yaml / README.md
```

Rutas agrupadas conforme al contrato actual; no mover módulos a otro YAML por
estética. Services con SQL parametrizado y PoolClient único por escritura.
content-access extiende course-access con teacher-any-section/publicación;
no cambia semántica de autorización para los otros consumidores.
DatabaseService.check verifica columnas nuevas; AppModule registra controladores.

## Execution and Verification

1. Confirmar prerequisitos y contratos existentes; no confirmar cambios ajenos.
2. Foundation: migración, autorización, fixtures de dos tenants, servicios/controladores
   compilables registrados sin rutas y contrato/tipos sincronizados antes de historias.
3. US1: creación/edición/orden/publicación y auditoría; probar publish vs unpublish
   concurrentes en módulo/material y snapshots de orden como objetos {modules:[{id,position}]}.
4. US2: implementar GET con registro/DTO de Foundation, enlaces directos y revocación
   con fixtures propias; cambios concurrentes por SQL sin depender de escrituras US1.
   Validar arranque HTTP y contrato de cada historia sin tareas de la otra.
5. Validar migración desde identidad+cursos, rollback de operación y concurrencia.
6. Ejecutar checks del quickstart y registrar evidencia sin marcar tareas pendientes.

MVP incremental sugerido: US1. Entrega completa exige US1+US2 y todos los negativos.
SC-001: cuatro estados de publicación; SC-002: mismos IDs en dos secciones;
SC-003: ninguna lectura/escritura/relación cruzada ni enlace revocado expone datos.

## Complexity Tracking

Sin violaciones. Bloquear Course reutiliza la serialización existente; constraint
UNIQUE diferible permite intercambiar posiciones sin valores temporales.
No agregar versionado paralelo: auditoría before/after conserva historia de edición.

Base comprobada: PR #86, `feat/cursos-roles-backend` @ `57a113e`. HTTP real de
identidad/cursos, roles, revocación y auditoría PASS en DB exclusiva PostgreSQL 17.
Trazabilidad CU/RF/RNF y teacher no admin reconciliados; sin dependencia faltante.
