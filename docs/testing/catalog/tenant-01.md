# Fichas TENANT · 01

[Índice TENANT](TENANT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-tenant-001"></a>

## E2E-TENANT-001 — UC no accede UTFSM sin membresía

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: UC no accede UTFSM sin membresía; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,authz.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC como ST1.
2. GET institutions y me/UTFSM por API con su token.
3. Abrir UTFSM/courses en nueva pestaña y autenticar ST1.

- Interfaz esperada: No datos UTFSM ni reutilización de sesión UC.
- API esperada: Institutions solo UC; path UTFSM 404 aun con token global válido.
- Persistencia / consistencia: Snapshot tenant UTFSM sin cambios.
- Denegación: 404 no revela si recurso existe.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-002"></a>

## E2E-TENANT-002 — Identidad con roles distintos entre instituciones

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Identidad con roles distintos entre instituciones; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,multirol.
- Rol / institución: MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login MULTI en UC y abrir C1.
2. Abrir UTFSM y autenticar misma identidad.
3. Abrir F1 y comparar capacidades.

- Interfaz esperada: Student UC, teacher UTFSM; sin botones docentes en UC.
- API esperada: Mismo userId; memberships/sectionMemberships scoped; operaciones usan slug correcto.
- Persistencia / consistencia: Escritura docente UTFSM no modifica UC.
- Denegación: No extrapolar rol UTFSM al tenant UC.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-003"></a>

## E2E-TENANT-003 — Path prevalece sobre Host Origin headers y body

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Path prevalece sobre Host Origin headers y body; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,seguridad.
- Rol / institución: MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Token MULTI: GET UC/courses con Host/Origin UTFSM y x-tenant utfsm.
2. Repetir path UTFSM con headers UC.
3. POST UC/courses con institutionId/body extra.

- Interfaz esperada: N/A HTTP complementaria; CORS no sustituye auth.
- API esperada: Paths devuelven solo tenant del path; body no permitido 400; Origin no concede identidad.
- Persistencia / consistencia: Ninguna relación cross-tenant creada.
- Denegación: No fallback por headers; request sin Bearer 401.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-004"></a>

## E2E-TENANT-004 — Slug inválido inexistente e institución inactiva

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Slug inválido inexistente e institución inactiva; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,borde.
- Rol / institución: MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+TENANT-INACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. GET me con slug mayúscula, >63, formato inválido.
2. GET slug válido desconocido e inactivo.
3. Navegar contexto válido.

- Interfaz esperada: Aviso seguro para contexto no válido; recuperación a origen conocido.
- API esperada: 400 formato; 404 inexistente/inactivo; válido 200.
- Persistencia / consistencia: Sin cambios.
- Denegación: No listar institución inactiva.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-005"></a>

## E2E-TENANT-005 — Revocación membership con JWT vigente

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Revocación membership con JWT vigente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,revocación.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC y abrir curso.
2. Operador fixture aislado desactiva membership UC sin alterar JWT.
3. Forzar foco y acceder al recurso.

- Interfaz esperada: Retira datos y controles UC; no basta seguir con UI cacheada.
- API esperada: me/operación 404 tras revocación; login global puede seguir 200.
- Persistencia / consistencia: Ninguna escritura luego de revocación; historia intacta.
- Denegación: No acceso por token emitido antes.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
