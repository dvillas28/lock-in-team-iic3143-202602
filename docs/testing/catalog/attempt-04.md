# Fichas ATTEMPT · 04

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-016"></a>

## E2E-ATTEMPT-016 — PUT perdido bloquea envío y cancelación

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: PUT perdido bloquea envío y cancelación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: red,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar PUT y perder respuesta tras commit.
2. Pulsar enviar/cancelar/editar.
3. Consultar estado y dejar llegar GET.

- Interfaz esperada: Guardado incierto; controles siguen bloqueados; GET no demuestra fin de un PUT tardío.
- API esperada: No POST submit/cancel después de PUT ambiguo.
- Persistencia / consistencia: Solo PUT original; sin Grade ni cancelación.
- Denegación: No desbloquear por igualdad de un GET observado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-017"></a>

## E2E-ATTEMPT-017 — Guardar simultáneamente desde dos contextos

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Guardar simultáneamente desde dos contextos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: concurrencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Contextos A y B guardan conjuntos distintos con barrera y orden de liberación.
2. Esperar confirmaciones.
3. Consultar A1.

- Interfaz esperada: Último write confirmado según serialización; no mezcla parcial.
- API esperada: Dos200; no prometer versionado o merge de respuestas.
- Persistencia / consistencia: Un array completo de una escritura y eventos correspondientes.
- Denegación: Nunca respuesta de otro usuario.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-018"></a>

## E2E-ATTEMPT-018 — Enviar guarda borrador antes del POST

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Enviar guarda borrador antes del POST; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,integridad.
- Rol / institución: ST1; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Elegir respuestas correctas sin guardar.
2. Confirmar Enviar.
3. Teacher revisar A1 y Grade; student revisar recibo.

- Interfaz esperada: PUT confirmado antes de POST; recibo graded sin nota student; teacher ve100%/7.
- API esperada: PUT200 seguido POST200 con key; receipt solo id/status/submittedAt.
- Persistencia / consistencia: Intento graded, Grade no publicada, attempt.graded y grade.created atómicos.
- Denegación: Student sin score/grade/corrección por respuesta.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-019"></a>

## E2E-ATTEMPT-019 — Entrega parcial y vacía califica omisiones cero

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Entrega parcial y vacía califica omisiones cero; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,cálculo.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear intentos separados con solo pregunta1 correcta y con answers[].
2. Confirmar envío vacío explícito.
3. Teacher consultar resultados.

- Interfaz esperada: Aviso respuestas faltantes; envío permitido; no inventar obligatoriedad de todas.
- API esperada: 200 graded; parcial60%=>4.0 para puntos6/4; vacío0%=>1.0.
- Persistencia / consistencia: Grade coherente; ninguna submitted durable.
- Denegación: No cero como nota válida.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-020"></a>

## E2E-ATTEMPT-020 — Último graded reemplaza mejor nota previa

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Último graded reemplaza mejor nota previa; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: cálculo,persistencia.
- Rol / institución: ST1; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: LATEST; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Calificar intento1 100%/7.
2. Crear intento2 0%/1 y enviar.
3. Revisar libro y antes publicar.

- Interfaz esperada: Teacher ve1.0 vigente y conserva historial intento1; student aún no ve nota.
- API esperada: GET book Grade apunta intento2; no elegir mejor nota.
- Persistencia / consistencia: Una Grade vigente no publicada, attemptId más alto graded y grade.updated.
- Denegación: Sin cambio del resultado histórico de intento1.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
