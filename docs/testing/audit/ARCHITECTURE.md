# Arquitectura y reproducibilidad auditadas

## Topología y versiones del commit base

| Área | Evidencia | Resultado |
| --- | --- | --- |
| Repo | [package.json](../../../package.json) | Scripts raíz delegan; pnpm 9.15.9 |
| Paquetes | [backend](../../../backend/package.json), [frontend](../../../frontend/package.json) | Tres lockfiles independientes; no `pnpm-workspace.yaml` |
| Frontend | package frontend, [next.config.ts](../../../frontend/next.config.ts) | Next 16.4.1, React 19.3.0, TS 5.9.3, App Router, standalone |
| API | package backend, [app.module](../../../backend/src/app.module.ts) | Nest 12.1.0, módulos monolíticos, JWT 12.0.3, argon2 0.45.1 |
| Persistencia | [database.service](../../../backend/src/database/database.service.ts) | pg 8.23.1; pool 5; conexiones/queries 2 s; SQL sin ORM |
| Migraciones | [directorio](../../../backend/migrations) | 11 SQL; node-pg-migrate 9.0.0; bootstrap y operador separados |
| Datos globales | [foundation](../../../backend/migrations/20261015000100_institutional-foundation.sql) | users, institutions; membresía une identidad y tenant |
| Académicos | [cursos](../../../backend/migrations/20261016000100_courses_roles.sql) | courses, sections, enrollments, audit_events |
| Contenido | [migración](../../../backend/migrations/20261016000200_modules_material.sql) | course_modules y materials Markdown |
| Evaluación | [quiz](../../../backend/migrations/20261019000100_quiz_authoring.sql), [intentos](../../../backend/migrations/20261019000200_attempts_grades.sql) | JSONB questions/alternatives; grade_items, quiz_attempts, grades |
| Publicación | [migración](../../../backend/migrations/20261019000300_grade_publication.sql) | grade_publications; recibos e historia inmutables |
| Operación | [runtime/demo](../../../backend/migrations/20261020000100_runtime_and_demo.sql) | demo_data_runs y pgmigrations; no dominio UI |
| Storage | [alcance](../../deliveries/2/02-scope.md) | No adaptador object storage; binarios diferidos |

## Identidad y tenant

[AuthGuard](../../../backend/src/auth/auth.guard.ts) valida un Bearer, firma/claims y User activo.
[AuthService](../../../backend/src/auth/auth.service.ts): HS256, issuer `academix-api`, audience
`academix-clients`, duración exacta 900 s, argon2id; login global sin tenant; no refresh/logout API.
[TenantGuard](../../../backend/src/tenancy/tenant.guard.ts) solo normaliza path/contexto;
la autorización efectiva ocurre en `withInstitution` y servicios, no en ese guard por sí solo.
`withIdentity` abre transacción y limpia contexto; `withInstitution` resuelve slug activo,
establece UUID local a transacción y revalida membership. Locks revalidan cambios concurrentes.
[RLS](../../../backend/migrations/20261020000200_tenant_isolation.sql) usa FORCE sobre 12 tablas tenant;
[checkRuntime](../../../backend/src/database/runtime-check.ts) rechaza owner, superuser, BYPASSRLS, DDL y grants inseguros.
FK compuestas y triggers conservan historia y relaciones institucionales.

El dominio frontend selecciona contexto, pero API autoriza por path + identidad/membership;
Host/Origin/x-tenant no conceden privilegios. Un multi-miembro puede usar su token global
contra ambos paths si conserva ambos permisos. No exigir token ligado a dominio.
CORS permite orígenes exactos, sin cookies, y expone Location/Retry-After.

## Frontend y sesiones

[Session](../../../frontend/src/lib/auth/session.ts) guarda token solo en instancia de memoria.
Recargar/pagehide cierra sesión; navegación SPA conserva sesión; cambio de subdominio no la transfiere.
Generation, AbortController, referencia de contexto y secuencias descartan respuestas viejas.
`/me` se revalida al foco/visibilidad/pageshow; scope idéntico conserva borradores.
401 borra sesión; 403/404 secundarios revalidan sin cerrar globalmente si `/me` sigue válido.
Fallo temporal de revalidación puede conservar lectura con escritura bloqueada.
[API client](../../../frontend/src/lib/api/client.ts) usa `no-store`, `credentials: omit`,
sin redirects ni Authorization en públicos. Timeout privado 15 s en Session.
No middleware Next de autenticación ni cookie SSR: componentes privados controlan montaje.

