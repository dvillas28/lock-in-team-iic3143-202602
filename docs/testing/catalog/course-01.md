# Fichas COURSE · 01

[Índice COURSE](COURSE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-course-001"></a>

## E2E-COURSE-001 — Mis cursos refleja usuario tenant y periodo

- Módulo / flujo: COURSE; [FL-COURSE-01](../audit/FLOWS.md#fl-course-01).
- Requisito: CU-03; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Mis cursos refleja usuario tenant y periodo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,consistencia.
- Rol / institución: ST1; T1; AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}`; `listCourses; getCourse; listSections`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login cada actor UC.
2. Comparar tarjetas con manifest permitido.
3. Abrir C1 y breadcrumbs/resumen.

- Interfaz esperada: Código/nombre/term exactos; no C3/F1; roles del curso actual.
- API esperada: GET courses solo ownership o Enrollment activo; detalle createdBy correcto.
- Persistencia / consistencia: Volver/abrir preserva datos servidor.
- Denegación: No tarjeta falsa por rol de otro curso.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-002"></a>

## E2E-COURSE-002 — Dashboard sin cursos

- Módulo / flujo: COURSE; [FL-COURSE-01](../audit/FLOWS.md#fl-course-01).
- Requisito: CU-03; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Dashboard sin cursos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: estado-vacío.
- Rol / institución: MEMBER; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: EMPTY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}`; `listCourses; getCourse; listSections`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login miembro activo sin Enrollments ni ownership.
2. Abrir Mis cursos.
3. Revalidar foco.

- Interfaz esperada: Estado vacío único, no spinner eterno ni cursos demo.
- API esperada: 200 items [].
- Persistencia / consistencia: Sin cambios.
- Denegación: No fallback a listado global.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-003"></a>

## E2E-COURSE-003 — Identificadores inválidos e inexistentes

- Módulo / flujo: COURSE; [FL-COURSE-01](../audit/FLOWS.md#fl-course-01).
- Requisito: CU-03; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Identificadores inválidos e inexistentes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: negativo,borde.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}`; `listCourses; getCourse; listSections`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Navegar curso abc y UUID-AUSENTE.
2. Llamar API equivalente.
3. Volver C1 por enlace interno.

- Interfaz esperada: Validación/error recuperable; no detalle residual de C1.
- API esperada: 400 UUID mal formado; 404 válido ausente.
- Persistencia / consistencia: Sin cambios.
- Denegación: No stacktrace ni enumeración.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-004"></a>

## E2E-COURSE-004 — Revocación última matrícula retira curso

- Módulo / flujo: COURSE; [FL-COURSE-01](../audit/FLOWS.md#fl-course-01).
- Requisito: CU-03; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Revocación última matrícula retira curso; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}`; `listCourses; getCourse; listSections`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1 C1.
2. T1 revoca único student ST1.
3. Foco y recargar listado vía navegación SPA.

- Interfaz esperada: C1 desaparece; URL conocida no permite detalle.
- API esperada: List sin C1 y detail 404.
- Persistencia / consistencia: Enrollments históricos/Grades intactos.
- Denegación: No caché privada posterior a revocación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-005"></a>

## E2E-COURSE-005 — Dashboard error recupera sin mezclar identidad

- Módulo / flujo: COURSE; [FL-COURSE-01](../audit/FLOWS.md#fl-course-01).
- Requisito: CU-03; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Dashboard error recupera sin mezclar identidad; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: red,recuperación.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}`; `listCourses; getCourse; listSections`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retrasar listCourses real y observar carga.
2. Fallar una consulta y activar Reintentar.
3. Liberar respuesta real vigente.

- Interfaz esperada: Carga accesible, error y recuperación a tarjetas correctas.
- API esperada: GET de reintento real 200; sin POST.
- Persistencia / consistencia: Sin cambios.
- Denegación: Ninguna tarjeta de actor anterior.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
