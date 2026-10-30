# Fichas CONTENT · 01

[Índice CONTENT](CONTENT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-content-001"></a>

## E2E-CONTENT-001 — Teacher crea renombra y ordena módulo

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Teacher crea renombra y ordena módulo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear módulo título Unidad nueva posición libre 3.
2. Renombrarlo Unidad editada.
3. Mover antes de M1 con controles de orden; volver a vista.

- Interfaz esperada: Orden y título actualizados tras confirmación.
- API esperada: POST 201; PATCH 200; PUT order colección completa 200.
- Persistencia / consistencia: Posiciones consecutivas y eventos created/updated/reordered.
- Denegación: Student/assistant no obtienen controles.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-002"></a>

## E2E-CONTENT-002 — Docente otra sección ve contenido compartido

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Docente otra sección ve contenido compartido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: scope,consistencia.
- Rol / institución: T1; T2; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. T1 crea módulo C1.
2. T2 teacher S2 lo renombra.
3. T1 vuelve al listado.

- Interfaz esperada: Mismo recurso del curso, no copia por sección.
- API esperada: Ambos autorizados sin isAdmin; GET misma UUID.
- Persistencia / consistencia: Un módulo compartido y cambios auditados.
- Denegación: Teacher otro curso no tiene acceso.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-003"></a>

## E2E-CONTENT-003 — Publicar ocultar republicar módulo

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Publicar ocultar republicar módulo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: estado,persistencia,privacidad.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar M1 y comprobar lectura student.
2. Ocultar M1.
3. Republicar y consultar student en sesión nueva.

- Interfaz esperada: Student ve solo publicado; ocultar retira también sus materiales sin borrarlos.
- API esperada: publish/unpublish 200 sin cuerpo; oculto GET student 404.
- Persistencia / consistencia: publishedAt cambia según transición; materiales conservan flags; eventos uno por cambio.
- Denegación: Sin HTML/datos de borrador en payload student.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-004"></a>

## E2E-CONTENT-004 — Orden incompleto duplicado ajeno y obsoleto

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Orden incompleto duplicado ajeno y obsoleto; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,concurrencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PUT order omitiendo M2.
2. Probar M1 repetido y UUID ajeno.
3. Crear M3 en otro contexto y repetir orden viejo.

- Interfaz esperada: Error sin alterar orden; nueva consulta permite recomponer.
- API esperada: 409 incompleto/obsoleto; 422 repetido; 404 ID ajeno.
- Persistencia / consistencia: Orden anterior completo; sin evento en rechazo.
- Denegación: No orden parcial aplicado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-content-005"></a>

## E2E-CONTENT-005 — Posición límite y colisión

- Módulo / flujo: CONTENT; [FL-CONTENT-01](../audit/FLOWS.md#fl-content-01).
- Requisito: CU-05/06/14; RF13/16/25/26; RNF1/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Posición límite y colisión; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: validación,borde.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules`; `listCourseModules; getCourseModule; createCourseModule; updateCourseModule; reorderCourseModules; publishCourseModule; unpublishCourseModule`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear posición 0, fracción, 2147483648.
2. Probar 1 ya ocupada.
3. Probar posición válida libre y título 200/201 caracteres.

- Interfaz esperada: Validación/rechazo sin nuevo módulo erróneo.
- API esperada: 422 valor dominio/título; 400 tipo; 409 posición ocupada.
- Persistencia / consistencia: Sin huecos/filas por error; posición libre se guarda.
- Denegación: No atribuir 409 a permisos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
