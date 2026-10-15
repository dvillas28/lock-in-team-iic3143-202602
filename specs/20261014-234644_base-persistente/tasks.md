# Tasks: Base persistente y datos demo

**Feature**: `specs/20261014-234644_base-persistente/`
**Branch**: `feat/base-persistente` | **Date**: 2026-10-15
**Input**: [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[operación](contracts/operations.md), [demo](contracts/demo-dataset.md),
[readiness](contracts/readiness.openapi.yaml) y [quickstart](quickstart.md).
**Estado**: 30 tareas pendientes; generar tareas no ejecuta implementación.
**Tests**: requeridos por spec/constitución; escribir pruebas antes del comportamiento.
**Responsables**: mantener asignaciones del backlog; no reasignar por estas tareas.

## Phase 1: Setup

- [ ] T001 Instalar pg@8.23.1, node-pg-migrate@9.0.0 y argon2@0.45.1 como dependencias productivas y @types/pg exacto en desarrollo, con pnpm; actualizar `backend/package.json` y `backend/pnpm-lock.yaml` sin agregar ORM (FR-001/003/004).
- [ ] T002 Documentar DATABASE_URL y TEST_DATABASE_URL separadas en `.env.example`, sin credenciales demo predeterminadas ni URLs Railway reales; conservar las variables del skeleton (FR-006/007).

## Phase 2: Foundation

- [ ] T003 Crear harness `backend/test/integration/helpers.mjs`: exigir TEST_DATABASE_URL terminada en _test, sin fallback a DATABASE_URL, secretos aleatorios y limpieza solo del destino validado; probar rechazo previo a conectar en `backend/test/integration/config.test.mjs` (FR-005/007).
- [ ] T004 Agregar test:integration en `backend/package.json`: compilar y ejecutar `test/integration/*.test.mjs` secuencialmente con node:test; conservar tests actuales sin dependencia de DB y verificar el guard de T003 (FR-005/006).

**Checkpoint**: herramientas instaladas y harness aislado; sin tocar DB de desarrollo/productiva.

## Phase 3: US1 — Preparar entorno reproducible (P1)

**Goal**: esquema durable y backend que solo se declara listo con persistencia disponible.
**Independent Test**: migrar DB vacía, insertar identidad/membership de fixture,
reiniciar y comprobar IDs/relaciones; arrancar sin DB falla sin escuchar HTTP.

### Verification

- [ ] T005 [P] [US1] Escribir `backend/test/integration/persistence.test.mjs`: migración repetida, tres tablas/constraints, slug y membership duplicados, FK inexistente, borrado restringido, identidad multiinstitución, rollback de DDL/historia y lock concurrente; fixture de migración fallida solo en test (FR-001/002/003/005, SC-002).
- [ ] T006 [P] [US1] Escribir `backend/test/integration/readiness.test.mjs`: contrato 200/503 sin secretos, rechazo de URL/TLS inválidos, pérdida de DB/esquema, conexión/cola saturada, arranque fallido ≤30 s, respuesta ≤5 s y cierre sin conexiones pendientes; preservar respuesta de /health (FR-005/006).

### Implementation

- [ ] T007 [US1] Crear `backend/migrations/20261015000100_institutional-foundation.sql` con Institution/User/Membership según modelo, NOT NULL, límites/checks, timestamps, unicidades/FK RESTRICT e índice acordado; no agregar email único, tablas académicas o down destructivo (FR-001/002/005).
- [ ] T008 [US1] Implementar `backend/src/platform/database/migrate.ts`: runner v9, public/pgmigrations, up transaccional con orden/bloqueo, SQL localizado desde archivo compilado, timeouts y salida/log sanitizados del contrato; exponer db:migrate en `backend/package.json` (FR-003/006/007).
- [ ] T009 [US1] Implementar `backend/src/platform/database/database.service.ts` y `backend/src/platform/database/database.module.ts`: exportar un único Pool máximo 5, conexión/cola y consulta 2 s, validación de URL/TLS/esquema mínimo, errores sanitizados y cierre; sin migraciones en hooks HTTP (FR-001/005/006).
- [ ] T010 [US1] Integrar DatabaseModule en `backend/src/app.module.ts` y `backend/src/platform/platform.module.ts` reutilizando el proveedor; en `backend/src/main.ts` habilitar shutdown y fallo acotado antes de listen, sin imprimir conexión ni secretos (FR-005/006).
- [ ] T011 [US1] Implementar `backend/src/platform/health/readiness.controller.ts` y registrarlo en `backend/src/platform/platform.module.ts`: /ready público valida conexión/estructura y devuelve solo status ok/unavailable; conservar `backend/src/platform/health/health.controller.ts` (FR-005/006).
- [ ] T012 [US1] Actualizar `backend/Dockerfile`: incluir SQL en /app/migrations y dependencias productivas; mantener usuario no privilegiado y ejecución con node sin npm/pnpm; verificar CLI de migración desde imagen (FR-003/006).
- [ ] T013 [US1] Ajustar `docker-compose.yml` para esperar PostgreSQL healthy, ejecutar migración antes de exec HTTP y sondear /ready antes de iniciar frontend; preservar volumen y no ejecutar bootstrap todavía (FR-003/006).
- [ ] T014 [US1] Configurar preDeployCommand de migración compilada y healthcheckPath /ready en `backend/railway.json`, conservando builder/PORT/timeouts; no ejecutar bootstrap en cada deploy (FR-003/006).
- [ ] T015 [US1] Integrar /ready desde el contrato en `docs/reference/openapi/openapi.yaml` y `docs/reference/openapi/paths/platform.yaml`, manteniendo /health y contratos académicos existentes (FR-006/007).
- [ ] T016 [US1] Ejecutar pruebas T005/T006, migración y reinicio con volumen desde Compose; registrar resultados reales en `docs/backend/base-persistente-validation.md` sin hashes/secretos y comprobar rechazo de acceso público a bootstrap (FR-001/005/006/007, SC-002/003 local).

**Checkpoint MVP**: US1 usable sin demo; tablas vacías válidas y /ready disponible.
Evidencia Railway de SC-003 queda pendiente hasta T029; no declarar cierre total.

## Phase 4: US2 — Preparar demo repetible (P1)

**Goal**: UC/UTFSM y sus identidades demo se preparan sin alterar datos existentes.
**Independent Test**: ejecutar bootstrap dos veces y concurrentemente; comparar
IDs, cantidades, hashes, estados y timestamps sin imprimir sus valores sensibles.

### Verification

- [ ] T017 [P] [US2] Escribir `backend/test/integration/bootstrap.test.mjs`: opt-in ausente/false, flag inválido, cinco contraseñas obligatorias y límites Unicode, manifiesto 2/5/6, hash/verify, repetición/concurrencia, colisión UUID/email, rollback intermedio y preservación de nombre/hash/estado/timestamps; comprobar salida y logs sanitizados (FR-003/004/005/007, SC-001/002).

### Implementation

- [ ] T018 [P] [US2] Crear `backend/src/platform/database/demo-data.ts` con slugs, nombres, cinco UUID/email .example y seis memberships exactamente como contrato demo; sin contraseñas, roles académicos ni filas futuras (FR-001/004).
- [ ] T019 [US2] Implementar frontera CLI en `backend/src/platform/database/bootstrap.ts`: omitir sin conectar si demo no habilitada, validar cinco secretos antes de escribir, exit 0/1 y categorías/resúmenes sanitizados; nunca exponer ruta pública (FR-004/007).
- [ ] T020 [US2] Completar transacción de `backend/src/platform/database/bootstrap.ts`: advisory xact lock, resolver slug/UUID/pareja, validar colisiones, insertar solo faltantes y producir PHC Argon2id solo para usuario nuevo; rollback/release/cierre y timeouts según contratos, sin UPDATE de existentes (FR-001/002/003/004/005, SC-001/002).
- [ ] T021 [US2] Agregar db:bootstrap en `backend/package.json` y variables DEMO_* vacías con DEMO_BOOTSTRAP_ENABLED=false en `.env.example`; documentar parámetros de Argon2id del research sin introducir autenticación (FR-004/007).
- [ ] T022 [US2] Extender `docker-compose.yml` a migración → bootstrap opt-in → exec HTTP y pasar variables demo explícitamente; ausencia de demo es no-op y fallo de preparación impide iniciar HTTP (FR-003/004/006).
- [ ] T023 [US2] Verificar imagen de `backend/Dockerfile` contra DB de test: ejecutar ambos CLI y hash/verify Argon2id en Alpine sin gestores de paquetes; dejar comandos reproducibles en `specs/20261014-234644_base-persistente/quickstart.md` y resultados sanitizados en `docs/backend/base-persistente-validation.md` (FR-004/006).
- [ ] T024 [US2] Ejecutar T017 y demo local repetida/concurrente, incluyendo revocación previa y cambio de variables de contraseña; registrar resultado sin valores secretos en `docs/backend/base-persistente-validation.md` (FR-003/004/005/007, SC-001/002).

**Checkpoint**: base vacía produce 2 instituciones, 5 users y 6 memberships;
una base operada conserva cambios. No añadir JWT, roles ni tests HTTP académicos.

## Phase 5: Integration and delivery

- [ ] T025 [P] Agregar PostgreSQL 17 y ejecución test:integration con URL exclusiva de test en `.github/workflows/ci.yml`; conservar lint/tests, Docker, Trivy, SonarQube y CI result, incluyendo el nuevo job si se crea uno (FR-005/006).
- [ ] T026 [P] Escribir `docs/guides/backend-persistence.md` (<150 líneas) con arranque, comandos compilados, env, bootstrap opt-in, TLS, rollback de app y recuperación; enlazarlo desde `README.md` respetando límite documental (FR-003/006/007).
- [ ] T027 Ejecutar quickstart local, lint/test/test:integration, build Docker, lint OpenAPI y longitud documental; reconciliar instrucciones con comandos reales en `specs/20261014-234644_base-persistente/quickstart.md` y registrar evidencia en `docs/backend/base-persistente-validation.md` (FR-006, SC-001/002/003 local).
- [ ] T028 Verificar checks remotos del cambio y compatibilidad de la versión anterior con esquema aditivo; registrar ejecución/commit y resultado sin afirmar éxito de checks pendientes en `docs/backend/base-persistente-validation.md` (FR-003/006).
- [ ] T029 Verificar contexto Railway y usar una DB vacía aislada del entorno de validación, sin vaciar la existente; conectar por referencia privada, desplegar `backend/railway.json`, migrar y ejecutar bootstrap explícito para comprobar 2/5/6; después reiniciar y comprobar IDs/relaciones/readiness; registrar instalación vacía y durabilidad como evidencias separadas o bloqueo en `docs/backend/base-persistente-validation.md` (FR-006/007, SC-003 Railway).
- [ ] T030 Ensayar dump/restore completo en destino vacío separado, verificar IDs/constraints/readiness y revisar snapshots/PITR/retención reales; registrar RPO/RTO medidos, brechas y matriz FR/SC en `docs/backend/base-persistente-validation.md`, sin versionar dumps ni marcar pendientes como terminados (FR-005/006, SC-003).

## Dependencies & Execution Order

```text
T001–T002 → T003–T004 → US1 (T005–T016) → US2 (T017–T024)
→ T025/T026 → T027 → T028 → T029 → T030
```

- Las pruebas de cada historia se escriben antes de su implementación.
- T007/T008 preceden al arranque con esquema; T009 precede a wiring/readiness.
- T010/T011 completan juntos el wiring; T012 precede a Compose y smoke de imagen.
- T019 requiere T017/T018; T020 precede a exponer bootstrap en scripts/Compose.
- Orden secuencial salvo [P]; [P] permite editar archivos distintos, no ejecutar
  tests simultáneamente sobre la misma DB. Compartir migración bajo un solo dueño.
- T029/T030 requieren entorno real y operador autorizado; si falta acceso o backup,
  mantener la tarea pendiente y registrar bloqueo, sin inventar evidencia.
- Si evidencia crece a 150 líneas, dividir por validación y enlazar un índice;
  150–200 solo con justificación, nunca superar 200.

## Parallel Examples

- **US1**: después de T004, escribir T005 y T006 en paralelo: archivos separados,
  basados en modelo y contrato ya definidos; ejecutar suite serialmente.
- **US2**: después de T016, escribir pruebas T017 y manifiesto T018 en paralelo;
  ambos leen el contrato demo y T019 espera los dos.
- **Cierre**: T025 (CI) y T026 (guía/README) no comparten archivos; T027 espera ambos.

## Implementation Strategy

1. Completar Setup/Foundation y US1 como MVP verificable sin bootstrap.
2. Entregar US2 sobre esa base, con pruebas de conservación y concurrencia.
3. Integrar CI, documentación y validaciones locales antes de Railway.
4. Cerrar solo con evidencia de ambos entornos y recuperación; fuera de alcance:
   login, permisos académicos, AuditEvent de curso, ORM, RLS y storage.

