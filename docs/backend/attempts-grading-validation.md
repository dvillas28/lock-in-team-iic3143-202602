# Intentos y calificación: validación

Fecha: 2026-10-19. Rama: feat/intentos-calificacion, base PR #94 (da8b59b).
Worktree: academix-intentos-calificacion, separado del checkout original.
Estado histórico (2026-10-19): T001–T030 ejecutadas; T031 pendiente.
Actualización AUD-PRIV al final; aceptación global de esta misión aún no cerrada.

## Prerrequisito y alcance

T001 verificado con 18/18 pruebas de autoría sobre PostgreSQL 17 real.
Esquema real: 20261019000100_quiz_authoring.sql, quizzes/grade_items con unicidad
compuesta. canAuthorQuiz compartido; requireDraft impide edición publicada antes
del primer intento. Puntos positivos exactos a dos decimales y total ≤999999.99.
La inspección inicial de feat/cursos-roles no cubría PR #94; se corrigió usando
su implementación existente. No se rehízo autoría ni se crearon mocks de producción.
T002: prefijo posterior libre 20261019000200_attempts_grades.sql.

DB exclusiva academix_attempts_test en contenedor academix-attempts-test,
PostgreSQL 17, puerto local 55437. Una segunda DB exclusiva
academix_attempts_focused_test aísla verificaciones focalizadas durante la suite.
No se usaron datos compartidos. TEST_DATABASE_URL y secretos no se registran.

## Comportamiento entregado

Inicio secuencial, respuestas completas y reanudación, cancelación explícita y
terminal. Save idéntico/cancel repetido/start replay no generan eventos duplicados.
Ventana [opensAt,closesAt), NULL ilimitado, reloj DB posterior a locks. Fuera de
ventana da 409 sin cancelar; GET/cancel y replay confirmado siguen disponibles.
Submit usa una transacción para submitted transitorio, corrección NUMERIC, Grade
desde último graded por número y auditoría. Último intento peor sustituye Grade
no publicada; resultados históricos/terminales y Grade publicada son inmutables.
Replay solo con clave original: recibo estable, sin nuevo cálculo ni evento;
otra clave da 409 sin alias. Revocación se revalida incluso en replay.
Student nunca recibe resultados/corrección; assistant nunca recibe corrección
por respuesta; teacher respeta sección histórica, con ampliación por admin dueño.

## Trazabilidad FR/SC

| Requisito | Evidencia ejecutable |
| --- | --- |
| FR-001/003 | attempt-permissions: UC/UTFSM, otro propietario, revocación de cuatro vínculos con mismo JWT, roles acumulados y sección histórica |
| FR-002 | attempt-integrity/concurrency: FK compuestas, numeración/activo/claves únicos, doble inicio con claves iguales/distintas |
| FR-004 | attempt-window: límites NULL, apertura incluida/cierre excluido y reloj posterior a espera por locks; sin cancelación automática |
| FR-005/006 | attempt-lifecycle/permissions: cancel propio/docente histórico, Grade previa idéntica, consumo, terminal y no-op |
| FR-007 | attempt-grading: transacción, replay A/B sin alias, cada fallo de evento/cálculo revierte datos y claves |
| FR-008/009 | attempt-grading: valores esperados independientes para 0/60/100, 59/58.99/59.99/60.01/60.6/60.67, 1/3, 1/32, 1/100 y 58999.99/100000, omisiones/errores y último peor |
| FR-010 | attempt-integrity/grading/contract: terminales/publicada inmutables; DTO allowlist y recibo exacto; no sobrescritura publicada |
| FR-011 | attempt-concurrency: save/save, save/submit, save/cancel, submit/submit, submit/cancel; publicación SQL en ambas órdenes |
| SC-001 | Barreras observan esperas de locks PostgreSQL; unicidad de intento/Grade y evento; publicación sin activos |
| SC-002 | SQL NUMERIC: porcentaje HALF_UP 2 decimales y nota HALF_UP 1 decimal desde ese porcentaje; 0/60/100 → 1.0/4.0/7.0 |
| SC-003 | Recibo original estable y clave rechazada reutilizable en otro intento; anyOf real valida student/teacher/assistant sin filtración |

No se añadieron dependencias, UI, workers ni infraestructura de producto.
Publicación de notas/listado académico/pesos/libro quedan para la misión de notas.
Las carreras de publicación de Grade usan SQL controlado, no un endpoint futuro.
La carrera publishQuiz/start sí usa HTTP real sobre autoría existente.

## Comandos y resultados

Todos los comandos shell se ejecutan con RTK; scripts Spec Kit usan
SPECIFY_FEATURE_DIRECTORY=specs/20261014-235144_intentos-calificacion.

| Comando | Resultado |
| --- | --- |
| check-prerequisites.sh --json --require-tasks --include-tasks | PASS, misión explícita; checklist 16/16 |
| pnpm --dir backend install --frozen-lockfile | PASS, sin cambio de dependencias |
| Pruebas de autoría previas a Foundation | 18/18 PASS |
| pnpm --dir backend lint / build / test | PASS; 22 pruebas unitarias |
| pnpm --dir frontend lint / api:generate / api:check / typecheck / test | PASS; 28 pruebas |
| pnpm docs:api:lint | PASS; advertencia preexistente de /ready sin respuesta 4xx |
| pnpm --dir backend audit --audit-level high | PASS; ninguna vulnerabilidad conocida |
| pnpm --dir backend test:integration | PASS final; 81/81, sin omisiones |
| pnpm --dir backend test:coverage | PASS final; 103/103, sin omisiones; líneas 99.66 %, ramas 95.69 % |
| python3 .github/scripts/check-doc-length.py y --self-test | PASS |
| git diff --check y whitespace de archivos nuevos | PASS |

