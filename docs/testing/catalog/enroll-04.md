# Fichas ENROLL · 04

[Índice ENROLL](ENROLL.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-enroll-016"></a>

## E2E-ENROLL-016 — Rol en matrícula inactiva y no-op

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Rol en matrícula inactiva y no-op; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: estado,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PATCH role de matrícula inactiva.
2. PATCH active false ya false.
3. PATCH role idéntico en activa.

- Interfaz esperada: Conflicto en cambio de histórico; no-op no crea sucesor.
- API esperada: 409 histórico; 200 no-op.
- Persistencia / consistencia: Sin eventos extra por no-op.
- Denegación: No reescribir historia.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).

<a id="e2e-enroll-017"></a>

## E2E-ENROLL-017 — Dos asignaciones concurrentes mismo rol

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Dos asignaciones concurrentes mismo rol; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: concurrencia,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Dos contextos envían ST2 student S1 simultáneo.
2. Esperar respuestas.
3. Revisar historial y audit.

- Interfaz esperada: Una matrícula confirmada compartida.
- API esperada: 201 y 200 con mismo id al serializar Course.
- Persistencia / consistencia: Un activo, un evento.
- Denegación: Sin 500/unicidad rota.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).

<a id="e2e-enroll-018"></a>

## E2E-ENROLL-018 — Páginas de historial y actor revocado

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Páginas de historial y actor revocado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: paginación,authz.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES+REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cargar 21+ matrículas activas y 21+ históricas.
2. Avanzar/Primera página en «Activas» y en «Historial».
3. Revocar docente y pedir cursor anterior.

- Interfaz esperada: cada vista pagina por separado, sin omisiones/duplicados; tras revocación se limpia alcance.
- API esperada: limit default20 max100; `status=active|historical` filtra y sin `status` lista todo; cursor inválido/limit0/101/status inválido 400; acceso revalidado.
- Persistencia / consistencia: Sin cambios excepto revocación de fixture.
- Denegación: No historial de otra sección/tenant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).

<a id="e2e-enroll-019"></a>

## E2E-ENROLL-019 — Diálogo y PATCH pendiente al cambiar sección

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Diálogo y PATCH pendiente al cambiar sección; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,scope.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cambiar rol ST2 S1 reteniendo respuesta.
2. Cerrar diálogo y cambiar a S2.
3. Liberar respuesta y revisar nuevo workspace.

- Interfaz esperada: No confirmación ni seleccionado ST2 en S2; incertidumbre no dispara segundo PATCH.
- API esperada: Un PATCH S1, nunca PATCH accidental S2.
- Persistencia / consistencia: Cambio solo S1 y audit correcto.
- Denegación: No mezclar identidad/cuerpo en UI nueva.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).

<a id="e2e-enroll-020"></a>

## E2E-ENROLL-020 — Teacher no gestiona matrículas docentes

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx).
- Objetivo: Solo el admin dueño asigna, cambia, revoca o reactiva teachers; teacher gestiona students/assistants.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,regresión.
- Rol / institución: T1 y AO; UC.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; login real en origen institucional.

1. T1 asigna teacher, promueve ST2 y revoca/degrada a AO por API.
2. AO asigna y revoca a ST2 como teacher; T1 intenta reactivarlo.
3. T1 abre la gestión de S1.

- Interfaz esperada: fila teacher ajena sin acciones; student propio gestionable.
- API esperada: T1 403 en todas las operaciones docentes; AO 201/200.
- Persistencia / consistencia: denegaciones sin cambios ni eventos; historial conservado.
- Denegación: `is_admin` sin ownership no amplía permisos docentes.
- Limpieza: cerrar contextos; datos históricos quedan en namespace del test.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression.
- Estado del test: Pendiente de validación en GitHub Actions.
