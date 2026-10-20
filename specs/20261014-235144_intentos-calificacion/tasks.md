# Tasks: Intentos y calificación automática

**Input**: `specs/20261014-235144_intentos-calificacion/`.
**Prerequisites**: spec, plan, research, data-model, contracts y quickstart de esta misión.
**Status**: T001–T030 ejecutadas; T031 pendiente por hallazgo adicional de privacidad. Responsables conservados.
**Format**: `- [X] T001 [P?] [USn] Acción con ruta y referencia de aceptación`.
Tests exigidos por spec: negativos completos, permisos, integridad y concurrencia.

## Phase 1: Setup

- [X] T001 Verificar autoría operativa y acordar esquema real Quiz/GradeItem, precisión/puntos, predicado compartido de pauta, locks y freeze tras primer intento según contracts/handoff.md; registrar evidencia y nombres reales en specs/20261014-235144_intentos-calificacion/research.md y plan.md; bloquear Foundation hasta cumplir (dependencia FR-001/003/011).
- [X] T002 Confirmar prefijo libre posterior a autoría para backend/migrations/20261019000200_attempts_grades.sql y comandos/DB exclusiva en specs/20261014-235144_intentos-calificacion/quickstart.md; conservar migraciones aplicadas y cambios ajenos (FR-002/007).

## Phase 2: Foundation

- [X] T003 Crear tablas quiz_attempts/grades, FK compuestas, unique por serie/activo/Grade/claves, checks de estado, trigger terminal/publicada y constraint diferible contra submitted persistido en backend/migrations/20261019000200_attempts_grades.sql según data-model.md (FR-002/003/006/010).
- [X] T004 [P] Extender backend/src/audit/audit.service.ts con allowlists quizAttempt/grade y cubrir en backend/test/audit.test.mjs exclusión de answers, pauta, claves y secretos sin cambiar lectores actuales (FR-007/010).
- [X] T005 Implementar contexto y permisos de intento en backend/src/attempts/attempt-access.ts reutilizando backend/src/courses/course-access.ts y predicado de pauta de T001; locks Course→Enrollment→Quiz→Attempt→Grade, revalidación, scope histórico, teacher/admin y roles acumulados (FR-001/003/005/011).
- [X] T006 [P] Implementar entradas/headers estrictos y DTO Student/Teacher/Assistant en backend/src/attempts/attempt-validation.ts y attempt-dto.ts; probar forma, duplicados, clave 1..200, campos prohibidos y proyecciones en backend/test/attempt-validation.test.mjs (FR-003/010; SC-003).
- [X] T007 Registrar provider/controlador compilables sin rutas todavía en backend/src/attempts/attempts.service.ts, attempts.controller.ts y backend/src/app.module.ts; ampliar backend/src/database/database.service.ts check con columnas requeridas (FR-001/007).
- [X] T008 Crear fixtures SQL UC/UTFSM con dos secciones, roles acumulados, quizzes/GradeItems del esquema real, intentos/Grades históricos y reloj de bordes en backend/test/integration/attempt-fixtures.mjs; extender backend/test/integration/helpers.mjs solo si hace falta (FR-001/003/008).
- [X] T009 Verificar FK cruzadas, índices/uniqueness, coherencia de estados, inmutabilidad terminal/publicada y rollback de submitted al commit con SQL directo en backend/test/integration/attempt-integrity.test.mjs (FR-002/003/006/010).

**Checkpoint**: autoría real disponible; esquema, fixtures y registro permiten probar cada historia por separado.
T004 puede hacerse paralelo a T003; T006 con T005 tras confirmar T001; T008 tras T003.

## Phase 3: US1 - Responder y cancelar (P1)

**Goal**: iniciar, guardar, reanudar y cancelar con consumo/historia correctos.
**Independent Test**: fixtures de Foundation; start→PUT→GET→cancel, sin submit US2;
Grade previa de fixture permanece idéntica y el número cancelado consume máximo.

