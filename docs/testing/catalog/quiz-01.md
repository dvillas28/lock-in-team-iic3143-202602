# Fichas QUIZ · 01

[Índice QUIZ](QUIZ.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-quiz-001"></a>

## E2E-QUIZ-001 — Listado y detalle por rol y destino

- Módulo / flujo: QUIZ; [FL-QUIZ-01](../audit/FLOWS.md#fl-quiz-01).
- Requisito: CU-07/08; RF17/25/27; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Listado y detalle por rol y destino; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,authz,privacidad.
- Rol / institución: AO; T1; T2; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes; /courses/{C1}/quizzes/{Q1}`; `listCourseQuizzes; getQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir listado C1 por actor.
2. Filtrar destino S1/S2 y publicar/draft.
3. Abrir detalle seguro Q1 y forzar Q-DRAFT ajeno.

- Interfaz esperada: Solo quizzes visibles por scope; no student draft; owner teacher amplía.
- API esperada: List/detail sin isCorrect en vista segura; authoring separado; invisible404.
- Persistencia / consistencia: Sin cambios.
- Denegación: No pauta en JSON aunque UI no la pinte.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-002"></a>

## E2E-QUIZ-002 — Buscar filtrar limpiar sin llamadas no previstas

- Módulo / flujo: QUIZ; [FL-QUIZ-01](../audit/FLOWS.md#fl-quiz-01).
- Requisito: CU-07/08; RF17/25/27; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Buscar filtrar limpiar sin llamadas no previstas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: estado-vacío,navegación.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes; /courses/{C1}/quizzes/{Q1}`; `listCourseQuizzes; getQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar título inexistente.
2. Combinar Estado Borrador y destinatario S1.
3. Limpiar filtros.

- Interfaz esperada: Conteo y vacío de búsqueda correctos; limpiar recupera listado autorizado.
- API esperada: Filtros visuales locales sobre lista recibida; no inventar paginación quiz.
- Persistencia / consistencia: Sin cambios.
- Denegación: No borrar filtro tenant ni cargar quizzes ajenos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-003"></a>

## E2E-QUIZ-003 — Lista vacía y sin instrucciones

- Módulo / flujo: QUIZ; [FL-QUIZ-01](../audit/FLOWS.md#fl-quiz-01).
- Requisito: CU-07/08; RF17/25/27; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Lista vacía y sin instrucciones; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: EMPTY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes; /courses/{C1}/quizzes/{Q1}`; `listCourseQuizzes; getQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir CEMPTY/quizzes.
2. Abrir quiz visible con instructions null.
3. Revisar hechos y destino.

- Interfaz esperada: Vacío legítimo; instrucciones fallback; sin datos demo de relleno.
- API esperada: 200 [] y detalle permitido; sin error parser.
- Persistencia / consistencia: Sin cambios.
- Denegación: No confundir draft invisible con fallo servidor.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-004"></a>

## E2E-QUIZ-004 — Pauta de publicado solo autor autorizado

- Módulo / flujo: QUIZ; [FL-QUIZ-01](../audit/FLOWS.md#fl-quiz-01).
- Requisito: CU-07/08; RF17/25/27; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Pauta de publicado solo autor autorizado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,seguridad.
- Rol / institución: T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes; /courses/{C1}/quizzes/{Q1}`; `listCourseQuizzes; getQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Q1 como T1 y Ver pauta.
2. AS1/ST1 fuerzan authoring URL/API.
3. Inspeccionar respuestas de red seguras.

- Interfaz esperada: T1 pauta visible solo lectura; otros error sin pauta residual.
- API esperada: Authoring200 T1;403 AS1/ST1 si publicado visible; draft invisible404.
- Persistencia / consistencia: Sin cambios.
- Denegación: isCorrect jamás en respuesta student/assistant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-005"></a>

## E2E-QUIZ-005 — Crear quiz completo con preguntas y pauta

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Crear quiz completo con preguntas y pauta; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear título Quiz E2E destino S1.
2. Agregar dos preguntas puntos6/4, dos alternativas a/b y correcta a en ambas.
3. Crear y abrir editor desde listado.

- Interfaz esperada: Quiz draft y pauta persistidos; sin publicación automática.
- API esperada: POST201 Location, UUID preguntas servidor; authoring200 con isCorrect.
- Persistencia / consistencia: Una quiz, preguntas JSONB y audit metadata; sin GradeItem hasta publicar.
- Denegación: createdBy servidor; teacher ordinario no crea whole-course.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
