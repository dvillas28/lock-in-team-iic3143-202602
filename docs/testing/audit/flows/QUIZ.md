# Funcionalidades QUIZ

Evidencia: [quizzes.service.ts](../../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../../frontend/src/components/quizzes/quiz-create.tsx).
Permisos comunes: Teacher autoriza destino; owner+teacher todo curso; no-owner teacher solo destino propio; assistant/student publicado visible.
Estados: draft → published irreversible; GradeItem peso0; published no editable; freeze bloquea nuevos ítems.

## FL-QUIZ-01 — Catálogo, detalle seguro y filtros de quizzes
- Requisito: CU-07/08; RF17/25/27; RNF1/2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/quizzes; /courses/{C1}/quizzes/{Q1}`.
- Endpoints/operaciones: listCourseQuizzes; getQuiz; getQuizAuthoringView; resolver path/método en [API](../API.md).
- Roles: Teacher autoriza destino; owner+teacher todo curso; no-owner teacher solo destino propio; assistant/student publicado visible.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, EMPTY; [definiciones](../../E2E_TEST_DATA.md).
- Estados: draft → published irreversible; GradeItem peso0; published no editable; freeze bloquea nuevos ítems.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [QUIZ](../../catalog/QUIZ.md); cada ficha precisa pasos y persistencia.

## FL-QUIZ-02 — Autoría de borrador y validación
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/quizzes/{QD}/authoring`.
- Endpoints/operaciones: createQuiz; updateQuiz; getQuizAuthoringView; resolver path/método en [API](../API.md).
- Roles: Teacher autoriza destino; owner+teacher todo curso; no-owner teacher solo destino propio; assistant/student publicado visible.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: WRITE, WRITE+LOST-RESPONSE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: draft → published irreversible; GradeItem peso0; published no editable; freeze bloquea nuevos ítems.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [QUIZ](../../catalog/QUIZ.md); cada ficha precisa pasos y persistencia.

## FL-QUIZ-03 — Publicación irreversible y freeze de ítems
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/quizzes/{QD}/authoring`.
- Endpoints/operaciones: publishQuiz; updateQuiz; listCourseGradeItems; resolver path/método en [API](../API.md).
- Roles: Teacher autoriza destino; owner+teacher todo curso; no-owner teacher solo destino propio; assistant/student publicado visible.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: RACE, WRITE, WRITE+FROZEN; [definiciones](../../E2E_TEST_DATA.md).
- Estados: draft → published irreversible; GradeItem peso0; published no editable; freeze bloquea nuevos ítems.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [QUIZ](../../catalog/QUIZ.md); cada ficha precisa pasos y persistencia.
