# Fichas OPS · 01

[Índice OPS](OPS.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-ops-001"></a>

## E2E-OPS-001 — Health readiness y arranque migrado

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Health readiness y arranque migrado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: infra,contrato.
- Rol / institución: ANON; OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. En DB efímera ejecutar predeploy autorizado.
2. Arrancar API runtime y consultar health/ready.
3. Validar shape y cabeceras sin secretos.

- Interfaz esperada: N/A companion de entorno; readiness habilita pruebas navegador.
- API esperada: health200 version/commit/deployedAt/timestamp;ready200 status ok;sin Bearer.
- Persistencia / consistencia: Migraciones aplicadas una vez; HTTP no usa owner.
- Denegación: No confundir health200 con DB lista.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-002"></a>

## E2E-OPS-002 — DB cae readiness503 y operación sin éxito parcial

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: DB cae readiness503 y operación sin éxito parcial; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: infra,red.
- Rol / institución: T1; OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: FAULT-DB; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar snapshot y desconectar solo PG del stack de prueba.
2. Consultar ready y GET privado.
3. Restaurar PG y consultar entidad.

- Interfaz esperada: Error servicio y recuperación; no éxito inventado.
- API esperada: ready503 status unavailable; privado503 cuando error conexión reconocido; health puede200.
- Persistencia / consistencia: Sin mutación parcial; rollback/recuperación en proceso aislado.
- Denegación: No ejecutar fallo contra DB compartida/productiva.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-003"></a>

## E2E-OPS-003 — Runtime inseguro no sirve tráfico

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Runtime inseguro no sirve tráfico; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: infra,seguridad.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: OPERATIONS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar base efímera con rol unsafe o RLS ausente en clon específico.
2. Arrancar commands/start.
3. Verificar salida y puerto sin datos.

- Interfaz esperada: N/A integración de configuración.
- API esperada: Startup falla antes de HTTP; no aceptar owner/BYPASSRLS como alternativa de tests.
- Persistencia / consistencia: No cambiar esquema del stack de otras pruebas.
- Denegación: No desactivar RLS para facilitar suite.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-004"></a>

## E2E-OPS-004 — Seed repetible sin duplicados ni restaurar revocados

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Seed repetible sin duplicados ni restaurar revocados; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: infra,idempotencia.
- Rol / institución: OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: SEED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Aplicar seedE2E diseñada dos veces mismo namespace.
2. Cambiar rol/contenido vía API y repetir modo ensure.
3. Comparar IDs/conteos e historial.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: Estado persistido conserva cambio explícito; no reaparece permiso revocado.
- API esperada: Comprobación de runner futura; no endpoint seed público.
- Persistencia / consistencia: Misma identidad sin duplicación; reset solo nueva DB/namespace antes suite.
- Denegación: Seed rechaza colisión no administrada, no upsert ciego.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-ops-005"></a>

## E2E-OPS-005 — Persistencia tras reiniciar backend y nueva sesión

- Módulo / flujo: OPS; [FL-OPS-01](../audit/FLOWS.md#fl-ops-01).
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [health.controller.ts](../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../backend/src/seeds/presentation-data.ts).
- Objetivo: Persistencia tras reiniciar backend y nueva sesión; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: persistencia,integridad.
- Rol / institución: T1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin página propia; frontend consume API`; `getHealth; getReadiness; predeploy; seed`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear material y calificar/publicar nota real.
2. Reiniciar solo API manteniendo PG y secreto efímero.
3. Nuevo login y consultar material/nota/audit.

- Interfaz esperada: Mismos IDs valores publicación e historia; sesión nueva válida.
- API esperada: GET200; runtime vuelve ready; no reseed que repare el estado.
- Persistencia / consistencia: Datos persisten en PG; no estado solo memoria API.
- Denegación: No usar reinicio como reset ni reclamar logout servidor.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F1](../roadmap/F1.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
