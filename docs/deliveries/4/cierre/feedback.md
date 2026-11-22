# Correcciones del semestre

| Observación del evaluador | Corrección y evidencia | Ubicación en E4 |
| --- | --- | --- |
| E1 · complejidad de BD por universidad y dependencia de infraestructura | Base compartida con RLS, rol runtime acotado y claves compuestas; desarrollo local con Compose. [Feedback por celda](../../2/14-e1-feedback.md) y [arquitectura](../arquitectura.md). | 2–3 |
| E1 · logs, redespliegue, revisión y exceso de alcance | La guía indica qué evento de predeploy buscar en los logs del backend; el Blueprint condiciona el despliegue a checks y declara los controles de salud. Flujo de revisión y exclusiones explícitas. [Despliegue](../../../guides/render-deploy.md), [flujo Git](../../../guides/git-flow.md), [alcance](alcance-final.md). | 2, 6 |
| E2 · simplificar HAProxy y despliegue | Se retiraron del diseño final HAProxy y el pool externo; el diagrama muestra los dos servicios web y el acceso a datos. [Registro POL-05](../../2/15-feedback-e2.md) y [arquitectura final](../arquitectura.md). | 2 |
| E2 · riesgos y plan bien evaluados | Se conservaron responsables y semanas. El cierre distingue registros parciales, estimaciones y riesgos que el operador debe confirmar. [Balance por responsable](gestion.md). | 6 |
| E2 · cardinalidades, roles, admin/superadmin y creación de cuentas | UML y ER corregidos, roles restringidos por CHECK, administración separada de docencia. [Feedback original](../../2/15-feedback-e2.md), [PR #160](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/160), [modelo actualizado](../modelo-datos.md). | 2–3, demo |
| E3 · mostrar mejora Sonar y Trivy | Comparación fechada por SHA y capturas de los runs. Gate de #329 explicado por separado. [Calidad](calidad-para-ppt.md). | 4, 9–10 |
| E3 · métricas frontend y captura Lighthouse | Tres navegaciones UC y recorrido privado; reporte completo y capturas. [Rendimiento](rendimiento.md). | 5 |
| E3 · proveedores y disponibilidad de la demo | Ciclo remoto por institución, tiempos fríos/calientes y responsables. [Operación](operacion-demo.md). Render y Neon confirmados por el equipo. | 2, 8 |
| E3 · aprendizajes concretos | Tres decisiones con resultados observables. Reunión y validación colectiva pendientes. [Guion](../ppt/guion.md). | 7 |
| Tom · un idioma en commits | Español exigido en commits y PR. Ejemplo de aplicación en esta [PR de cierre](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/331). | Anexo documental |

## Procesos revisados contra el MVP

Los [modelos BPMN de E1](../../1/bpmn/README.md) conservan el diseño inicial. Los anexos 13–15 representan intento y publicación, acceso por rol y el recorrido desde la tarea hasta la nota con los resultados del [ciclo académico](evidencia/remote-cycle.json) y la [matriz por caso](alcance-final.md).

- **00–02**. La pertenencia institucional y el rol de sección se comprueban por separado. Superadmin puede delegar administración; el permiso administrativo por sí solo no publica notas.
- **03–04 y 07**. La corrección produce un borrador. La publicación explícita corresponde al docente. El ayudante consulta el libro y el estudiante ve solo sus resultados publicados.
- **05–06**. Distinguir intento cancelado de intento enviado y tarea entregada de tarea calificada. El archivo privado requiere comprobación institucional al descargar.
- **08–09**. IA y solicitud de recorrección del diseño inicial quedan fuera del compromiso operativo. Las revisiones de notas del libro tienen su propio [ADR](../../../adr/gradebook-groups-and-revisions.md).

Material por etapa: [E1](../../1/checklist.md), [E2](../../2/README.md), [E3](../../3/ppt/README.md) y [E4](../ppt/README.md).
