# Fichas TENANT · 03

[Índice TENANT](TENANT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-tenant-011"></a>

## E2E-TENANT-011 — Mismo rol en curso ajeno del mismo tenant

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Mismo rol en curso ajeno del mismo tenant; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,scope.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir C3 ajeno conocido.
2. Forzar APIs detail/modules/quizzes/gradebook/audit por C3.
3. Volver C1.

- Interfaz esperada: No aparece C3 ni sus recursos aunque rol exista en C1.
- API esperada: 404 curso ajeno y recursos; no herencia institucional de teacher.
- Persistencia / consistencia: C3 intacto.
- Denegación: No un simple botón oculto.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-012"></a>

## E2E-TENANT-012 — Curso y padres incoherentes en URL frontend

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Curso y padres incoherentes en URL frontend; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: consistencia,seguridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login T1 con acceso C1 y C2.
2. Abrir material M1/R1 bajo URL C2.
3. Abrir revisión A1 con quiz Q2 y curso C1.

- Interfaz esperada: Error seguro por parser de relación; no mostrar contenido de padre incorrecto.
- API esperada: APIs individuales pueden ser 200 autorizados; cliente rechaza courseId/moduleId/quizId discordante.
- Persistencia / consistencia: Sin cambios.
- Denegación: No confundir autorización API por ID con integridad de ruta UI.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-013"></a>

## E2E-TENANT-013 — Cursor de otro tenant actor o filtro

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Cursor de otro tenant actor o filtro; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,authz,paginación.
- Rol / institución: MULTI; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Obtener cursor UC en enrollment/book/attempts/audit/users/memberships.
2. Reutilizarlo en UTFSM, con otro actor y filtro distinto.
3. Consultar página original válida.

- Interfaz esperada: Error/reinicio filtros; sin datos mezclados.
- API esperada: 400 scope cursor; permisos se revalidan antes de resultados.
- Persistencia / consistencia: Sin mutaciones; sin caché compartida.
- Denegación: No cursor como capability de acceso.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-014"></a>

## E2E-TENANT-014 — Contexto RLS ausente y pool reutilizado

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Contexto RLS ausente y pool reutilizado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,concurrencia.
- Rol / institución: runtime; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Consultar tabla tenant con academix_runtime sin set_config.
2. Alternar HTTP UC/UTFSM en 20 lecturas concurrentes.
3. Consultar de nuevo sin contexto y verificar rol.

- Interfaz esperada: N/A companion SQL/HTTP; no UI.
- API esperada: SQL sin contexto cero filas; HTTP cada resultado scoped; role sin bypass/owner; identity directory limitado al actor.
- Persistencia / consistencia: Contexto local a transacción no sobrevive COMMIT/ROLLBACK.
- Denegación: Ninguna tabla tenant retorna fila ajena.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-tenant-015"></a>

## E2E-TENANT-015 — Respuesta UC tardía tras cambio de identidad

- Módulo / flujo: TENANT; [FL-TENANT-02](../audit/FLOWS.md#fl-tenant-02).
- Requisito: CU-03–16; RF8/9/25; RNF1/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [database.service.ts](../../../backend/src/database/database.service.ts); [20261020000200_tenant_isolation.sql](../../../backend/migrations/20261020000200_tenant_isolation.sql); [protected-institution.tsx](../../../frontend/src/components/auth/protected-institution.tsx).
- Objetivo: Respuesta UC tardía tras cambio de identidad; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,sesión,red.
- Rol / institución: ST1; MULTI; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/...`; `todos los recursos institucionales; ver matriz de operaciones`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retener respuesta GET UC/my-grades real.
2. Logout y login otro actor o cambiar de documento UTFSM.
3. Liberar respuesta anterior.

- Interfaz esperada: Ninguna nota UC aparece en nueva identidad; estado actual conservado.
- API esperada: Respuesta anterior descartada/abortada, 401 tardío no cierra sesión nueva.
- Persistencia / consistencia: Sin mutaciones.
- Denegación: No mezclar selección/cursor/recibo de actores.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
