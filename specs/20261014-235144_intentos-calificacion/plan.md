# Implementation Plan: Intentos y calificación automática

**Branch**: `feat/intentos-calificacion` | **Base**: PR #94, `da8b59b`
**Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)
**Status**: Implementado; cierre pendiente por hallazgo adicional de privacidad.
**Input**: `specs/20261014-235144_intentos-calificacion/spec.md`.

## Summary

Entregar inicio, guardado, reanudación, cancelación y envío atómico de intentos.
Reusar NestJS, pg, autorización vigente, transacciones y auditoría existentes.
Course FOR UPDATE serializa las escrituras académicas del curso; índices únicos
protegen numeración, intento activo y nota vigente. Calificación decimal en SQL,
sin dependencias nuevas ni trabajo asíncrono. Replay submit exige clave original;
otra clave sobre graded da 409. GET usa anyOf para vistas que pueden solaparse. Respuestas HTTP estudiantiles sin nota.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Language/Version | TypeScript 5.9.3, Node 24, NestJS 12.1.0 existentes |
| Primary Dependencies | pg 8.23.1, node-pg-migrate 9.0.0; ninguna nueva |
| Storage | PostgreSQL 17, schema public; quiz_attempts y grades nuevas |
| Testing | node:test/assert, HTTP real y DB exclusiva; c8/CI existentes |
| Target Platform | Backend monolítico Node/Docker |
| Project Type | API; frontend solo tipos y pruebas de consumidor |
| Performance Goals | Consultas por tenant/quiz/student; conservar timeouts del pool |
| Constraints | Sin ORM, workers, caché, corrección manual, cron ni UI |
| Scale/Scope | Dos historias P1; UC/UTFSM, dos secciones y roles acumulados |

Ventana ratificada por usuario: opensAt ≤ reloj DB < closesAt; cada límite NULL
es ilimitado. Guardar/enviar fuera de ventana da 409 y conserva in_progress.
Leer y cancelar no requieren ventana abierta. Replay de envío confirmado no
vuelve a evaluar ventana ni publicación, pero sí autorización vigente.
Mantener límite JSON y pool existentes. Usar NUMERIC/round en PostgreSQL para
puntajes, porcentaje a dos decimales y nota a uno; no aritmética flotante JS.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS. T001 verificado sobre autoría real;
18 pruebas de su contrato pasan en PostgreSQL 17 exclusivo.

| Gate | Evidencia |
| --- | --- |
| Tenant isolation | institution_id, FK compuestas, filtros SQL y pruebas UC/UTFSM |
| Roles | Enrollment vigente; teacher obligatorio; admin solo amplía ownership |
| Historia | Intentos terminales inmutables; Grade no publicada auditada, publicada inmutable |
| Independencia | US1 sobre Foundation; US2 verificable con intentos de fixture sin rutas US1 |
| Checked changes | Revocación, negativos, fronteras, rollback y carreras obligatorios |
| Documentación | Cada artefacto <150 líneas |
| Traceability | CU-08/09/15; RF19–20/25–28; RNF1–4; BE-18–20/25 y parte BE-24 |
| Complexity | Dos tablas, claves en intento, SQL decimal y lock de curso existente |

Permisos del [ADR vigente](../../docs/adr/institution-admin-and-course-ownership.md).
Política temporal aclarada en spec; no quedan aclaraciones funcionales pendientes.
No cambiar responsables del backlog ni dar por implementadas dependencias.

## Prerequisites and Boundaries

