# Fichas CONTENT · 03

[Índice CONTENT](CONTENT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-content-011"></a>

## E2E-CONTENT-011 — Body Markdown vacío Unicode y bytes

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Body Markdown vacío Unicode y bytes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: validación,borde.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Probar espacios y U+0000.
2. Guardar Unicode válido cuyo JSON completo mide <=4096 bytes.
3. Enviar 4097 bytes y caracteres que caben en 10000 pero exceden HTTP.

- Interfaz esperada: Error dominio/local o payload grande; contenido válido correcto.
- API esperada: 422 whitespace/NUL;413 >4096 bytes; límite en bytes no caracteres.
- Persistencia / consistencia: Sin material ni eventos por fallo.
- Denegación: No truncar silenciosamente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-012"></a>

## E2E-CONTENT-012 — HTML y enlaces peligrosos no ejecutan

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: HTML y enlaces peligrosos no ejecutan; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: MARKDOWN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Leer material con script, onerror, javascript:, data:, relativo, //host y URLs con controles/credenciales.
2. Activar enlaces permitidos HTTPS y ancla.
3. Vigilar requests/dialogs y window sentinel.

- Interfaz esperada: HTML literal; enlaces peligrosos sin href; seguros externos noopener noreferrer no-referrer.
- API esperada: Solo API autorizada; sin request por imagen remota ni credenciales hacia URL externa.
- Persistencia / consistencia: Markdown original persiste literal.
- Denegación: No script, navegación peligrosa ni imagen exfiltrante.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-013"></a>

## E2E-CONTENT-013 — Imágenes externas y tablas anchas

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Imágenes externas y tablas anchas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: seguridad,compatibilidad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: MARKDOWN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir material con imagen remota, tabla GFM y bloque código largo.
2. Viewport375 y desktop.
3. Tabular dentro del contenido.

- Interfaz esperada: Alt textual, ningún img externo; tabla/código con scroll local; no overflow global.
- API esperada: Cero peticiones al host imagen.
- Persistencia / consistencia: Solo lectura.
- Denegación: No enviar token por contenido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-014"></a>

## E2E-CONTENT-014 — No publicar con cuerpo ni borrar material

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: No publicar con cuerpo ni borrar material; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: contrato,exclusión.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. POST publish con {} y con payload.
2. Repetir sin body.
3. Intentar DELETE material y GET posterior.

- Interfaz esperada: Estado solo cambia por operación válida; sin botón borrar.
- API esperada: Publish con body400, sin body200; DELETE no tiene contrato, capturar rechazo framework sin fijar semántica MVP.
- Persistencia / consistencia: Material intacto salvo publicación autorizada.
- Denegación: No borrar historia ni asumir feature DELETE.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-015"></a>

## E2E-CONTENT-015 — Edición concurrente y orden de confirmación

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Edición concurrente y orden de confirmación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: concurrencia,consistencia.
- Rol / institución: T1; T2; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Ambos leen R1.
2. T1 guarda texto A y T2 guarda texto B después mediante barrera.
3. Consultar lector y audit.

- Interfaz esperada: Última escritura confirmada B visible; no prometer control de versión inexistente.
- API esperada: Dos PATCH200 serializados; GET B.
- Persistencia / consistencia: Dos eventos secuenciales before/after; sin mezcla parcial del body.
- Denegación: No presentar borrador local A como persistido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
