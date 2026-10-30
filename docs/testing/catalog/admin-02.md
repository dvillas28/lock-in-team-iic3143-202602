# Fichas ADMIN · 02

[Índice ADMIN](ADMIN.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-admin-006"></a>

## E2E-ADMIN-006 — Flags independientes y delegación propia

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Flags independientes y delegación propia; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: multirol,authz.
- Rol / institución: SA; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. SA con isAdmin false se concede solo isAdmin true en propia membership.
2. Revalidar UI.
3. Revocar isAdmin propia sin cambiar superadmin.

- Interfaz esperada: Puede habilitar crear curso solo mientras isAdmin true.
- API esperada: PUT permitido según membership vigente; isSuperAdmin permanece.
- Persistencia / consistencia: Cambios auditados; no transferencia de ownership.
- Denegación: No asumir isSuperAdmin implica admin siempre.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-007"></a>

## E2E-ADMIN-007 — Onboarding inicial repetible sin reset de credenciales

- Módulo / flujo: ADMIN; [FL-ADMIN-02](../audit/FLOWS.md#fl-admin-02).
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Onboarding inicial repetible sin reset de credenciales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,integridad.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI/API; operación controlada`; `onboard-institution; set-superadmin (operaciones existentes, no endpoints)`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Revisar contrato operativo y generar Institution nueva en DB efímera.
2. Ejecutar operación onboarding con secreto efímero.
3. Repetir mismo operationId y comprobar cambios posteriores preservados.

- Interfaz esperada: N/A integración operativa sin UI; login posterior solo si aplica.
- API esperada: No endpoint POST institutions/users; usar firma documentada de operación existente.
- Persistencia / consistencia: Una institution/membership y audit onboarding; no reponer privilegios/passwords revocados.
- Denegación: Sin acceso runtime a escritura identidades.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-008"></a>

## E2E-ADMIN-008 — Recuperación superadmin controlada y auditada

- Módulo / flujo: ADMIN; [FL-ADMIN-02](../audit/FLOWS.md#fl-admin-02).
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Recuperación superadmin controlada y auditada; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,auditoría.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI/API; operación controlada`; `onboard-institution; set-superadmin (operaciones existentes, no endpoints)`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Aplicar set-superadmin según contrato en tenant de fixture.
2. Repetir operationId y comprobar metadata audit.
3. Intentar equivalente con runtime SQL.

- Interfaz esperada: N/A integración operativa.
- API esperada: No API autoservicio isSuperAdmin; runtime denegado.
- Persistencia / consistencia: Cambio limitado a membership tenant; actor operativo/source/operatorRef/operationId; repeat-safe.
- Denegación: No asignación superadmin global ni secreto en evento.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-009"></a>

## E2E-ADMIN-009 — Revocar último superadmin exige reemplazo

- Módulo / flujo: ADMIN; [FL-ADMIN-02](../audit/FLOWS.md#fl-admin-02).
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Revocar último superadmin exige reemplazo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: integridad,authz.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI/API; operación controlada`; `onboard-institution; set-superadmin (operaciones existentes, no endpoints)`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Ejecutar node backend/dist/data-migrations/set-superadmin.js con SUPERADMIN_ENABLED=false para único SA y sin reemplazo.
2. Repetir con SUPERADMIN_REPLACEMENT_USER_ID activo distinto.
3. Consultar flags y eventos.

- Interfaz esperada: N/A integración operativa.
- API esperada: Sin reemplazo conflicto y exit no cero; con reemplazo éxito; no endpoint HTTP.
- Persistencia / consistencia: Reemplazo true y objetivo false atómicos; isAdmin/Enrollment intactos; dos eventos misma operación.
- Denegación: Nunca cero superadmins activos por estas revocaciones serializadas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-010"></a>

## E2E-ADMIN-010 — Onboarding colisión y operación repetida con input distinto

- Módulo / flujo: ADMIN; [FL-ADMIN-02](../audit/FLOWS.md#fl-admin-02).
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Onboarding colisión y operación repetida con input distinto; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: idempotencia,integridad.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI/API; operación controlada`; `onboard-institution; set-superadmin (operaciones existentes, no endpoints)`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Ejecutar onboard-institution.js sobre slug nuevo con User existente exacto.
2. Repetir operationId cambiando institutionName o UserId.
3. Probar slug existente sin evento reconocido.

- Interfaz esperada: N/A integración operativa.
- API esperada: Conflicto/exit no cero para fingerprint distinto o colisión; ningún endpoint nuevo.
- Persistencia / consistencia: Sin duplicar User ni adoptar institution ajena; password/name User existente intactos.
- Denegación: No reponer flags por replay.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
