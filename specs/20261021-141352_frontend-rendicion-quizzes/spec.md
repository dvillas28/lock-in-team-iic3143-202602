# Feature Specification: Rendición frontend de quizzes

**Feature Branch**: `feat/frontend-rendicion-quizzes` (propuesta)
**Feature Directory**: `specs/20261021-141352_frontend-rendicion-quizzes`
**Created**: 2026-10-21
**Status**: Ready for planning — validación documental, producto pendiente
**Input**: Conectar inicio, guardado, reanudación, envío y cancelación de intentos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar, guardar y reanudar mi intento (Priority: P1)

Como estudiante, quiero responder un quiz disponible y distinguir respuestas guardadas de cambios pendientes.
**Why this priority**: Permite trabajar sin depender de publicación de notas.
**Independent Test**: Quiz publicado y estudiante de fixture con ventana/límite válidos, sin editor frontend.
**Acceptance Scenarios**:
1. **Given** quiz disponible y student activo, **When** inicio, **Then** recibo un intento propio con sección histórica y sin pauta.
2. **Given** preguntas respondidas, **When** guardo, **Then** sé qué conjunto completo fue confirmado y qué cambios siguen pendientes.
3. **Given** intento conocido en progreso, **When** vuelvo a su enlace y me autentico, **Then** recupero las respuestas guardadas autorizadas.
4. **Given** límite, cierre o acceso a pauta incompatible, **When** inicio/guardo, **Then** veo rechazo real sin inventar intento disponible.

### User Story 2 - Enviar una sola vez con confirmación segura (Priority: P1)

Como estudiante, quiero confirmar el envío y recuperar su resultado si la respuesta se pierde.
**Why this priority**: El envío fija respuestas y genera la calificación académica.
**Independent Test**: Intento guardado con fallos de red, doble acción y replay controlado.
**Acceptance Scenarios**:
1. **Given** respuestas pendientes, **When** confirmo enviar, **Then** primero se guardan las respuestas elegidas y luego se confirma el envío.
2. **Given** respuesta perdida, **When** reintento la misma operación, **Then** se conserva su identidad idempotente y no se crea otra calificación.
3. **Given** envío confirmado, **When** veo recibo, **Then** muestra identificación/estado/fecha sin nota, porcentaje, puntaje ni pauta anticipados.
4. **Given** sesión vencida, cierre o conflicto, **When** intento enviar, **Then** no se afirma recepción ni se cambian automáticamente claves para forzar éxito.

### User Story 3 - Cancelar un intento de forma explícita (Priority: P2)

Como estudiante propietario o docente autorizado, quiero cancelar un intento abandonado dentro de mi alcance.
**Why this priority**: Cierra intentos activos sin crear notas ni dejar bloqueada una publicación.
**Independent Test**: Intento en progreso y fixtures estudiante/docente/ayudante, sin libro frontend implementado.
**Acceptance Scenarios**:
1. **Given** intento propio en progreso, **When** confirmo cancelar, **Then** queda terminal sin nota y cuenta entre intentos iniciados.
2. **Given** docente autorizado para sección histórica o admin dueño con teacher, **When** cancelo un intento abandonado, **Then** se conserva actor/historial aunque estudiante esté revocado.
3. **Given** ayudante, docente ajeno o intento ya calificado, **When** intento cancelar, **Then** se rechaza sin alterar notas.
4. **Given** cancelación ya aplicada, **When** se repite, **Then** se conserva el resultado sin duplicar historial.

### Edge Cases

