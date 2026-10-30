# Fichas GRADE · 02

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-006"></a>

## E2E-GRADE-006 — Notas ajenas no seleccionables por query

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Notas ajenas no seleccionables por query; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,privacidad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Mis notas ST1.
2. Añadir studentId ST2 a API my-grades.
3. Comparar payload propio y navegar atrás.

- Interfaz esperada: Solo ST1; UI sin selector de alumno ajeno.
- API esperada: Query no permitida400; sin query200 propio; user derivado JWT.
- Persistencia / consistencia: Sin cambios.
- Denegación: No datos ST2 ni unpublished en payload.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-007"></a>

## E2E-GRADE-007 — Historial de sección no reescribe nota al trasladar alumno

- Módulo / flujo: GRADE; [FL-GRADE-01](../audit/FLOWS.md#fl-grade-01).
- Requisito: CU-09/12; RF20/23/24; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Historial de sección no reescribe nota al trasladar alumno; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: scope,persistencia.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/grades`; `getStudentGrades; getCourseGradebook; submitQuizAttempt`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Calificar ST1 en S1.
2. Revocar student S1 y matricular student S2 mismo curso.
3. Leer libro con T1 S1 y propias tras publicación autorizada.

- Interfaz esperada: Fila histórica S1 permanece; nota propia según student activo del curso.
- API esperada: Book usa Grade.section_id histórica; my-grades con rol student curso devuelve propias publicadas.
- Persistencia / consistencia: section_id del intento/Grade no cambia por nueva matrícula.
- Denegación: No mover historia a sección actual ni exponer otra sección al staff.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-008"></a>

## E2E-GRADE-008 — Libro muestra publicadas y no publicadas autorizadas

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Libro muestra publicadas y no publicadas autorizadas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,authz.
- Rol / institución: T1; AS1; AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login cada perfil y abrir libro C1.
2. Filtrar sección.
3. Abrir enlace a intento graded.

- Interfaz esperada: Teacher/assistant S1; owner teacher global; unpublished distinguida; media solo publicadas.
- API esperada: Book200 con Grade sin pauta; no corrección assistant en revisión.
- Persistencia / consistencia: Lectura sin cambios.
- Denegación: Sin notas S2 para T1/AS1.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-009"></a>

## E2E-GRADE-009 — Filas separadas mismo alumno dos secciones

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Filas separadas mismo alumno dos secciones; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: paginación,consistencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY+PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar Grades ST1 S1 y S2 de distintos quizzes.
2. Recorrer libro.
3. Filtrar S1 luego S2.

- Interfaz esperada: Filas distintas studentId+sectionId; medias de su grupo.
- API esperada: Cursor incluye fecha/student/section; sin colisión row key.
- Persistencia / consistencia: Sin cambios.
- Denegación: No agregar notas históricas en sección incorrecta.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-010"></a>

## E2E-GRADE-010 — Filas históricas de usuarios inactivos

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Filas históricas de usuarios inactivos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: persistencia,privacidad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar Grade ST2 S1.
2. Desactivar User ST2 mediante fixture.
3. Abrir libro.

- Interfaz esperada: Historial sigue visible al staff autorizado con usuario active false.
- API esperada: Book200 incluye registro histórico; no habilita login ST2.
- Persistencia / consistencia: Notas no borradas ni cambiadas.
- Denegación: No filtrar historia solo por membership actual estudiante.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
