# Funcionalidades GRADE

Evidencia: [gradebook.service.ts](../../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../../frontend/src/components/gradebook/weights-form.tsx).
Permisos comunes: Student solo propias publicadas; staff libro scoped; teacher publica scoped; teacher+owner configura pesos.
Estados: Grade no publicada → publicada inmutable; pesos abiertos → frozen; promedio null/parcial/completo.

## FL-GRADE-01 — Cálculo decimal y notas propias publicadas
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/grades`.
- Endpoints/operaciones: getStudentGrades; getCourseGradebook; submitQuizAttempt; resolver path/método en [API](../API.md).
- Roles: Student solo propias publicadas; staff libro scoped; teacher publica scoped; teacher+owner configura pesos.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: AVERAGE, GRADING, GRADING-ROUND, HISTORY, PUBLISHED, UNPUBLISHED, ZERO-WEIGHT; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Grade no publicada → publicada inmutable; pesos abiertos → frozen; promedio null/parcial/completo.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [GRADE](../../catalog/GRADE.md); cada ficha precisa pasos y persistencia.

## FL-GRADE-02 — Libro docente por alumno y sección
- Requisito: CU-16; RF25/29; RNF1/2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/gradebook`.
- Endpoints/operaciones: getCourseGradebook; listCourseGradeItems; listQuizAttempts; resolver path/método en [API](../API.md).
- Roles: Student solo propias publicadas; staff libro scoped; teacher publica scoped; teacher+owner configura pesos.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, EMPTY, HISTORY, HISTORY+PAGES, PAGES; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Grade no publicada → publicada inmutable; pesos abiertos → frozen; promedio null/parcial/completo.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [GRADE](../../catalog/GRADE.md); cada ficha precisa pasos y persistencia.

## FL-GRADE-03 — Ponderaciones completas y congelación global
- Requisito: CU-10; RF21/26; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/gradebook`.
- Endpoints/operaciones: updateGradebookWeights; listCourseGradeItems; getCourseGradebook; resolver path/método en [API](../API.md).
- Roles: Student solo propias publicadas; staff libro scoped; teacher publica scoped; teacher+owner configura pesos.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: PAGES+FROZEN, RACE, WEIGHTS, WEIGHTS+LOST-RESPONSE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Grade no publicada → publicada inmutable; pesos abiertos → frozen; promedio null/parcial/completo.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [GRADE](../../catalog/GRADE.md); cada ficha precisa pasos y persistencia.

## FL-GRADE-04 — Publicación explícita atómica e idempotente
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/gradebook`.
- Endpoints/operaciones: publishGrades; getCourseGradebook; getStudentGrades; resolver path/método en [API](../API.md).
- Roles: Student solo propias publicadas; staff libro scoped; teacher publica scoped; teacher+owner configura pesos.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: LATEST-ACTIVE, PUBLISH-INCOMPLETE, PUBLISHABLE, PUBLISHABLE+DELAY, PUBLISHABLE+LOST-RESPONSE, PUBLISHABLE+REVOKE, PUBLISHED, PUBLISHED+REVOKE, RACE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Grade no publicada → publicada inmutable; pesos abiertos → frozen; promedio null/parcial/completo.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [GRADE](../../catalog/GRADE.md); cada ficha precisa pasos y persistencia.