- Plazo cierra durante guardado/envío; no cancela por sí solo intento activo ni dispara envío automático.
- PUT reemplaza respuestas completas; colección vacía borra; pregunta/alternativa ajena produce rechazo.
- Nota ya publicada, intento terminal, varios intentos y sección histórica distinta de matrícula actual.
- Respuesta perdida de start/submit, doble clic, cuerpo tardío y replay original tras cierre/publicación.
- Recarga elimina sesión en memoria; volver a login y al intento conocido no garantiza descubrir automáticamente un intento cuya ID nunca se recibió.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Listar quizzes seguros y usar rutas limpias como `/courses/{courseId}/quizzes` y `/attempts/{attemptId}`; dominio aporta slug a la API.
- **FR-002**: Solo student propietario autorizado inicia/guarda/envía; backend revalida identidad, pertenencia, sección y restricción de pauta en cada acción.
- **FR-003**: Respetar ventana [apertura,cierre), límites nulos ilimitados, máximo positivo y único intento activo; no usar reloj frontend como autorización.
- **FR-004**: Iniciar con clave idempotente ligada al destino y conservarla al recuperar resultado incierto en el documento actual; no generar otra por cada clic.
- **FR-005**: Guardar reemplaza todo el conjunto; distinguir cambios locales/guardando/guardado/error y evitar envíos concurrentes que sobrescriban silenciosamente respuestas nuevas.
- **FR-006**: No enviar studentId, pauta, puntajes ni nota; identidades y calificación provienen del backend. Colección vacía requiere intención explícita de borrar respuestas.
- **FR-007**: Reanudar desde ID conocido con datos confirmados; sin endpoint de búsqueda propia, no prometer descubrir automáticamente intentos perdidos tras recarga o historial local borrado.
- **FR-008**: Confirmar envío con respuestas actuales; si guardado falla, no enviar como si estuvieran persistidas. No enviar automáticamente por temporizador/cierre.
- **FR-009**: Envío usa clave idempotente independiente de inicio; conservarla para reintentar resultado incierto, no sustituirla para esquivar conflicto ni repetir calificación.
- **FR-010**: Recibo contiene id/estado/fecha; no mostrar nota, score, porcentaje o corrección hasta publicación consultada por misión 6.
- **FR-011**: Recuperar resultado incierto consultando intento autorizado o repitiendo la misma operación/clave cuando esté disponible; si se perdió tras recarga, informar límite sin duplicar ni afirmar éxito.
- **FR-012**: Cierre no cancela; cancelado/calificado son terminales. Replay original revalida permisos, sigue reglas backend y no recalcula al reabrir ventana.
- **FR-013**: Cancelación exige confirmación y permiso: propietario student sin pauta incompatible, teacher de sección histórica o teacher con isAdmin y ownership.
- **FR-014**: Assistant no cancela; docente autorizado puede cancelar fuera de ventana y con student revocado. Repetir cancelación no duplica auditoría; no altera nota publicada.
- **FR-015**: Mostrar que cancelación cuenta para máximo, no genera nota y no sustituye calificación requerida para publicar; esta es la única definición de cancelación reutilizada desde misión 6.
- **FR-016**: Conservar backend como autoridad de intentos, sección histórica, último calificado, locks y auditoría; sin cálculo ni mutación académica local equivalente.
- **FR-017**: Manejar 401/403/404/409/413/422/503/red, vacío y carga; limpiar datos al logout/expiración y descartar respuestas de identidad/contexto anteriores.
- **FR-018**: Teclado en alternativas, foco y confirmaciones accesibles, avisos de guardado, contraste ≥4.5:1, 375 px, ambos temas y movimiento reducido.
- **FR-019**: Pruebas futuras cubren UC/UTFSM, multirol/pauta, doble acción, resultado incierto, revocación, sección histórica, publicación concurrente y ausencia de nota anticipada.

### Key Entities

- **Intento**: Propietario, quiz, sección histórica inmutable, número y estado académico.
- **Respuestas**: Selección completa reemplazable mientras el intento y permisos lo permiten.
- **Operación idempotente/recibo**: Identidad de inicio/envío y confirmación backend, sin calificación estudiantil anticipada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de recorridos guardar/reanudar distingue respuestas confirmadas de pendientes sin afirmar guardado fallido.
- **SC-002**: Dobles acciones y reintentos con clave original generan como máximo un intento/resultado por operación autorizada.
- **SC-003**: Cero recibos o vistas estudiantiles previas a publicación muestran calificación o pauta.
- **SC-004**: Cancelación válida conserva estado terminal/historia; todos los casos sin permiso dejan intacto el intento.
- **SC-005**: Responder, guardar, enviar y cancelar son operables por teclado en móvil/escritorio y ambos temas.

## Assumptions

- Sesión en memoria existente: no se promete recuperación de claves efímeras tras cerrar documento; el plan conserva este límite visible.
- No se añade endpoint para descubrir intento propio activo; revisar un intento conocido sí está soportado.

## Sources & Traceability

- CU-08/09/15, RF19–20/25–28, RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-12–14/20 (JC/MA), vistas 05 parcial/14/16 cancelación: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencia runtime: [autoría](../20261021-141351_frontend-autoria-quizzes/spec.md); fixtures permiten revisión sin implementarla.
- [Contrato](../../docs/reference/openapi/paths/quizzes.yaml), [ciclo](../../docs/adr/quiz-attempt-lifecycle-and-grading.md),
  [cancelación](../../docs/adr/close-abandoned-quiz-attempts.md), [diseño](../../DESIGN.md).
- Operaciones: listCourseQuizzes/getQuiz/startQuizAttempt/getQuizAttempt/saveQuizAttemptAnswers/submitQuizAttempt/cancelQuizAttempt.
- Exclusiones: autosubmit, trabajo offline, almacenamiento persistente de credenciales, descubrimiento sin endpoint, corrección manual, notas anticipadas y cambios API/DB.
