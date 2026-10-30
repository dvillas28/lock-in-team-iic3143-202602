# Fichas AUDIT · 02

[Índice AUDIT](AUDIT.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-audit-006"></a>

## E2E-AUDIT-006 — Filtros completos y fechas imposibles

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Filtros completos y fechas imposibles; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,borde.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Aplicar action/resourceType/resourceId/actor/section/from/to.
2. Probar30feb/año0/rango invertido.
3. Limpiar filtros.

- Interfaz esperada: Resultados correctos; error local por campo; limpiar reinicia cursor.
- API esperada: 200 filtros válidos;400 fechas/rango inválidos;404 section ajena.
- Persistencia / consistencia: Solo lectura.
- Denegación: No normalización silenciosa ni stack SQL.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-007"></a>

## E2E-AUDIT-007 — Paginación estable y fallo siguiente página

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Paginación estable y fallo siguiente página; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: paginación,red.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Cargar primera página audit.
2. Fallar siguiente request.
3. Reintentar, avanzar y cambiar filtros.

- Interfaz esperada: Conserva página autorizada ante fallo; nueva búsqueda no reutiliza cursor viejo.
- API esperada: Orden occurredAt/id, sin duplicados; cursor viejo con filtro nuevo400.
- Persistencia / consistencia: Sin cambios.
- Denegación: No mostrar página vieja como resultado del filtro nuevo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-008"></a>

## E2E-AUDIT-008 — Snapshots nunca contienen pauta ni credenciales

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Snapshots nunca contienen pauta ni credenciales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,privacidad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: HISTORY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear/editar/publicar quiz y calificar.
2. Leer audit y SQL de changes como operador fixture.
3. Buscar campos questions/alternatives/isCorrect/token/password/request.

- Interfaz esperada: Metadata quiz y contadores; ningún secreto/pauta/respuesta en audit.
- API esperada: Allowlist tanto al escribir como leer; grade solo proyección autorizada.
- Persistencia / consistencia: Historial sanitizado persistido, no solo oculto por UI.
- Denegación: No usar reportes para imprimir valores prohibidos.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-009"></a>

## E2E-AUDIT-009 — Snapshots Markdown como texto escapado

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: Snapshots Markdown como texto escapado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: MARKDOWN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Editar material con HTML adversarial.
2. Abrir evento material.updated.
3. Expandir before/after y activar teclado.

- Interfaz esperada: Texto literal; no ejecución HTML, imagen ni enlace automático peligroso.
- API esperada: GET autorizado devuelve string permitido; UI no dangerouslySetInnerHTML.
- Persistencia / consistencia: Sin cambios al abrir historia.
- Denegación: No XSS por renderizador de snapshots.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-audit-010"></a>

## E2E-AUDIT-010 — No-op y operación fallida no emiten eventos

- Módulo / flujo: AUDIT; [FL-AUDIT-01](../audit/FLOWS.md#fl-audit-01).
- Requisito: CU-13; RF26; RNF1/3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [audit.service.ts](../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../docs/adr/grade-audit-visibility.md).
- Objetivo: No-op y operación fallida no emiten eventos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: integridad,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/audit`; `listCourseAuditEvents`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar mismo módulo dos veces.
2. Intentar cambio inválido de posición y publicación sin permiso.
3. Comparar eventos por namespace.

- Interfaz esperada: Solo cambios reales confirmados aparecen.
- API esperada: Respuestas no-op200/errores según operación; ninguna afirmación de cambio.
- Persistencia / consistencia: Sin nuevos eventos por no-op/fallo; rollback de operación y audit juntos.
- Denegación: No generar evento fuera transacción.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
