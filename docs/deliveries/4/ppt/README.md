# Presentación E4

[PDF de exposición](main.pdf) · [Fuente Beamer editable](main.tex) · [Guion de 30 minutos](guion.md) · [Índice de evidencias](../cierre/README.md).

## Lectura por pauta

| Bloque | Láminas | Apoyo para presentar |
| --- | --- | --- |
| Arquitectura y datos | 2–3 | El diagrama de [arquitectura final](../arquitectura.md) muestra los servicios y sus conexiones. El [modelo](../modelo-datos.md) detalla cardinalidades y reglas; el anexo 16 muestra las 24 tablas por dominio. |
| Prácticas, pruebas y calidad | 4–5 | Qué cambió en E4: auditorías de SonarQube (25 → 0) y Trivy (10 → 0), sus correcciones y los gates separados de #257. El gate D de #329 sigue visible. Captura real de Lighthouse y métricas de navegación autenticada. |
| Plan, decisiones y pendientes | 6 | Línea base E3, alcance entregado, ampliaciones fuera del compromiso y exclusiones decididas. No queda pendiente del compromiso funcional. |
| Análisis del proceso | 7–8 | Lo que hicimos bien y dos aciertos; dos decisiones que no repetiríamos y dos errores, cada una con su efecto y qué haríamos distinto. Contexto en [#207](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/207). |
| Demo en vivo | 9 | Cambiar al navegador. El [guion](guion.md) distribuye acciones y tiempos entre UC y UTFSM. |
| Evidencia y procesos corregidos | 10–16 | Capturas Sonar, Trivy y producto; diagramas de intentos/publicación, acceso/roles y tareas/entregas; modelo de datos completo. [Feedback del semestre](../cierre/feedback.md). |

## Compilación

Desde esta carpeta, ejecutar `latexmk -pdf -halt-on-error main.tex` y luego `latexmk -c main.tex`. Usa pdfLaTeX, Beamer y TikZ. Las nueve láminas principales acompañan la exposición; los siete anexos quedan disponibles para preguntas. Los reportes y las fuentes de las láminas están en el [índice de evidencias](../cierre/README.md). El envío al curso y la evaluación individual corresponden al equipo.
