# Fichas ATTEMPT · 05

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-021"></a>

## E2E-ATTEMPT-021 — Reenvío misma clave y clave distinta

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Reenvío misma clave y clave distinta; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: idempotencia,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar A1 key K.
2. Repetir K dos veces.
3. Enviar otra key K2 tras graded.

- Interfaz esperada: Un recibo estable, ningún envío duplicado.
- API esperada: K200 mismo timestamp;K2 409.
- Persistencia / consistencia: Una calificación y un evento graded/Grade correspondiente.
- Denegación: No alias a clave nueva tras éxito.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-022"></a>

## E2E-ATTEMPT-022 — Submit sin cuerpo y clave reutilizada en otro intento

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Submit sin cuerpo y clave reutilizada en otro intento; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,seguridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar A1 con K.
2. Intentar POST A2 con K.
3. Probar body answers inesperado y key ausente.

- Interfaz esperada: N/A companion HTTP.
- API esperada: 409 clave usada por otro intento;400 body no vacío/key ausente.
- Persistencia / consistencia: A2 sin calificar; A1 intacto.
- Denegación: No usar submit para inyectar respuestas o nota.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-023"></a>

## E2E-ATTEMPT-023 — Dos envíos simultáneos misma clave

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Dos envíos simultáneos misma clave; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,idempotencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear A1 con respuestas.
2. Dos clientes POST submit con K en barrera.
3. Leer receipt/Grade/eventos.

- Interfaz esperada: Resultado único; ambos clientes pueden confirmar mismo envío.
- API esperada: Ambos200 mismo receipt.
- Persistencia / consistencia: Una Grade y un graded event; no submitted pendiente.
- Denegación: No recalificación duplicada.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-024"></a>

## E2E-ATTEMPT-024 — Carrera submit cancelar

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Carrera submit cancelar; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,integridad.
- Rol / institución: ST1; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. A1 activo con respuestas.
2. ST1 submit y T1 cancel sincronizados.
3. Consultar estado Grade y audit.

- Interfaz esperada: Si graded gana cancel informa409; si cancel gana submit409.
- API esperada: Un estado terminal, HTTP coherente con orden; cancel204 o submit200.
- Persistencia / consistencia: Si cancelled no nueva Grade; si graded Grade única; sin combinación imposible.
- Denegación: No ambos éxitos incompatibles.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-025"></a>

## E2E-ATTEMPT-025 — Enviar fuera de plazo sin mutación parcial

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Enviar fuera de plazo sin mutación parcial; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tiempo,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WINDOW-CROSS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar A1 antes del cierre.
2. Cerrar ventana con tiempo preparado.
3. Confirmar envío y luego cancelar explícitamente.

- Interfaz esperada: Submit conflicto; intento sigue activo hasta cancelar.
- API esperada: Submit409; cancel204 aun fuera ventana.
- Persistencia / consistencia: Sin Grade ni submitted_at por rechazo; cancelled después.
- Denegación: No calificar tarde implícitamente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
