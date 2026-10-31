# AcademiX — Plan maestro E2E

Fecha 2026-10-30 · `test/e2e-master-plan` · base `90463059015e5045d011eadd12b6403b7b492615`.
Solo investigación/documentación. Sin tests nuevos, dependencias, cambios funcionales o despliegues.

Actualización de implementación: [estado verificable](execution/IMPLEMENTATION_STATUS.md).
Rama `test/e2e-implementation`: F1 aceptada localmente;10 fichas aprobadas, suite incompleta.
El contenido siguiente conserva la estrategia original, no constituye evidencia de ejecución.

## Resumen ejecutivo y alcance

El MVP real integra cursos/secciones/roles → módulos/Markdown → quizzes → intentos →
autocorrección → publicación → notas/promedio y auditoría. PostgreSQL compartida con RLS,
JWT global y membresías activas. `isAdmin`+ownership y Enrollment son dimensiones distintas.
No coordinador, almacenamiento binario, entregas manuales, corrección manual ni administración general.
La implementación está integrada estáticamente; su operatividad completa queda por ejecutar en entorno aislado.

Se inventariaron 18 páginas y 50 operaciones contractuales implementadas, 34 familias
de flujos y 248 fichas: 222 E2E navegador y 26 complementarias.
Exhaustividad significa clasificar cada ruta/operación y frontera descubierta; no ausencia garantizada de errores.

## Mapa de entregables

| Documento | Contenido |
| --- | --- |
| [Auditoría](audit/BASELINE.md) | Método, base Git, jerarquía de fuentes e issues |
| [Arquitectura actual](audit/ARCHITECTURE.md) | Stack, scripts, sesiones, guards, RLS, DB, seed y CI |
| [Rutas](audit/ROUTES.md), [API](audit/API.md), [flujos](audit/FLOWS.md) | Inventario exhaustivo con evidencia y clasificación |
| [Hallazgos](audit/FINDINGS.md) | Discrepancias, riesgos, bloqueos y límites de evidencia |
| [Catálogo](E2E_TEST_CATALOG.md) | Fichas ejecutables y conteos reales por módulo/prioridad |
| [Cobertura](E2E_COVERAGE_MATRIX.md) | Requisitos, permisos, tenant, estados, errores y combinaciones |
| [Arquitectura propuesta](TEST_ARCHITECTURE.md) | Playwright, fixtures, selectores, sesiones y diagnóstico |
| [Datos](E2E_TEST_DATA.md) | Actores, entidades y perfiles; seed/limpieza/seguridad |
| [Ejecución/CI](EXECUTION_CI.md) | Comandos actuales/futuros, triggers, tiempos, artifacts y gates |
| [Roadmap](E2E_IMPLEMENTATION_ROADMAP.md) | Backlog en ramas posteriores, esfuerzo y aceptación |
| [Mantenimiento](QUALITY_MAINTENANCE.md) | Métricas, cobertura y actualización de la suite |
| [Validación documental](audit/VALIDATION.md) | Conteos y controles realmente ejecutados al entregar |

## Decisiones de estrategia

1. Playwright Test TypeScript como herramienta nueva propuesta: navegador, múltiples contextos,
   red y trazas; mantener node:test/jsdom e integración actuales para lógica/SQL de menor nivel.
2. Baseline local/CI con Next y Nest compilados y PostgreSQL17 efímera; cero escrituras en producción.
   No reemplazar backend/DB con mocks en flujos críticos. Fallos inyectados se etiquetan como tales.
3. Login UI real por test; token solo memoria. `storageState` no reconstruye React Session.
   Un worker por stack inicialmente; sharding duplica stack, no comparte volumen/credenciales.
4. Nueva seed E2E namespaced, no cuentas demo productivas. Inmutabilidad exige limpiar infraestructura
   propia al terminar, sin borrar filas académicas por test. Repetir ensure no repara cambios.
