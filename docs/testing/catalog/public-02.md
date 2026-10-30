# Fichas PUBLIC · 02

[Índice PUBLIC](PUBLIC.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-public-006"></a>

## E2E-PUBLIC-006 — Legacy con slug coincidente y cruzado

- Módulo / flujo: PUBLIC; [FL-PUBLIC-02](../audit/FLOWS.md#fl-public-02).
- Requisito: CU-02; RF4/6; RNF1; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Legacy con slug coincidente y cruzado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: tenant,regresión.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login; /institutions; /institutions/{slug}; /no-existe`; `getCurrentUser solo tras login`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC.
2. Navegar SPA a /institutions/uc.
3. Navegar SPA a /institutions/utfsm.

- Interfaz esperada: Coincidente redirige /courses; cruzado muestra aviso, no datos UTFSM.
- API esperada: No se autoriza otro tenant por slug legacy.
- Persistencia / consistencia: Sin cambios.
- Denegación: Desacuerdo host/slug bloqueado en UI.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-public-007"></a>

## E2E-PUBLIC-007 — Directorio legacy sin selector privado

- Módulo / flujo: PUBLIC; [FL-PUBLIC-02](../audit/FLOWS.md#fl-public-02).
- Requisito: CU-02; RF4/6; RNF1; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Directorio legacy sin selector privado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: navegación.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login; /institutions; /institutions/{slug}; /no-existe`; `getCurrentUser solo tras login`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC.
2. Navegar SPA /institutions.
3. Volver atrás y adelante.

- Interfaz esperada: Redirect /courses; no asumir pantalla selector de memberships.
- API esperada: GET institutions solo instituciones accesibles durante login.
- Persistencia / consistencia: Sin cambios.
- Denegación: No enlaces privados a instituciones ajenas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
