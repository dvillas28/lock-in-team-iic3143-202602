# Implementation Plan: Autoría y publicación de quizzes

**Branch**: `docs/autoria-quizzes-plan` | **Date**: 2026-10-19
**Spec**: [spec.md](spec.md) | **Implementación prevista**: `feat/autoria-quizzes`.
**Estado**: Implementación y validación local completas; integración con intentos/notas pendiente.
**Base vigente**: `origin/dev` @ `4c24dbc`; #93 integrado el 2026-10-20.
La cadena #85 → #86 → #87 → #89 → #90 → #93 ya está integrada en dev.
Este PR entrega autoría; integración con intentos/notas conserva sus gates posteriores.

Entrega acordada: dos PRs apilados. `docs/autoria-quizzes-plan` contiene spec,
plan, tareas, contratos y ADR sobre #90; `feat/autoria-quizzes` parte de esa rama
y reúne foundation, API de ambas historias, pruebas y evidencia. Sin PR técnico intermedio.

## Summary

Extender el backend existente con Quiz, preguntas/alternativas JSONB y GradeItem.
Docente prepara borrador y publica con auditoría atómica; estudiante consulta
una proyección sin pauta. Reutilizar identidad, permisos vigentes y locks de curso.
No implementar intentos, calificación, pesos, publicación de notas ni pantallas.
Reasignar sectionId de un draft exige permiso en origen/destino del mismo curso;
Quiz.id y Section.id no cambian. Publicado sigue íntegramente inmutable.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Language/Version | TypeScript 5.9.3, Node 24, pnpm 9.15.9 heredados |
| Primary Dependencies | NestJS 12.1.0, pg 8.23.1, node-pg-migrate 9.0.0 existentes |
| Storage | PostgreSQL 17; dos tablas nuevas y marcador en Course; sin ORM |
| Testing | node:test/assert, integración HTTP/SQL en DB exclusiva, c8 existente |
| Target Platform | Backend modular HTTP sobre Node/Docker |
| Project Type | API; frontend solo tipos y comprobación de consumidor |
| Performance Goals | SQL filtrado por tenant/curso/alcance; sin SLO adicional |
| Constraints | JSON HTTP máximo 4096 bytes; no dependencias ni servicios nuevos |
| Scale/Scope | Dos historias P1, fixtures UC/UTFSM y dos secciones por curso |

Mantener límites y timeouts existentes; un quiz que excede 4096 bytes obtiene 413.
El límite heredado restringe tamaño práctico; ampliarlo requiere decisión separada.
Validaciones y DTO concretos en [contrato HTTP](contracts/http.md).
Resolver todos los desconocidos mediante evidencia local en [research.md](research.md).

## Constitution Check

Gates de diseño y aceptación local: PASS; ver [evidencia](../../docs/backend/quiz-authoring-validation.md).

| Gate | Evidencia |
| --- | --- |
| Tenant isolation | institution_id, FK compuestas y filtros en cada ruta |
| Roles/admin | Teacher obligatorio; admin dueño amplía scope; assistant sin pauta |
| Audit/history | Auditoría atómica por allowlist sin preguntas ni respuestas correctas |
| Academic integrity | Publicado inmutable; GradeItem único; congelación monotónica del curso |
| Independencia | Foundation compartida; cada historia usa fixtures SQL propias |
| Checked changes | Spec exige negativos, revocación, sanitización, rollback y concurrencia |
| Documentación | Cada artefacto <150 líneas; sin excepción necesaria |
| Traceability | CU-07; RF17–18/25–27; RNF1–4; BE-15–17 y parte BE-24 |
| Complexity | Dos tablas; JSONB del modelo vigente; mutex Course existente |

Permisos reconciliados con [ADR de ownership](../../docs/adr/institution-admin-and-course-ownership.md).
Sin reasignar responsables del backlog. El [ADR de quizzes](../../docs/adr/quiz-authoring-integrity.md)
define la coordinación con las misiones posteriores.

## Project Structure

### Documentation

- [research.md](research.md): decisiones y alternativas.
- [data-model.md](data-model.md): relaciones, invariantes y transacciones.
- [contracts/http.md](contracts/http.md): rutas, DTO, validaciones y errores.
- [contracts/authorization.md](contracts/authorization.md): matriz y proyecciones.
- [contracts/academic-integration.md](contracts/academic-integration.md): consumidores futuros.
- [quickstart.md](quickstart.md): escenarios ejecutables tras implementar.
- [tasks.md](tasks.md): secuencia de implementación.

### Source Code (repository root)

```text
backend/migrations/20261019000100_quiz_authoring.sql
backend/src/quizzes/quiz-access.ts / quiz-validation.ts / quiz-dto.ts
backend/src/quizzes/quizzes.service.ts / quizzes.controller.ts
backend/src/courses/course-access.ts / audit/audit.service.ts
backend/src/app.module.ts / database/database.service.ts
backend/test/quiz-validation.test.mjs / quiz-access.test.mjs
backend/test/integration/quiz-fixtures.mjs / quiz-schema.test.mjs
backend/test/integration/quiz-authoring.test.mjs / quiz-publish.test.mjs
backend/test/integration/quiz-integrity.test.mjs / quiz-read.test.mjs
backend/test/integration/quiz-revocation.test.mjs / quiz-contract.test.mjs
docs/reference/openapi/paths/quizzes.yaml
docs/reference/openapi/components/schemas/quizzes.yaml
frontend/src/lib/api/schema.d.ts / frontend/test/api.test.ts
docs/backend/quiz-authoring-validation.md
```

Foundation registra servicios/controlador compilables sin rutas y sincroniza los
DTO canónicos antes de historias. US1 agrega escritura; US2 agrega lectura segura.
No crear componentes de UI ni cambiar permisos compartidos de contenido.

## Execution and Verification

1. Partir del trabajo de #90; verificar migraciones aplicadas y contratos existentes.
2. Foundation agrega persistencia, autorización, sanitización y fixtures compartidas.
3. US1 entrega alta/edición/publicación y GET authoring docente con pauta.
4. US2 entrega lista/GET seguros y guard reutilizable de elegibilidad estudiantil.
5. Probar cada historia sin ejecutar las tareas de la otra, con fixtures SQL propias.
6. Ejecutar quickstart y registrar resultados reales, pendientes y límites.

MVP incremental: US1; entrega completa requiere US2 y todos los negativos.
FR-007 entrega predicado/guard probado; su uso HTTP en rendición pertenece a
intentos-calificacion. No atribuir rendición ni notas funcionales a esta misión.
FR-005 se acepta localmente por marcador/SQL; su prueba con Grade real y FR-007
HTTP son gates de las misiones consumidoras explicitados en spec e integración.

## Complexity Tracking

Sin violaciones. Marcador `courses.grade_items_locked_at` evita crear tablas de
intentos/notas anticipadamente. Publicador futuro debe fijarlo junto a primera
nota publicada; este acoplamiento queda explícito y probado como protocolo SQL.
Edición solo en draft ya está definida en OpenAPI y protege FR-008 anticipadamente.
