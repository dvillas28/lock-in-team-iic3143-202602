# Fichas ENROLL · 05

[Índice ENROLL](ENROLL.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-enroll-021"></a>

## E2E-ENROLL-021 — Roster mínimo de participantes activos

- Módulo / flujo: ENROLL; [FL-ENROLL-03](../audit/FLOWS.md#fl-enroll-03).
- Requisito: CU-04; RF12/25/26; RNF1/2/3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [enrollments.service.ts](../../../backend/src/enrollments/enrollments.service.ts); [section-participants.controller.ts](../../../backend/src/enrollments/section-participants.controller.ts).
- Objetivo: student/assistant leen solo participantes activos de su sección, sin datos privados ni escritura.
- Prioridad / criticidad: P0 / Crítica; categorías: authz,tenant,privacidad.
- Rol / institución: ST1, AS1 y T1; UC, UTFSM en escenarios cruzados.
- Precondiciones / fixtures: WRITE+REVOKE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `sin UI propia (PR-7)`; `listSectionParticipants`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; matrícula histórica ST2 y matrículas activas de REVOKED/INACTIVE en S1.

1. ST1, AS1 y T1 GET participants de S1.
2. ST1 GET S2, ST2 GET S1, FST1/MULTI desde UTFSM GET S1; ST1 POST/PATCH en participants.
3. T1 revoca ST1 en S1 y ST1 repite GET.

- Interfaz esperada: N/A; vista estudiantil se implementa en PR-7.
- API esperada: 200 idéntico con `userId`, `name`, `roles`; 404 sección ajena/tenant/revocado; 404 en verbos de escritura.
- Persistencia / consistencia: Solo lectura; enrollments y auditoría sin cambios.
- Denegación: sin correos, historial, REVOKED, INACTIVE ni FST1; roles múltiples en una sola fila.
- Limpieza: cerrar contextos; datos históricos quedan en namespace del test.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente.
- Nivel / suite: Complemento HTTP de integración; sin navegador; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Pendiente de validación en GitHub Actions.
