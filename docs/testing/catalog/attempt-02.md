# Fichas ATTEMPT · 02

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-006"></a>

## E2E-ATTEMPT-006 — Intentos ilimitados y numeración tras cancelaciones

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Intentos ilimitados y numeración tras cancelaciones; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: LIMIT-NULL; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Iniciar y cancelar intento1.
2. Iniciar intento2 y calificar.
3. Iniciar tercero sin nota publicada.

- Interfaz esperada: Números1/2/3; sin límite inventado.
- API esperada: 201 y cancel204; maxAttempts null.
- Persistencia / consistencia: Tres históricos sin reutilización.
- Denegación: Un solo activo siempre.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-007"></a>

## E2E-ATTEMPT-007 — Ventana futura cerrada y límites ausentes

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Ventana futura cerrada y límites ausentes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tiempo,authz.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WINDOWS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Intentar start QFUTURE y QCLOSED.
2. Iniciar Q sin opens/closes.
3. Registrar hora DB y respuesta.

- Interfaz esperada: Conflicto en no disponibles; sin cuenta regresiva que prometa elegibilidad.
- API esperada: 409 fuera [opens,closes);201 sin límites.
- Persistencia / consistencia: Ningún intento para rechazados.
- Denegación: No saltar por reloj navegador alterado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-008"></a>

## E2E-ATTEMPT-008 — Pertenencia destino y nota publicada

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Pertenencia destino y nota publicada; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,estado.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Start con S2 ajena y Q1 S1.
2. Start Q1 después de Grade publicada.
3. Consultar A1 terminal existente.

- Interfaz esperada: Sin inicio; notas publicadas conservadas.
- API esperada: 404 sección ajena/destino;409 nota publicada.
- Persistencia / consistencia: No intento adicional ni cambio Grade.
- Denegación: Conocer IDs no concede scope.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-009"></a>

## E2E-ATTEMPT-009 — Clave start ausente inválida o reutilizada

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Clave start ausente inválida o reutilizada; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,idempotencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. POST start sin key, con dos headers y key201 chars.
2. Crear con key K y repetir K otro quiz/sección.
3. Repetir K original.

- Interfaz esperada: N/A companion HTTP.
- API esperada: 400 clave inválida/duplicada;409 K otro destino; mismo destino201 mismoID.
- Persistencia / consistencia: Un intento para K.
- Denegación: No alias de clave entre operaciones distintas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-010"></a>

## E2E-ATTEMPT-010 — Start simultáneo con claves distintas

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-01](../audit/FLOWS.md#fl-attempt-01).
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Start simultáneo con claves distintas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `startQuizAttempt; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Dos contextos ST1 POST start Q1 con K1/K2 en barrera.
2. Esperar ambos.
3. Consultar tabla/eventos.

- Interfaz esperada: Un intento activo accesible; otro conflicto.
- API esperada: 201 y409; nunca dos activos.
- Persistencia / consistencia: Un in_progress y un started.
- Denegación: No flakiness por asumir orden ganador.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
