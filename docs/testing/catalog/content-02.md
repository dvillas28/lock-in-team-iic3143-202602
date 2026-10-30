# Fichas CONTENT · 02

[Índice CONTENT](CONTENT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-content-006"></a>

## E2E-CONTENT-006 — No-op de módulo orden y publicación

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: No-op de módulo orden y publicación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Repetir título idéntico.
2. Reenviar orden actual.
3. Publicar dos veces mismo módulo.

- Interfaz esperada: Estado confirmado sin cambios adicionales.
- API esperada: 200 autorizados; publish con {} 400, sin body permitido.
- Persistencia / consistencia: Solo evento por transición real.
- Denegación: Revalidar acceso aun en no-op.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-007"></a>

## E2E-CONTENT-007 — Módulos vacíos y visibilidad staff

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Módulos vacíos y visibilidad staff; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: estado-vacío,authz.
- Rol / institución: T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: EMPTY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir curso vacío.
2. Añadir solo módulo draft como teacher.
3. Consultar con assistant y student.

- Interfaz esperada: Teacher ve borrador; otros ven vacío, sin ficha de módulo oculto.
- API esperada: Teacher GET 200 draft; no-teacher omite draft y detalle 404.
- Persistencia / consistencia: Sin escritura del lector.
- Denegación: Assistant no equivale teacher.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-008"></a>

## E2E-CONTENT-008 — Crear editar y leer Markdown persistido

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Crear editar y leer Markdown persistido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear RNEW con título Lectura y # Tema, lista, tabla y código.
2. Editar cuerpo, publicar material y módulo.
3. Login ST1 abrir lector y Volver a módulos.

- Interfaz esperada: Markdown semántico sin editor para ST1; enlace conserva módulo correcto.
- API esperada: POST 201; PATCH/publish 200; GET cuerpo persistido.
- Persistencia / consistencia: Un material kind markdown con createdBy actor; eventos before/after.
- Denegación: No publicar solo en UI.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-009"></a>

## E2E-CONTENT-009 — Cuatro combinaciones módulo e ítem

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Cuatro combinaciones módulo e ítem; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,privacidad.
- Rol / institución: T1; ST1; AS1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: VISIBILITY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar M/R published flags 00 01 10 11.
2. Como student y assistant listar/GET cada combinación.
3. Teacher leer todas.

- Interfaz esperada: No-teacher solo 11; teacher ve todas; ítem publicado bajo módulo oculto conserva su estado.
- API esperada: Solo 11 GET no-teacher200; otras404; listas filtran antes de enviar.
- Persistencia / consistencia: Flags independientes, sin cascada de borrado.
- Denegación: No filtrar borradores después de recibirlos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-010"></a>

## E2E-CONTENT-010 — Ocultar material retira lectura directa

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Ocultar material retira lectura directa; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,persistencia.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. ST1 abre R1 publicado.
2. T1 oculta R1.
3. ST1 vuelve por navegación/reintenta GET y luego teacher republica.

- Interfaz esperada: R1 deja de mostrarse tras nueva lectura; republicado vuelve.
- API esperada: unpublish 200; GET student404 mientras oculto.
- Persistencia / consistencia: Cuerpo/historia intactos; eventos únicos.
- Denegación: No conservar contenido tras 403/404 de recurso.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
