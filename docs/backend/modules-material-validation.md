# Módulos y material: evidencia local

Fecha: 2026-10-16. Scope: Foundation, US1, US2 e integración.
Spec: `specs/20261014-234944_modulos-material`; variable
`SPECIFY_FEATURE_DIRECTORY=specs/20261014-234944_modulos-material` usada en prerequisites.

## Base comprobada y aislamiento

PR #86 abierto, rama `feat/cursos-roles-backend`, commit `57a113e1280fc4c1f95c97aa93efbbab80238cd8`.
Base del PR anterior: docs/cursos-roles-spec. Branch nueva: feat/modulos-material.
Worktree separado /tmp/academix-modulos-material; workspace original conservado,
incluido trabajo local de otras specs, sin stash, reset ni commits ajenos.
Se incorporan solo artefactos de esta misión y su ADR de markdown.
Identidad-acceso/cursos-roles operativos: suite base real 47/47 PASS;
líneas 99,41 %, ramas 92,86 %. Incluye login, contexto, roles, cursos, secciones,
revocaciones, auditoría, onboarding y cliente generado contra HTTP real.
CI funcional del PR #86 PASS; Sonar/CI result remotos FAIL preexistentes.
No se implementaron dependencias de otras specs.

Node 24.14.0, pnpm 9.15.9, PostgreSQL 17 en contenedor academix-modulos-test,
puerto local 55447, base exclusiva academix_modulos_test. Helpers rechazan
TEST_DATABASE_URL sin sufijo _test; las suites recrean public y corren en serie.
Passwords/JWT efímeros y locales; logs comprobados sin credenciales.

## Comportamiento y correspondencia

| Requisito | Evidencia ejecutable |
| --- | --- |
| FR-001 | modules-write + content-integrity: alta, edición, orden completo, swaps, publicación/no-op |
| FR-002 | materials-write: markdown, actor servidor, edición compartida, publicación independiente |
| FR-003 / SC-002 | Dos secciones del mismo curso reciben mismos IDs; FK compuestas rechazan cruces |
| FR-004 / SC-001 | content-read: cuatro estados padre/ítem, lista/detalle de módulos y materiales |
| FR-005 / SC-003 | content-read/revocation: User/Institution/membership/Enrollment activos, enlaces y tenant ajenos |
| FR-006 | content-integrity: nueve mutaciones con fallo audit, rollback completo, historia inmutable y carreras |
| FR-007 | content-validation/contract + frontend: Unicode, NUL, claves/tipos y cadenas hostiles inertes |
| FR-008 | Contrato/tipos solo markdown; binarios y renderer ausentes; tipos negativos frontend |

CU-14/05/06; RF13–16/25–26, RNF1–4; BE-21–23 y parte BE-24, sin reasignaciones.
RF15 y archivos de RF14 siguen P2. [ADR markdown](../adr/shared-markdown-publication.md).

Teacher no admin escribe desde cualquier sección; assistant/student solo leen
publicado; flags admin/superadmin sin Enrollment no conceden acceso académico.
Role union: perder teacher conservando student quita borradores y conserva publicado;
otra inscripción vigente mantiene lectura. No cambia autorización de otros dominios.
Auditoría común sectionId=null: docente no admin no obtiene esos eventos;
admin dueño los conserva. Snapshots permitidos guardan markdown histórico;
module.reordered usa objetos {modules:[{id,position}]} conforme a AuditChanges.

Pruebas US1 empezaron con 404 al no existir rutas; validación con módulo ausente.
US2 arranca HTTP con fixtures SQL, sin llamar escrituras US1 para preparar datos.
Ocultación/revocación US2 usan transacciones SQL y barreras pg_stat_activity.
Publication races cubren ambos órdenes publish/unpublish de módulo/material,
incluyendo fallo audit primero y posterior no-op. Alta/alta, orden/orden,
alta/orden en ambos órdenes y edición concurrente conservan historia serial.
Revocación primero bloquea y deniega; operación autorizada primero termina antes
de la revocación en espera. Solicitud posterior al COMMIT pierde acceso.
No quedan transacciones HTTP abiertas; más fallos que conexiones del pool verifican release.

