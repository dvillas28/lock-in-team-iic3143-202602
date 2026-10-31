# Fichas OPS · 02

[Índice OPS](OPS.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-ops-006"></a>

## E2E-OPS-006 — FK compuestas e historia inmutable en DB

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: FK compuestas e historia inmutable en DB; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: integridad,tenant.
- Rol / institución: runtime; OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Con runtime y contextoUC intentar FK a UTFSM.
2. Intentar update/delete de Grade publicada, intento terminal y audit.
3. Verificar snapshot desde operador de fixture.

- Interfaz esperada: N/A integración SQL complementaria.
- API esperada: SQL rechaza por FK/RLS/grants/triggers según acción; no asignar códigoHTTP a SQL.
- Persistencia / consistencia: Snapshot académico idéntico; transacción rollback.
- Denegación: No usar owner como prueba de garantía runtime.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-007"></a>

## E2E-OPS-007 — Fallo transaccional en calificación no deja submitted

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Fallo transaccional en calificación no deja submitted; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: integridad,concurrencia.
- Rol / institución: ST1; OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: FAULT-TX; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar A1 activo con answers y token del actor; operador BEGIN y LOCK TABLE public.audit_events IN ACCESS EXCLUSIVE MODE en clon propio.
2. Enviar POST submit K y mantener lock hasta statement_timeout2s; liberar lock con ROLLBACK operador.
3. Leer A1/Grade/audit y repetir K explícito tras recuperar.

- Interfaz esperada: N/A companion HTTP/SQL; error no se presenta como éxito.
- API esperada: 500 sanitizado por query cancelada57014; retryK posterior200 si estado sigue elegible; no failpoint producto.
- Persistencia / consistencia: Tras fallo A1 sigue inProgress con answers previas, sin Grade ni nuevos eventos; retry genera conjunto atómico una vez; nunca submitted durable.
- Denegación: Solo base exclusiva sin otras escrituras, lock liberado en finally.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-008"></a>

## E2E-OPS-008 — Guard de destino rechaza producción antes de preparar datos

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Guard de destino rechaza producción antes de preparar datos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: infra,seguridad.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: GUARD; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Configurar runner futuro con origen productivo o DB sin _test.
2. Ejecutar solo preflight sin conectarse.
3. Repetir loopback allowlist con manifest ownership de entorno válido.

- Interfaz esperada: N/A validación del harness por implementar.
- API esperada: Rechazo antes de migrar/seed/HTTP; no prueba real contra URL productiva.
- Persistencia / consistencia: Cero conexiones/escrituras en destino rechazado.
- Denegación: Flag E2E aislado no basta por sí solo; host+DB+ownership obligatorios.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Parcial: 5 checks del guard pasan; camino DB permitido bloqueado. [Evidencia](../execution/IMPLEMENTATION_STATUS.md).

<a id="e2e-ops-009"></a>

## E2E-OPS-009 — Restauración baseline de suite sin borrar historia por test

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Restauración baseline de suite sin borrar historia por test; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: infra,limpieza.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: SEED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear curso/Grades por API en stack efímero.
2. Finalizar suite y destruir solo stack propiedad runId.
3. Crear stack nuevo y seed baseline.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: Mismos datos iniciales en siguiente corrida; sin contaminación.
- API esperada: Readiness y manifest reproducibles.
- Persistencia / consistencia: Se destruye recurso infra propio, no DELETE de historia ni volumen ajeno.
- Denegación: Operación futura en entorno permitido, no realizada en auditoría.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
