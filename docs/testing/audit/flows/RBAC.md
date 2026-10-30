# Funcionalidades RBAC

Evidencia: [course-access.ts](../../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../../backend/src/gradebook/gradebook-access.ts).
Permisos comunes: SA solo delega; admin crea; owner configura; teacher académico contextual; assistant consulta; student propio.
Estados: Flags independientes; ownership inmutable; Enrollment activo/histórico, roles acumulados por sección.

## FL-RBAC-01 — Flags institucionales y ownership frente a roles
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`.
- Endpoints/operaciones: createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights; resolver path/método en [API](../API.md).
- Roles: SA solo delega; admin crea; owner configura; teacher académico contextual; assistant consulta; student propio.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, REVOKE, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Flags independientes; ownership inmutable; Enrollment activo/histórico, roles acumulados por sección.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [RBAC](../../catalog/RBAC.md); cada ficha precisa pasos y persistencia.

## FL-RBAC-02 — Combinaciones multirol y revocación contextual
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`.
- Endpoints/operaciones: getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts; resolver path/método en [API](../API.md).
- Roles: SA solo delega; admin crea; owner configura; teacher académico contextual; assistant consulta; student propio.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, REVOKE+PAGES; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Flags independientes; ownership inmutable; Enrollment activo/histórico, roles acumulados por sección.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [RBAC](../../catalog/RBAC.md); cada ficha precisa pasos y persistencia.