Autoría real: feat/autoria-quizzes, commit da8b59b (PR #94). Esquema migrado,
puntos y GradeItem único comprobados; canAuthorQuiz compartido; requireDraft
impide editar publicados antes de cualquier intento. Worktree aislado conserva
el checkout previo. [Evidencia](../../docs/backend/attempts-grading-validation.md).

- [Base](../20261014-234644_base-persistente/plan.md),
  [identidad](../20261014-234744_identidad-acceso/plan.md) y
  [cursos](../20261014-234844_cursos-roles/plan.md): infraestructura reutilizable.
- [Autoría](../20261014-235044_autoria-quizzes/spec.md): debe entregar quizzes con
  questions JSONB, IDs estables, puntos decimales válidos, GradeItem único,
  predicado de acceso a pauta y bloqueo de edición tras primer intento.
  El contrato requerido está en [handoff.md](contracts/handoff.md); T001 es gate.
- [Módulos](../20261014-234944_modulos-material/plan.md): misión paralela,
  sin dependencia funcional; coordinar prefijos de migración y registro AppModule.
- [Notas](../20261014-235244_notas-publicacion-auditoria/spec.md): implementación
  futura de pesos, publicación, libro y listado académico de intentos. Esta misión
  entrega Grade y protocolo de locks; valida publicación con fixtures SQL.

## Project Structure

### Documentation (this feature)

[research.md](research.md), [data-model.md](data-model.md),
[http.md](contracts/http.md), [authorization.md](contracts/authorization.md),
[handoff.md](contracts/handoff.md), [quickstart.md](quickstart.md), [tasks.md](tasks.md).
Decisión durable: [ADR](../../docs/adr/quiz-attempt-lifecycle-and-grading.md).

### Source Code (repository root)

```text
backend/migrations/20261019000200_attempts_grades.sql
backend/src/attempts/attempts.service.ts / attempts.controller.ts
backend/src/attempts/attempt-access.ts / attempt-validation.ts / attempt-dto.ts
backend/src/attempts/grading.ts
backend/src/courses/course-access.ts
backend/src/audit/audit.service.ts
backend/src/app.module.ts / database/database.service.ts
backend/test/attempt-validation.test.mjs / audit.test.mjs
backend/test/integration/attempt-fixtures.mjs / attempt-integrity.test.mjs
backend/test/integration/attempt-lifecycle.test.mjs / attempt-permissions.test.mjs
backend/test/integration/attempt-grading.test.mjs / attempt-concurrency.test.mjs
backend/test/integration/attempt-contract.test.mjs
frontend/src/lib/api/schema.d.ts / frontend/test/api.test.ts
docs/reference/openapi/paths/quizzes.yaml
docs/reference/openapi/components/schemas/quizzes.yaml
docs/backend/attempts-grading-validation.md
```

Servicios concretos registrados en AppModule; transaction/lockContext/courseScope
existentes, un PoolClient por escritura y release en finally. Grading recibe ese
cliente; sin servicio/repositorio genérico ni duplicación de autorización de pauta.
DatabaseService.check incluye columnas nuevas. Migración 20261019000200 confirmada
posterior a autoría; ninguna migración previa aplicada fue modificada.

## Execution and Verification

1. Gate autoría: reconciliar interfaz, precisión, GradeItem y bloqueo del primer intento.
2. Foundation: tablas, constraints, permisos, DTO, fixtures y registro compilable.
3. US1: start/get/save/cancel, auditoría, idempotencia y contrato/tipos sincronizados.
4. US2: envío, corrección, actualización Grade y recibo sin resultado; probar
   aisladamente con fixtures SQL y luego integrar con US1.
5. Cerrar negativos y carreras con publicación SQL usando el mismo lock de curso;
   la prueba HTTP real con publicación queda asignada a la misión de notas.
6. Ejecutar quickstart y registrar evidencia sin secretos ni marcar pendientes hechas.

MVP: US1 permite responder/cancelar. Flujo académico calificable exige US1+US2.
SC-001 cubre unicidades/carreras; SC-002 fórmula/fronteras; SC-003 replay y secreto.

## Complexity Tracking

Sin violaciones. Lock grueso por curso reduce paralelismo pero ya existe y evita
un coordinador nuevo. Escalar solo si medición real exige locks por serie/libro.

Validación T001/T002: base PR #94 da8b59b; 18 pruebas de autoría pasan en
PostgreSQL 17 exclusivo (2026-10-19). Esquema 20261019000100_quiz_authoring.sql,
canAuthorQuiz compartido y requireDraft bloquea edición publicada antes del intento.
Puntos hasta dos decimales y total ≤999999.99 validados; GradeItem único en SQL.
Intentos usa prefijo posterior libre 20261019000200. DB efímera academix_attempts_test.
