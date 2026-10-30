# Fichas RBAC · 03

[Índice RBAC](RBAC.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-rbac-011"></a>

## E2E-RBAC-011 — Assistant y student acumulan capacidades diferenciadas

- Módulo / flujo: RBAC; [FL-RBAC-02](../audit/FLOWS.md#fl-rbac-02).
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Assistant y student acumulan capacidades diferenciadas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: multirol,privacidad.
- Rol / institución: AS-ST; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login assistant+student S1.
2. Abrir intento propio por ruta propia.
3. Abrir seguimiento staff de mismo quiz e intentar escribir otro intento.

- Interfaz esperada: Ruta propia sin nota/corrección; staff puede agregar nota autorizada, nunca isCorrect.
- API esperada: GET propio proyección student; staff list proyecta assistant; otro intento no editable.
- Persistencia / consistencia: Solo intento propio puede cambiar.
- Denegación: No filtrar notas staff como si solo existiera student.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-012"></a>

## E2E-RBAC-012 — Revocación de teacher con cursor y sesión vigentes

- Módulo / flujo: RBAC; [FL-RBAC-02](../audit/FLOWS.md#fl-rbac-02).
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Revocación de teacher con cursor y sesión vigentes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,revocación.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE+PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir audit/libro S1 y obtener cursor.
2. Revocar Enrollment teacher T1.
3. Reusar cursor y forzar URL/API sin relogin.

- Interfaz esperada: Pierde controles/datos al revalidar; no página cacheada con notas.
- API esperada: 404 sin curso visible o 403 si conserva otro rol; cursor no retiene privilegio.
- Persistencia / consistencia: Historial conservado; ningún cambio posterior del actor.
- Denegación: No acceso heredado por cursor.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-013"></a>

## E2E-RBAC-013 — Parámetros visuales no escalan rol

- Módulo / flujo: RBAC; [FL-RBAC-02](../audit/FLOWS.md#fl-rbac-02).
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Parámetros visuales no escalan rol; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,authz.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1.
2. Añadir ?role=teacher&experience=admin a courses/sections/authoring.
3. Forzar POST quiz/publications.

- Interfaz esperada: Permisos siguen student; autoría bloqueada.
- API esperada: 403/404 según recurso, no flags desde URL.
- Persistencia / consistencia: Sin cambios.
- Denegación: No usar mockup role como identidad.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