- [X] T010 [US1] Añadir primero casos de inicio/replay con claves iguales/distintas, máximo/cancelados, PUT reemplazo/[], GET y cancel repetido en backend/test/integration/attempt-lifecycle.test.mjs (US1-1/2/3; FR-001–006).
- [X] T011 [P] [US1] Añadir negativos UC/UTFSM/otro propietario, revocaciones, cambio de sección, teacher histórico/admin, assistant sin cancel, pauta+student y vistas sanitizadas en backend/test/integration/attempt-permissions.test.mjs; usar fixtures sin submit (FR-001/003/005; SC-003).
- [X] T012 [US1] Implementar start y replay persistido en backend/src/attempts/attempts.service.ts: contexto vigente, locks, grado publicado, ventana DB tras espera, máximo, MAX+1, sección histórica, respuesta inicial estable y attempt.started en misma tx (FR-001/002/011; US1-1).
- [X] T013 [US1] Implementar GET por visibilidad/proyección y PUT de answers completo en backend/src/attempts/attempts.service.ts; validar pregunta/alternativa contra pauta inmovilizada, rechazar terminal/ventana, auditar save efectivo sin pauta y reanudar sin corrección (FR-003/004; US1-2).
- [X] T014 [US1] Implementar cancel del propietario o teacher autorizado, replay 204 y attempt.cancelled en backend/src/attempts/attempts.service.ts; preservar Grade previa y answers, permitir cierre fuera de ventana y a teacher con estudiante revocado (FR-005/006; US1-3).
- [X] T015 [US1] Exponer start/get/answers/cancel con Location, códigos explícitos, body/header estrictos y no-store en backend/src/attempts/attempts.controller.ts; mapear status SQL a API con backend/src/attempts/attempt-dto.ts (US1-1/2/3).
- [X] T016 [US1] Probar doble inicio, claves reusadas tras cancel/reinicio, start vs freeze de pauta, save-save, save-cancel y rollback al fallar auditoría en backend/test/integration/attempt-concurrency.test.mjs; barreras SQL deterministas y ambos órdenes (FR-002/004/006/011).
- [X] T017 [US1] Sincronizar ventana, idempotencia start, scope cancel, AssistantView y unión anyOf GET (reemplazar oneOf) en docs/reference/openapi/paths/quizzes.yaml y components/schemas/quizzes.yaml; validar header por operación sin ampliar otros contratos; regenerar frontend/src/lib/api/schema.d.ts (FR-003–006).
- [X] T018 [US1] Verificar contrato HTTP start/get/save/cancel y proyecciones, incluyendo validación del anyOf real GET para teacher/assistant con answers [] y resultados NULL y graded sin respuestas, en backend/test/integration/attempt-contract.test.mjs; extender frontend/test/api.test.ts con consumidor tipado; ejecutar checks US1 y registrar resultados en docs/backend/attempts-grading-validation.md (US1-1/2/3).

**Checkpoint**: US1 desplegable sin rutas/cálculo US2; terminal cancelado consume intento y no cambia nota.

## Phase 4: US2 - Enviar para calificar (P1)

**Goal**: resultado íntegro, reproducible e idempotente, sin divulgar nota estudiantil.
**Independent Test**: fixtures SQL inProgress/graded/Grade previa de Foundation;
submit dos veces compara recibo, respuestas, Grade, fechas y eventos sin usar rutas US1.

- [X] T019 [US2] Añadir casos de omisiones/aciertos, 0/60/100, porcentaje HALF_UP y fronteras de nota en backend/test/integration/attempt-grading.test.mjs; referencia decimal independiente, incluidos porcentajes a ambos lados de 60 (FR-008/009; SC-002).
- [X] T020 [US2] Implementar cálculo SQL NUMERIC con cliente transaccional en backend/src/attempts/grading.ts: extraer puntos sin float JS, validar total, corregir respuestas, round porcentaje 2 decimales y escala/round nota 1 decimal usando porcentaje redondeado (FR-008/009).
- [X] T021 [US2] Implementar submit/replay en backend/src/attempts/attempts.service.ts: permisos, clave original ligada a destino y 409 para otra clave sobre graded sin alias, locks/ventana, submitted transitorio→graded, congelar corrección, Grade única desde mayor attempt_number y eventos attempt.graded/grade.created o updated; rollback completo (FR-007/009/010).
- [X] T022 [US2] Exponer POST submit en backend/src/attempts/attempts.controller.ts con Idempotency-Key y recibo exacto id/status/submittedAt después de commit; no resultado ni claves en DTO (FR-007/010; US2-1/2).
- [X] T023 [US2] Completar backend/test/integration/attempt-grading.test.mjs con replay de clave original, 409 para otra clave libre/de otro destino sobre graded, secuencia A→éxito/B→409 en ese graded/A→409 en otro intento/B→éxito en otro intento (rechazo no reserva alias), replay original tras cierre/publicación, último graded peor, Grade previa inmutable, terminales y fallos de cada evento; demostrar ausencia de cambios parciales (US2-1/2/3; FR-007–010).
- [X] T024 [US2] Extender backend/test/integration/attempt-permissions.test.mjs y attempt-contract.test.mjs para submit con revocación, pauta acumulada, IDs ajenos, ventana tras esperar lock y cero campos de resultado en recibo/errores (FR-001/004/007/010).
- [X] T025 [US2] Extender backend/test/integration/attempt-concurrency.test.mjs con submit-submit de misma clave (ambos mismo recibo) y distintas claves (un éxito y un 409), save-submit, submit-cancel y start/submit/cancel contra publicador SQL controlado con lock Course y chequeo de activos; verificar órdenes válidos y sin dobles Grades/eventos (FR-007/011; SC-001/003).
- [X] T026 [US2] Sincronizar submit/receipt/replay y errores en docs/reference/openapi/paths/quizzes.yaml y components/schemas/quizzes.yaml; regenerar frontend/src/lib/api/schema.d.ts y probar recibo sin nota en frontend/test/api.test.ts (US2-1/2; SC-003).
- [X] T027 [US2] Ejecutar US2 aisladamente con fixtures SQL y luego flujo US1→US2; registrar comandos/resultados sin secretos en docs/backend/attempts-grading-validation.md (US2-1/2/3).

