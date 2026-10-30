# Fichas NETWORK · 02

[Índice NETWORK](NETWORK.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-network-006"></a>

## E2E-NETWORK-006 — Timeout privado15s y desconexión

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Timeout privado15s y desconexión; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,tiempo.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retener GET privado más de15s sin bloquear resto.
2. Esperar error observable dentro presupuesto.
3. Restaurar conexión y reintentar.

- Interfaz esperada: Estado de error recuperable; spinner no infinito.
- API esperada: Abort timeout del cliente, no código HTTP inventado; luego200.
- Persistencia / consistencia: Sin cambios.
- Denegación: Sin logout forzado por simple timeout de lectura.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-007"></a>

## E2E-NETWORK-007 — Offline tras carga y vuelta online

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Offline tras carga y vuelta online; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: red,recuperación.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir notas y poner context offline.
2. Navegar a otra vista que requiere API.
3. Volver online y Reintentar.

- Interfaz esperada: Error conexión, sin afirmar guardado; recuperación explícita.
- API esperada: Sin respuesta HTTP offline; nueva lectura200.
- Persistencia / consistencia: Sin cambios.
- Denegación: No service-worker/cache privado supuesto.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-008"></a>

## E2E-NETWORK-008 — Respuesta401 vieja no cierra sesión nueva

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Respuesta401 vieja no cierra sesión nueva; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: concurrencia,sesión.
- Rol / institución: ST1; ST2; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+DELAY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Retener401 de request de ST1.
2. Logout y loginST2.
3. Liberar401 viejo y leer cursos.

- Interfaz esperada: ST2 permanece autenticado; sin mensaje ajeno ni datosST1.
- API esperada: Generation descarta completion vieja.
- Persistencia / consistencia: Sin cambios.
- Denegación: No logout cruzado por operación antigua.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-009"></a>

## E2E-NETWORK-009 — Códigos400409422 distinguidos sin borrar borrador

- Módulo / flujo: NETWORK; [FL-NETWORK-02](../audit/FLOWS.md#fl-network-02).
- Requisito: CU-04–15; RF25/26; RNF3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Códigos400409422 distinguidos sin borrar borrador; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,red.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `formularios académicos existentes`; `operaciones de escritura según inventario`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Provocar body inválido400 mediante API, conflicto409 y regla dominio422.
2. Observar error de formulario correspondiente.
3. Corregir y reenviar explícitamente.

- Interfaz esperada: Errores coherentes; datos válidos del borrador conservados; sin éxito falso.
- API esperada: Status y Problem.code según matriz errores.
- Persistencia / consistencia: Sin cambios por fallo; una escritura tras corrección.
- Denegación: No reintento automático en4xx.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-010"></a>

## E2E-NETWORK-010 — Cuerpo4096 y media415 transversales

- Módulo / flujo: NETWORK; [FL-NETWORK-02](../audit/FLOWS.md#fl-network-02).
- Requisito: CU-04–15; RF25/26; RNF3/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Cuerpo4096 y media415 transversales; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,borde.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `formularios académicos existentes`; `operaciones de escritura según inventario`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar JSON exacto4096 bytes con shape válido.
2. Enviar4097 bytes y text/plain/gzip.
3. Releer entidad.

- Interfaz esperada: N/A companionHTTP; UI de413 cubiertaCONTENT/QUIZ.
- API esperada: 4096 no falla por tamaño aunque puede fallar dominio;4097=>413;media/encoding no admitida415; gzip según parser sin inflate.
- Persistencia / consistencia: Sin escrituras inválidas; no asumir todos415 declarados OpenAPI.
- Denegación: No secretos en Problem/instance.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
