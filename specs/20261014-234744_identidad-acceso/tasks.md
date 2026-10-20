# Tasks: Identidad global y acceso institucional

**Input**: `specs/20261014-234744_identidad-acceso/`.
**Prerequisites**: [spec](spec.md), [plan](plan.md), [modelo](data-model.md),
[HTTP](contracts/http.md), [seguridad](contracts/security.md), [quickstart](quickstart.md).
**Estado**: En implementación; tareas marcadas verificadas localmente, evidencia en docs/backend/identity-access-validation.md.
**T027**: auditoría frontend adicional fuera del alcance de la tarea; GHSA-vfj7-8cjw-p6xm se sigue por separado. Checkbox conservado por instrucción; resultados en la evidencia enlazada.
**Backlog**: PREP-07, INST-03, INF-03, BE-03–BE-08; conservar responsables existentes.
**Cobertura**: CU-01/02; RF1–RF7, RF25; RNF1–RNF2. No agregar UI ni roles académicos.

## Format

Checkbox + ID secuencial + [P] opcional + [USn] en historias + acción/rutas.
[P] permite archivos distintos tras los prerrequisitos indicados; no omite dependencias.
Pruebas exigidas por supuestos del spec: negativos, dos tenants y revocación.

## Phase 1: Setup

- [X] T001 Verificar migración/seed de base-persistente, PostgreSQL 17 y fixtures UC/UTFSM en backend/test/integration/helpers.mjs; usar solo TEST_DATABASE_URL terminada en _test y registrar prerrequisito en specs/20261014-234744_identidad-acceso/quickstart.md (FR-001/002).
- [X] T002 Instalar @nestjs/jwt@12.0.3 y @nestjs/throttler@6.7.1 mediante pnpm add --save-exact, generar lockfile y comprobar resolución sin overrides ni peers incompatibles en backend/package.json y backend/pnpm-lock.yaml; conservar node:test y argon2 existentes (FR-001/007/008).

## Phase 2: Foundation

- [X] T003 Extender backend/test/integration/helpers.mjs para lanzar/cerrar HTTP con DB exclusiva, secreto efímero, credenciales en memoria y logs capturados; no cambiar a DATABASE_URL ni mostrar valores sensibles en assertions (FR-006, SC-001).
- [X] T004 [P] Escribir backend/test/problem.filter.test.mjs para Problem completo y sanitizado: 400/401/403/404/413/415/429/500/503, WWW-Authenticate, Retry-After preservado y contrato de sondas intacto (FR-003/006/007).
- [X] T005 Implementar backend/src/http/problem.filter.ts y registrarlo en backend/src/main.ts: errores seguros, traceId servidor, instance sin query, cuerpo JSON ≤4 KiB y manejo 400/413/415; preservar /health y /ready públicos (FR-003/006/007).

**Checkpoint**: Infraestructura verificable; ningún endpoint académico ni tabla futura.

## Phase 3: US1 - Ingresar con identidad global (P1)

**Goal**: Cuenta demo activa inicia sesión y obtiene sus instituciones autorizadas.
**Independent Test**: Sobre seed base, multi lista UC/UTFSM, UC solo UC, UTFSM solo
UTFSM y revocado lista vacía; credenciales incorrectas/inactivo y JWT inválido → 401.

### Contract

- [X] T006 [US1] Integrar contrato de login y listado en docs/reference/openapi/paths/auth.yaml, components/schemas/auth.yaml y docs/reference/openapi/openapi.yaml; actualizar GET institutions en docs/reference/openapi/paths/platform.yaml con institución activa, 503 y no-store; conservar operationIds y validar con pnpm docs:api:lint antes de implementar US1 (FR-001/002/003/006/007/008).

### Verification

