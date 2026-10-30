# Fichas ATTEMPT · 03

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-011"></a>

## E2E-ATTEMPT-011 — Guardar reemplaza respuestas y persiste

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Guardar reemplaza respuestas y persiste; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Seleccionar a en pregunta1 y b en pregunta2.
2. Guardar respuestas.
3. Volver al quiz, abrir A1 conocido y consultar GET.

- Interfaz esperada: Respuestas confirmadas iguales; sin autosave ni nota anticipada.
- API esperada: PUT200 answers completo y sin corrección.
- Persistencia / consistencia: answers en DB iguales; attempt.answersSaved metadata sin respuestas.
- Denegación: Otro student no escribe A1.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-012"></a>

## E2E-ATTEMPT-012 — Guardar vacío requiere confirmación

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Guardar vacío requiere confirmación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar inicialmente dos respuestas.
2. Quitar todas selecciones y Guardar sin respuestas.
3. Cancelar diálogo, luego confirmar.

- Interfaz esperada: Cancelar conserva servidor; confirmar borra conjunto; avance0.
- API esperada: PUT con answers[] solo tras confirmar;200.
- Persistencia / consistencia: DB answers[]; estado sigue in_progress.
- Denegación: No submit/cancel automático al borrar.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-013"></a>

## E2E-ATTEMPT-013 — Pregunta alternativa inválida y respuesta duplicada

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Pregunta alternativa inválida y respuesta duplicada; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,seguridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PUT pregunta de otro quiz o alternativa inexistente.
2. Probar misma questionId dos veces y campos isCorrect/grade inyectados.
3. Leer intento.

- Interfaz esperada: Error y respuestas previas intactas.
- API esperada: 422 referencia pregunta/alternativa;400 duplicado/extra/tipo.
- Persistencia / consistencia: Sin respuestas ni eventos parciales.
- Denegación: No confiar corrección suministrada cliente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-014"></a>

## E2E-ATTEMPT-014 — Guardado no cambia cuota ni genera Grade

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Guardado no cambia cuota ni genera Grade; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar una selección válida.
2. Repetir exactamente el mismo array.
3. Consultar intentos Grade audit.

- Interfaz esperada: Mismo intento y estado; sin nota.
- API esperada: 200 ambos; no-op sin evento adicional.
- Persistencia / consistencia: Una actualización real, ningún Grade hasta submit.
- Denegación: No calificar al guardar.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-015"></a>

## E2E-ATTEMPT-015 — Guardar después del cierre

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-02](../audit/FLOWS.md#fl-attempt-02).
- Requisito: CU-08; RF19/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Guardar después del cierre; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tiempo,estado.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WINDOW-CROSS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir A1 antes del cierre.
2. Pasar deadline de DB por fixture temporal seguro fuera del test activo o reloj real con margen.
3. Guardar y leer A1.

- Interfaz esperada: Conflicto; edición no se presenta guardada; intento sigue activo.
- API esperada: PUT409 fuera de ventana;GET200 aún inProgress.
- Persistencia / consistencia: answers anteriores intactas; no cancelación automática.
- Denegación: No aceptar hora enviada por navegador.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
