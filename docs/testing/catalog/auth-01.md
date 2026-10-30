# Fichas AUTH · 01

[Índice AUTH](AUTH.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-auth-001"></a>

## E2E-AUTH-001 — Login correcto de cada perfil

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Login correcto de cada perfil; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: happy,authz.
- Rol / institución: SA; AO; T1; AS1; ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir UC/login en contexto limpio por perfil.
2. Completar correo y contraseña efímera; Continuar.
3. Esperar Mis cursos y nombre/roles del actor.

- Interfaz esperada: Nombre, institución UC y acciones según cada perfil; contraseña borrada tras enviar.
- API esperada: POST login 200 tokenType Bearer expiresIn 900; institutions y me autorizados; token solo en privados.
- Persistencia / consistencia: Nueva navegación SPA conserva identidad; ningún token en cookie/localStorage/sessionStorage.
- Denegación: Un perfil sin cursos ve vacío legítimo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-002"></a>

## E2E-AUTH-002 — Credenciales erróneas indistinguibles

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Credenciales erróneas indistinguibles; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: negativo,seguridad.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+AUTH-NEG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar password incorrecta de ST1.
2. En entorno de cuota limpio enviar email inexistente.
3. Comparar mensaje y respuesta sin imprimir passwords.

- Interfaz esperada: Mismo mensaje genérico; formulario recuperable; contraseña vacía.
- API esperada: 401 ambos, problem sin enumerar cuenta; no acceso privado.
- Persistencia / consistencia: No crea sesión ni eventos académicos.
- Denegación: No nombre, membership ni motivo de cuenta.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-003"></a>

## E2E-AUTH-003 — Usuario inactivo

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Usuario inactivo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,revocación.
- Rol / institución: INACTIVE; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login con credencial efímera de INACTIVE.
2. Observar rechazo.
3. Pedir courses con token previamente emitido antes de desactivar, vía fixture aislada.

- Interfaz esperada: No entra a Mis cursos; sesión inválida se limpia.
- API esperada: Login 401; token de User desactivado 401.
- Persistencia / consistencia: User sigue inactivo y sin escrituras académicas.
- Denegación: Ningún dato privado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-004"></a>

## E2E-AUTH-004 — Campos vacíos y correo inválido

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Campos vacíos y correo inválido; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: validación,recuperación.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar ambos vacíos.
2. Enviar correo sin @, luego password vacía.
3. Corregir y autenticar ST1.

- Interfaz esperada: Error comprensible y foco; validación local sin petición en entradas inválidas.
- API esperada: API directa con body inválido 400; caso companion usa cliente sin UI.
- Persistencia / consistencia: Sin sesión residual.
- Denegación: No redirección prematura.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-005"></a>

## E2E-AUTH-005 — Correo normalizado y password exacta

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Correo normalizado y password exacta; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Login usando correo ST1 en mayúsculas y espacios.
2. Cerrar sesión.
3. Intentar password con espacio añadido y volver con original.

- Interfaz esperada: Primer login válido; password con espacio añadido falla.
- API esperada: Email se trim/lower; password no se trim; 200/401.
- Persistencia / consistencia: Una identidad global, sin duplicación.
- Denegación: Respuesta genérica al fallo.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
