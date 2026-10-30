# Fichas ATTEMPT · 07

[Índice ATTEMPT](ATTEMPT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-attempt-031"></a>

## E2E-ATTEMPT-031 — Seguimiento paginado y filtros históricos

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-04](../audit/FLOWS.md#fl-attempt-04).
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Seguimiento paginado y filtros históricos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: paginación,privacidad.
- Rol / institución: T1; AS1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`; `cancelQuizAttempt; listQuizAttempts; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Intentos Q1.
2. Filtrar section/student/status y recorrer páginas.
3. Abrir revisión A1 y cambiar filtro.

- Interfaz esperada: Solo scope autorizado, ID/estado/fecha; assistant sin corrección, teacher sí en graded.
- API esperada: GET attempts200; status submitted filtro válido puede vacío; cursor scoped.
- Persistencia / consistencia: Sin cambios.
- Denegación: Curso/quiz de URL debe coincidir con intento.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-attempt-032"></a>

## E2E-ATTEMPT-032 — Cancelación perdida y GET fallido conserva éxito 204

- Módulo / flujo: ATTEMPT; [FL-ATTEMPT-04](../audit/FLOWS.md#fl-attempt-04).
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [attempts.service.ts](../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../frontend/src/components/attempts/attempt-detail.tsx).
- Objetivo: Cancelación perdida y GET fallido conserva éxito 204; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,consistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`; `cancelQuizAttempt; listQuizAttempts; getQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Confirmar cancelación y recibir204.
2. Fallar GET posterior.
3. Reintentar consulta explícita.

- Interfaz esperada: Cancelación confirmada se mantiene, fecha pendiente; no revive botones por GET fallido.
- API esperada: No segundo POST automático; GET eventual cancelled.
- Persistencia / consistencia: Un cancelled persistido.
- Denegación: Si se pierde204 estado incierto requiere replay/consulta, no éxito inventado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
