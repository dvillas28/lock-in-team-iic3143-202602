# Fichas ENROLL · 01

[Índice ENROLL](ENROLL.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-enroll-001"></a>

## E2E-ENROLL-001 — Buscar por nombre correo mayúsculas y Unicode

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Buscar por nombre correo mayúsculas y Unicode; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,validación.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Asignar participante.
2. Buscar parte de nombre de ST2, correo en mayúsculas y nombre José.
3. Seleccionar resultado y comprobar identidad.

- Interfaz esperada: Resultados activos UC y selección explícita; no emails UTFSM.
- API esperada: GET users?search=... 200; coincidencia literal case-insensitive.
- Persistencia / consistencia: Sin cambios hasta Asignar rol.
- Denegación: No búsqueda global sin membership.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-002"></a>

## E2E-ENROLL-002 — Búsqueda vacía y sin coincidencias

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Búsqueda vacía y sin coincidencias; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: estado-vacío,negativo.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar espacios.
2. Buscar InexistenteE2E.
3. Repetir búsqueda ST2 válida.

- Interfaz esperada: Vacío no envía request; sin coincidencias mensaje; repetir es posible.
- API esperada: API directa search ausente/vacío 400; válido sin match 200 [].
- Persistencia / consistencia: Sin cambios.
- Denegación: No enumeración sin término desde UI.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-003"></a>

## E2E-ENROLL-003 — Caracteres especiales son literales

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Caracteres especiales son literales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: seguridad,borde.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+SEARCH; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar %, _, comilla y texto de inyección SQL.
2. Comparar solo usuarios con ese literal en nombre/email.
3. Volver búsqueda normal.

- Interfaz esperada: Texto escapado, lista sin ampliación global.
- API esperada: 200 coincidencias literales por strpos/parametrización; sin error SQL.
- Persistencia / consistencia: Tablas y personas intactas.
- Denegación: No ejecución SQL/HTML.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-004"></a>

## E2E-ENROLL-004 — Directorio excluye revocados inactivos y UTFSM

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Directorio excluye revocados inactivos y UTFSM; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,privacidad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar término común E2E.
2. Recorrer páginas.
3. Comparar con manifest de users activos y memberships UC activas.

- Interfaz esperada: Solo nombres/emails autorizados UC.
- API esperada: 200 sin usuarios desactivados, memberships revocadas ni solo UTFSM.
- Persistencia / consistencia: Sin cambios.
- Denegación: No resultados sensibles ocultos solo por CSS.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-005"></a>

## E2E-ENROLL-005 — Permiso de búsqueda requiere teacher institucional

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Permiso de búsqueda requiere teacher institucional; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz.
- Rol / institución: SA; AO-ONLY; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cada actor solicita users con búsqueda válida.
2. Teacher de otro curso UC repite.
3. Revisar UI de owner sin teacher.

- Interfaz esperada: Owner sin teacher usa UUID permitido, sin directorio; otros sin búsqueda.
- API esperada: No teacher 403; teacher activo en cualquier sección UC 200.
- Persistencia / consistencia: Sin cambios.
- Denegación: No conceder por isAdmin/isSuperAdmin.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
