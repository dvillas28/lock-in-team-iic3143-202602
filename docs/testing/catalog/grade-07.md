# Fichas GRADE · 07

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-031"></a>

## E2E-GRADE-031 — Publicación pierde memoria al recargar

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Publicación pierde memoria al recargar; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,red.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHABLE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar publicación reteniendo respuesta.
2. Recargar y relogin.
3. Abrir libro y consultar notas actuales.

- Interfaz esperada: Sin selección/key/receipt anterior; no reconstruir receipt atribuido; publicada visible si commit ocurrió.
- API esperada: GET book, sin POST automático.
- Persistencia / consistencia: Publicación como máximo una; memoria no es rollback servidor.
- Denegación: Aviso previo al salir si incertidumbre activa.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-grade-032"></a>

## E2E-GRADE-032 — Replay después de revocar teacher no devuelve recibo

- Módulo / flujo: GRADE; [FL-GRADE-04](../audit/FLOWS.md#fl-grade-04).
- Requisito: CU-11; RF22/23/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Replay después de revocar teacher no devuelve recibo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: PUBLISHED+REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `publishGrades; getCourseGradebook; getStudentGrades`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Publicar conK y guardar receipt en runner.
2. Revocar teacher conservando membership/otro rol.
3. Repetir POSTK.

- Interfaz esperada: Sin capacidades docentes ni nuevo recibo privado por permisos antiguos.
- API esperada: 403/404 según scope residual; revalidación antes de replay.
- Persistencia / consistencia: Receipt original intacto; no nuevo evento.
- Denegación: Idempotency-Key no actúa como autorización.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../roadmap/F5.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
