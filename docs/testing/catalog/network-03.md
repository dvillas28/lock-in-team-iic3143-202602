# Fichas NETWORK · 03

[Índice NETWORK](NETWORK.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-network-011"></a>

## E2E-NETWORK-011 — Error incierto no se reintenta por foco o back

- Módulo / flujo: NETWORK; [FL-NETWORK-02](../audit/FLOWS.md#fl-network-02).
- Requisito: CU-04–15; RF25/26; RNF3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Error incierto no se reintenta por foco o back; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: red,idempotencia.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `formularios académicos existentes`; `operaciones de escritura según inventario`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Perder respuesta PATCH material tras commit.
2. Disparar focus/pageshow y navegar interna manteniendo aviso.
3. Observar red y consultar explícitamente.

- Interfaz esperada: Ningún reenvío automático; estado incierto no es éxito ni fallo definitivo.
- API esperada: Un PATCH; GET solo por recuperación permitida.
- Persistencia / consistencia: Un cambio como máximo; request vieja no actualiza otra vista.
- Denegación: No extender replay a endpoints sin idempotencia.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-012"></a>

## E2E-NETWORK-012 — Problem HTTP no filtra detalles sensibles

- Módulo / flujo: NETWORK; [FL-NETWORK-02](../audit/FLOWS.md#fl-network-02).
- Requisito: CU-04–15; RF25/26; RNF3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Problem HTTP no filtra detalles sensibles; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,contrato.
- Rol / institución: ANON; T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `formularios académicos existentes`; `operaciones de escritura según inventario`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Recoger401403404409422 y error servidor aislado.
2. Validar content-type/code/traceId/instance sin query.
3. Comparar recursos ajeno/inexistente.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: Texto genérico sin SQL/trace interna/passwords/tokens.
- API esperada: Problem+json no-store;401WWW-Authenticate;ready503 excepción shape status.
- Persistencia / consistencia: Sin cambios por fallo.
- Denegación: No bodies completos en artifacts de autenticación.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-013"></a>

## E2E-NETWORK-013 — CORS real permite solo orígenes configurados

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: CORS real permite solo orígenes configurados; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,contrato.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Desde UC/UTFSM realizar login y petición privada real con Idempotency-Key en operación permitida.
2. Desde origen desconocido intentar fetch con mismo Bearer sintético del test.
3. Probar API sin Origin con token propio.

- Interfaz esperada: UC/UTFSM funcionan; navegador desconocido no puede leer respuesta; ninguna política CORS reemplaza auth API.
- API esperada: Preflight204 permite Authorization/Content-Type/Idempotency-Key; Location/Retry-After expuestos; origen no listado sin allow-origin; request directo sinOrigin sigue autorización.
- Persistencia / consistencia: Sin cambios fuera del test; operación válida usa tenant del path.
- Denegación: No considerar CORS barrera contra cliente HTTP directo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
