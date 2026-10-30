# Fichas AUTH · 04

[Índice AUTH](AUTH.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-auth-016"></a>

## E2E-AUTH-016 — Expiración cliente a 900 segundos

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Expiración cliente a 900 segundos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,tiempo.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: EXPIRY; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login real y abrir notas.
2. Avanzar reloj cliente a expiresAt mediante reloj Playwright.
3. Emitir focus/pageshow y activar enlace privado.

- Interfaz esperada: Mensaje sesión vencida, datos privados retirados, login requerido.
- API esperada: Ninguna escritura usando sesión expirada del cliente; expiración servidor se prueba aparte.
- Persistencia / consistencia: Datos previos intactos.
- Denegación: Sin flashes de notas al reactivar documento.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-017"></a>

## E2E-AUTH-017 — JWT inválido manipulado o vencido en API

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: JWT inválido manipulado o vencido en API; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad,authz.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: JWT-NEG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Obtener token solo en memoria del runner.
2. Llamar me/courses con firma alterada, alg none, exp vencido e issuer/aud incorrectos.
3. Repetir con token válido.

- Interfaz esperada: N/A: companion HTTP; 401 UI se verifica en NETWORK.
- API esperada: 401 y WWW-Authenticate Bearer; válido 200; no firmar con secreto productivo.
- Persistencia / consistencia: Sin mutación.
- Denegación: No aceptar claims/roles inyectados.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-018"></a>

## E2E-AUTH-018 — Headers Bearer ambiguos

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Headers Bearer ambiguos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,seguridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: JWT-NEG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar duplicado Authorization por cliente HTTP que preserve duplicados.
2. Probar Bearer múltiple, blanco y >4096 bytes.
3. Enviar uno válido.

- Interfaz esperada: N/A HTTP complementaria.
- API esperada: 401 en variantes de credencial; límites generales proxy no deben encubrir aceptación.
- Persistencia / consistencia: Sin cambios.
- Denegación: No elegir una credencial arbitraria.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-019"></a>

## E2E-AUTH-019 — Dos pestañas con memoria independiente

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Dos pestañas con memoria independiente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: sesión,concurrencia.
- Rol / institución: ST1; ST2; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login ST1 en pestaña A.
2. Abrir pestaña B misma institución y comprobar anónimo.
3. Login ST2 en B; navegar ambas.

- Interfaz esperada: Cada pestaña muestra su actor; logout A no promete revocar JWT B.
- API esperada: Tokens de cada pestaña no se mezclan.
- Persistencia / consistencia: Solo lecturas.
- Denegación: No copiar identidad mediante storage compartido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-020"></a>

## E2E-AUTH-020 — Foco no borra borradores

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Foco no borra borradores; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,regresión.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: ACTIVE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login y abrir intento A1; elegir alternativa sin guardar.
2. Alternar foco/visibilidad/pageshow.
3. Volver y guardar explícitamente.

- Interfaz esperada: Radio/borrador conservado si /me idéntico; ningún guardado o submit automático.
- API esperada: Una revalidación deduplicada concurrente; PUT solo tras acción.
- Persistencia / consistencia: Respuesta persiste solo tras guardar.
- Denegación: Permiso revocado debe limpiar, no conservar edición autorizada obsoleta.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
