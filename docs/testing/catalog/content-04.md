# Fichas CONTENT · 04

[Índice CONTENT](CONTENT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-content-016"></a>

## E2E-CONTENT-016 — Respuesta perdida en edición no habilita reenvío ciego

- Módulo / flujo: CONTENT; [FL-CONTENT-02](../audit/FLOWS.md#fl-content-02).
- Requisito: CU-05/06; RF14/16/25/26; RNF1/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).
- Objetivo: Respuesta perdida en edición no habilita reenvío ciego; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/modules/{M1}/materials/{R1}`; `listModuleMaterials; getMaterial; createMarkdownMaterial; updateMaterial; publishMaterial; unpublishMaterial`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar cuerpo nuevo y perder respuesta tras commit.
2. Intentar segundo guardar/publicar.
3. Consultar estado explícitamente.

- Interfaz esperada: Aviso incierto y bloqueo; no segundo PATCH automático; borrador conservado.
- API esperada: Lectura real de reconciliación; no inferir que GET prueba fin de write tardío.
- Persistencia / consistencia: Una edición; audit no duplicado.
- Denegación: No éxito especulativo ni borrado del draft.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
