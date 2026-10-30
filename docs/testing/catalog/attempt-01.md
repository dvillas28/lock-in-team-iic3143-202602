# Fichas ATTEMPT · 01

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-001"></a>

## E2E-ATTEMPT-001 — Inicio real y navegación al intento

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Inicio real y navegación al intento; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,privacidad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1 abrir QOPEN.
2. Elegir sección S1 e Iniciar intento.
3. Esperar lectura GET y abrir respuestas.

- Interfaz esperada: Intento1 en progreso; preguntas sin pauta ni nota.
- API esperada: POST201 Idempotency-Key único, Location; GET estado actual real.
- Persistencia / consistencia: Una fila in_progress y attempt.started con actor/tenant/section exactos.
- Denegación: No isCorrect/pointsAwarded/grade en DTO propio.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-002"></a>

## E2E-ATTEMPT-002 — Reanudar tras reload con ID conocido

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Reanudar tras reload con ID conocido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: persistencia,sesión.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar respuesta en A1 y anotar attemptId en runner.
2. Recargar y relogin con next=/attempts/A1.
3. Comparar radio guardado y continuar.

- Interfaz esperada: Mismo intento, respuestas confirmadas; borrador no guardado no se promete persistente.
- API esperada: GET A1; no nuevo POST start por reload.
- Persistencia / consistencia: Mismo id/attemptNumber; sin evento started adicional.
- Denegación: No inventar descubrimiento automático de intentos propios.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-003"></a>

## E2E-ATTEMPT-003 — Doble clic iniciar

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Doble clic iniciar; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,idempotencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retener respuesta start real.
2. Activar Iniciar intento dos veces rápidamente.
3. Liberar y consultar GET.

- Interfaz esperada: Un intento visible; busy impide segundo envío UI.
- API esperada: Un POST UI; replays companion con misma clave devuelven mismo id.
- Persistencia / consistencia: Un intento y evento.
- Denegación: No cuota doble por clic.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-004"></a>

## E2E-ATTEMPT-004 — Start replay obtiene recibo y luego estado actual

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Start replay obtiene recibo y luego estado actual; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,estado.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear A1 con key K.
2. Calificar/cancelar A1.
3. Repetir start K y luego GET por ID.

- Interfaz esperada: Reanudación UI confía en GET, no recibo de start que puede reflejar inProgress inicial.
- API esperada: Replay201 mismo ID sin nuevo intento; GET terminal real.
- Persistencia / consistencia: Un intento terminal, sin auditoría extra.
- Denegación: No resucitar terminal por respuesta histórica.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-005"></a>

## E2E-ATTEMPT-005 — Segundo activo y maxAttempts agotado

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Segundo activo y maxAttempts agotado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: borde,estado.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: LIMIT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear A1 activo con K1.
2. Start K2 mismo quiz.
3. Cancelar A1 y alcanzar maxAttempts1, intentar K3.

- Interfaz esperada: Mensaje conflicto; no segundo intento.
- API esperada: 409 activo y 409 límite; cancelado cuenta.
- Persistencia / consistencia: Numeración no reutilizada; máximo cuenta iniciados.
- Denegación: No UI calcula límite como autoridad.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
