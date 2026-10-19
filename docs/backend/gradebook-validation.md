# Validación de notas, publicación y auditoría

Fecha: 2026-10-19. Estado: ambas historias implementadas; 35/36 completas, cierre T036 pendiente.
Feature: specs/20261014-235244_notas-publicacion-auditoria.
Rama: feat/notas-publicacion-auditoria; worktree ../academix-notas-publicacion-auditoria.

## Procedencia y entorno

Base cf7ef53 (intentos), da8b59b (autoría), e34499e (módulos), 57a113e (cursos).
Spec/AGENTS copiados del checkout original feat/cursos-roles, conservado intacto.
Publicación en dos PR apilados autorizada por el usuario; sin merge ni despliegue.
Sin dependencias nuevas.
Node 24.14.0, pnpm 9.15.9, PostgreSQL 17 en contenedor exclusivo
academix-gradebook-test: gradebook_test y diagnóstico gradebook_regression_test.
Puerto local dinámico; credenciales fuera del repo en archivo modo 0600.
Todas las escrituras, migraciones, fixtures y resets apuntaron a esas DB exclusivas.
Migraciones nuevas: 20261019000300_grade_publication.sql y
20261019000400_validate_publication_history.sql; no se reescribió SQL aplicado.
004 rechaza historia inválida sin reparar silenciosamente resultados.

## Comandos y resultados

Prefijo rtk; SPECIFY_FEATURE_DIRECTORY explícito en prerrequisitos.
Suites con reset y builds se ejecutaron secuencialmente para la aceptación.

| Comando | Resultado |
| --- | --- |
| env SPECIFY_FEATURE_DIRECTORY=specs/20261014-235244_notas-publicacion-auditoria .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks | PASS; checklist 16/16 |
| pnpm --dir backend build / lint | PASS |
| pnpm --dir backend db:migrate | PASS tras reinicio: created=0, existing=8 |
| pnpm --dir backend test | PASS, 25/25 |
| pnpm --dir backend test:integration | PASS, 111/111, sin omitidos |
| pnpm --dir backend test:coverage | PASS final, 137/137, sin omitidos; incluye regresión nueva |
| pnpm docs:api:lint | PASS; aviso previo de /ready sin respuesta 4xx |
| pnpm --dir frontend api:check / typecheck / test / lint | PASS; 30/30 tests |
| pnpm --dir frontend build | PASS, instalación local desde lockfile |
| python3 .github/scripts/check-doc-length.py | PASS |
| git diff --check | PASS |
| pnpm --dir backend audit --audit-level=high | PASS, sin vulnerabilidades conocidas |
| pnpm --dir frontend audit --audit-level=high | FAIL preexistente en herramienta de desarrollo; detalle abajo |

Cobertura c8: 99.70% líneas/statements, 96.03% ramas, 99.60% funciones.
Gradebook: 100% líneas/statements/funciones, 97.51% ramas.
Artefacto: backend/coverage/lcov.info. Sin umbrales o pruebas debilitados.
Check adicional no-undef sobre todas las pruebas nuevas: PASS.

## Evidencia FR, SC y RNF

Suites en backend/test/integration/, sufijo .test.mjs.

| Criterio | Evidencia ejecutable |
| --- | --- |
| FR-001/002; RF21/25 | gradebook-weights/write-permissions: colección exacta, precisión, total 100, teacher+owner, no-op y rollback |
| FR-003/004; SC-001; RF22 | gradebook-publication: selección completa, ausente/no graded/activo, cancelación explícita |
| FR-005; RF22/26; RNF3/4 | gradebook-integrity/concurrency: freeze SQL, identidad del ítem, Grade/ledger inmutables |
| FR-006; SC-002; RF23/24 | gradebook-read: 6.1, 65%, parcial; null/0/true; empate HALF_UP vía HTTP; solo propias publicadas |
| FR-007/009; RF25/29; RNF1/2 | gradebook-read-permissions/attempts-read/write-permissions: historia, roles acumulados, revocación y UC/UTFSM |
| FR-008; RF26 | gradebook-audit-read: filtros/páginas, sanitización histórica y admin dueño sin teacher |
| FR-010; SC-003 | academic-flow: HTTP completo en ambas instituciones; matriz 16 CU |
| RNF9 | publication captura stdout/stderr de fallos: únicamente operation/outcome/category, sin JWT/claves/pauta/answers/identificadores |
| RNF9 | integrity/readiness/health: status/version/commit/deployedAt/timestamp; probes y recuperación sin datos académicos |

