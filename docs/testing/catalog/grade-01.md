# Fichas GRADE · 01

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-001"></a>

## E2E-GRADE-001 — Escala numérica y exigencia60

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Escala numérica y exigencia60; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: cálculo,integridad.
- Rol / institución: ST1; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: GRADING; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Rendir quizzes con0,30,60,80,100% según fixtures.
2. Teacher leer cada resultado.
3. Publicar y student consultar.

- Interfaz esperada: Notas1.0,2.5,4.0,5.5,7.0 respectivamente; porcentaje y nota no confundidos.
- API esperada: API mismos números, SQL NUMERIC rounding; student solo tras publicación.
- Persistencia / consistencia: Grade coincide intento; nunca nota0 ni >7.
- Denegación: No frontend recalifica ni oculta errores con promedio local.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-002"></a>

## E2E-GRADE-002 — Redondeo HALF_UP y porcentaje previo a nota

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Redondeo HALF_UP y porcentaje previo a nota; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: cálculo,borde.
- Rol / institución: ST1; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: GRADING-ROUND; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Rendir quiz con1/3 y2/3 puntos correctos.
2. Consultar teacher.
3. Publicar y leer propias.

- Interfaz esperada: 33.33%=>2.7 y66.67%=>4.5; exactitud un decimal.
- API esperada: Porcentaje dos decimales, nota decimal; expected calculado independientemente con decimal/oráculo fijo.
- Persistencia / consistencia: score_points/percent/grade consistentes.
- Denegación: No usar función productiva como único oráculo esperado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-003"></a>

## E2E-GRADE-003 — Sin notas publicadas promedio null

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Sin notas publicadas promedio null; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: privacidad,estado-vacío.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: UNPUBLISHED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Calificar A1 sin publicar.
2. Abrir Mis notas.
3. Revisar payload completo y libro docente.

- Interfaz esperada: Student vacío y promedio pendiente; no ceros ni nota anticipada.
- API esperada: my-grades200 items[] partialAverage null publishedWeight0 isPartial true.
- Persistencia / consistencia: Grade existe sin publishedAt, visible solo staff.
- Denegación: No request gradebook/grade-items de student para completar nota.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-004"></a>

## E2E-GRADE-004 — Publicación parcial y promedio normalizado

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Publicación parcial y promedio normalizado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: cálculo,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: AVERAGE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar Q1 nota4 peso30 y Q2 nota7 peso70.
2. Publicar solo Q1 y abrir notas.
3. Publicar Q2 y volver.

- Interfaz esperada: Primero promedio4.0/peso30/parcial; luego6.1/peso100/no parcial.
- API esperada: my-grades refleja sum(grade*weight)/sum(published weights).
- Persistencia / consistencia: Grades/weights exactos y ambos published al final.
- Denegación: No contar nota no publicada en denominador.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-005"></a>

## E2E-GRADE-005 — Peso cero publicado y promedio null

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Peso cero publicado y promedio null; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,cálculo.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ZERO-WEIGHT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar Q0 peso0 y otros ítems sumando100.
2. Publicar solo Q0.
3. Abrir Mis notas.

- Interfaz esperada: Nota publicada visible, peso0 y promedio pendiente, no0 ni NaN.
- API esperada: items contiene Q0; partialAverage null publishedWeight0 isPartial true.
- Persistencia / consistencia: Published Grade persiste; pesos globales100.
- Denegación: No tratar nota visible como promedio disponible.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
