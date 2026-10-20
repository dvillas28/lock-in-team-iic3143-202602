# Research: Módulos y material compartido

Investigación 2026-10-16 basada en fuentes y contratos locales. No cambia stack.

## 1. Integración existente

**Decision**: reutilizar NestJS, SQL pg, AuthGuard, Problem y auditoría del plan
cursos-roles; implementación depende de verificar sus permisos/tablas operativos.
**Rationale**: backend ya tiene identidad y DatabaseService; cursos/auditoría son
artefactos planeados al investigar; implementación comprobada en PR #86 @ 57a113e.
**Alternatives considered**: ORM, repositorio genérico y nuevo servicio: sin necesidad.
**Evidence**: backend/package.json, backend/src/database/database.service.ts,
[plan cursos](../20261014-234844_cursos-roles/plan.md).

## 2. Autoría compartida

**Decision**: teacher vigente en cualquier sección del curso puede gestionar todos
sus módulos/materiales; assistant/student solo leen publicado. Admin dueño sin
teacher tampoco ve borradores ni escribe contenido.
**Rationale**: contenido pertenece al curso y ambos docentes son autores según ADR.
**Alternatives considered**: exigir is_admin o duplicar por sección contradice FR-003.
**Evidence**: [ADR permisos](../../docs/adr/ui-admin-non-admin-experiences.md),
[contrato previo](../20261014-234844_cursos-roles/contracts/authorization.md).

## 3. Orden concurrente

**Decision**: posición positiva única por curso; alta exige posición libre;
PUT order recibe el conjunto completo sin duplicados y asigna posiciones 1..N.
Course FOR UPDATE serializa altas/reordenamientos; UNIQUE diferible protege SQL.
**Rationale**: preserva ModuleCreate.position del contrato existente y permite swaps.
**Alternatives considered**: posiciones flotantes, secuencias por sección y offsets
transitorios agregan mecanismos innecesarios. Sin borrado, no hace falta compactación.
**Evidence**: docs/reference/openapi/components/schemas/courses.yaml, FR-001.

## 4. Publicación, historial y revocación

**Decision**: published_at nullable independiente en padre e ítem; no-op repetido
conserva timestamp y no duplica evento. Edición mantiene publicación y audita
before/after, incluido markdown. Lecturas revalidan estados y filtran en SQL.
**Rationale**: ocultar padre conserva hijos e historial; auditoría atómica existente.
**Alternatives considered**: borrar, despublicar hijos o congelar edición: no requeridos.
Eventos comunes usan section_id NULL: no ampliar historial a teacher no admin.
**Evidence**: FR-004/006, [modelo previo](../20261014-234844_cursos-roles/data-model.md).

## 5. Markdown seguro sin nuevo renderizador

**Decision**: guardar fuente markdown y devolverla solo como string application/json,
con nosniff y no-store. Consumidores la tratan como texto; no se produce HTML,
se ejecutan enlaces, resuelven imágenes ni se inyecta contenido en DOM.
**Rationale**: misión backend sin mockups nuevos; texto inerte cumple FR-007 sin
parser/sanitizador ad hoc que destruya ejemplos de código legítimos.
**Alternatives considered**: regex de XSS rechazada; render HTML exige sanitizador
probado y pruebas de navegador en una misión UI posterior antes de habilitarlo.
**Evidence**: FR-007 y exclusión de mockups en spec.md; contrato JSON Material actual.
Límites elegidos: título trim 1–200; markdown no blanco 1–10000 caracteres; sin NUL.
No normalizar cuerpo ni ejecutar su contenido. Validar tipos, claves y tamaños.

## 6. Divergencias contractuales

**Decision**: en implementación quitar rutas upload/content y variantes file del
contrato activo del MVP, documentar P2 y regenerar tipos. Conservar operationId
existentes para markdown/módulos y explicitar assistant como lectura publicada.
**Rationale**: OpenAPI actual anuncia binarios y staff ambiguo; FR-005/008 son precisos.
**Alternatives considered**: implementar storage o anunciar rutas sin servicio: descartados.
**Evidence**: docs/reference/openapi/paths/materials.yaml y paths/sections.yaml.

Sin NEEDS CLARIFICATION pendientes. Decisiones verificadas durante implementación;
[evidencia funcional](../../docs/backend/modules-material-validation.md).
