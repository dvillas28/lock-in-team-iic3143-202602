# Presentación E4

[PDF de exposición](main.pdf) · [Fuente Beamer editable](main.tex) · [Guion de 30 minutos](guion.md) · [Índice de evidencias](../cierre/README.md).

## Lectura por pauta

| Bloque | Láminas | Apoyo para presentar |
| --- | --- | --- |
| Arquitectura y datos | 2–3 | El flujo de despliegue de [E3](../../3/ppt/dvillas28/07-cicd/frames.tex) sitúa el diagrama de [arquitectura final](../arquitectura.md). El [modelo](../modelo-datos.md) detalla cardinalidades y reglas. |
| Prácticas, pruebas y calidad | 4–5 | SonarQube manual, Trivy y gate de PR por separado. Captura real de Lighthouse y métricas de navegación autenticada. |
| Plan, decisiones y pendientes | 6 | Línea base E3, alcance entregado y pendientes del equipo. |
| Retrospectiva | 7 | Tres decisiones con efectos observados. Las conclusiones de la reunión quedan en [#207](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/207). |
| Demo en vivo | 8 | Cambiar al navegador. El [guion](guion.md) distribuye acciones y tiempos entre UC y UTFSM. |
| Evidencia y procesos corregidos | 9–14 | Capturas Sonar, Trivy y producto; diagramas de intentos/publicación, acceso/roles y tareas/entregas. [Feedback del semestre](../cierre/feedback.md). |

## Compilación

Desde esta carpeta, ejecutar `latexmk -pdf -halt-on-error main.tex` y luego `latexmk -c main.tex`. Usa pdfLaTeX, Beamer y TikZ. Las ocho láminas principales acompañan la exposición; los seis anexos quedan disponibles para preguntas. Los enlaces del PDF apuntan al corte de evidencia revisado. El envío al curso y la evaluación individual corresponden al equipo.
