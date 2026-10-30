# Fichas AUDIT · 01

[Índice AUDIT](AUDIT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-audit-001"></a>

## E2E-AUDIT-001 — Historia before after actor tenant y recurso

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Historia before after actor tenant y recurso; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Editar curso y módulo como actores distintos.
2. Abrir Auditoría.
3. Filtrar action/resourceId y desplegar antes/después.

- Interfaz esperada: Fechas/actor/recurso/cambios correctos; historial persistente.
- API esperada: GET200 solo institutionIdUC/courseIdC1.
- Persistencia / consistencia: Eventos append-only con before/after de cada cambio.
- Denegación: Sin secretos ni stacktrace.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-002"></a>

## E2E-AUDIT-002 — Teacher solo sección histórica owner teacher global

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Teacher solo sección histórica owner teacher global; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,scope.
- Rol / institución: T1; AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Generar eventos S1/S2 y curso sectionId null.
2. Consultar como T1 y AO.
3. Aplicar filtro S2 con T1.

- Interfaz esperada: T1 solo eventos S1; AO teacher ve todo curso.
- API esperada: T1404 filtroS2; lista excluye S2 y null; AO200global.
- Persistencia / consistencia: Sin cambios.
- Denegación: No asumir teacher ordinario ve eventos compartidos section null.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-003"></a>

## E2E-AUDIT-003 — Owner student sin teacher no ve grade

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Owner student sin teacher no ve grade; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: privacidad,authz.
- Rol / institución: AO-ST; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY+PUBLISHED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar owner+student sin teacher con notas propias y ajenas.
2. Abrir audit sin filtros y resourceType grade.
3. Recorrer páginas pequeñas, conservar snapshot.

- Interfaz esperada: Administrativos visibles; ningún evento grade ni hueco/paginación que lo exponga.
- API esperada: 200 filtrado antes ORDER/LIMIT; grade[]; publicada no concede permiso audit.
- Persistencia / consistencia: Auditoría persistida intacta, solo filtrada al leer.
- Denegación: No basta redactar payload de grade; evento entero excluido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-004"></a>

## E2E-AUDIT-004 — Owner pierde teacher manteniendo cursor

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Owner pierde teacher manteniendo cursor; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: revocación,privacidad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: REVOKE+PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Leer audit con grade y cursor.
2. Revocar teacher manteniendo isAdmin/ownership.
3. Continuar mismo cursor y filtros.

- Interfaz esperada: Desde revalidación no grade; owner sigue administrativos.
- API esperada: 200 filtrado o página vacía según cursor; no cursor como grant.
- Persistencia / consistencia: Eventos originales intactos.
- Denegación: Cualquier grade tras revocación es defectoP0.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-005"></a>

## E2E-AUDIT-005 — Student assistant y superadmin sin curso no consultan

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Student assistant y superadmin sin curso no consultan; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz.
- Rol / institución: ST1; AS1; SA; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Forzar URL audit y GET de C1 por actor.
2. Comparar con T1 autorizado.
3. Revisar DOM y payload de fallos.

- Interfaz esperada: Sin tabla audit ni notas residuales.
- API esperada: ST1/AS1 403 curso visible;SA404 sin alcance;T1200.
- Persistencia / consistencia: Sin cambios.
- Denegación: Ni notas publicadas habilitan historial.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
