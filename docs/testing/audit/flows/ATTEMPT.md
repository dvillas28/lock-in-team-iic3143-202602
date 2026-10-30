# Funcionalidades ATTEMPT

Evidencia: [attempts.service.ts](../../../../backend/src/attempts/attempts.service.ts); [attempt-access.ts](../../../../backend/src/attempts/attempt-access.ts); [operations.ts](../../../../frontend/src/lib/attempts/operations.ts); [attempt-detail.tsx](../../../../frontend/src/components/attempts/attempt-detail.tsx).
Permisos comunes: Student elegible propio sin acceso a pauta; teacher sección histórica/owner+teacher cancela/revisa; assistant solo seguimiento.
Estados: inProgress → graded o cancelled; submitted interno transaccional; terminal inmutable; ventana [opens,closes).

## FL-ATTEMPT-01 — Inicio y reanudación desde identificador conocido
- Requisito: CU-08; RF19/25/27; RNF2/3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`.
- Endpoints/operaciones: startQuizAttempt; getQuizAttempt; resolver path/método en [API](../API.md).
- Roles: Student elegible propio sin acceso a pauta; teacher sección histórica/owner+teacher cancela/revisa; assistant solo seguimiento.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: ACTIVE, LIMIT, LIMIT-NULL, PUBLISHED, RACE, WINDOWS, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: inProgress → graded o cancelled; submitted interno transaccional; terminal inmutable; ventana [opens,closes).
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ATTEMPT](../../catalog/ATTEMPT.md); cada ficha precisa pasos y persistencia.

## FL-ATTEMPT-02 — Guardar conjunto completo de respuestas
- Requisito: CU-08; RF19/25/27; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/attempts/{A1}`.
- Endpoints/operaciones: saveQuizAttemptAnswers; getQuizAttempt; resolver path/método en [API](../API.md).
- Roles: Student elegible propio sin acceso a pauta; teacher sección histórica/owner+teacher cancela/revisa; assistant solo seguimiento.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: ACTIVE, ACTIVE+LOST-RESPONSE, WINDOW-CROSS; [definiciones](../../E2E_TEST_DATA.md).
- Estados: inProgress → graded o cancelled; submitted interno transaccional; terminal inmutable; ventana [opens,closes).
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ATTEMPT](../../catalog/ATTEMPT.md); cada ficha precisa pasos y persistencia.

## FL-ATTEMPT-03 — Envío atómico autocorrección y recibo
- Requisito: CU-09; RF20/23/27; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/attempts/{A1}`.
- Endpoints/operaciones: submitQuizAttempt; saveQuizAttemptAnswers; getQuizAttempt; resolver path/método en [API](../API.md).
- Roles: Student elegible propio sin acceso a pauta; teacher sección histórica/owner+teacher cancela/revisa; assistant solo seguimiento.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: ACTIVE, ACTIVE+DELAY, ACTIVE+LOST-RESPONSE, LATEST, RACE, WINDOW-CROSS, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: inProgress → graded o cancelled; submitted interno transaccional; terminal inmutable; ventana [opens,closes).
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ATTEMPT](../../catalog/ATTEMPT.md); cada ficha precisa pasos y persistencia.

## FL-ATTEMPT-04 — Cancelación explícita y revisión histórica
- Requisito: CU-15/16; RF28/29; RNF2/3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/attempts/{A1}; /courses/{C1}/quizzes/{Q1}/attempts/{A1}`.
- Endpoints/operaciones: cancelQuizAttempt; listQuizAttempts; getQuizAttempt; resolver path/método en [API](../API.md).
- Roles: Student elegible propio sin acceso a pauta; teacher sección histórica/owner+teacher cancela/revisa; assistant solo seguimiento.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: ACTIVE+FAULT, LATEST-ACTIVE, PAGES, REVOKE-ACTIVE, TERMINAL; [definiciones](../../E2E_TEST_DATA.md).
- Estados: inProgress → graded o cancelled; submitted interno transaccional; terminal inmutable; ventana [opens,closes).
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [ATTEMPT](../../catalog/ATTEMPT.md); cada ficha precisa pasos y persistencia.
