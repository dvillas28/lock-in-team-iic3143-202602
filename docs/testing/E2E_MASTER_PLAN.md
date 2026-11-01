# Qué probamos y cómo se organizan las fases

AcademiX tiene **248 casos implementados**, con **512 combinaciones de variantes y navegadores**.
La corrida completa pasó y se completaron veinte rondas smoke locales sin fallos.
[Ejecución y comandos](E2E_README.md) · [Evidencia y tiempos](execution/VALIDATION.md).
La ejecución de GitHub Actions y la protección de ramas siguen pendientes de validación remota.

## Fases

| Fase | Qué se comprueba |
| --- | --- |
| F1 — Infraestructura y datos | PostgreSQL 17 aislado, migraciones, seed repetible, persistencia tras reinicio, rollback y limpieza incluso ante fallos. |
| F2 — Entrada y navegación | Portal, catálogo, login válido e inválido, sesión en memoria, recarga, enlaces y redirecciones permitidas. |
| F3 — Permisos y universidades | Roles, usuarios multirol, revocaciones, JWT, aislamiento UC↔UTFSM y privacidad de pautas, notas e historial. |
| F4 — Cursos y contenido | Cursos, secciones, participantes, asignación de roles, módulos, Markdown y publicación persistida. |
| F5 — Ciclo académico | Autoría y publicación de quizzes, rendición, guardado, envío, cancelación, autocorrección, pesos, publicación de notas, promedio y auditoría. |
| F6 — Errores y compatibilidad | Desconexiones, respuestas tardías, escrituras inciertas, concurrencia, teclado, móvil, temas, Firefox y WebKit. |
| F7 — Automatización y estabilidad | Selección de suites, CI, detección de cambios, reportes seguros, métricas, limpieza y veinte rondas smoke comparables. |

F1–F6 contienen las pruebas funcionales; F7 las organiza y verifica su ejecución.
Las fases son el orden de implementación. Cada prueba prepara sus datos y puede ejecutarse por separado.
Todas tienen aceptación local; F7 conserva como pendiente su validación remota.

## Qué significa que una prueba pasó

Playwright realiza acciones sobre un navegador real contra Next, Nest y PostgreSQL.
Las aserciones comprueban resultados visibles, respuestas HTTP y persistencia, según cada caso.
Las denegaciones verifican que no queden escrituras indebidas. Los cálculos de notas usan un oráculo independiente.
Cada variante tiene actores, universidad y datos propios; otra sesión o lectura confirma las escrituras pertinentes.
Un mensaje de éxito o un log no bastan: una aserción incumplida hace fallar el proceso.

El catálogo distingue **222 casos de navegador** y **26 complementarios de API, SQL u operación**.
Sus variantes producen 454 y 58 instancias respectivamente en la corrida completa; no son 512 funcionalidades.
Los casos complementarios no tienen necesariamente una interacción visual.

## Suites

| Suite | Casos incluidos | Uso |
| --- | --- | --- |
| Smoke | 22 casos críticos | Comprobación rápida de entrada, permisos y recorrido académico. |
| Regression | Smoke + regression: 178 casos | Regresión habitual en Chromium. |
| Extended | Los 248 casos | Catálogo completo y proyectos declarados. |

Las variantes obligatorias están en [case-variants.ts](../../e2e/data/case-variants.ts).
Una ficha solo aprueba si se ejecutan todas las variantes y motores que exige el manifest.
Skip, cancelación, resultado incompleto o recuperación mediante retry impiden aprobar el gate.
Las veinte rondas miden estabilidad del smoke en tres motores; no equivalen a veinte catálogos completos.

## Detalle técnico

- [Catálogo](E2E_TEST_CATALOG.md): IDs, escenarios, prioridades y criterios de cada caso.
- [Cobertura](E2E_COVERAGE_MATRIX.md): requisitos, permisos, aislamiento, estados y combinaciones.
- [Arquitectura](TEST_ARCHITECTURE.md) y [datos](E2E_TEST_DATA.md): fixtures, helpers y preparación.
- [CI](EXECUTION_CI.md): eventos, omisiones permitidas, artifacts y presupuestos.
- [Mantenimiento](QUALITY_MAINTENANCE.md): cómo actualizar pruebas al cambiar el producto.

El código acumulado está en `test/e2e-f7`, en el repositorio permanente.
Las ramas F1–F7 encadenan los incrementos; se acordó una única PR acumulativa para la revisión posterior.
No se hizo push, merge, despliegue ni se utilizó producción.
La suite no acredita ausencia de defectos, cobertura de código ni certificación WCAG.
