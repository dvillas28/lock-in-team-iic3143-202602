# Fichas ADMIN · 01

[Índice ADMIN](ADMIN.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-admin-001"></a>

## E2E-ADMIN-001 — Listar miembros activos institucionales

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Listar miembros activos institucionales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,tenant.
- Rol / institución: SA; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Autenticar SA y GET memberships UC limit1.
2. Recorrer páginas.
3. Comparar miembros activos con manifest e intentar cursor cruzado.

- Interfaz esperada: N/A no pantalla administrativa implementada.
- API esperada: 200 activosUC; limit0/101 y cursor cruzado400; sin hash de password.
- Persistencia / consistencia: Solo lectura.
- Denegación: No miembros UTFSM ni inactivos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-002"></a>

## E2E-ADMIN-002 — Conceder isAdmin habilita crear curso

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Conceder isAdmin habilita crear curso; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,persistencia.
- Rol / institución: SA; MEMBER; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. SA PUT membership MEMBER course-admin isAdmin true.
2. MEMBER revalida foco o relogin en UI.
3. Crear curso con MEMBER.

- Interfaz esperada: Aparece Crear curso; no cursos ajenos ni pauta automática.
- API esperada: PUT200, /me isAdmin true y POSTcourse201.
- Persistencia / consistencia: Flag solo UC; membership.adminChanged una vez; curso propio teacher inicial.
- Denegación: Sin isSuperAdmin concedido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-003"></a>

## E2E-ADMIN-003 — Revocar delegación y repetir no-op

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Revocar delegación y repetir no-op; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: revocación,idempotencia.
- Rol / institución: SA; AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. SA revoca isAdmin AO.
2. Repite PUT false.
3. AO revalida y forzar crear/configurar.

- Interfaz esperada: Controles administrativos retirados; Enrollment docente conserva funciones.
- API esperada: PUT200 dos veces; crear/config403.
- Persistencia / consistencia: Un evento por cambio, no por no-op; flags otros tenants intactos.
- Denegación: No borrar cursos de AO.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-004"></a>

## E2E-ADMIN-004 — Admin y roles académicos no delegan

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Admin y roles académicos no delegan; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,seguridad.
- Rol / institución: AO; T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cada actor GET memberships.
2. PUT isAdmin true a sí mismo.
3. Intentar body isSuperAdmin/active extra.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: Sin UI de delegación; sus capacidades originales intactas.
- API esperada: 403 cuando permiso insuficiente en body válido;400 shape extra validado antes servicio.
- Persistencia / consistencia: Sin flags/eventos cambiados.
- Denegación: No self-escalation ni dependencia del botón UI.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-admin-005"></a>

## E2E-ADMIN-005 — Target otra institución inactivo o ausente

- Módulo / flujo: ADMIN; [FL-ADMIN-01](../audit/FLOWS.md#fl-admin-01).
- Requisito: RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Target otra institución inactivo o ausente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,authz.
- Rol / institución: SA; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia; efecto /courses`; `listInstitutionMemberships; setInstitutionCourseAdmin`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. SAUC PUT membership UTFSM bajoUC.
2. Probar membership revocada y UUID-AUSENTE.
3. Leer flags ambos tenants.

- Interfaz esperada: N/A companionHTTP.
- API esperada: 404 para targets no visibles/activos; sin enumeración.
- Persistencia / consistencia: Flags/auditoría sin cambios.
- Denegación: SA no es superadministrador global.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
