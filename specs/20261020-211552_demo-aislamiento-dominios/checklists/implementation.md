# Evidencia de implementación

## Baseline

- Árbol limpio; rama `docs/demo-aislamiento-plan`.
- Node 24.14.0, pnpm 9.15.9; backend unit: 25/25 PASS antes de cambios.
- Gobernanza: constitución 1.5.0 y ADR autorizan RLS/path; altas generales excluidas.
- CodeGraph consultado antes de localizar servicios y callers.
- Ignore files: Git/Docker/ESLint cubren dependencias, builds y secretos; paquetes privados.

## Inventario

| Frontera | Componentes |
| --- | --- |
| Global | AuthController, HealthController, InstitutionsController.list |
| Institucional | InstitutionsController.current, MembershipAdminController |
| Académico | CoursesController, SectionsController, EnrollmentsController |
| Contenido | ModulesController, MaterialsController, QuizzesController |
| Evaluación | AttemptsController, GradebookController, AuditController |
| SQL | institution_memberships, courses, sections, enrollments, course_modules, materials |
| SQL | quizzes, grade_items, quiz_attempts, grades, grade_publications, audit_events |
| Fixtures | helpers, course/content/quiz/attempt/gradebook-fixtures |
| Consumo | OpenAPI, catálogo, schema.d.ts, institutions.ts, API tests |

## Pendientes externos

- T042: configuración efectiva Railway, DNS y TLS; prohibido ejecutar en esta sesión.
- T044: smoke HTTPS producción después del despliegue por operador.

## Validaciones intermedias

- Lint backend/frontend y build backend: PASS.
- OpenAPI lint: PASS (warnings de probes públicos y server localhost documentado).
- Cliente api:check/typecheck y frontend: 45/45 PASS; se añadió un caso de baseUrl origen.
- Contrato/catálogo y smoke self-check: 5/5 PASS.
- Compose aislado: imagen, predeploy, seed/replay, readiness, login/list/me y aislamiento PASS.
- Dirigidas: 100 operaciones concurrentes y 20 reusos tras error PASS.
- EXPLAIN cursos/enrollments/grades: owner Index Scan; runtime Result sobre el mismo lookup.
  Dataset pequeño: sin evidencia para nuevos índices ni promesa de benchmark de producción.
- Readiness: owner, SUPERUSER, BYPASSRLS, herencia, grants extra y políticas/RLS débiles rechazados.
- Revocación concurrente: locks y auditoría preservados; fixtures SQL usan runtime para assertions de acceso.
- Primera coverage invalidada por rebuild simultáneo de dist; no cuenta como aceptación.

## US1–US3 y revisión

- US1: vacía 2/10/10; rollback; adopción legacy explícita; colisiones; replay sin secretos;
  tres predeploys repetidos y dos cargas concurrentes; IDs/hashes/revocados preservados.
- US2: sin pool público en servicios; solo límites withInstitution/withIdentity. Operador usa pool aparte.
- US3: workflow demo UC/UTFSM completo, cuentas separadas, delegación explícita, negativos de roles,
  notas ocultas antes de publicar, promedio 7 después; RLS sin filtro sobre las 12 tablas pobladas.
- Workflow respeta cuota de login: espera 62 segundos entre instituciones, sin desactivar throttling.
- Directorio global y actor multi-tenant no abren acceso académico sin contexto.
- Catálogo final: 49 implementadas, 50 documentadas; /users sigue planificada.
- Cliente: baseUrl origen, prefijo singular, 400/401/403/404; frontend lint/api:check/typecheck y 46 tests PASS.
- Provisionador rechaza rol inseguro antes de LOGIN; prueba conserva NOLOGIN tras rechazo.
- Docker Compose final: PASS; runtime/start sin variables operativas; predeploy local, seed/replay y probes.
- Backend pnpm audit --audit-level high: sin vulnerabilidades conocidas; locks de dependencias intactos.
- Docs: README y guía de cliente reconciliados; inventario de rutas/SQL arriba y runbook enlazado.
- Hooks: antes/después de implement solo git commit opcional, no ejecutado; ninguno obligatorio.

## PostgreSQL 18 local

- Contenedor independiente y base academix_pg18_test descartable, sin acceso a producción.
- node --test --test-concurrency=1: cors, demo-migration, runtime-provision, tenant-isolation.
- 8/8 PASS: primera provisión, replay, rol NOLOGIN inseguro, CORS y Location, demo y RLS.
- 100 operaciones/20 reusos tras error y EXPLAIN PASS también en PostgreSQL 18.

## Cierre local

| Verificación | Resultado |
| --- | --- |
| pnpm --dir backend lint / test | PASS; 28 unitarias |
| pnpm --dir backend test:coverage | PASS; 153/153, sin skips/fallos |
| Cobertura c8 | 99.51% líneas/statements; 95.42% branches; 99.25% funciones |
| Integración incluida en coverage | Todas las suites, seriales sobre academix_test PostgreSQL 17 |
| PostgreSQL 18 | 8/8 integración; otra base descartable, sin competir con PostgreSQL 17 |
| Frontend lint / api:check / typecheck / test | PASS; 46/46 |
| OpenAPI lint | PASS; 3 warnings documentados (probes y localhost) |
| Catálogo + smoke self-check | PASS; 5/5 |
| Catálogo build | PASS; 49 implementadas; revisión 126fd8ec4007-4f458696b56e2ef4 |
| Docker Compose final | PASS; imagen, predeploy, probes, seed/replay, autenticación y aislamiento |
| Railway JSON / CI YAML | Parseo y asserts locales PASS; CI remoto no ejecutado |
| Markdown authored | Todos los nuevos/modificados <150 líneas; sin excepciones |
| git diff --check | PASS; sin cambios a lockfiles ni feature.json |

T001–T041 y T043 completadas; T042/T044 quedan pendientes por prohibición explícita de operaciones remotas.
No se modificaron Railway, DNS ni producción. Sin deploy ni merge; PR hacia dev preparada por separado.
Runbook: [pasos concretos de entrega y smoke](../../../docs/backend/demo-tenant-bootstrap.md).
