# Fichas AUTH · 03

[Índice AUTH](AUTH.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-auth-011"></a>

## E2E-AUTH-011 — Logout limpia información y peticiones

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Logout limpia información y peticiones; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,seguridad.
- Rol / institución: ST1; ST2; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1 y abrir notas.
2. Cerrar sesión.
3. Iniciar ST2 en misma pestaña y volver por historial.

- Interfaz esperada: Nombre/notas ST1 ausentes; solo ST2 visible.
- API esperada: No nuevas solicitudes con token ST1 desde UI; logout no tiene endpoint revocador.
- Persistencia / consistencia: Sin cambios académicos; no afirmar invalidación del JWT copiado por logout.
- Denegación: No respuestas viejas ni estado previo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-012"></a>

## E2E-AUTH-012 — URL profunda permitida vuelve tras login

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: URL profunda permitida vuelve tras login; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: navegación,authz.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir UC/courses/C1/grades sin sesión.
2. Comprobar next.
3. Login ST1.

- Interfaz esperada: Retorna /courses/C1/grades; datos propios publicados.
- API esperada: me valida UC antes de my-grades.
- Persistencia / consistencia: Sin cambios.
- Denegación: No contenido antes del login.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-013"></a>

## E2E-AUTH-013 — Retorno fuera de allowlist

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Retorno fuera de allowlist; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,borde.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir login?next=https://evil.example.
2. Probar //evil.example, doble next y path con query/hash.
3. Login ST1 por variante aislada.

- Interfaz esperada: Destino seguro /courses; nunca navegación externa.
- API esperada: No credenciales a destino externo.
- Persistencia / consistencia: Sin almacenamiento del destino malicioso.
- Denegación: Sin open redirect.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-014"></a>

## E2E-AUTH-014 — Deep link material y autoría usa fallback vigente

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Deep link material y autoría usa fallback vigente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: navegación.
- Rol / institución: T1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir URL material o autoría sin sesión.
2. Login T1.
3. Navegar luego desde curso al recurso.

- Interfaz esperada: Tras login fallback /courses; recurso accesible por navegación autorizada.
- API esperada: No afirmar retorno universal; APIs siguen permisos.
- Persistencia / consistencia: Contenido no alterado.
- Denegación: No filtrar borradores durante transición.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-015"></a>

## E2E-AUTH-015 — Visitar login con sesión activa

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Visitar login con sesión activa; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: sesión,navegación.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC.
2. Navegar SPA /login.
3. Usar back/forward sin reload.

- Interfaz esperada: Redirige al destino seguro; no muestra otra identidad ni formulario simultáneo.
- API esperada: No POST login automático adicional.
- Persistencia / consistencia: Sin mutaciones.
- Denegación: No pérdida de frontera privada.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
