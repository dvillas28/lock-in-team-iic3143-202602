# Tasks: Catálogo de endpoints

**Input**: `specs/20261019-121536_catalogo-endpoints/`
**Prerequisites**: plan.md, research.md, data-model.md y contracts/catalog.md.

## Phase 1: Setup

- [ ] T001 Confirmar fuentes, permisos y disponibilidad real en docs/reference/api-catalog.md (FR-003/005).
- [ ] T002 Configurar scripts pnpm e ignorados de salida en package.json y .gitignore (FR-008).

## Phase 2: Foundation

- [ ] T003 Añadir pruebas de cobertura, referencias y preservación de release en scripts/api-catalog.test.mjs (FR-003/009).
- [ ] T004 Implementar extracción de rutas registradas y revisión reproducible en scripts/api-catalog.mjs (FR-003/007).

## Phase 3: US1 - Consulta (P1)

**Prueba independiente**: abrir sin backend, recorrer dominios y fichas con teclado.

- [ ] T005 [US1] Publicar Swagger UI oficial con estados, entradas y respuestas en scripts/api-catalog-render.mjs (FR-001/002/010/012).
- [ ] T006 [US1] Servir estilos oficiales de Swagger UI y ajustes de accesibilidad en docs/reference/catalog.css (FR-010).

## Phase 4: US2 - Ejemplos (P1)

**Prueba independiente**: leer ejemplos externos sin depender del portal.

- [ ] T007 [US2] Completar permisos y ejemplos sintéticos en docs/reference/openapi/paths/ y components/schemas/ (FR-004/005/006/007).
- [ ] T008 [US2] Generar curl y ejemplos de respuestas copiables por operación en scripts/api-catalog-render.mjs (FR-002/004/011).
- [ ] T009 [P] [US2] Documentar flujo login/instituciones/me y rechazos en docs/reference/api-catalog.md (FR-004/006).

## Phase 5: US3 - Publicación (P2)

**Prueba independiente**: generar válida; intentar inválida; comparar entrada anterior.

- [ ] T010 [US3] Implementar staging, release, descarga y promoción atómica en scripts/api-catalog.mjs (FR-008/009/012).
- [ ] T011 [US3] Integrar build, pruebas y artefacto revisable en .github/workflows/ci.yml (FR-008/009).

## Phase 6: Polish

- [ ] T012 Registrar comprobaciones de generación, cobertura, descarga, navegación y limitaciones en docs/reference/api-catalog.md (SC-001/004/005/006).
- [ ] T013 Revisar integridad, referencias, documentos y finalizar specs/20261019-121536_catalogo-endpoints/tasks.md (FR-001–012).

## Dependencies and delivery

T001 → T002 → T003 → T004 → US1; US2 puede documentarse sobre contrato sin portal.
US3 necesita generador, renderer y tests; T012/T013 cierran todas las historias.
T009 puede ejecutarse en paralelo con renderer una vez confirmado contrato.
MVP: US1; entrega actual incluye US1–US3. Sin agentes de implementación paralelos.
No cambian tenants, persistencia, autorización ni auditoría académica.
## Revisión Swagger UI (FR-013)

- [ ] T014 [US1] Sustituir fichas propias por Swagger UI en scripts/api-catalog-render.mjs y scripts/api-catalog-init.js.
- [ ] T015 [US3] Empaquetar assets/licencias locales y fijar dependencia en scripts/api-catalog.mjs, package.json y pnpm-lock.yaml.
- [ ] T016 [US1] Verificar filtro, enlaces, ejemplos, carga fallida y ausencia de ejecución/remotos en scripts/api-catalog.test.mjs y navegador.
- [ ] T017 Simplificar portada y reconciliar spec, plan, ADR y evidencia en docs/reference/api-catalog.md y docs/adr/static-api-catalog.md.

SC-002/003 requieren cinco lectores y entorno con cuentas; pendientes de evaluación humana.
