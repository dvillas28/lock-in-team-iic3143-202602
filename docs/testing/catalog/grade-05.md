# Fichas GRADE · 05

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-021"></a>

## E2E-GRADE-021 — Publicar selección explícita y ver nota estudiante

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Publicar selección explícita y ver nota estudiante; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,persistencia.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Publicar notas y seleccionar item I1 secciónS1 estudianteST1.
2. Revisar resumen de pares y confirmar.
3. Login ST1 y abrir Mis notas.

- Interfaz esperada: Recibo cantidad1/fecha; nota4.0 aparece a ST1; otras permanecen ocultas.
- API esperada: POST200 key estable body tres arrays explícitos; my-grades200 publicado.
- Persistencia / consistencia: Grade.publishedAt, freeze, receipt y grade.published atómicos.
- Denegación: Solo teacher scope; no assistant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-022"></a>

## E2E-GRADE-022 — Selección vacía y rectángulo incompleto

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Selección vacía y rectángulo incompleto; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: validación,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISH-INCOMPLETE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir diálogo sin seleccionar.
2. Elegir dos items y estudiantes donde falta un par.
3. Intentar confirmar y forzar API.

- Interfaz esperada: Confirmación deshabilitada; explicación del par faltante.
- API esperada: 400 arrays vacíos;409 falta Grade del producto item×student; sin POST UI inválido.
- Persistencia / consistencia: Ninguna nota parcial publicada ni receipt.
- Denegación: No seleccionar alumnos de páginas ocultas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-023"></a>

## E2E-GRADE-023 — Intento activo bloquea; cancelado no basta para nota

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Intento activo bloquea; cancelado no basta para nota; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,integridad.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: LATEST-ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Intentar publicar Grade previa con A2 activo.
2. Cancelar A2 y publicar de nuevo.
3. Intentar publicar alumno con solo cancelled sin graded.

- Interfaz esperada: Conflicto primero; tras cancelar permite Grade previa; sin graded sigue bloqueado.
- API esperada: 409 activo/falta Grade;200 tras cancelación con Grade válida.
- Persistencia / consistencia: No cancelación automática ni nota fabricada.
- Denegación: No publicar mientras haya inProgress seleccionado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-024"></a>

## E2E-GRADE-024 — Último graded y valores consistentes requeridos

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Último graded y valores consistentes requeridos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: integridad,cálculo.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear dos graded y Grade vigente última.
2. Intentar selección sin pesos100.
3. Completar pesos y publicar vigente; caracterizar inconsistencia solo en integración fixture válida.

- Interfaz esperada: No éxito con precondiciones incumplidas; última nota publicada.
- API esperada: 409 total distinto100;200 nota coherente; invariantes SQL companion en OPS.
- Persistencia / consistencia: No published Grade apuntando intento antiguo.
- Denegación: No fixture que desactive triggers para fabricar aceptación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-025"></a>

## E2E-GRADE-025 — Replay misma clave selección canónica

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Replay misma clave selección canónica; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar dos ítems/alumnos con keyK.
2. Reordenar arrays manteniendo mismos IDs y repetirK.
3. Consultar receipt/eventos.

- Interfaz esperada: Mismo count/timestamp; un éxito persistido.
- API esperada: 200 receipt original tras revalidar permisos.
- Persistencia / consistencia: Un receipt y un grade.published por Grade.
- Denegación: No auditar replay como nueva publicación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
