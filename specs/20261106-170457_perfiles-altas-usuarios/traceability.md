# Trazabilidad de perfiles y altas

[Spec](spec.md) · [Requisitos fuente](../../docs/planning/perfiles/requisitos.md)
· [Backlog agrupado](../../docs/planning/perfiles/backlog.md).
FR son locales a esta spec; RF/RNF conservan los IDs del registro de requisitos.
CA = escenarios de aceptación de cada US; SC = criterios de éxito del spec.

## Historias y entregables

| Historia | CU | Backlog activo | Comprobación independiente |
| --- | --- | --- | --- |
| US1 Perfil | CU-17 | USR-02 | Cuenta existente, incluso sin institución |
| US2 Contraseña | CU-18 | USR-02 | Cuenta/sesiones preparadas; no requiere US1/3/4 |
| US3 Foto | CU-21 | USR-02 | Cuenta y almacenamiento de prueba, sin altas |
| US4 Alta/activación | CU-19 | USR-04 | Institución/admin y correo simulado, sin perfil/CSV |
| US5 CSV | CU-20 | USR-05 | Base US4 preparada; no depende del formulario individual |
| Preparación / validación integrada | CU-17–21 | USR-01 / USR-08 | Documentación / matriz final, sin posponer tests propios |

## Requisitos funcionales fuente

| RF | FR del spec | Historia / CA | SC | Backlog |
| --- | --- | --- | --- | --- |
| RF30 | FR-001 | US1.1/2 | SC-001/002 | USR-02 |
| RF31 | FR-001/002 | US1.1/2 | SC-001 | USR-02 |
| RF32 | FR-002/023 | US1.2 | SC-001/002/009 | USR-02 |
| RF33 | FR-003 | US2.1/2 | SC-003 | USR-02 |
| RF34 | FR-004 | US2.1/2 | SC-003/009 | USR-02 |
| RF35 | FR-007/008/022 | US4.1/3 | SC-002/004 | USR-04 |
| RF36 | FR-009/010/011 | US4.1/2/3 | SC-004 | USR-04 |
| RF37 | FR-008/009 | US4.2/3, US5.2 | SC-004/005 | USR-04/05 |
| RF38 | FR-007/012/016 | US4.1/3, US5.1 | SC-002/004 | USR-04/05 |
| RF39 | FR-014 | US5.1 | SC-005/006 | USR-05 |
| RF40 | FR-014/015/016 | US5.1 | SC-005 | USR-05 |
| RF41 | FR-016 | US5.1 | SC-005/006 | USR-05 |
| RF42 | FR-017/022 | US5.2/3 | SC-002/005 | USR-05 |
| RF43 | FR-017/018 | US5.2/3 | SC-004/005 | USR-05 |
| RF44 | FR-018/020 | US5.2/3 | SC-006/007 | USR-05 |
| RF45 | FR-005/006 | US3.1/2 | SC-001/008 | USR-02 |
| RF46 | FR-005/006 | US3.1/2 | SC-008 | USR-02 |
| RF47 | FR-004/021/023 | US1–5 | SC-009 | USR-02/04/05/08 |
| RF48 | FR-007/009/023 | US4.1/2, US5.2 | SC-002/004/005 | USR-04/05 |
| RF49 | FR-007/009/010/022 | US4.3, US5.3 | SC-002/004 | USR-04/05 |
| RF50 | FR-012/020 | US4.1, US5.3 | SC-007 | USR-04/05 |
| RF51 | FR-011/024 | US4.1 | SC-007/009 | USR-04 |
| RF52 | FR-010/011/024 | US4.1/2/3 | SC-002/004/009 | USR-04 |
| RF53 | FR-012 | US4.1, US5.3 | SC-007 | USR-04/05 |
| RF54 | FR-018/020 | US5.3 | SC-005/007 | USR-05 |
| RF55 | FR-010/013 | US4.3, US5.3 | SC-004/007 | USR-04/05 |
| RF56 | FR-025 | US4.4, US5.4 | SC-010 | USR-01/04/05/08 |

## Requisitos no funcionales fuente

| RNF | FR / SC | Verificación prevista | Backlog |
| --- | --- | --- | --- |
| RNF11 | FR-022; SC-002/009 | Escritura propia y privilegios runtime acotados | USR-01/02/04/08 |
| RNF12 | FR-007/022; SC-002 | UC/UTFSM, identificadores/cursors/contextos cruzados | USR-02/04/05/08 |
| RNF13 | FR-015/016/020; SC-005/007 | Límites, preview, confirmación corta, correo posterior | USR-05 |
| RNF14 | FR-019/021/024; SC-006/009 | Original efímero, secretos fuera de logs/recibos | USR-02/04/05/08 |
| RNF15 | FR-024; SC-001/008 | Teclado/foco, ambos temas, 375 px y estados | USR-02/04/05/08 |
| RNF16 | FR-004/017/018/022/023/025; SC-001–010 | Migración, carreras, revocación, fallos y regresión | USR-01/02/04/05/08 |
| RNF17 | FR-005/006; SC-008 | Foto inválida/ajena, reemplazo y limpieza recuperable | USR-02 |
| RNF18 | FR-012/020; SC-007 | Cuota compartida, rate y resultado por destinatario | USR-04/05 |
| RNF19 | FR-012/013/017/018/020; SC-005/007 | Límite entre confirmación local y efecto externo | USR-04/05 |
| RNF20 | FR-011/012/024; SC-007/009 | Simulación local/CI; remitente elegido, DNS pendiente | USR-04/08 |

## Decisiones resueltas y exclusiones

PEND-01/02 cerrados: remitente elegido y limpieza 7/30 aprobada. Falta verificar DNS
e implementar/probar mantenimiento; no confundir decisión con ejecución.
Detalle y default sin primera emisión en [registro](pending-decisions.md).
IDs remotos: USR-01 #233, USR-02 #234, USR-04 #235, USR-05 #236 y USR-08 #237.
Conservar los cinco IDs activos y las referencias históricas consolidadas del backlog;
no reabrir misiones anteriores ni marcar implementación/pruebas como realizadas sin evidencia.
La implementación autorizada se sigue en [tasks](tasks.md), con pruebas por historia y evidencia externa separada.