Fallos de desarrollo detectados y corregidos: DTO/header no-store inicial,
tipado de parámetros SQL de fixtures y resolución de referencias del validador
OpenAPI. La ejecución TDD de submit falló con 404 antes de añadir la ruta.
La primera suite completa detectó expectativas históricas de cinco migraciones:
actualizadas a seis; prueba de migración de autoría aislada a su directorio.
Una recompilación concurrente eliminó temporalmente dist durante integración,
causando ERR_MODULE_NOT_FOUND y fallos de fixtures: se repite sin builds paralelos.
El test de replay tras reinicio ahora conserva el secreto JWT entre arranques;
el helper genera uno distinto por defecto. No cambió la política de autenticación.
Warnings previos: Node MODULE_TYPELESS_PACKAGE_JSON y DEP0169; sin cambios de stack.

Umbral vigente consultado en SonarCloud para el proyecto: Sonar way, gate 9,
new_coverage ≥80 %. La ejecución local genera LCOV; el scanner remoto no se
presenta como ejecutado. Fuente pública: API qualitygates/get_by_project y
qualitygates/show con organization=dvillas28 (2026-10-19).

## Persistencia y cobertura

Migración desde vacío, upgrade poblado de autoría, repetición, recuperación de
readiness y reinicio HTTP pasan en attempt-integrity/readiness. Reinicio real de
PostgreSQL con docker restart academix-attempts-test: hashes/conteos idénticos
para 3 intentos, 1 Grade y 6 eventos; readiness HTTP 200 después de reiniciar.
Comprobación sin datos personales: hashes y conteos del snapshot previo/posterior.
Cobertura preauditoría: 102/102 PASS; intentos 236/236 líneas y 186/190 ramas
(100 % líneas, 97.89 % ramas; combinado local 99.06 %). Frontend: 99.02 % líneas.
SC-001/002 comprobados. SC-003 bloqueado por lectura de nota vía auditoría.
FR-004 conserva la deuda temporal aceptada abajo.

## Cierre

Revisión LMS del código nuevo: aislamiento, roles vigentes, proyecciones,
transacciones, historia y dependencias revisados; auditoría posterior detallada abajo.
Implementación en worktree aislado; checkout original conservado. Planificación
y código se entregan en capas de PR separadas, sobre autoría #94.
Sonar remoto y publicación HTTP futura no se presentan como ejecutados.

## Auditoría posterior y decisiones del usuario

- Hallazgo 1: pérdida de precisión inferior a 1 ms aceptada como deuda técnica.
  Se conserva el comportamiento; límite y condición de mejora documentados en
  attempt-access.ts y ADR. FR-004 tiene esta salvedad conocida.
- Hallazgo 2: visibilidad tardía, carga de respuestas ajenas antes del rechazo y
  distinción 403/404 de quiz oculto. Corrección aprobada y aplicada: metadatos
  mínimos bajo locks, visibilidad compartida antes de cargar pauta/respuestas.
  Prueba PostgreSQL observa cero cargas completas antes de denegar; start de
  quiz oculto/borrador invisible/inexistente devuelve 404 sin cambiar la DB.
- Hallazgo 3: corrección aprobada. Caso independiente 58999.99/100000 debe dar
  59.00 % y 4.0; usar porcentaje crudo daría 3.9. Prueba de regresión añadida.
- Hallazgo 4: corrección aprobada. OpenAPI save/submit/cancel distingue 401 por
  identidad, 404 por contexto/recurso invisible y 403 por acción visible prohibida.

Validación inicial de auditoría: backend lint/build y 6/6 grading/permissions PASS
en DB exclusiva academix_attempts_audit_test. OpenAPI lint, api:generate/api:check,
typecheck y 28/28 frontend PASS; lint/build frontend PASS; longitud/whitespace PASS.
Suite completa/cobertura repetidas: 81/81 integración y 103/103 cobertura PASS.
Intentos: 100 % líneas y 97.57 % ramas. Esto no cubría la filtración vía auditoría.
Primera repetición: carrera start/publish esperaba 409 para borrador invisible;
se exige 404 conforme al contrato, con prueba adicional de ausencia de mutaciones.

Revisión LMS adicional: HIGH pendiente en lectura de eventos Grade por admin
dueño sin teacher. Reproducción PostgreSQL/HTTP: owner conserva student, se revoca
teacher, submit 200; GET intento omite nota pero audit-events?resourceType=grade
responde 200 con grade=1.0 y publishedAt=NULL. Contradice secreto estudiantil.
Corrección propuesta: filtro SQL de eventos Grade exige teacher vigente; conservar
otros eventos del admin. Presentado al usuario antes de resolver, según instrucción.
SC-003 y T031 no se cierran hasta validar/corregir y repetir negativos/cobertura.
speckit-analyze: 14/14 requisitos FR/SC mapeados a 31 tareas; sin tareas huérfanas.
La brecha implementación/privacidad se registra como HIGH de revisión LMS.

<!-- length-exception: conserva evidencia histórica completa y actualización localizada de AUD-PRIV -->

## Actualización localizada AUD-PRIV — 2026-10-29

[Privacidad de auditoría](audit-grade-privacy-validation.md) registra regresión
previa y corrección local: grade exige teacher, administrativos owner se conservan.
La excepción histórica de owner sin teacher queda acotada por el nuevo ADR.
Esto resuelve solo AUD-PRIV; no cierra T031/T036 ni otros checks/pendientes de
esta misión histórica. Sin aceptación remota ni despliegue.
