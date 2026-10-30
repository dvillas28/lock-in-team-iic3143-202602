# Fichas SECTION · 01

[Índice SECTION](SECTION.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-section-001"></a>

## E2E-SECTION-001 — Secciones según ownership y matrículas

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Secciones según ownership y matrículas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: authz,happy.
- Rol / institución: AO; T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login cada perfil.
2. Abrir resumen y secciones C1.
3. Comparar S1/S2 y controles.

- Interfaz esperada: AO ve ambas; T1 solo gestiona S1; AS1/ST1 ven resumen propio sin gestión.
- API esperada: list/get solo scope, S2 ajena 404 para T1/AS1/ST1.
- Persistencia / consistencia: Sin cambios.
- Denegación: No inferir acceso a S2 por docente UC.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-section-002"></a>

## E2E-SECTION-002 — Crear sección vacía y editar

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Crear sección vacía y editar; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear sección código 3 capacidad null.
2. Configurar capacidad 0 y código 3B.
3. Volver a resumen/secciones.

- Interfaz esperada: Sección nueva sin roles inventados, capacidad 0 distinta de sin límite.
- API esperada: POST 201 Location; PATCH 200; GET campos exactos.
- Persistencia / consistencia: Una sección y eventos de creación/cambio; sin teacher automático en nueva sección.
- Denegación: No teacher ordinario creando secciones.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-section-003"></a>

## E2E-SECTION-003 — Validación de capacidad y duplicado

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Validación de capacidad y duplicado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde,contrato.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Probar null, 0, 2147483647.
2. Probar -1, fracción y 2147483648.
3. Crear código S1 duplicado y cambiar a único.

- Interfaz esperada: Límites válidos; errores sin borrar selección actual.
- API esperada: 400 capacidades inválidas; 409 código duplicado mismo curso.
- Persistencia / consistencia: Sin cambios por rechazo.
- Denegación: No usar 422 universal de validación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-section-004"></a>

## E2E-SECTION-004 — Buscar sección mantiene selección sin coincidencias

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Buscar sección mantiene selección sin coincidencias; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: navegación,estado-vacío.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir secciones, seleccionar S2.
2. Buscar código inexistente.
3. Limpiar y seleccionar S1.

- Interfaz esperada: No coincidencias conserva S2; limpiar devuelve opciones; workspace solo sección activa.
- API esperada: GET de sección activa; no GET/POST sobre IDs del texto de búsqueda.
- Persistencia / consistencia: Sin cambios.
- Denegación: No pérdida de scope al filtrar.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-section-005"></a>

## E2E-SECTION-005 — Cambio de sección descarta respuesta tardía

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Cambio de sección descarta respuesta tardía; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: scope,red.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Seleccionar S1 y retener GET participantes.
2. Cambiar a S2.
3. Liberar S1 y observar tabla/editor.

- Interfaz esperada: Solo participantes S2; cursor y selección anteriores no invaden S2.
- API esperada: Respuesta S1 ignorada; requests siguientes usan S2.
- Persistencia / consistencia: Sin cambios.
- Denegación: No gestionar participante con sectionId viejo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
