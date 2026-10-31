# Catálogo maestro de pruebas

Base y límites: [auditoría](audit/BASELINE.md). Estado actual por ID en
[ledger de implementación](execution/IMPLEMENTATION_STATUS.md); no hay E2E aprobados.
**248 fichas**: **222 E2E de navegador** (B/M) y
**26 comprobaciones complementarias** HTTP/SQL/operación (H/O).
Se identifican **34 familias de flujos** con operaciones y transiciones detalladas,
trazadas a las 18 páginas y 50 operaciones API; no contar variantes como funcionalidades nuevas.

## Convenciones de ejecución y conteo

B ejecuta navegador real; académicos recorren Next → Nest → PostgreSQL. CATALOG consulta su portal estático sin API/DB.
M agrega ataques HTTP y/o lectura SQL
del mismo entorno a un recorrido UI. H prueba HTTP→DB sin navegador (integración).
O prueba operación/SQL de infraestructura. H/O no se presentan como E2E de interfaz.
Los IDs `E2E-*` son claves del plan; el prefijo no cambia el nivel indicado en la ficha.
Cada fila es una ficha estable. Roles/valores/recursos enumerados son variantes parametrizadas
del mismo caso. Al implementar, usar sufijos de reporte actor/tenant/recurso/navegador;
el conteo ejecutado será mayor y se informará por separado. No afirmar hoy ese número expandido.

## Índice por módulo

| Módulo y fichas | Total | B/M navegador | H/O complemento | Flujos |
| --- | --- | --- | --- | --- |
| [PUBLIC](catalog/PUBLIC.md) | 7 | 7 | 0 | 2 |
| [AUTH](catalog/AUTH.md) | 22 | 18 | 4 | 2 |
| [TENANT](catalog/TENANT.md) | 15 | 13 | 2 | 2 |
| [RBAC](catalog/RBAC.md) | 13 | 13 | 0 | 2 |
| [COURSE](catalog/COURSE.md) | 13 | 12 | 1 | 2 |
| [SECTION](catalog/SECTION.md) | 6 | 6 | 0 | 1 |
| [ENROLL](catalog/ENROLL.md) | 19 | 19 | 0 | 2 |
| [CONTENT](catalog/CONTENT.md) | 16 | 16 | 0 | 2 |
| [QUIZ](catalog/QUIZ.md) | 18 | 18 | 0 | 3 |
| [ATTEMPT](catalog/ATTEMPT.md) | 32 | 30 | 2 | 4 |
| [GRADE](catalog/GRADE.md) | 32 | 32 | 0 | 4 |
| [AUDIT](catalog/AUDIT.md) | 10 | 10 | 0 | 1 |
| [ADMIN](catalog/ADMIN.md) | 11 | 4 | 7 | 2 |
| [NETWORK](catalog/NETWORK.md) | 13 | 11 | 2 | 2 |
| [A11Y](catalog/A11Y.md) | 8 | 8 | 0 | 1 |
| [OPS](catalog/OPS.md) | 9 | 2 | 7 | 1 |
| [CATALOG](catalog/CATALOG.md) | 4 | 3 | 1 | 1 |

## Distribución reproducible

| Prioridad | Fichas | Nivel de riesgo |
| --- | --- | --- |
| P0 | 126 | Seguridad, aislamiento, integridad o operación esencial |
| P1 | 91 | Flujo central y errores de impacto alto |
| P2 | 30 | Límites y secundarios importantes |
| P3 | 1 | Complementarios de bajo impacto |

Selección primaria: 22 smoke, 156 regression,
70 extended. Regression ejecuta smoke+regression; extended ejecuta todas.
P0 no significa automáticamente smoke: ataques exhaustivos/concurrencia van en regresión/extendida,
pero ningún defecto P0 conocido se admite como verde de entrega aunque el smoke pase.

## Cómo implementar una ficha sin rediseñarla

1. Leer [datos](E2E_TEST_DATA.md) y resolver manifest por run/shard/test/retry.
2. Preparar fixture exacta, verificar sus invariantes y login real. Si hay varios perfiles,
   ejecutar variantes independientes; no consumir más de cinco logins por proceso API salvo RATE.
3. Usar nombres accesibles de los componentes enlazados. Entrada de ruta usa IDs del manifest,
   no `page.goto` repetido después del login: un documento nuevo borra la sesión en memoria.
4. Capturar respuesta relevante y verificar UI/HTTP/DB según la ficha. SQL solo como test oracle
   o preparación autorizada; la operación del usuario ocurre por UI/API real.
5. Revisar denegaciones contra [matriz](matrices/ROLES.md), incluyendo invisibilidad404 vs prohibición403.
6. Conservar evidencia sanitizada y terminar contextos. No DELETE de historia para limpiar test.

Las fichas incluyen requisito, evidencia, objetivo, criticidad, actor/tenant, precondiciones,
datos, pasos, UI/API/persistencia/denegación, limpieza, dependencias, nivel/suite y estado.
Los defaults se resuelven mediante el diccionario enlazado; no implican compartir estado mutable.
Un escenario Q02 permanece bloqueado por aclaración, sin status inventado ni skip que dé cobertura.
