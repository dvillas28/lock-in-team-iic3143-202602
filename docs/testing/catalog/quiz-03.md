# Fichas QUIZ · 03

[Índice QUIZ](QUIZ.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-quiz-011"></a>

## E2E-QUIZ-011 — Mover borrador entre secciones autorizadas

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Mover borrador entre secciones autorizadas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,scope,privacidad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Leer QD destino S1.
2. Cambiar destino S2 y guardar.
3. T1 solo S1 y T2 solo S2 consultan quiz e historial.

- Interfaz esperada: AO cambia; T1 pierde draft y T2 ve draft permitido.
- API esperada: PATCH200; autor ordinario sin permiso destino404; audit reassignment sectionId null.
- Persistencia / consistencia: Misma UUID y curso; metadata de cambio sin pauta, visibilidad historial segura.
- Denegación: No evento del origen filtrado al docente solo destino.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-012"></a>

## E2E-QUIZ-012 — Límite JSON quiz y reintento tras error

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Límite JSON quiz y reintento tras error; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde,red.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Añadir texto hasta JSON UTF-8>4096.
2. Intentar guardar.
3. Reducir tamaño y crear quiz válido.

- Interfaz esperada: Error de tamaño; borrador editable; válido luego confirma.
- API esperada: API413 para cuerpo grande; formulario previene envío cuando detectado.
- Persistencia / consistencia: Ningún quiz truncado.
- Denegación: No asumir max10000 caracteres alcanzable vía HTTP.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-013"></a>

## E2E-QUIZ-013 — Creación con respuesta perdida

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Creación con respuesta perdida; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear quiz y perder respuesta tras commit.
2. Revisar estado incierto y filtros.
3. Consultar listado y abrir quiz creado.

- Interfaz esperada: No POST repetido automático ni borrador cambiado por foco.
- API esperada: Un create201 aplicado; GET descubre entidad por namespace.
- Persistencia / consistencia: Una quiz y un quiz.created.
- Denegación: No idempotency-key inventada para creación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-014"></a>

## E2E-QUIZ-014 — Publicar quiz crea ítem único peso cero

- Módulo / flujo: QUIZ; [FL-QUIZ-03](../audit/FLOWS.md#fl-quiz-03).
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Publicar quiz crea ítem único peso cero; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `publishQuiz; updateQuiz; listCourseGradeItems`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear QD válido en COPEN.
2. Abrir Publicar quiz y revisar resumen.
3. Confirmar y consultar GradeItems/libro.

- Interfaz esperada: Publicado sin editor; pauta autorizada solo lectura; ítem asociado.
- API esperada: POST publish200 sin body; GET item único weightPercent0.
- Persistencia / consistencia: publishedAt, un GradeItem y un quiz.published en misma transacción.
- Denegación: No nota ni intento creado al publicar.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-015"></a>

## E2E-QUIZ-015 — Publicación repetida es no-op autorizado

- Módulo / flujo: QUIZ; [FL-QUIZ-03](../audit/FLOWS.md#fl-quiz-03).
- Requisito: CU-07/10; RF18/21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Publicación repetida es no-op autorizado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `publishQuiz; updateQuiz; listCourseGradeItems`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar QD.
2. Repetir POST publish misma UUID dos veces.
3. Leer item y eventos.

- Interfaz esperada: Permanece publicado; sin duplicar ítem.
- API esperada: 200 mismas metadata, aun si curso congelado posteriormente.
- Persistencia / consistencia: Un GradeItem y un evento published.
- Denegación: Revalidar permisos en replay.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
