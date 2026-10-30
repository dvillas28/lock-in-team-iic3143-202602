# Fichas ADMIN · 03

[Índice ADMIN](ADMIN.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-admin-011"></a>

## E2E-ADMIN-011 — Revocación concurrente de superadmin y delegación

- Módulo / flujo: ADMIN; [FL-ADMIN-02](../audit/FLOWS.md#fl-admin-02).
- Requisito: RF3/7/12/26; RNF1/3/10; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [membership-admin.service.ts](../../../backend/src/institutions/membership-admin.service.ts); [onboard-institution.ts](../../../backend/src/data-migrations/onboard-institution.ts); [set-superadmin.ts](../../../backend/src/data-migrations/set-superadmin.ts).
- Objetivo: Revocación concurrente de superadmin y delegación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,concurrencia.
- Rol / institución: SA; OPERATOR; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: RACE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI/API; operación controlada`; `onboard-institution; set-superadmin (operaciones existentes, no endpoints)`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. SA tiene permiso emitir PUT course-admin.
2. Operador revoca isSuperAdmin bajo locks con reemplazo.
3. Después de commit volver PUT con JWT vigente.

- Interfaz esperada: Sin UI de delegación; usuario pierde ese permiso inmediatamente.
- API esperada: PUT posterior403; petición previa puede completar según orden de locks.
- Persistencia / consistencia: Flags/audit coherentes con orden; sin delegación posterior autorizada por JWT viejo.
- Denegación: No recuperar flag por token vigente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F3](../roadmap/F3.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