**Checkpoint**: US2 valida cálculo y transacción sin depender de endpoints US1 para preparar datos.

## Phase 5: Integración y entrega

- [X] T028 Validar migración vacía/upgrade/repetición, persistencia tras reinicio y readiness con backend/test/integration/attempt-integrity.test.mjs y readiness.test.mjs, preservando identidad/cursos/quizzes/GradeItems existentes (FR-002/003/010).
- [X] T029 Alinear grade_value histórico, claves, checks y proyecciones en docs/deliveries/2/06-data-model-part-2.md, 12-data-catalog-part-1.md, 12-data-catalog-part-2.md y docs/reference/openapi/README.md; respetar longitud y decisiones de docs/adr/quiz-attempt-lifecycle-and-grading.md (FR-007–010).
- [X] T030 Registrar dependencia de lock/publicación HTTP y proyección AssistantView del listado futuro en specs/20261014-235144_intentos-calificacion/contracts/handoff.md; verificar consistencia con specs/20261014-235244_notas-publicacion-auditoria/spec.md sin implementar pesos/listado/publicación (FR-011).
- [ ] T031 Ejecutar lint/build/test/integration/coverage, api:check/typecheck/test consumidor y check-doc-length según specs/20261014-235144_intentos-calificacion/quickstart.md; registrar cobertura FR/SC, fallos y pendientes reales en docs/backend/attempts-grading-validation.md; no cerrar con negativos pendientes (SC-001/002/003).

## Dependencies & Parallel Execution

```text
T001 → T002 → Foundation T003–T009 → US1 T010–T018 → integración T028–T031
                                 → US2 T019–T027 → integración T028–T031
```

US1 y US2 son verificables con fixtures de Foundation. Orden recomendado US1→US2
porque comparten servicio, controlador, OpenAPI y tests; no editar esos archivos
simultáneamente. US2 depende del registro/DTO de Foundation, no de endpoints US1.
T009 requiere T003/T008; T012–T015 requieren permisos/DTO/auditoría T004–T007.
T020 requiere pruebas T019; T021 requiere T020 y auditoría; T025 requiere T021/T022.
US2 aislada prueba save/cancel intercalados por fixture SQL bajo el mismo lock;
tras US1 repetir esas carreras por HTTP. Publicador sigue simulado en esta misión.

Paralelo US1: T010 y T011 usan archivos distintos tras Foundation.
Paralelo US2: después de T019, cálculo T020 puede avanzar junto a escenarios
T024 en archivos de test distintos, sin ejecutar el conjunto hasta completar T022.
T024 no lleva [P]: puede compartir attempt-contract con T018 si US1 sigue activa.
No paralelizar migraciones ni cambios a AppModule/AuditService compartidos.

## Implementation Strategy

1. Confirmar autoría real; completar Foundation y tests de integridad.
2. Entregar MVP US1 y sus negativos sin calificación.
3. Entregar US2 y verificar idempotencia, decimales e historia con fixtures propias.
4. Integrar flujos y carreras, sincronizar contrato/tipos y evidencia verificable.
5. Cierre completo exige US1+US2; publicación HTTP final se valida en notas.
