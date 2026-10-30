# Fichas GRADE · 06

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-026"></a>

## E2E-GRADE-026 — Clave reutilizada selección diferente y otro curso

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Clave reutilizada selección diferente y otro curso; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: idempotencia,seguridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar C1 selecciónA keyK.
2. Reusar K para selecciónB o C2 autorizado.
3. Releer notas.

- Interfaz esperada: Conflicto claro sin atribuir éxito a otra selección.
- API esperada: 409 IDEMPOTENCY_CONFLICT si ambos destinos autorizados y selección válida.
- Persistencia / consistencia: Ningún nuevo receipt/evento por conflicto.
- Denegación: No filtrar recibo al actor/tenant diferente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-027"></a>

## E2E-GRADE-027 — Otra clave sobre nota publicada

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Otra clave sobre nota publicada; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: estado,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Seleccionar Grade ya publicada.
2. Enviar nueva keyK2.
3. Consultar Grade y eventos.

- Interfaz esperada: Error nota ya publicada; filtros liberados para corregir selección.
- API esperada: 409 GRADE_ALREADY_PUBLISHED.
- Persistencia / consistencia: PublishedAt/grade/attemptId inmutables; sin receiptK2.
- Denegación: No sobrescritura ni doble publicación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-028"></a>

## E2E-GRADE-028 — Doble clic y dos docentes publican lo mismo

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Doble clic y dos docentes publican lo mismo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,integridad.
- Rol / institución: T1; AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Doble clic confirmar en un contexto.
2. En entorno aparte T1 y AO envían mismo par con claves diferentes simultáneo.
3. Leer libro y audit.

- Interfaz esperada: UI envía una operación; carrera informa ganador y conflicto.
- API esperada: Uno200 y otro409 GRADE_ALREADY_PUBLISHED tras serialización.
- Persistencia / consistencia: Un receipt ganador, una Grade publicada y evento único.
- Denegación: No dos timestamps ni publicación parcial.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-029"></a>

## E2E-GRADE-029 — Timeout tras commit y replay original

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Timeout tras commit y replay original; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: red,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar y perder solo respuesta.
2. Volver al foco y revisar resumen.
3. Reintentar misma operación.

- Interfaz esperada: Selección/key/cuerpo inmutables; ningún POST implícito al foco; replay confirma.
- API esperada: 200 original al replay; sin key nueva.
- Persistencia / consistencia: Un receipt/evento; no duplicación.
- Denegación: No liberar filtros durante incertidumbre.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-030"></a>

## E2E-GRADE-030 — 403 definitivo o409 libera selección corregible

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: 403 definitivo o409 libera selección corregible; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: authz,recuperación.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE+REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar selección.
2. Revocar permiso o publicar nota desde otro contexto.
3. Confirmar y luego ajustar selección tras rechazo.

- Interfaz esperada: Error definitivo; no spinner/bloqueo infinito; acceso se revalida por403/404.
- API esperada: 403/404 por revocación o409 conflicto; sin reintento automático.
- Persistencia / consistencia: Solo cambios del otro actor.
- Denegación: No conservar capacidad de publicar revocada.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