Carreras HTTP publicación-publicación, start/submit/cancel, pesos y alta de ítem:
ambos órdenes con barreras PostgreSQL, sin sleeps usados para decidir resultados.
Clave entre cursos también usa barrera de recibo y verifica ambos órdenes.
Fallo en cada evento seleccionado y recibo: rollback de Grades, eventos, clave y
freeze; misma clave reutilizada hasta éxito, sin duplicados. Replay reordenado y
tras reinicio conserva recibo exacto; revocación deniega nuevo replay.
US1 prepara Grades SQL; US2 prepara publicadas SQL sin llamar endpoints US1.
Listado staff assistant+student conserva score/grade sin isCorrect/pointsAwarded.
Contratos HTTP reales validan 200/400/401/403/404/409/422/500/503 y no-store.

## Persistencia tras reinicio real

Además de reinicios de API en las suites, se reinició el PostgreSQL exclusivo.
Comando: node /tmp/academix-gradebook-db-restart.mjs "$PWD" con entorno de prueba.
PASS: hash de Courses/GradeItems/Grades/recibos/auditoría idéntico después de reiniciar;
mismo JWT devuelve recibo original; revocar membership produce 404 sin mutación.
Script y log verificables: /tmp/academix-gradebook-db-restart.mjs y .log.
Docker reasignó el puerto efímero; el script resuelve docker port y espera conexión
real al host, sin aumentar timeouts de producto. El migrador repetido conservó datos.

## Matriz de los 16 CU

| CU | Suites |
| --- | --- |
| 01 | institution-list, institutions, access-revocation |
| 02 | auth, access-revocation, academic-flow |
| 03 | courses-read, course-workflow, academic-flow |
| 04 | courses-write, enrollments, course-integrity, course-workflow |
| 05 | materials-write, content-integrity, academic-flow |
| 06 | content-read, content-revocation, academic-flow |
| 07 | quiz-authoring, quiz-publish, quiz-read, quiz-revocation, academic-flow |
| 08 | attempt-lifecycle, attempt-window, attempt-permissions, academic-flow |
| 09 | attempt-grading, attempt-concurrency, academic-flow |
| 10 | gradebook-weights, gradebook-write-permissions |
| 11 | gradebook-publication, gradebook-concurrency, gradebook-integrity |
| 12 | gradebook-read, gradebook-read-permissions |
| 13 | gradebook-audit-read, course-audit |
| 14 | modules-write, content-integrity, academic-flow |
| 15 | attempt-lifecycle, attempt-permissions, gradebook-concurrency, academic-flow |
| 16 | gradebook-read, gradebook-attempts-read, gradebook-read-permissions |

## Fallos corregidos y límites restantes

Ensayos iniciales tuvieron interferencia de build/tests y sintaxis de fixtures;
se corrigieron y no se usaron como aprobación. Focalizada inicial: 8/8;
ampliación detectó 4 fallos de fixtures/contrato; corrección: 18/18.
Se ajustaron fixtures antiguas para exigir pesos 100 y counts de ocho migraciones.
Turbopack rechazó symlinks externos: se instaló el lockfile existente localmente.
Primera cobertura: 136/137 por import faltante en nueva prueba; corregido,
archivo 2/2 y cobertura completa repetida 137/137. No se omitió el caso.
Ajv multipleOfPrecision evita falso rechazo IEEE-754 de 5.1; negativos 6.15 y
33.333 siguen rechazados. Producción usa NUMERIC, sin cálculos float JS.
Primer ensayo de reinicio encontró el puerto Docker reasignado; corregido el probe.
Cierre pendiente: #96 documenta acceso del admin dueño+student sin teacher a
su Grade no publicada mediante auditoría. Esta misión conserva la excepción
owner sin teacher exigida explícitamente; no cambia esa política sin resolver
el conflicto. Los checks locales no acreditan corregido ese hallazgo heredado.
T036 queda abierta y el stack no está listo para merge. Sin UI ni pruebas de navegador.
Metadatos de despliegue comprobados localmente; no se realizó despliegue.
Audit frontend falla por GHSA-vfj7-8cjw-p6xm, braces <=3.0.3 vía
eslint-config-next/fast-glob/micromatch. Reproducido en base cf7ef53: dependencia
de desarrollo previa, sin versión reparada ofrecida por el registro. No se suprimió
el advisory ni se cambió el stack fuera del plan; no se presenta como aprobado.
Lock por Course conserva la limitación deliberada de concurrencia del ADR.
Hooks git opcionales no ejecutados; commits/push/PR autorizados después por el usuario.
