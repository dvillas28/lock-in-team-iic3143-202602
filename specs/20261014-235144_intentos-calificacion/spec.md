# Feature Specification: Intentos y calificación automática

**Feature Branch**: `feat/intentos-calificacion`
**Feature Directory**: `specs/20261014-235144_intentos-calificacion`
**Created**: 2026-10-14
**Status**: Implemented; final validation blocked by additional privacy finding (2026-10-19)
**Input**: Backend MVP de Entrega 2: Intentos y calificación automática.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responder y cancelar (Priority: P1)

Como estudiante, inicio, guardo y reanudo respuestas o cancelo mi intento.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Guardar, reanudar y cancelar; comprobar consumo y nota sin cambios.

**Acceptance Scenarios**:

1. Dos inicios concurrentes crean a lo sumo un intento en progreso.
2. Guardar y reanudar intento propio conserva respuestas sin corrección anticipada.
3. Cancelar como propietario o docente autorizado cierra terminalmente, consume intento y no genera nota.

### User Story 2 - Enviar para calificar (Priority: P1)

Como estudiante, finalizo respuestas y conservo resultado íntegro hasta publicación docente.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Enviar dos veces y comparar nota e historial.

**Acceptance Scenarios**:

1. Enviar inmoviliza respuestas y calcula nota sin mostrarla antes de publicación.
2. Repetir envío ya calificado con la misma clave conserva resultado sin duplicar nota ni evento; otra clave produce conflicto sin cambios.
3. Fallo durante calificación/auditoría no deja envío parcial.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Validar usuario, membership, Enrollment student, destinatarios, ventana, máximo, incompatibilidad con pauta y ausencia de nota publicada al iniciar.
- **FR-002**: Numerar secuencialmente por estudiante/quiz/institución y admitir un único intento en progreso incluso ante concurrencia.
- **FR-003**: Conservar curso/sección históricos; rechazar preguntas/alternativas ajenas y escrituras sobre intentos ajenos o terminales.
- **FR-004**: Guardar respuestas solo en progreso; permitir iniciar/guardar/enviar solo con opensAt ≤ reloj actual < closesAt (límites ausentes sin restricción); fuera de ventana rechazar sin cambios ni cancelación automática.
- **FR-005**: Permitir cancelación explícita al propietario o docente con permiso sobre sección histórica; ayudante no cancela.
- **FR-006**: Cancelado es terminal, consume máximo, no modifica nota vigente ni bloquea publicación.
- **FR-007**: Finalizar, corregir, actualizar nota no publicada y auditar atómicamente; reintentos con la clave original son idempotentes; otra clave sobre un intento ya calificado produce conflicto sin cambios.
- **FR-008**: Calcular porcentaje a dos decimales HALF_UP y nota a un decimal HALF_UP: hasta 60 %, 1 + porcentaje × 3 / 60; sobre 60 %, 4 + (porcentaje − 60) × 3 / 40.
- **FR-009**: Respuesta omitida/incorrecta aporta cero; acierto aporta puntos de pregunta. Usar último intento graded por número, nunca mejor nota.
- **FR-010**: Impedir intentos nuevos y sobrescritura de nota publicada; conservar respuestas/corrección de intentos calificados.
- **FR-011**: Concurrencia de iniciar/enviar/cancelar/publicar debe mantener orden válido sin dobles notas ni intentos activos tras publicación.

### Key Entities

- QuizAttempt con sección histórica; Grade vigente derivada del intento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los escenarios concurrentes conservan un único intento activo y nota vigente por estudiante/evaluación.
- **SC-002**: 0 %, 60 % y 100 % producen 1.0, 4.0 y 7.0; se verifican fronteras y redondeo.
- **SC-003**: Todo envío repetido conserva resultado; ninguna nota no publicada se revela al estudiante.

## Assumptions

- Depende del alcance docente aclarado. submitted es transitorio durante envío/calificación, sin dejar corrección pendiente indefinidamente. Política temporal ratificada por usuario el 2026-10-19: ventana [opensAt, closesAt); lectura/cancelación explícita siguen disponibles tras cierre. Un replay de envío ya confirmado no es un envío nuevo y conserva recibo, revalidando autorización vigente.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [autoria-quizzes](../20261014-235044_autoria-quizzes/spec.md).

Deuda aceptada por usuario tras auditoría: intentos conserva resolución temporal
real de milisegundos al leer timestamps; límites pueden adelantarse menos de 1 ms.
La precisión submilisegundo de FR-004 queda diferida según el
[ADR](../../docs/adr/quiz-attempt-lifecycle-and-grading.md).

## Sources & Traceability

- Casos: CU-08, CU-09, CU-15. Requisitos: RF19–RF20, RF25–RF28; RNF1–RNF4.
- Backlog: BE-18–BE-20, BE-25; parte de BE-24; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.

Permisos vigentes: [ADR de admin y ownership](../../docs/adr/institution-admin-and-course-ownership.md).
Teacher activo habilita evaluación; admin dueño amplía alcance, sin reemplazar rol.
Assistant conserva solo lectura de seguimiento; superadmin no concede docencia.
