# Funcionalidades OPS

Evidencia: [health.controller.ts](../../../../backend/src/health/health.controller.ts); [runtime-check.ts](../../../../backend/src/database/runtime-check.ts); [predeploy.ts](../../../../backend/src/commands/predeploy.ts); [presentation-data.ts](../../../../backend/src/seeds/presentation-data.ts).
Permisos comunes: Operador credencial separada prepara; runtime HTTP academix_runtime sin bypass; públicos health/ready.
Estados: DB migrada/no lista; runtime seguro/rechazado; seed ensured; stack owned efímero.

## FL-OPS-01 — Salud entorno y garantías de persistencia
- Requisito: RF3/8/9/26; RNF1/3–7/9/10; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `sin página propia; frontend consume API`.
- Endpoints/operaciones: getHealth; getReadiness; predeploy; seed; resolver path/método en [API](../API.md).
- Roles: Operador credencial separada prepara; runtime HTTP academix_runtime sin bypass; públicos health/ready.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: FAULT-DB, FAULT-TX, GUARD, OPERATIONS, SEED, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: DB migrada/no lista; runtime seguro/rechazado; seed ensured; stack owned efímero.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: infra implementada; harness E2E propuesto; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [OPS](../../catalog/OPS.md); cada ficha precisa pasos y persistencia.
