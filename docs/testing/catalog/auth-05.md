# Fichas AUTH · 05

[Índice AUTH](AUTH.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-auth-021"></a>

## E2E-AUTH-021 — Login200 sin directorio confirmado no abre privado

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Login200 sin directorio confirmado no abre privado; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: sesión,red.
- Rol / institución: ST1; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: BASE+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Permitir POST login200 real.
2. Fallar GET institutions con503 o shape inválido antes de marcar authenticated.
3. Restaurar y volver a login explícitamente.

- Interfaz esperada: No dashboard privado prematuro; mensaje recuperable; credencial anterior descartada.
- API esperada: Sin authenticated UI hasta directorio válido; ningún loop automático de POST.
- Persistencia / consistencia: Sin cambios académicos ni token persistente.
- Denegación: No mostrar identidad solo por decodificar JWT local.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-auth-022"></a>

## E2E-AUTH-022 — Password Unicode se limita por bytes

- Módulo / flujo: AUTH; [FL-AUTH-01](../audit/FLOWS.md#fl-auth-01).
- Requisito: CU-02; RF1/7; RNF2; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [session.ts](../../../frontend/src/lib/auth/session.ts); [auth.service.ts](../../../backend/src/auth/auth.service.ts); [auth.guard.ts](../../../backend/src/auth/auth.guard.ts).
- Objetivo: Password Unicode se limita por bytes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde,validación.
- Rol / institución: ANON; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: AUTH-NEG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/login`; `login; listAccessibleInstitutions; getCurrentUser`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar password de32 emojis4bytes y luego33 emojis.
2. Comparar límite128/132bytes API.
3. Probar contraseña válida efímera sin normalizaciónUnicode.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: No se trunca entrada ni cambia password; respuesta genérica cuando no coincide.
- API esperada: 128bytes sintácticamente válido puede401;132bytes400; cuerpo total<4096.
- Persistencia / consistencia: Sin cambios de credenciales.
- Denegación: No inventar máximo por caracteres para login.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
