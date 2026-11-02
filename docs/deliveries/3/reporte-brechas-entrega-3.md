# Entrega 3 — Estado y brechas

Corte: **2026-10-29**, HEAD `7f4334a` y cambios locales. Referencia: [checklist E3](checklist-entrega-3.md).
**Cubierto:** hay evidencia del requisito. **Parcial:** hay base, falta completar. **Pendiente:** sin entregable encontrado. **Por verificar:** depende de confirmación externa o del equipo.
Los estados describen evidencia disponible; su incorporación al PPT se controla en el checklist.
La respuesta al feedback E2 y el fix de privacidad se referencian al commit del [PR #160](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/160), aún pendiente hacia `dev`.

## Resumen del producto

| Área | Qué tenemos | Brecha para E3 |
| --- | --- | --- |
| Identidad, instituciones y roles | JWT, matrículas y aislamiento; [estado técnico](../2/10-status.md). | Seleccionar perfiles y cruce institucional para la demo. |
| Cursos, secciones y material | Implementación y [QA con API real](../../qa/experiencia-academica/README.md). | Preparar recorrido y datos. |
| Quizzes e intentos | Autoría, publicación, rendición y corrección; [validación real](../../qa/quizzes-real-backend/README.md). | Ensayar en la versión de E3. |
| Notas y auditoría | Ponderaciones, publicación, libro y consulta; [QA](../../qa/experiencia-academica/README.md). | Mostrar permisos y publicación; cerrar validación de privacidad. |
| Privacidad de auditoría | Corrección local; [3/3 pruebas focalizadas aprobadas](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/fcf360db3c2674febb78fee3ee8b626782b85e56/docs/backend/audit-grade-privacy-validation.md). | Checks de cierre todavía en ejecución; sin despliegue acreditado. |

## 1. Material y exposición

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-01 · PPT | Pendiente | Checklist; `ppt/` y `report/` vacías. | Presentación; informe opcional. |
| E3-02 · Estimaciones y plan | Parcial | [Plan y estimaciones E2](../2/08-work-plan.md), [backlog](../2/08-work-plan-detail/08-work-plan-detail.md). | Actualizar corte E3 e integrar tablas. |
| E3-03 · Duración | Pendiente | Límite conocido: 20 min + 10–15 de preguntas. | Ensayar presentación y demo. |

## 2. Proceso de desarrollo

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-04 · Ciclo de desarrollo | Parcial | [Flujo Git](../../guides/git-flow.md), specs, PR y pruebas. | Explicar el ciclo real con un ejemplo completo. |
| E3-05 · PR, checks y merges | Parcial | PR integradas #142, #145, #151, #158; flujo documentado. | Capturas de PR/checks y evidencia del merge. |
| E3-06 · Prácticas y beneficios | Parcial | Revisión por PR, ADR, pruebas y controles CI. | Relacionar cada práctica con resultados observados. |
| E3-07 · Prácticas abandonadas | Por verificar | Sin declaración consolidada encontrada. | Confirmar cuáles dejaron o que no hubo. |
| E3-08 · Decisiones y motivos | Cubierto | [ADR](../../adr/) de persistencia, aislamiento, permisos, publicación y despliegue. | Seleccionar las decisiones relevantes para exponer. |
| E3-09 · Deuda técnica | Parcial | Límites y decisiones diferidas en ADR y [estado técnico](../2/10-status.md). | Explicar registro, priorización y tratamiento de deuda. |
| E3-10 · Resolución de bugs | Parcial | [Bug de fechas](../../qa/quizzes-real-backend/README.md): causa, corrección y regresiones. | Explicar el proceso general desde detección hasta cierre. |
| E3-11 · Documentación | Cubierto | ADR, specs, contratos, diagramas y reportes de validación. | Seleccionar ejemplos para mostrar. |
| E3-12 · Criterio Done | Parcial | [Reglas del tablero](../../guides/board-metrics.md): horas reales obligatorias; validaciones técnicas documentadas. | Consolidar criterio Done; 42 Done sin horas reales en el corte de métricas. |
| E3-13 · Cambio de estado | Cubierto | [Reglas](../../guides/board-metrics.md): In progress al comenzar, horas reales antes de Done. | Mostrar aplicación con una tarjeta real. |

## 3. Calidad y testing

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-14 · Calidad del código | Cubierto | [CI](../../../.github/workflows/ci.yml): lint, tipos, contratos, tests, Sonar y Trivy. | Mostrar controles y resultados seleccionados. |
| E3-15 · Cantidad de defectos | Parcial | [Matriz de casos corregidos/verificados](../../qa/experiencia-academica/edge-cases.md). | Conteo de defectos abiertos/corregidos al corte E3. |
| E3-16 · Estabilidad de desarrollo | Parcial | [Flujo real del 28/10](../../qa/quizzes-real-backend/README.md), sin errores JS observados. | Confirmar estabilidad de la versión y entorno de E3. |
| E3-17 · Estrategia y justificación | Parcial | Pruebas unitarias, DOM, integración PostgreSQL y navegador real. | Explicar por qué se eligieron esos niveles y sus límites. |
| E3-18 · Pruebas backend | Cubierto | [QA](../../qa/experiencia-academica/README.md): 171/171; integración HTTP/SQL, roles y RLS. | Incorporar ejemplos y resultados al PPT. |
| E3-19 · Pruebas frontend | Cubierto | [Quizzes](../../frontend/quizzes-experiencia.md): 343 aprobadas; [navegador con API real](../../qa/quizzes-real-backend/README.md). | Incorporar ejemplos y resultados al PPT. |
| E3-20 · Cobertura actual | Parcial | BE: 99,55 % líneas / 95,59 % ramas ([QA](../../qa/experiencia-academica/README.md)); FE: 95,05 % / 88,47 % ([quizzes](../../frontend/quizzes-experiencia.md)). | Unificar resultados sobre el commit de E3; cifras de cortes anteriores. |
| E3-21 · Cobertura óptima | Parcial | [Frontend](../../../frontend/package.json) exige ≥80 % líneas/ramas. | Acordar y justificar objetivo BE/FE; umbral configurado no equivale a óptimo acordado. |

## 4. CI/CD

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-22 · Pipeline y captura | Parcial | [CI](../../../.github/workflows/ci.yml), [release](../../../.github/workflows/release.yml), Render y [capturas E2](../2/11-cicd-evidence/README.md). | Captura vigente; acreditar CI → release → despliegue actual. |
| E3-23 · CI/CD en vivo | Pendiente | Workflows ejecutables; demo Render histórica documentada solo en local con autodeploy desactivado. | Preparar muestra en vivo y distinguir despliegue manual de CD automático. |

## 5. Métricas y viabilidad

Base: [reglas y automatización](../../guides/board-metrics.md); [reporte guardado](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/463fe2b22e0d4a319e4b108e6cb2925d7527dea6/README.md), referencia local `origin/metrics`, commit `463fe2b`.
Corte **11–22/10**: 12 snapshots; 50/120 tarjetas (42 %); 185/457 horas estimadas (40 %); lead time mediano 4 días (n=50), cycle time 4,6 días (n=19); 42 Done sin horas reales.

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-24 · Métricas y análisis | Parcial | Avance, tiempos, distribución por tipo/área y generación de burnup/CFD. | Actualizar datos, revisar faltantes e interpretar resultados. |
| E3-25 · ¿Alcanzamos? | Pendiente | Backlog, estimaciones y métricas históricas. | Proyección de pendiente frente a capacidad y fecha. |
| E3-26 · Medidas si no alcanzamos | Por verificar | Sin conclusión de viabilidad E3. | Definir medidas o justificar que no aplica según E3-25. |
| E3-27 · Priorización si no alcanzamos | Por verificar | Prioridades en plan E2. | Confirmar recortes/prioridades o que no aplica según E3-25. |
| E3-28 · Compromiso E4 | Parcial | Alcance MVP y plan existentes. | Ratificar compromiso con la proyección actual. |

## 6. Plan actualizado

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-29 · Evolución del plan | Parcial | [Plan E2](../2/08-work-plan.md), ADR y cambios registrados. | Comparación E2 → E3 y motivos. |
| E3-30 · Decisiones de planificación | Parcial | Priorización, responsables y exclusiones documentadas. | Vincular decisiones recientes con avance/capacidad reales. |
| E3-31 · Feedback | Parcial | [Matriz E2](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/fcf360db3c2674febb78fee3ee8b626782b85e56/docs/deliveries/2/15-feedback-e2.md) y [respuesta validada](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/fcf360db3c2674febb78fee3ee8b626782b85e56/docs/backend/feedback-e2-validation.md). | Integrar impacto y pendientes en el plan E3. |
| E3-32 · Plan hacia MVP | Parcial | Siete semanas, fechas y responsables. | Actualizar según ejecución y proyección. |
| E3-33 · Trabajo completo | Parcial | Implementación y reportes de validación por flujo. | Consolidar compromisos completos con evidencia. |
| E3-34 · Trabajo pendiente | Parcial | Backlog y pendientes por documento. | Consolidar pendientes, esfuerzo restante y responsables. |

## 7. Demo y acceso

| ID / requisito | Estado | Qué tenemos | Qué falta |
| --- | --- | --- | --- |
| E3-35 · Demo funcional | Parcial | [Recorridos académicos reales](../../qa/experiencia-academica/README.md), [quizzes](../../qa/quizzes-real-backend/README.md) y datos demo. | Fijar versión/entorno y ensayar recorrido E3. |
| E3-36 · Acceso del profesor | Por verificar | Usuario requerido: `gmartinezramirez`. | Comprobar acceso al repositorio. |
| E3-37 · Producción o aviso | Por verificar | Demo Render documentada solo en local: login y aislamiento; sin flujo académico completo remoto. | Confirmar viabilidad actual; si no llegarán, acreditar aviso en E3. |

**Prioridad:** actualizar métricas → proyectar y ajustar plan → consolidar pruebas/cobertura/defectos → reunir evidencia → PPT y ensayo.
**Límite:** no se ejecutaron pruebas ni se consultó Project/CI/Render remoto; «cubierto» acredita evidencia existente, no disponibilidad actual ni presentación terminada.
