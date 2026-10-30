# Fichas RBAC · 01

[Índice RBAC](RBAC.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-rbac-001"></a>

## E2E-RBAC-001 — Superadmin solo no obtiene permisos académicos

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Superadmin solo no obtiene permisos académicos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz.
- Rol / institución: SA; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login SA sin isAdmin ni Enrollment.
2. Revisar Mis cursos y forzar C1/gradebook/authoring.
3. Intentar crear curso por API.

- Interfaz esperada: Sin crear curso ni pauta/notas; listado vacío.
- API esperada: Create 403; curso ajeno 404; memberships autorizado se verifica ADMIN.
- Persistencia / consistencia: Sin cambios.
- Denegación: isSuperAdmin no implica isAdmin ni teacher.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-002"></a>

## E2E-RBAC-002 — Admin ajeno no administra todos los cursos

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Admin ajeno no administra todos los cursos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz.
- Rol / institución: AX; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login AX admin dueño C3.
2. Abrir C1 conocido.
3. Intentar PATCH C1 y POST sections C1.

- Interfaz esperada: C1 no visible sin Enrollment; controles no aparecen.
- API esperada: 404 sin rol; con teacher añadido en S1 ve C1 pero update/createSection 403.
- Persistencia / consistencia: C1 sin cambios.
- Denegación: isAdmin solo no concede ownership de C1.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-003"></a>

## E2E-RBAC-003 — Owner sin teacher mantiene solo administración

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Owner sin teacher mantiene solo administración; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,privacidad.
- Rol / institución: AO-ONLY; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login owner isAdmin sin Enrollments C1.
2. Editar nombre/crear sección.
3. Intentar módulos/pauta/libro/pesos y audit grade.

- Interfaz esperada: Config/secciones disponibles; sin acciones académicas.
- API esperada: Administrativos 200/201; content/quiz 404 sin roles; book/weights 403; audit no grade.
- Persistencia / consistencia: Solo cambios administrativos auditados.
- Denegación: No nota/corrección por ser dueño.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-004"></a>

## E2E-RBAC-004 — Teacher no admin escribe academia propia

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Teacher no admin escribe academia propia; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,happy.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login T1 sin isAdmin en S1.
2. Crear módulo/material y quiz S1.
3. Intentar configurar C1/crear S3/pesos.

- Interfaz esperada: Contenido/quiz permitido; configuración global ausente.
- API esperada: Académicos 201/200; config y pesos 403; sin permiso course-wide quiz.
- Persistencia / consistencia: Cambios compartidos visibles S2 si publicados.
- Denegación: No convertir docente no admin en solo lectura.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-rbac-005"></a>

## E2E-RBAC-005 — Assistant solo seguimiento autorizado

- Módulo / flujo: RBAC; [FL-RBAC-01](../audit/FLOWS.md#fl-rbac-01).
- Requisito: CU-03/04/07/10/11/13/16; RF10–12/21/25/29; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [course-access.ts](../../../backend/src/courses/course-access.ts); [quiz-access.ts](../../../backend/src/quizzes/quiz-access.ts); [gradebook-access.ts](../../../backend/src/gradebook/gradebook-access.ts).
- Objetivo: Assistant solo seguimiento autorizado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,privacidad.
- Rol / institución: AS1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/sections; /courses/{C1}/gradebook`; `createCourse; updateCourse; createSection; getCourseGradebook; updateGradebookWeights`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login AS1 y abrir libro/intentos S1.
2. Forzar pauta, save/submit/cancel/publications y pesos.
3. GET enrollments S1 separado.

- Interfaz esperada: Libro agregado sin corrección por respuesta; sin controles escritura; participantes UI ausente.
- API esperada: Libro/intentos 200; authoring 403 publicado visible; writes 403 o 404 según visibilidad; enrollment GET 200.
- Persistencia / consistencia: Nada mutado.
- Denegación: No isCorrect/pointsAwarded/pauta en payload.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
