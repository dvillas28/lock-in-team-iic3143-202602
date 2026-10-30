# Fichas GRADE · 04

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-016"></a>

## E2E-GRADE-016 — Rango precisión y tipo de ponderación

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Rango precisión y tipo de ponderación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,contrato.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PUT pesos -0.01/100.01/0.001/string/null.
2. Enviar0 y100 con total100.
3. Consultar.

- Interfaz esperada: Inválidos rechazados;0 permitido.
- API esperada: 400 rangos/tipo/decimales;200 valores válidos.
- Persistencia / consistencia: Sin truncar ni normalizar peso inválido.
- Denegación: No aceptar NaN por cuerpo JSON no válido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-017"></a>

## E2E-GRADE-017 — No-op antes y después de freeze

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: No-op antes y después de freeze; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: estado,idempotencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar pesos idénticos antes de publicar.
2. Publicar primera nota.
3. Repetir PUT mismos pesos.

- Interfaz esperada: Antes confirmado sin evento; después bloqueado aunque mismos valores.
- API esperada: 200 no-op previo;409 GRADE_WEIGHTS_LOCKED posterior.
- Persistencia / consistencia: Freeze monotónico; un evento solo por cambio real.
- Denegación: No usar no-op para sortear bloqueo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-018"></a>

## E2E-GRADE-018 — Freeze en otra página o sección no visible

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Freeze en otra página o sección no visible; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: regresión,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PAGES+FROZEN; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir libro filtrado S1 sin publicadas primera página.
2. Tener una publicada S2/página posterior.
3. Abrir editor de pesos.

- Interfaz esperada: Escaneo global completo detecta freeze; controles bloqueados; no falso desbloqueo por página vacía.
- API esperada: GET book sin filtro recorre hasta publicada/agotar; no PUT mientras desconocido.
- Persistencia / consistencia: Ningún cambio de pesos.
- Denegación: No asumir freeze desde una única página.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-019"></a>

## E2E-GRADE-019 — Carrera pesos contra primera publicación

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Carrera pesos contra primera publicación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,integridad.
- Rol / institución: AO; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir pesos en COPEN.
2. T1 publica primera nota.
3. AO confirma pesos aún abiertos.

- Interfaz esperada: Aviso bloqueo, refresca estado real.
- API esperada: PUT409 GRADE_WEIGHTS_LOCKED si publicación ganó; si pesos ganaron publicación usa pesos confirmados.
- Persistencia / consistencia: Orden serial, nunca cambio posterior a freeze.
- Denegación: No éxito UI de borrador viejo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-020"></a>

## E2E-GRADE-020 — Resultado incierto de pesos exige reconciliar

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Resultado incierto de pesos exige reconciliar; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,consistencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Guardar pesos y perder respuesta tras commit.
2. Intentar editar de nuevo.
3. Consultar pesos y bloqueo explícito.

- Interfaz esperada: Valores observados diferenciados de confirmación propia; bloqueo conservador hasta reconciliar.
- API esperada: GET real, ningún PUT automático.
- Persistencia / consistencia: Un cambio de pesos auditado.
- Denegación: No ocultar incertidumbre con aviso éxito temporal.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
