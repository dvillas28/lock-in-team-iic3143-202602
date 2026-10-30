# Fichas ENROLL · 03

[Índice ENROLL](ENROLL.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-enroll-011"></a>

## E2E-ENROLL-011 — Cambio hacia rol activo existente

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Cambio hacia rol activo existente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,multirol.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar ST2 student+assistant S1.
2. Cambiar student a assistant.
3. Recorrer historial.

- Interfaz esperada: Reutiliza assistant activo; student histórico; sin tercer rol duplicado.
- API esperada: 200 retorna enrollment assistant existente.
- Persistencia / consistencia: Un assistant activo, un student revocado y un evento de cambio.
- Denegación: No violar unicidad activa.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-012"></a>

## E2E-ENROLL-012 — Revocar mediante confirmación

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Revocar mediante confirmación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,persistencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Gestionar ST2 y Revocar student.
2. Cancelar diálogo y comprobar sin PATCH.
3. Confirmar revocación después.

- Interfaz esperada: Cancelación no escribe; confirmación retira acceso student y conserva historial.
- API esperada: PATCH active false 200; /me ST2 actualizado.
- Persistencia / consistencia: Una transición auditada; sin borrado de notas/intentos.
- Denegación: No otros roles revocados por esta acción.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-013"></a>

## E2E-ENROLL-013 — Autorrevocación último teacher permitido

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Autorrevocación último teacher permitido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,regresión.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. T1 teacher único S1 abre gestión propia.
2. Revoca teacher y vuelve al foco.
3. Intenta editar contenido/participantes.

- Interfaz esperada: Se retiran acciones; curso e historia permanecen; no bloqueo mínimo docente inventado.
- API esperada: PATCH autorizado 200; futuras escrituras 403/404 según scope residual.
- Persistencia / consistencia: Enrollment histórico; no borrado del curso.
- Denegación: No usar UI vieja después de auto-revocación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-014"></a>

## E2E-ENROLL-014 — Reactivar matrícula por API sin UI

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Reactivar matrícula por API sin UI; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: persistencia,integridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar Enrollment histórico ST2.
2. PATCH active true por API.
3. Consultar UI participantes y /me ST2.

- Interfaz esperada: Fila vuelve activa; UI no requiere botón de reactivación inexistente.
- API esperada: 200; conflicto 409 si ya existe mismo rol activo distinto.
- Persistencia / consistencia: No duplicación; enrollment.activeChanged una vez.
- Denegación: Rol de histórico no cambia.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-enroll-015"></a>

## E2E-ENROLL-015 — Payload estricto y rol inválido

- Módulo / flujo: ENROLL; [FL-ENROLL-02](../audit/FLOWS.md#fl-enroll-02).
- Requisito: CU-04; RF10–12/25/26; RNF2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [participant-search.service.ts](../../../backend/src/institutions/participant-search.service.ts); [participants-panel.tsx](../../../frontend/src/components/courses/participants-panel.tsx); [enrollment-form.tsx](../../../frontend/src/components/courses/enrollment-form.tsx).
- Objetivo: Payload estricto y rol inválido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: validación,seguridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSectionEnrollments; createSectionEnrollment; updateSectionEnrollment`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. POST rol coordinator/admin u objeto extra.
2. PATCH role y active juntos, active string y body vacío.
3. Leer historial.

- Interfaz esperada: Errores; sin éxito ni fila corrupta.
- API esperada: 400 en cada shape/rol inválido.
- Persistencia / consistencia: Snapshot enrollments/events estable.
- Denegación: No flags institucionales vía Enrollment.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