- [X] T007 [P] [US1] Añadir backend/test/auth.test.mjs para secreto base64 ≥32 bytes obligatorio, email/password según data-model.md, JWT HS256/iss/aud/sub/iat/exp, vencimiento 900 s y rechazo de none, firma/claims inválidos o ausentes (FR-001/007/008, SC-001).
- [X] T008 [P] [US1] Añadir backend/test/integration/login-email.test.mjs: migración vacía/poblada/repetida, colisión normalizada con rollback sin pérdida y dos inserciones concurrentes de email equivalente admiten solo una; seed repetible sin cambios (FR-008 y edge cases).
- [X] T009 [P] [US1] Añadir backend/test/integration/auth.test.mjs: login correcto, mismo 401 por desconocido/password/inactivo, DTO/JSON/tamaño/media type inválidos, token/headers de éxito y logs sin secretos; sin escrituras de usuarios/memberships al repetir (FR-001/006/007/008).
- [X] T010 [P] [US1] Añadir backend/test/integration/institution-list.test.mjs: listado ordenado UC/UTFSM sin cruces, estados activos, vacío, 401 sin identidad y 503 sin fallback; comparar esquema InstitutionListResponse (FR-002/003/004, SC-001/003).

### Implementation

- [X] T011 [US1] Crear backend/migrations/<timestamp>_unique_login_email.sql con índice UNIQUE lower(btrim(email)); timestamp posterior al existente, sin backfill ni editar migración aplicada; colisiones abortan sin eliminar/fusionar datos (FR-008).
- [X] T012 [US1] Implementar backend/src/auth/auth.service.ts: validar configuración al arrancar, DTO estricto, consulta email parametrizada, argon2.verify real/dummy, activo y 401 genérico; firmar claims mínimos por 900 s sin registrar credenciales (FR-001/006/007/008).
- [X] T013 [US1] Implementar backend/src/auth/auth.guard.ts: Bearer único ≤4096 bytes, HS256 y claims obligatorios verificados antes de DB, User activo persistido por operación, 401/503 sanitizados y excepciones públicas explícitas (FR-001/003/004/008).
- [X] T014 [US1] Implementar POST /api/v1/auth/login en backend/src/auth/auth.controller.ts con 200/no-store y ThrottlerGuard solo en login: limit=5, ttl=60000 ms, blockDuration=60000 ms, IP observada sin confiar X-Forwarded-For y Retry-After restante (FR-006/007/008).
- [X] T015 [US1] Implementar listado en backend/src/institutions/institutions.service.ts y backend/src/institutions/institutions.controller.ts: JOIN User/membership/Institution activos, sub verificado, proyección explícita sin hash, orden slug y items=[] (FR-002/004/006).
- [X] T016 [US1] Registrar providers, JwtModule, ThrottlerModule, controladores y guard global en backend/src/app.module.ts; configurar límites/parser sin confiar proxies en backend/src/main.ts y comprobar que solo sondas/login son públicos (FR-001/003/007).
- [X] T017 [US1] Añadir AUTH_JWT_SECRET sin default en .env.example y passthrough requerido en docker-compose.yml; dar secreto efímero a arranques HTTP de backend/test/integration/readiness.test.mjs y comprobar arranque sin/corto secreto sin regresión de sondas (FR-006/008).
- [X] T018 [US1] Verificar cuota y concurrencia en backend/test/login-limit.test.mjs: cinco verificaciones máximas por IP, sexta 429, headers falsos no eluden, TTL/desbloqueo con reloj controlado y sin sleeps; preservar Retry-After tras filtro (FR-007).
- [X] T019 [US1] Regenerar frontend/src/lib/api/schema.d.ts mediante pnpm api:generate; en frontend/src/lib/api/client.ts excluir login/health/ready de Authorization y getToken, cubrirlo en frontend/test/api.test.ts y ejecutar api:check/typecheck/test antes del checkpoint US1 (FR-001/006).
- [X] T020 [US1] Ejecutar tests US1, migración+seed, cliente HTTP real y checks del contrato/cliente tipado; registrar resultados sin credenciales en docs/backend/identity-access-validation.md, incluidos negativos y ausencia de mutaciones (SC-001/003).

**Checkpoint MVP**: Login/listado, contrato OpenAPI y cliente tipado entregados sin US2 ni cursos; negativos y checks del consumidor verdes.

## Phase 4: US2 - Elegir institución (P1)

**Goal**: Mismo JWT cambia contexto por slug y observa permisos persistidos vigentes.
**Independent Test**: Multi consulta UC/UTFSM; revocar UC por fixture y COMMIT,
reusar JWT: UC devuelve 404 y desaparece del listado, UTFSM sigue accesible.
**Dependency**: US1 entrega login, guard y listado; no requiere cursos ni Enrollments.

### Verification

