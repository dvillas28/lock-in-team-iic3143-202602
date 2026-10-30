# Fichas RBAC · 02

[Índice RBAC](RBAC.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-rbac-006"></a>

## E2E-RBAC-006 — Estudiante solo recorrido propio

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Estudiante solo recorrido propio; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,privacidad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1 y abrir notas/intento propio.
2. Forzar gradebook/audit/enrollments/authoring y escritura académica.
3. Abrir A-ST2.

- Interfaz esperada: Notas propias; sin acciones staff.
- API esperada: 403 en operaciones sobre recurso visible; intento ajeno 404; drafts 404.
- Persistencia / consistencia: Sin mutaciones ajenas.
- Denegación: No corrección/notas anticipadas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-007"></a>

## E2E-RBAC-007 — Revocar isAdmin conserva docencia

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Revocar isAdmin conserva docencia; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,revocación.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. AO abre editor global y contenido.
2. SA revoca isAdmin con API aislada.
3. AO vuelve al foco e intenta config/pesos y editar material.

- Interfaz esperada: Desaparecen funciones owner; docencia S1 sigue; borrador no autoriza escritura global.
- API esperada: Config/weights 403; contenido docente permitido; /me flags actuales.
- Persistencia / consistencia: Matrículas/docencia intactas; sin escritura administrativa posterior.
- Denegación: Rol docente no repone flag.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-008"></a>

## E2E-RBAC-008 — Owner teacher amplía a sección distinta

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Owner teacher amplía a sección distinta; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,scope.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login AO teacher solo S1 dueño C1.
2. Leer libro S2 y publicar quiz destino S2.
3. T1 ordinario intenta mismas acciones.

- Interfaz esperada: AO autorizado global; T1 no ve secciones ajenas de staff.
- API esperada: AO 200/201; T1 destino S2 404; course-wide quiz T1 403.
- Persistencia / consistencia: Solo cambios AO en S2.
- Denegación: Ownership sin teacher es otro perfil y no se equipara.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-009"></a>

## E2E-RBAC-009 — Teacher más student con acceso a pauta no rinde

- Módulo / flujo: RBAC; [FL-RBAC-02](../audit/FLOWS.md#fl-rbac-02).
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Teacher más student con acceso a pauta no rinde; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: multirol,seguridad.
- Rol / institución: TS-SAME; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login con teacher+student S1.
2. Abrir Q1/pauta.
3. Intentar start Q1 S1 por API.

- Interfaz esperada: Ver pauta permitido; no Iniciar intento.
- API esperada: Authoring 200; start 403.
- Persistencia / consistencia: No intento ni evento started.
- Denegación: Separación pauta/rendición efectiva en API.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-010"></a>

## E2E-RBAC-010 — Teacher S2 student S1 sin pauta de Q1 puede rendir

- Módulo / flujo: RBAC; [FL-RBAC-02](../audit/FLOWS.md#fl-rbac-02).
- Requisito: CU-04/08/13/15/16; RF11/25/27/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Teacher S2 student S1 sin pauta de Q1 puede rendir; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: multirol,scope.
- Rol / institución: TS-CROSS; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/quizzes/{Q1}; /attempts/{A1}`; `getQuizAuthoringView; startQuizAttempt; getQuizAttempt; listQuizAttempts`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login teacher S2+student S1 sin ownership.
2. Intentar pauta de Q1 S1.
3. Iniciar Q1 S1 y guardar.

- Interfaz esperada: No pauta Q1; rendición propia autorizada.
- API esperada: Authoring 403; start 201 y answers 200; no owner ampliando pauta.
- Persistencia / consistencia: Intento propio S1, sin corrección visible.
- Denegación: No bloquear todo teacher institucional por rol global.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
