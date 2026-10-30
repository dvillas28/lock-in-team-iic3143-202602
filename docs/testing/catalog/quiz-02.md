# Fichas QUIZ · 02

[Índice QUIZ](QUIZ.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-quiz-006"></a>

## E2E-QUIZ-006 — Editar ordenar agregar y quitar preguntas

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Editar ordenar agregar y quitar preguntas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir QD con dos preguntas.
2. Mover segunda arriba, editar enunciado y añadir alternativa/pregunta.
3. Quitar nueva pregunta y guardar.

- Interfaz esperada: Orden/pauta correctos después de volver; foco funcional.
- API esperada: PATCH200 conserva UUID existentes; nuevas preguntas servidor; positions únicas.
- Persistencia / consistencia: JSON preguntas correcto y un evento por cambio real.
- Denegación: No renumerar UUID existentes por posición.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-007"></a>

## E2E-QUIZ-007 — Configuración opcional y fechas exactas en PATCH mínimo

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Configuración opcional y fechas exactas en PATCH mínimo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: consistencia,regresión.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear fechas con zona y fracción >ms, maxAttempts null.
2. Abrir editor y cambiar solo título.
3. Guardar y leer authoring.

- Interfaz esperada: Fechas no se alteran al editar título; campos null siguen opcionales.
- API esperada: PATCH solo title; no reenviar fecha truncada por datetime-local.
- Persistencia / consistencia: Valores originales de apertura/cierre iguales en SQL; título cambiado.
- Denegación: No redondear timestamps silenciosamente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-008"></a>

## E2E-QUIZ-008 — Pauta inválida y alternativas duplicadas

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Pauta inválida y alternativas duplicadas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar pregunta con cero/dos correctas, una alternativa o IDs alternativos repetidos.
2. Probar prompt vacío.
3. Corregir exactamente una correcta y dos alternativas.

- Interfaz esperada: Errores locales sin POST si detectables; válido se guarda.
- API esperada: API directa422 en reglas; tipo incorrecto400.
- Persistencia / consistencia: Sin quiz/eventos por rechazo.
- Denegación: No publicar pauta incoherente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-009"></a>

## E2E-QUIZ-009 — Puntos posiciones e identidades de pregunta

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Puntos posiciones e identidades de pregunta; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PATCH con points0/negativo/0.001 y posiciones repetidas/0.
2. Probar UUID nuevo inventado como existente y duplicate questionId.
3. Enviar puntos0.01 válidos.

- Interfaz esperada: Error específico sin perder borrador.
- API esperada: 422 semánticos; UUID mal formado400; suma puntos máximo999999.99.
- Persistencia / consistencia: No modificación parcial ni pauta duplicada.
- Denegación: No reutilizar pregunta de otro quiz.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-quiz-010"></a>

## E2E-QUIZ-010 — Fechas imposibles ventana invertida y maxAttempts

- Módulo / flujo: QUIZ; [FL-QUIZ-02](../audit/FLOWS.md#fl-quiz-02).
- Requisito: CU-07; RF17/18/25/27; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [quizzes.service.ts](../../../backend/src/quizzes/quizzes.service.ts); [quiz-validation.ts](../../../backend/src/quizzes/quiz-validation.ts); [quiz-editor.tsx](../../../frontend/src/components/quizzes/quiz-editor.tsx); [quiz-create.tsx](../../../frontend/src/components/quizzes/quiz-create.tsx).
- Objetivo: Fechas imposibles ventana invertida y maxAttempts; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,tiempo.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{QD}/authoring`; `createQuiz; updateQuiz; getQuizAuthoringView`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Probar 30 febrero, año0000 y sin zona por API.
2. Probar cierre<=apertura y maxAttempts0/fracción.
3. Corregir fechas y maxAttempts1.

- Interfaz esperada: Errores de campo; no normalización silenciosa; válido persiste.
- API esperada: 400 fecha sintáctica/inválida;422 ventana/intentos; max positivo o null.
- Persistencia / consistencia: Draft anterior permanece si rechazo.
- Denegación: No inferir contador por duración inexistente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