## Scripts actuales, sin ejecutar en esta auditoría

| Comando existente | Alcance real |
| --- | --- |
| `pnpm build`, `pnpm lint` | Ambas apps; requiere instalar raíz y cada app |
| `pnpm test` | Solo tests backend; no significa suite completa |
| `pnpm --dir frontend test` | 55 archivos node:test/tsx, jsdom y fixtures; sin navegador real |
| `pnpm --dir backend test` | Build + 16 archivos unitarios/componentes |
| `pnpm --dir backend test:integration` | 65 archivos HTTP/SQL/CLI; PostgreSQL real; concurrency 1 |
| `pnpm --dir backend test:coverage` | c8 sobre unitarios e integración; no cobertura E2E |
| `pnpm --dir frontend test:coverage` | c8 con mínimo 80% líneas/branches; distinto de flujos |
| `pnpm docs:api:lint`, `pnpm docs:api:test`, `pnpm --dir frontend api:check` | Contrato/catálogo/tipos |
| `pnpm --dir backend db:predeploy` | Migra, provisiona runtime y bootstrap opt-in; exige base aislada |

No Playwright/Cypress/Webdriver ni scripts E2E de navegador encontrados en paquetes/config.
QA en docs registra navegador real y SQL; no constituye harness automatizado reutilizable.
No ejecutar helpers de integración junto a E2E: `reset` hace DROP SCHEMA y el proceso HTTP expira a 180 s.
El catálogo Swagger UI 5.34.0 se genera desde scripts/api-catalog*.mjs y se sirve estáticamente
por localhost8080; no usa App Router ni API/DB para lectura. Tiene tests Node y QA navegador histórica,
pero sin script Playwright durable; se incorpora como superficie adicional CATALOG.

## CI/CD y entorno

[ci.yml](../../../.github/workflows/ci.yml): PR, push main, dispatch; no regresión push dev ni schedule.
Jobs docs/contratos/lint/build/Docker/Trivy, integración PG17/c8, Sonar y agregador CI result.
[release](../../../.github/workflows/release.yml): push dev crea tag; main release y APP_VERSION Render.
[board](../../../.github/workflows/board-snapshot.yml) y [reviewer](../../../.github/workflows/pr-reviewer.yml)
son auxiliares; no ejecutan navegador. No se modifican aquí.
[render.yaml](../../../render.yaml) configura main, dos servicios Docker y PG17;
`checksPass`, readiness `/ready`, predeploy antes de HTTP; no acredita despliegue remoto.
Portal configurado es origen Render; dominio público citado por usuario no se verificó por red.
[Compose](../../../docker-compose.yml) levanta PG17, API y frontend; requiere secreto JWT y orígenes de build.
No reutilizar su volumen `postgres_data` para E2E; proponer stack efímero separado.

## Obstáculos que el diseño debe resolver

- Sin workspace: instalar paquetes separadamente y proponer paquete `e2e/` independiente.
- Límite JSON global 4096 bytes frente a Markdown de 10000 caracteres y preguntas múltiples.
- Rate limit login: 5 solicitudes/IP/60 s, incluida autenticación correcta; sexta bloquea 60 s.
- HTTP runtime debe usar academix_runtime y migrador otro rol; DB vacía sin seed no permite login.
- Demo seed preserva cambios/revocaciones; repetir no restaura baseline y estudiantes ficticios no pueden loguear.
- NEXT_PUBLIC se fija en build; configurar hosts antes de build, CORS real y DNS UC/UTFSM.
- Solo memoria: storageState no restaura React Session; no sirve asumir setup login por worker.
- Locks de Course serializan muchas operaciones; paralelismo por curso y medición de pool.
- Deuda sub-ms aceptada: límites efectivos de ms en intentos; no prometer precisión µs.