5. Reutilizar validaciones frontend y contrato como contexto, pero oráculos numéricos independientes.
   Persistencia confirmada por otra sesión/GET/SQL; un aviso de éxito no basta.
6. Fronteras tenant/rol exhaustivas por operación; pares representativos solo para dimensiones no críticas.
   El backend debe rechazar el ataque aunque se quite el control UI.
7. Triggers/protecciones futuras se proponen en documentación; no modificar workflows en esta rama.

## Riesgos prioritarios y tratamiento

| Riesgo | Por qué P0 | Primera cobertura |
| --- | --- | --- |
| UUID/path cruzado UC/UTFSM | Exposición o corrupción institucional | TENANT-008/009/010 y tabla de 50 operaciones |
| Pauta/notas filtradas | Afecta evaluación y privacidad | RBAC-005/006/009, QUIZ-004, AUDIT-003 |
| Permisos revocados con token vigente | JWT no incorpora autoridad persistida | TENANT-005, RBAC-012, GRADE-032 |
| Estado viejo tras logout/cambio actor | Otra identidad puede ver datos previos | AUTH-011, TENANT-015, NETWORK-008 |
| Submit/publicación concurrentes | Nota/recibo/auditoría deben ser atómicos | ATTEMPT-023/024, GRADE-028/029 |
| Pesos y freeze | Cálculo incorrecto de resultados publicados | GRADE-014/018/019 |
| Runner contra producción | Riesgo de escritura real no autorizada | OPS-008 y preflight obligatorio F1 |

El backend ya posee controles/constraints relevantes; estos casos protegen su integración y futuras regresiones.
Clasificación: impacto I, probabilidad P, frecuencia F y exposición a cambios E en escala1–3.
Score orientativo `2I+P+F+E` (5–15): >=12 P1, 9–11 P2, <=8 P3;
override P0 si fuga tenant/pauta/notas, escalada, pérdida de integridad irreversible o guard productivo.
Complejidad y dependencias ordenan dentro de prioridad, nunca rebajan seguridad.
Para P0 el catálogo identifica concretamente el daño en objetivo/aserciones y en esta tabla.
La alta proporción P0 refleja que múltiples variantes protegen fronteras distintas, no que todas sean smoke.

## Ejecución y aceptación

PR: smoke + seguridad pertinente al cambio. Dev: regression Chromium. Nocturna: extended,
concurrencia y smoke crítico Firefox/WebKit. Artifacts sanitizados, sin login/token/raw HAR.
Los fallos de infra se distinguen de producto; reintento no convierte flakiness en cobertura estable.
Metas, tiempos y costo son hipótesis de ingeniería, recalibradas con primeras20–30 ejecuciones.

La entrega exige todos CU-01–16 y RF implementados trazados, cero P0 conocidos abiertos,
P0 crítico estable, aislamiento exhaustivo y evidencia de ejecución de navegador real independiente.
Hoy esa cobertura es **planificada**, no implementada ni aprobada. No se ha ejecutado nueva suite.

## Primer conjunto y secuencia

Infra/preflight/seed → PUBLIC-001 → AUTH-001/002/010/011 → TENANT-001/008/009 →
RBAC-005/006/009 → CONTENT-008/009 → QUIZ-014 → ATTEMPT-001/018 →
GRADE-003/021 → AUDIT-003. Cada test prepara sus datos; la flecha es orden de implementación.
Detalle y aceptación por tarea en [roadmap](E2E_IMPLEMENTATION_ROADMAP.md).
Estimación total: 284–432 horas persona, sin correcciones funcionales descubiertas; ver desglose.

## Fuentes de herramienta

La recomendación de contextos aislados y locators por rol sigue
[buenas prácticas Playwright](https://playwright.dev/docs/best-practices).
La incompatibilidad concreta de storageState con Session deriva del código AcademiX;
[autenticación Playwright](https://playwright.dev/docs/auth) describe qué estado puede reutilizarse.
No se introduce proveedor de testing remoto ni infraestructura ajena al MVP.
