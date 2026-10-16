# Cursos, roles y operaciones institucionales

Implementación de cursos-roles; validación local, sin despliegue.
Dependencia local identidad-acceso conservada, incluidos archivos sin seguimiento.
Base exclusiva: contenedor academix-cursos-test, PostgreSQL 17, puerto local 55439,
base academix_cursos_test; helpers borran su schema public.

## Comportamiento implementado

- User global sin roles administrativos; flags independientes en membership.
- Admin institucional crea cursos; dueño único e inmutable administra los propios.
- Teacher gestiona participantes de su sección; assistant lee; student no lista.
- Creación confirma curso, primera sección, teacher inicial y tres eventos juntos.
- Enrollment admite roles distintos; cambio crea sucesor, revocación conserva historia.
- Admin dueño prevalece sobre teacher al consultar auditoría, incluso sin sección.
- Escrituras usan PoolClient único, locks ordenados y rollback ante fallo de eventos.
- Auditoría append-only, snapshots permitidos, sin secretos ni payloads completos.
- Sin UI, transferencia, coadministración, invitaciones o altas generales de usuarios.

## Onboarding PM

Primero compilar y aplicar schema: pnpm --dir backend build y
pnpm --dir backend db:migrate, con DATABASE_URL segura en entorno.
Para tenant nuevo usar node backend/dist/data-migrations/onboard-institution.js.
Entradas por entorno seguro, nunca argumentos CLI ni archivos versionados:

- ONBOARD_INSTITUTION_SLUG, ONBOARD_INSTITUTION_NAME.
- ONBOARD_USER_ID, ONBOARD_USER_EMAIL, ONBOARD_USER_NAME.
- ONBOARD_OPERATION_ID, ONBOARD_OPERATOR_REF.
- ONBOARD_INITIAL_PASSWORD solo si la identidad es nueva.

UUID/email normalizado deben identificar al mismo User activo si ya existe.
No cambia sus credenciales. Cada operación conserva fingerprint sin secretos.
Repetición aplicada devuelve alreadyApplied y no restaura privilegios revocados.
Onboarding no adopta tenants existentes ni recupera permisos.
Contrato: [onboarding](../../specs/20261014-234844_cursos-roles/contracts/onboarding.md).

## Recuperación y tenants demo existentes

Ejecutar node backend/dist/data-migrations/set-superadmin.js con entorno:

- SUPERADMIN_INSTITUTION_SLUG, SUPERADMIN_USER_ID.
- SUPERADMIN_ENABLED exactamente true o false.
- SUPERADMIN_OPERATION_ID y SUPERADMIN_OPERATOR_REF.
- SUPERADMIN_REPLACEMENT_USER_ID al reemplazar al último responsable.

Este es el artefacto explícito para habilitar UC/UTFSM preexistentes.
No crea personas, pertenencias ni tenants; no modifica is_admin.
Revocar último superadmin exige reemplazo distinto y activo en la misma transacción.
Repetición aplicada no cambia flags posteriores; input distinto con igual ID falla.
Contrato: [recuperación](../../specs/20261014-234844_cursos-roles/contracts/set-superadmin.md).

PM debe provisionar previamente User y membership activos de cada destinatario.
GET memberships y PUT course-admin solo operan sobre esos registros.
No hay endpoint ni importador de altas. El seed demo sigue insert-only y no promueve.
Superadmin puede delegar su propio is_admin; no obtiene acceso académico implícito.

## Evidencia por entrega

Baseline anterior a cambios: backend lint PASS, 11 unitarias y 16 integración PASS.
Foundation/US1: 5 integración PASS; readiness y revocación ampliadas: 7 PASS.
US3: onboarding, delegación y recuperación: 3 integración PASS.
US2: cursos/secciones, enrollments y auditoría: 3 integración PASS.
Frontend US1: 21 PASS; US3: 22 PASS, tipos generados y typecheck PASS.
OpenAPI lint PASS con warning existente de /ready sin respuesta 4xx.
Validación integral final serial: PASS; resultados y límites abajo.

## Trazabilidad

CU-03/04, RF8–12/25–26 y RNF1–4: creación, secciones, participantes, autorización,
aislamiento, historial e integridad. PREP-10 y BE-09–14 sin reasignar responsables.
US3 corresponde a ampliación confirmada por usuario, sin CU histórico inventado.
SC-001: UC/UTFSM y privilegios vigentes. SC-002: auditoría y rollback.
SC-003: unicidad, sucesores y no-op. SC-004: onboarding/delegación/recuperación.

## Comandos ejecutados de validación