Instalación vacía y upgrade desde cursos/roles/audit poblados preservan filas previas.
Repetir migración no cambia datos; down comprobado solo tras reset en _test vacía.
Readiness verifica tablas nuevas; pruebas previas adaptan inventario y 4 migraciones.

## Comandos y resultados

Instalaciones pnpm congeladas en raíz/backend/frontend PASS; lockfiles intactos.

| Comando desde raíz | Resultado |
| --- | --- |
| pnpm --dir backend lint / build | PASS |
| node --test backend/test/content-validation.test.mjs | PASS |
| node --test --test-concurrency=1 backend/test/integration/{modules-write,materials-write,content-integrity}.test.mjs | PASS |
| node --test --test-concurrency=1 backend/test/integration/{content-read,content-revocation,content-contract}.test.mjs | PASS |
| pnpm docs:api:lint | PASS; advertencia histórica /ready sin 4xx |
| pnpm --dir frontend api:generate / api:check | PASS |
| pnpm --dir frontend typecheck / lint / test | PASS; 25 pruebas |
| pnpm --dir backend audit --audit-level=high | PASS |
| pnpm --dir frontend audit --audit-level=high | FAIL preexistente: braces 3.0.3, GHSA-vfj7-8cjw-p6xm |

| pnpm --dir backend test:coverage | PASS; 63/63, 0 fallos y 0 omitidas |
| pnpm --dir frontend build | PASS |
| node backend/test/compose-smoke.mjs | PASS; stack aislado y limpieza final |
| python3 .github/scripts/check-doc-length.py | PASS; 13 documentos |
| git diff --check | PASS |

Cobertura final: líneas/statements 99,52 %, ramas 94,52 %, funciones 99,38 %.
Content, módulos y materiales: 100 % líneas/ramas/funciones. LCOV ignorado en
backend/coverage/lcov.info. Sin umbral c8 nuevo; no sustituye el gate remoto Sonar.
La primera regresión encontró 4≠3 en el contador heredado de login-email;
corregido al número de archivos disponibles. Ejecución final serial completa PASS.
Revisión lms-reviewer: sin hallazgos funcionales pendientes; callers, DTO,
exportaciones, permisos de audit y contratos/tipos coherentes.
Manifest/lockfiles sin cambios. Foundation y las dos historias verificadas;
T001–T032 completadas. [Stack draft](modules-material-pr.md), publicación autorizada posteriormente.
Contenedor de pruebas local eliminado al cerrar; worktree con cambios preservado.

## Límites

No se añadieron dependencias, binarios, visor HTML, pantallas, almacenamiento,
servicios externos ni permisos de otras specs. Cadenas hostiles persisten como texto
application/json; consumidor no hace render ni navegación automática.
Máximo semántico 10000 caracteres; transporte heredado de 4096 bytes JSON da 413
incluso para campos individualmente válidos. Ambos límites tienen pruebas.
Lecturas toman el lock de curso existente para serializar publicación/revocación;
peticiones del mismo curso se serializan. Sin SLO nuevo ni benchmark de carga.
No se ejecutaron despliegue, Sonar remoto ni Trivy. Publicación draft autorizada posteriormente.
Si #86 se fusiona con squash, revisar rebase antes de cambiar la base encadenada.

## Publicación en dos capas

Solicitud posterior: publicar encima de #87 con el formato de los PR previos.
Foundation: feat/modulos-material-foundation → docs/modulos-material-plan,
[PR #89](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/89), draft.
Su suite propia: 51/51, líneas 95,81 %, ramas 92,67 %; frontend 25/25 y contratos PASS.
API: feat/modulos-material-api → feat/modulos-material-foundation, también draft.
Stack nativo #88 conserva #85 → #86 → #87 y añade ambas capas.
Worktree de publicación: /tmp/academix-modulos-stack. El original permanece intacto.
División sin cambios funcionales respecto del código completo validado 63/63.

## Integración con dev (2026-10-20)

Conflictos de #90 resueltos conservando API/US1/US2 y las correcciones de #89.
Se retienen pruebas de acceso/publicación/revocación; el chequeo HTTP heredado
usa rutas existentes y espera 401 sin autenticación, manteniendo 415 no JSON.
Suite serial PostgreSQL 17 aislada: 65/65 PASS, sin pruebas omitidas.
Lint, TypeScript, longitud documental y diff check: PASS.
