# Fichas NETWORK · 01

[Índice NETWORK](NETWORK.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-network-001"></a>

## E2E-NETWORK-001 — 401 en request privado cierra sesión

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: 401 en request privado cierra sesión; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,red.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login y abrir notas.
2. Invalidar token observado en request o desactivar User por fixture.
3. Activar lectura privada.

- Interfaz esperada: Mensaje sesión inválida; datos/cursors/selecciones retirados.
- API esperada: 401 real por token inválido; no reintento automático con credencial vieja.
- Persistencia / consistencia: Sin cambios académicos.
- Denegación: No datos sensibles detrás de error.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-002"></a>

## E2E-NETWORK-002 — 403/404 secundario no derriba contexto válido

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: 403/404 secundario no derriba contexto válido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,authz.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir recurso C1 visible y forzar action prohibida o ID ausente.
2. Permitir /me válido de revalidación.
3. Navegar a Mis cursos.

- Interfaz esperada: Error local, shell sigue operativo; no logout global ni borrador ajeno.
- API esperada: 403/404 recurso; /me200; no login repetido.
- Persistencia / consistencia: Sin cambios por rechazo.
- Denegación: Nunca limpiar permiso insuficiente convirtiéndolo en éxito.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-003"></a>

## E2E-NETWORK-003 — /me temporal 503 conserva lectura y bloquea escritura

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: /me temporal 503 conserva lectura y bloquea escritura; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: red,authz.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir editor y escribir borrador.
2. Hacer fallar /me con503 al foco.
3. Intentar guardar; restaurar /me y Verificar acceso.

- Interfaz esperada: Aviso y fieldset bloqueado; borrador conservado si scope igual; luego permite guardar explícito.
- API esperada: Ningún PATCH durante contextWarning; /me200 recupera; sin write implícito.
- Persistencia / consistencia: Sin cambios hasta acción posterior.
- Denegación: No seguir escribiendo con permisos no revalidados.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-004"></a>

## E2E-NETWORK-004 — Payload200 inválido no parece lista vacía

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Payload200 inválido no parece lista vacía; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,red.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+MALFORMED; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Interceptar una lectura de cursos/notas y alterar shape a200 inválido.
2. Observar error seguro.
3. Restablecer backend real y Reintentar.

- Interfaz esperada: Servicio no disponible/datos inválidos; no éxito ni tabla inventada.
- API esperada: Fault inyectado explícito; siguiente request real200.
- Persistencia / consistencia: Sin escrituras.
- Denegación: No aceptar courseId/actor/tenant incoherente de DTO.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-network-005"></a>

## E2E-NETWORK-005 — Error500 sanitizado y recuperación

- Módulo / flujo: NETWORK; [FL-NETWORK-01](../audit/FLOWS.md#fl-network-01).
- Requisito: CU-02–16; RF25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../backend/src/http/problem.filter.ts).
- Objetivo: Error500 sanitizado y recuperación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,seguridad.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{C1}/...`; `getCurrentUser; listCourses; getStudentGrades; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Inyectar500 en GET modules manteniendo API real para resto.
2. Ver error y Reintentar.
3. Restablecer GET real.

- Interfaz esperada: Mensaje genérico y botón recuperación; sin SQL/secretos.
- API esperada: Problem500 de respuesta simulada para UX; error real backend se cubre companionOPS.
- Persistencia / consistencia: Solo lecturas.
- Denegación: No presentar inyección como fallo servidor demostrado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F6](../roadmap/F6.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
