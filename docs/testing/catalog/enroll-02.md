# Fichas ENROLL · 02

[Índice ENROLL](ENROLL.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-enroll-006"></a>

## E2E-ENROLL-006 — Paginación y búsqueda tardía

- Módulo / flujo: ENROLL; [FL-ENROLL-01](../audit/FLOWS.md#fl-enroll-01).
- Requisito: CU-04; RF12/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Paginación y búsqueda tardía; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: paginación,red.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `searchInstitutionUsers`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar E2E y seleccionar ST2.
2. Cargar Más resultados.
3. Retener búsqueda vieja y emitir otra nueva, liberar vieja.

- Interfaz esperada: Selección se conserva al paginar pero se reinicia al nueva búsqueda; lista vigente.
- API esperada: Cursor scoped por actor/tenant/search; sin duplicados ni resultado viejo.
- Persistencia / consistencia: Sin cambios.
- Denegación: No asignar persona de selección obsoleta.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-007"></a>

## E2E-ENROLL-007 — Asignar participante existente y persistir

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Asignar participante existente y persistir; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Buscar ST2 activo sin rol S1.
2. Seleccionarlo, rol student, Asignar rol.
3. Reabrir sección e iniciar sesión ST2.

- Interfaz esperada: Confirmación e historial activo; ST2 ve C1.
- API esperada: 201 Location; GET enrollment refleja user/section/role.
- Persistencia / consistencia: Un Enrollment activo y enrollment.created; student no obtiene otros roles.
- Denegación: Usuario debe tener membership UC activa.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-008"></a>

## E2E-ENROLL-008 — Asignación duplicada es idempotente

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Asignación duplicada es idempotente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Asignar ST2 student S1.
2. Repetir misma asignación.
3. Consultar historial y eventos.

- Interfaz esperada: Misma matrícula, sin doble fila activa.
- API esperada: Primero 201, repetición 200 mismo id.
- Persistencia / consistencia: Un activo y un evento de creación.
- Denegación: N/A actor autorizado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-009"></a>

## E2E-ENROLL-009 — Roles acumulados distintos

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Roles acumulados distintos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: multirol,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Asignar ST2 student S1.
2. Añadir assistant al mismo usuario/sección.
3. Login ST2 y comparar capacidades.

- Interfaz esperada: Dos roles activos; capacidades por acción, no perfil único.
- API esperada: 201 para rol distinto; /me devuelve ambos.
- Persistencia / consistencia: Dos filas activas distintas, sin duplicar mismo rol.
- Denegación: No teacher ni isAdmin implícitos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-010"></a>

## E2E-ENROLL-010 — Cambio de rol conserva predecesor histórico

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Cambio de rol conserva predecesor histórico; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: persistencia,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Gestionar ST2 student.
2. Cambiar a assistant.
3. Consultar historial y revalidar ST2.

- Interfaz esperada: Student histórica y assistant activo; ID nuevo/sucesor confirmado.
- API esperada: PATCH 200 retorna successor; anterior active false.
- Persistencia / consistencia: enrollment.roleChanged before/after, Grades/Attempts no se reescriben.
- Denegación: No mutación in-place del role histórico.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
