# Auditoría: base y alcance de la evidencia

Fecha: 2026-10-30. Rama documental: `test/e2e-master-plan`.
Base: `origin/dev` obtenido mediante clone remoto; commit `90463059015e5045d011eadd12b6403b7b492615`.
El checkout original estaba limpio en `dev`, en el mismo commit.
No se actualizaron archivos ni referencias de ese checkout: `.git` es de solo lectura en este entorno.
La rama y los commits están en `/private/tmp/academix-e2e-master-plan`; no hubo merge ni push.

## Método reproducible y límites

Se inventariaron páginas App Router, controladores, servicios, capacidades UI, validadores,
DTO, migraciones, seeds, tests, contratos, specs, ADR y workflows del commit base.
Se siguió identidad → contexto → SQL/RLS y UI → cliente tipado → operación HTTP → transacción.
CodeGraph fue intentado antes de inspeccionar código: `command not found`; se continuó con `rg` y lecturas directas.
Se consultaron issues mediante GitHub conectado, solo lectura, el 2026-10-30.
No se instalaron dependencias, arrancaron aplicaciones, ejecutaron tests funcionales ni conectaron bases.
No se visitó producción. No se modificaron cuentas, permisos, contratos ni workflows.
Por ello «implementada» significa evidencia estática de integración, no aprobación runtime nueva.
La evidencia QA previa se atribuye a su fecha y commit; no se presenta como ejecución de esta auditoría.

## Jerarquía para decidir expectativas

1. Constitución y alcance vigente E2: [constitución](../../../.specify/memory/constitution.md),
   [alcance](../../deliveries/2/02-scope.md), [CU/RF/RNF](../../deliveries/2/03-use-cases-and-requirements.md).
2. ADR aceptado más reciente que resuelve la regla; p. ej. privacidad grade del 2026-10-29.
3. Spec/contrato de misión vigente, luego OpenAPI para códigos, cuerpos y proyecciones.
4. Implementación del commit auditado describe comportamiento observado estáticamente.
5. Tests existentes y QA histórica son evidencia parcial; issues/backlog registran intención.
6. Mockups y entregas anteriores son referencia histórica, sin autoridad para conceder permisos.

Si código y requisito discrepan: registrar ambos, diseñar aserción normativa y marcar bloqueo;
no convertir una filtración en expectativa válida para obtener verde. Una decisión más reciente
puede acotar un texto antiguo; documentar la cadena de sustitución. No ampliar MVP por un issue.

## Fuentes examinadas

- [Plan contextual](../../../specs/20261021-141353_frontend-notas-seguimiento/plan.md)
  y misiones identidad-acceso, cursos-roles, modulos-material, autoria-quizzes,
  intentos-calificacion, libro-notas-auditoria, fundacion-frontend y experiencia-academica.
- [Permisos](../../adr/institution-admin-and-course-ownership.md),
  [privacidad audit](../../adr/grade-audit-visibility.md),
  [inmutabilidad quiz](../../adr/quiz-authoring-integrity.md),
  [tiempo/calificación](../../adr/quiz-attempt-lifecycle-and-grading.md),
  [PostgreSQL compartida](../../adr/adopt-shared-postgresql-multitenancy.md).
- [Backend](../../backend/README.md), [mapa frontend](../../frontend/coverage.md),
  [QA académica](../../qa/experiencia-academica/edge-cases.md),
  [QA real quizzes](../../qa/quizzes-real-backend/README.md), [QA intentos](../../qa/intentos-experiencia/README.md).
- [Backlog](../../deliveries/2/08-work-plan-detail/08-work-plan-detail.md)
  y TSV del mismo directorio: referencias BE/FE, no prueba de implementación.
- [DESIGN](../../../DESIGN.md), [mapa mockups](../../../mockups/README.md):
  formularios, diálogos, tablas, 375 px, temas y navegación por teclado.

## Issues pertinentes consultados

Repositorio GitHub: `dvillas28/lock-in-team-iic3143-202602`.
La búsqueda devolvió títulos/cuerpos, pero estado normalizado nulo; no inferir abierto/cerrado.

| Referencia | Uso en el plan |
| --- | --- |
| [#144](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/144), [#77](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/77) | Landing y dominio institucional |
| [#73](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/73), [#80](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/80), [#83](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/83) | JWT, sesión, identidad contextual |
| [#74](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/74), [#75](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/75), [#119](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/119) | Aislamiento y hardening |
| [#105](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/105), [#106](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/106), [#107](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/107) | Cursos, secciones y matrículas |
| [#110](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/110), [#111](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/111) | Autoría/publicación |
| [#112](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/112), [#113](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/113), [#114](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/114), [#115](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/115) | Intentos y corrección |
| [#116](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/116), [#117](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/117), [#118](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/118), [#120](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/120) | Pesos, notas, publicación y contrato |
| [#146](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/146), [#152](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/152) | Experiencia académica y regresiones recientes |
| [#84](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/84) | Integración/aislamiento como check PR; complementar con navegador |

## Estado documental

Todos los casos nuevos están propuestos, sin implementar ni ejecutar.
Los conteos se derivan de las fichas: [catálogo](../E2E_TEST_CATALOG.md).
Para discrepancias y cobertura faltante usar [hallazgos](FINDINGS.md), no listas históricas de tareas completadas.
