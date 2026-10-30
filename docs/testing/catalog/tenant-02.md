# Fichas TENANT · 02

[Índice TENANT](TENANT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-tenant-006"></a>

## E2E-TENANT-006 — Desactivar UC conserva acceso UTFSM

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Desactivar UC conserva acceso UTFSM; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,revocación.
- Rol / institución: MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Autenticar MULTI en ambos contextos.
2. Desactivar solo membership UC por fixture.
3. Revalidar ambos.

- Interfaz esperada: UC pierde acceso; UTFSM conserva perfil teacher.
- API esperada: UC 404; UTFSM 200; User sigue activo.
- Persistencia / consistencia: F1 intacto; ningún privilegio UC revivido.
- Denegación: No logout global inferido desde un 404 tenant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-007"></a>

## E2E-TENANT-007 — Volver entre subdominios y BFCache

- Módulo / flujo: TENANT; [FL-TENANT-01](../audit/FLOWS.md#fl-tenant-01).
- Requisito: CU-01/02; RF2–9/25; RNF1/2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Volver entre subdominios y BFCache; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,sesión.
- Rol / institución: MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /institutions/{slug}`; `listAccessibleInstitutions; getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC; abrir nota propia.
2. Navegar documento a UTFSM y autenticar MULTI.
3. Atrás a UC y adelante.

- Interfaz esperada: Pagehide limpia sesión; no revive nombre/notas entre orígenes; puede requerir login de nuevo.
- API esperada: No petición UC con contexto UTFSM.
- Persistencia / consistencia: Sin cambios.
- Denegación: Historial de navegador no restituye datos privados.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-008"></a>

## E2E-TENANT-008 — Lecturas de UUID UTFSM bajo UC

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Lecturas de UUID UTFSM bajo UC; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,authz.
- Rol / institución: AO; T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enumerar UUID F1/FS1/FM1/FR1/FQ1/FA1/FG1 del fixture.
2. Por actor pedir cada recurso bajo path UC.
3. Abrir URL frontend construida con esos IDs.

- Interfaz esperada: Recurso no disponible; cero contenido/títulos/personas UTFSM en DOM/red.
- API esperada: 404 en recursos ajenos; grade-items/book/audit por F1 404; probar 12 familias de la matriz tenant.
- Persistencia / consistencia: Snapshot UTFSM idéntico.
- Denegación: Nunca 200 parcial ni mensaje que confirme existencia.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-009"></a>

## E2E-TENANT-009 — Escrituras hacia UUID cruzados

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Escrituras hacia UUID cruzados; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,seguridad.
- Rol / institución: AO; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PATCH F1/FS1/FM1/FR1/FQ1 bajo UC y PUT/POST FA1/publicaciones F1.
2. Usar cuerpos válidos UC y claves nuevas.
3. Consultar recursos UTFSM como autorizado.

- Interfaz esperada: Sin éxito visible por operación UC; UI no actualiza optimista.
- API esperada: 404 al resolver recurso ajeno antes de mutación; snapshot UTFSM estable.
- Persistencia / consistencia: Sin cambios, eventos ni recibos en ambos tenants para fallos.
- Denegación: Probar cada operación de escritura de matriz tenant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-010"></a>

## E2E-TENANT-010 — Relación cruzada en cuerpos de escrituras

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Relación cruzada en cuerpos de escrituras; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,integridad.
- Rol / institución: AO; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Asignar usuario solo UTFSM a S1.
2. Reordenar C1 con FM1 y crear quiz C1 destino FS1.
3. Publicar notas C1 con gradeItemId/sectionId/studentId UTFSM.

- Interfaz esperada: Rechazo sin éxito local; selección sigue solo datos autorizados.
- API esperada: Enrollment 404; order/destino/item ajeno 404; student de otro tenant sin Grade seleccionable produce conflicto sin filtrar; no asumir un código único.
- Persistencia / consistencia: No filas FK cruzadas ni eventos parciales.
- Denegación: Comparar respuesta sin nombres/emails ajenos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
