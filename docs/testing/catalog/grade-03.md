# Fichas GRADE · 03

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-011"></a>

## E2E-GRADE-011 — Libro vacío no incluye estudiantes sin Grade

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Libro vacío no incluye estudiantes sin Grade; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: estado-vacío.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: EMPTY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir libro curso con matrículas pero sin intentos graded.
2. Consultar grade-items.
3. Revisar empty state.

- Interfaz esperada: Sin resultados de notas, no filas inventadas por roster; ítems si existen.
- API esperada: Book items[]; API agrupada desde grades.
- Persistencia / consistencia: Sin cambios.
- Denegación: No tratar ausencia de fila como nota0.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-012"></a>

## E2E-GRADE-012 — Cambio filtro reinicia cursor y selección

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Cambio filtro reinicia cursor y selección; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: paginación,scope.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Avanzar página libro y seleccionar estudiantes para publicación.
2. Cambiar filtro de sección.
3. Volver primera y siguiente.

- Interfaz esperada: Selección/cursor anterior reseteados; no estudiantes invisibles seleccionados.
- API esperada: Requests scoped al nuevo filtro; no POST al cambiar filtro.
- Persistencia / consistencia: Sin cambios.
- Denegación: No publicar destinatarios de página anterior inadvertidamente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-013"></a>

## E2E-GRADE-013 — Límites y curso ajeno en libro

- Módulo / flujo: GRADE; [FL-GRADE-02](../audit/FLOWS.md#fl-grade-02).
- Requisito: CU-16; RF25/29; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Límites y curso ajeno en libro; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,authz.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `getCourseGradebook; listCourseGradeItems; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. GET book limit1/20/100.
2. Probar0/101/cursor corrupto y sectionId ajena.
3. Volver filtro autorizado.

- Interfaz esperada: Error de filtros recuperable; no páginas mixtas.
- API esperada: 400 límites/cursor;404 sección fuera alcance.
- Persistencia / consistencia: Sin cambios.
- Denegación: No aumento de alcance por limit/cursor.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-014"></a>

## E2E-GRADE-014 — Guardar pesos exactos suma100

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Guardar pesos exactos suma100; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,cálculo.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Ponderaciones en COPEN.
2. Introducir33.33,33.33,33.34.
3. Guardar y volver.

- Interfaz esperada: Total100 y valores confirmados; solo owner+teacher puede editar.
- API esperada: PUT200 colección completa; GETtotal100.
- Persistencia / consistencia: Pesos NUMERIC exactos, evento weightsUpdated único.
- Denegación: T1 ordinario/assistant/owner sin teacher denegados.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-015"></a>

## E2E-GRADE-015 — Suma inválida colección incompleta y duplicados

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Suma inválida colección incompleta y duplicados; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar suma99.99/100.01, omitir ítem y repetir gradeItemId.
2. Probar ítem ajeno.
3. Leer pesos.

- Interfaz esperada: No guardar; error conserva valores previos.
- API esperada: 422 suma/incompleta;400 duplicado;ítem no perteneciente422 por colección; no inventar404 universal.
- Persistencia / consistencia: Ningún peso parcial ni evento.
- Denegación: Colección completa es requisito.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