Con TEST_DATABASE_URL exclusiva exportada (nombre terminado en _test):

- pnpm --dir backend lint
- pnpm --dir backend test
- pnpm --dir backend test:integration
- pnpm --dir backend test:coverage
- pnpm docs:api:lint
- pnpm --dir frontend api:generate
- pnpm --dir frontend api:check
- pnpm --dir frontend typecheck
- pnpm --dir frontend test
- pnpm --dir frontend lint
- pnpm --dir frontend build
- python3 .github/scripts/check-doc-length.py --self-test
- python3 .github/scripts/check-doc-length.py
- git diff --check
- node backend/test/compose-smoke.mjs
- docker build --tag academix-backend:cursos-check backend
- docker build --tag academix-frontend:cursos-check frontend

Trivy oficial fijado por digest, mediante .github/scripts/trivy.sh:
fs backend/frontend con --scanners vuln,secret,misconfig, e image para ambas imágenes;
--exit-code 1 --ignore-unfixed --severity HIGH,CRITICAL. Los cuatro scans PASS.
No se modificaron exclusiones ni se rebajó severidad. Sin secretos detectados.

pnpm --dir backend audit --audit-level high: PASS.
pnpm --dir frontend audit --audit-level high: FAIL por HIGH preexistente
GHSA-vfj7-8cjw-p6xm en braces 3.0.3, dependencia de desarrollo de eslint-config-next.
pnpm informa que no hay versión parcheada; package.json y lockfile frontend intactos.
Trivy con configuración CI no reporta hallazgos bloqueantes en runtime.
No se cambiaron dependencias para ocultar este hallazgo.

## Resultado anterior a las correcciones de auditoría

| Check | Resultado |
| --- | --- |
| Backend lint/test | PASS; 12 unitarias |
| Backend integración PostgreSQL 17 | PASS; 30 pruebas |
| Backend coverage final serial | PASS; 42/42, líneas 99,41 %, ramas 92,61 % |
| OpenAPI lint / tipos regenerados / api:check | PASS; warning previo de /ready |
| Frontend typecheck/test/lint/build | PASS; 23 pruebas |
| Coverage frontend como CI | PASS; líneas 99,02 %, ramas 97,47 % |
| Docker build backend/frontend, Compose aislado | PASS |
| Trivy fs/image de ambas apps | PASS según configuración CI |
| Longitud documental/self-test y diff --check | PASS |

LCOV en backend/coverage/lcov.info y frontend/coverage/lcov.info, ignorados por Git.
Pruebas US3 usan solo identidades/memberships, con cero cursos como precondición.
Carreras reales cubren ambos órdenes de commit; revocaciones no dejan cambios parciales.
La migración se probó vacía, poblada, repetida y con rollback de batch fallido.
Un contador histórico esperaba dos migraciones: actualizado a tres y verificado.
Se descartó una ejecución contaminada por solapamiento sobre la DB de test;
la ejecución final serial completa es la evidencia de coverage, sin fallos.
No se ejecutó CI remoto ni SonarQube Cloud: SONAR_TOKEN no está disponible.
Publicación separada de los checks locales; sin despliegue ni cambios operativos remotos.

Para repetir localmente, crear DB exclusiva PostgreSQL 17 desechable:
docker run -d --name academix-cursos-test -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=academix_cursos_test -p 127.0.0.1:55439:5432 postgres:17-alpine
Exportar TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/academix_cursos_test.
No ejecutar suites que borran schema en paralelo contra esa misma base.

## Correcciones de auditoría independiente (2026-10-16)

- Sección releída tras bloquear curso; regresión concurrente falla antes y pasa después, con snapshots exactos.
- createCourse declara 400/401/403/404; tipos regenerados y consumidor probado contra HTTP real.
- Perfiles teacher/assistant/student aislados, flags independientes y paginación de miembros activos comprobados.
- Replay conserva ambos flags/timestamps; reutilización conserva User completo; reemplazo permite delegar y preserva datos académicos.
- Auditoría comprueba snapshots exactos y exclusión de secretos para todos los tipos de recurso.

DB propia academix_fixes_test, PostgreSQL 17 desechable; suites seriales. Backend lint/build/coverage PASS: 13 unitarias + 34 integración, 47/47, líneas 99,41 %, ramas 92,86 %.
Frontend tipos/lint/build y 24 tests PASS; coverage 99,02 % líneas/97,47 % ramas; OpenAPI/api:check y Compose PASS.
Audits: backend PASS; frontend conserva HIGH de braces documentado arriba. Sin nueva ejecución de Trivy ni Sonar remoto.
