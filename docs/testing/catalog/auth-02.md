# Fichas AUTH · 02

[Índice AUTH](AUTH.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-auth-006"></a>

## E2E-AUTH-006 — Límites de login y JSON malformado

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Límites de login y JSON malformado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde,contrato.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+AUTH-NEG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. POST login con email 254/255 caracteres sintácticos y password 128/129 bytes.
2. Probar tipo array, campo adicional y JSON truncado.
3. Repetir con body válido.

- Interfaz esperada: N/A: validación HTTP complementaria sin pantalla.
- API esperada: 400 por límites de credenciales/tipos; JSON inválido 400; cuerpo >4096 bytes 413; media incorrecta 415.
- Persistencia / consistencia: Sin sesión ni mutación académica.
- Denegación: Problem sanitizado, sin eco de contraseña.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-007"></a>

## E2E-AUTH-007 — Cuota real y enfriamiento visible

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Cuota real y enfriamiento visible; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: negativo,tiempo.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RATE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. En API aislada enviar cinco logins inválidos desde una IP.
2. Sexto mediante formulario.
3. Verificar bloqueo y esperar Retry-After con polling acotado; luego login válido.

- Interfaz esperada: Contador/Continuar bloqueado; sin auto-reintento; al vencer permite acción explícita.
- API esperada: Sexto 429 con Retry-After; nueva ventana permite 200; no suponer cuota por usuario.
- Persistencia / consistencia: Sin sesión durante bloqueo.
- Denegación: No saltar cuota cambiando email ni X-Forwarded-For.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-008"></a>

## E2E-AUTH-008 — Login de usuario sin memberships

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Login de usuario sin memberships; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: tenant,estado-vacío.
- Rol / institución: NONE; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Autenticar NONE en UC.
2. Consultar GET institutions por API del actor.
3. Intentar courses UC.

- Interfaz esperada: Login global puede autenticar, contexto institucional no; aviso recuperable.
- API esperada: Login 200; institutions items []; me/courses UC 404.
- Persistencia / consistencia: Sin cambios.
- Denegación: No inferir pertenencia desde dominio.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-009"></a>

## E2E-AUTH-009 — Token no enviado a rutas públicas

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Token no enviado a rutas públicas; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: seguridad.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC.
2. Capturar headers de peticiones sanitizados.
3. Consultar health/ready y abrir landing en contexto separado.

- Interfaz esperada: Privado sigue correcto; landing anónima.
- API esperada: health/ready/login sin Authorization; privados Bearer; credentials omit.
- Persistencia / consistencia: Sin tokens almacenados.
- Denegación: No token en URL/referrer.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-010"></a>

## E2E-AUTH-010 — SPA conserva sesión; reload la pierde

- Módulo / flujo: AUTH; [FL-AUTH-02](../audit/FLOWS.md#fl-auth-02).
- Requisito: CU-02; RF1/25; RNF2/9; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: SPA conserva sesión; reload la pierde; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,persistencia.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /login?next=...`; `getCurrentUser; listCourses`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login UC.
2. Abrir curso C1 por Link y volver a Mis cursos.
3. Recargar documento e intentar atrás.

- Interfaz esperada: SPA mantiene identidad; reload exige login y no revive datos privados en historial.
- API esperada: Tras reload no GET privado con token anterior; solo tras nuevo login.
- Persistencia / consistencia: Datos académicos permanecen; solo sesión se pierde.
- Denegación: Sin flash de nombre/notas previas tras reload.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
