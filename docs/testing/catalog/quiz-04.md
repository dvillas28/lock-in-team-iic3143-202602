# Fichas QUIZ · 04

[Índice QUIZ](QUIZ.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-quiz-016"></a>

## E2E-QUIZ-016 — Publicado no editable aunque no tenga intentos

- Módulo / flujo: QUIZ; [FL-QUIZ-03](../audit/FLOWS.md#fl-quiz-03).
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Publicado no editable aunque no tenga intentos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `publishQuiz; updateQuiz; listCourseGradeItems`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar quiz sin intentos.
2. PATCH título preguntas destino y fechas.
3. Leer pauta original.

- Interfaz esperada: UI solo lectura; no botón edición efectiva.
- API esperada: PATCH409 desde publicación; no esperar primer intento.
- Persistencia / consistencia: Pauta y política inmutables, sin evento de actualización.
- Denegación: Nuevo quiz requiere otro flujo, no despublicación inexistente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-017"></a>

## E2E-QUIZ-017 — Publicar vacío o con curso congelado

- Módulo / flujo: QUIZ; [FL-QUIZ-03](../audit/FLOWS.md#fl-quiz-03).
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Publicar vacío o con curso congelado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,estado.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+FROZEN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `publishQuiz; updateQuiz; listCourseGradeItems`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear draft sin preguntas en COPEN.
2. Intentar publish por API.
3. Crear draft válido antes de freeze CFROZEN y publicarlo después de primera nota.

- Interfaz esperada: Bloqueo sin preguntas; freeze impide nuevo ítem.
- API esperada: 422 vacío;409 curso frozen; draft válido no publicado.
- Persistencia / consistencia: Sin GradeItem ni quiz.published de rechazo.
- Denegación: No modificar pesos para sortear freeze.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-018"></a>

## E2E-QUIZ-018 — Carrera publish quiz con primera publicación de notas

- Módulo / flujo: QUIZ; [FL-QUIZ-03](../audit/FLOWS.md#fl-quiz-03).
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Carrera publish quiz con primera publicación de notas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `publishQuiz; updateQuiz; listCourseGradeItems`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Dos contextos: publicar QD y publicar primera Grade C1 con barrera.
2. Esperar ambas.
3. Leer ítems/pesos/freeze y eventos.

- Interfaz esperada: Resultado coherente; UI informa conflicto del perdedor según orden.
- API esperada: Si QD primero añade peso0 compatible con total100, ambas pueden ganar; si freeze primero publish quiz409.
- Persistencia / consistencia: Nunca GradeItem creado después de lock activo; todo atómico.
- Denegación: No exigir exactamente un ganador si ambas operaciones son compatibles.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
