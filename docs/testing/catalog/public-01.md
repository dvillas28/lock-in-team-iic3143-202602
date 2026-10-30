# Fichas PUBLIC · 01

[Índice PUBLIC](PUBLIC.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-public-001"></a>

## E2E-PUBLIC-001 — Landing y selección UC/UTFSM

- Módulo / flujo: PUBLIC; [FL-PUBLIC-01](../audit/FLOWS.md#fl-public-01).
- Requisito: CU-01; RF2/6; RNF9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Landing y selección UC/UTFSM; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,navegación.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/`; `sin API privada`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir PORTAL/.
2. Activar Iniciar sesión y comprobar #instituciones.
3. Abrir UC; volver al portal y abrir UTFSM.

- Interfaz esperada: AcademiX y dos instituciones; cada enlace lleva al /login del origen exacto; sin cursos privados.
- API esperada: Ningún GET privado ni Authorization al navegar landing.
- Persistencia / consistencia: N/A: lectura pública.
- Denegación: No debe seleccionar tenant por query ni revelar memberships.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-public-002"></a>

## E2E-PUBLIC-002 — Entrada directa institucional

- Módulo / flujo: PUBLIC; [FL-PUBLIC-01](../audit/FLOWS.md#fl-public-01).
- Requisito: CU-01; RF2/6; RNF9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Entrada directa institucional; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/`; `sin API privada`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir UC/ y esperar redirect.
2. Abrir UTFSM/.
3. Comprobar login de cada origen.

- Interfaz esperada: /login; no dashboard sin credenciales.
- API esperada: Sin consulta académica autenticada.
- Persistencia / consistencia: N/A lectura.
- Denegación: Host no configurado se trata en FL-PUBLIC-02.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-public-003"></a>

## E2E-PUBLIC-003 — Anclas y navegación del portal

- Módulo / flujo: PUBLIC; [FL-PUBLIC-01](../audit/FLOWS.md#fl-public-01).
- Requisito: CU-01; RF2/6; RNF9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Anclas y navegación del portal; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P3 / Baja; categorías: navegación.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/`; `sin API privada`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir PORTAL/.
2. Activar Qué puedes hacer, Elegir mi universidad y pie Elegir universidad.
3. Usar atrás/adelante.

- Interfaz esperada: Secciones destino visibles; sin pérdida de contenido ni salto a tenant equivocado.
- API esperada: Sin llamadas privadas.
- Persistencia / consistencia: N/A lectura.
- Denegación: N/A flujo público.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-public-004"></a>

## E2E-PUBLIC-004 — Origen desconocido no elige institución

- Módulo / flujo: PUBLIC; [FL-PUBLIC-02](../audit/FLOWS.md#fl-public-02).
- Requisito: CU-02; RF4/6; RNF1; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Origen desconocido no elige institución; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: tenant,authz.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+HOST-UNKNOWN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login; /institutions; /institutions/{slug}; /no-existe`; `getCurrentUser solo tras login`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir http://desconocida.localhost:3000/.
2. Abrir /login.
3. Intentar /courses.

- Interfaz esperada: Aviso de acceso institucional; ninguna elección por defecto UC.
- API esperada: Sin credenciales ni peticiones académicas a tenant por defecto.
- Persistencia / consistencia: N/A lectura.
- Denegación: Bloqueo visible sin datos UC/UTFSM.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-public-005"></a>

## E2E-PUBLIC-005 — Página inexistente y recuperación

- Módulo / flujo: PUBLIC; [FL-PUBLIC-02](../audit/FLOWS.md#fl-public-02).
- Requisito: CU-02; RF4/6; RNF1; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [public-entry.ts](../../../frontend/src/lib/auth/public-entry.ts); [domain-entry.tsx](../../../frontend/src/components/public/domain-entry.tsx).
- Objetivo: Página inexistente y recuperación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: negativo,navegación.
- Rol / institución: ANON; luego ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login; /institutions; /institutions/{slug}; /no-existe`; `getCurrentUser solo tras login`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir UC/no-existe.
2. Usar enlace de recuperación disponible.
3. Autenticar ST1 y navegar con enlace interno; probar /courses/UUID-AUSENTE.

- Interfaz esperada: 404 o vista recurso no disponible según ruta; navegación existente permite volver a cursos.
- API esperada: Recurso UUID válido inexistente 404; no exigir mismo status HTTP al shell client-side.
- Persistencia / consistencia: Sin escrituras.
- Denegación: Sin detalles internos ni recurso ajeno.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
