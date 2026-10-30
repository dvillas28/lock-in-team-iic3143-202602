# Fichas ATTEMPT · 06

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-026"></a>

## E2E-ATTEMPT-026 — Recibo perdido admite replay en misma página

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Recibo perdido admite replay en misma página; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: red,idempotencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar y perder respuesta tras commit.
2. Observar incertidumbre.
3. Reintentar operación original sin cambiar key ni cuerpo.

- Interfaz esperada: Mismo intento graded confirmado; no muestra nota sin publicar.
- API esperada: Replay200 key idéntica; GET no genera receipt inventado.
- Persistencia / consistencia: Un Grade y evento graded.
- Denegación: No cambiar selección/actor al recuperar.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-027"></a>

## E2E-ATTEMPT-027 — Recarga durante envío exige consulta posterior

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-03](../audit/FLOWS.md#fl-attempt-03).
- Requisito: CU-09; RF20/23/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Recarga durante envío exige consulta posterior; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,red,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}`; `submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retener respuesta submit real.
2. Recargar documento y relogin con ID conocido.
3. Consultar A1 tras finalizar petición vieja.

- Interfaz esperada: Sesión/clave RAM perdidas; consulta terminal, sin replay automático ni recibo atribuido de otro envío.
- API esperada: GET estado actual; no nuevo POST submit sin key original.
- Persistencia / consistencia: A1 a lo sumo una vez graded; Grade coherente.
- Denegación: Logout no promete deshacer transacción ya recibida servidor.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-028"></a>

## E2E-ATTEMPT-028 — Cancelar propio no cambia Grade anterior

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-04](../audit/FLOWS.md#fl-attempt-04).
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Cancelar propio no cambia Grade anterior; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,integridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: LATEST-ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`; `cancelQuizAttempt; listQuizAttempts; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Con Grade previa no publicada iniciar A2.
2. Abrir cancelar y confirmar.
3. Leer A2 y libro como teacher.

- Interfaz esperada: Cancelado con fecha al consultar; Grade anterior conservada.
- API esperada: 204 cancel; GET cancelled; sin score/corrección student.
- Persistencia / consistencia: Cancelled consume intento2, no nueva Grade ni sustitución del intento1.
- Denegación: No restaurar intento ni devolver cuota.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-029"></a>

## E2E-ATTEMPT-029 — Teacher cancela sección histórica aun student revocado

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-04](../audit/FLOWS.md#fl-attempt-04).
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Teacher cancela sección histórica aun student revocado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE-ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`; `cancelQuizAttempt; listQuizAttempts; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. ST1 inicia A1.
2. Revocar su Enrollment sin borrar historia.
3. T1 abre revisión histórica y cancelación.

- Interfaz esperada: Teacher S1 conserva cancelación; estudiante ya no puede.
- API esperada: Teacher cancel204; student GET/write404 o403 según roles residuales.
- Persistencia / consistencia: Un cancelled event actorT1 secciónS1; Grade previa intacta.
- Denegación: Teacher otra sección no cancela salvo owner+teacher.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-030"></a>

## E2E-ATTEMPT-030 — Cancelar replay y estados terminales

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-04](../audit/FLOWS.md#fl-attempt-04).
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Cancelar replay y estados terminales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,estado.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: TERMINAL; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`; `cancelQuizAttempt; listQuizAttempts; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cancelar A1 dos veces.
2. Intentar save/submit A1 cancelled.
3. Intentar cancelar intento graded.

- Interfaz esperada: Cancelación conocida no se duplica; terminales sin acciones.
- API esperada: Cancel204 repetido; save/submit409; cancel graded409.
- Persistencia / consistencia: Un evento cancelled; graded intacto.
- Denegación: Sin reapertura ni modificación terminal.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