- [X] T021 [P] [US2] Añadir backend/test/integration/institutions.test.mjs: /me CurrentUser con sectionMemberships=[], slug inválido, contexto inexistente/ajeno/inactivo/revocado con mismo 404, token inválido 401 antes del slug y proyección sin secretos (FR-002/003/005/006, SC-001/003).
- [X] T022 [P] [US2] Añadir backend/test/integration/access-revocation.test.mjs: mismo JWT tras COMMIT de revocación/inactivación de membership/Institution/User, listado y /me vigentes, alternancia/concurrencia UC/UTFSM, DB caída 503; restaurar fixtures (FR-002/004 y SC-002/003).

### Implementation

- [X] T023 [US2] Agregar lectura contextual en backend/src/institutions/institutions.service.ts: un JOIN por sub y slug con tres estados activos, 404 indistinguible sin filas, DTO CurrentUser y sectionMemberships=[]; sin cachear permisos ni aceptar role/experience (FR-002/003/004/005).
- [X] T024 [US2] Exponer GET /api/v1/institutions/{institutionSlug}/me en backend/src/institutions/institutions.controller.ts: validar patrón/longitud tras guard, identidad de request y no-store; sin endpoint que mute una institución de sesión; actualizar contrato /me en docs/reference/openapi/paths/platform.yaml con 400/503/no-store, conservar CurrentUser/operationId y regenerar frontend/src/lib/api/schema.d.ts (FR-002/003/005/007).
- [X] T025 [US2] Ejecutar negativos US2 y repetir regresión US1 con PostgreSQL real, lint OpenAPI y frontend api:check/typecheck/test; registrar revocación posterior al COMMIT y límites de consultas ya iniciadas en docs/backend/identity-access-validation.md (SC-001/002/003).

## Phase 5: Integration and delivery

- [X] T026 Actualizar docs/reference/openapi/README.md y specs/20261014-234744_identidad-acceso/quickstart.md con decisiones resueltas, commands/env, migración con colisiones, una instancia/cuota proxy y exclusiones; mantener docs <150 líneas (FR-007/008).
- [ ] T027 Ejecutar lint/test/test:coverage backend con PostgreSQL 17, lint OpenAPI, frontend api:check/typecheck/test y check-doc-length.py; confirmar inclusión automática de nuevos tests en .github/workflows/ci.yml y registrar resultados reales en docs/backend/identity-access-validation.md (SC-001–003).
- [X] T028 Validar imagen backend/Compose con secreto temporal y DB demo aislada, migración+seed repetidos, sondas públicas y login/listado/me; registrar evidencia sanitizada y pendientes de proxy/despliegue en docs/backend/identity-access-validation.md sin cerrar pendientes de base-persistente (FR-001/002/006/008).

## Dependencies & Execution Order

- Base-persistente operativa → T001–T002 → T003/T004 → T005 → US1 → US2 → cierre.
- T006 fija el contrato US1 antes de T007–T010 (pruebas en archivos separados).
  T011 precede login; T012 → T013/T014; T013/T015 → T016 → T017 → T018.
- T006 precede T019; T018/T019 → T020. US1 no cierra sin OpenAPI y checks del cliente.
- T021/T022 pueden escribirse juntas; T023 → T024 → T025. T024 sincroniza contrato
  y tipos /me; T025 valida consumidores antes de cerrar US2. Revocación es fixture.
- T026 → T027 → T028. No modificar juntos AppModule o main.ts.
- Suite integración secuencial: sus fixtures comparten DB exclusiva y reset schema.
  [P] permite autoría en archivos separados, no ejecución concurrente de esos tests.

## Parallel execution examples

- US1: T007 + T008 + T009 + T010 tras T006; cada tarea tiene su archivo.
- US2: T021 + T022 tras US1; luego T023 y T024 secuenciales por comportamiento.
- Cada grupo espera interfaces del plan; cambios de archivos compartidos tienen un dueño.

## Implementation Strategy

1. Completar prerrequisitos y foundation sin servicios nuevos.
2. Entregar MVP US1: login + listado, contrato/cliente tipado, negativos y límites.
3. Entregar US2 sobre US1: contexto, revocación y su contrato/tipos sincronizados.
4. Cerrar regresión global y evidencia, sin marcar pendientes como hechos.
