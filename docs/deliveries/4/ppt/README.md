# Presentación E4

[PDF de exposición](main.pdf) · [Fuente Beamer editable](main.tex) · [Guion de 30 minutos](guion.md) · [Índice de evidencias](../cierre/README.md).

## Lectura por pauta

| Bloque | Láminas | Apoyo para presentar |
| --- | --- | --- |
| Arquitectura y datos | 2–3 | El diagrama de [arquitectura final](../arquitectura.md) muestra los servicios y sus conexiones. El [modelo](../modelo-datos.md) detalla cardinalidades y reglas; el anexo 16 muestra las 24 tablas por dominio, el 17 contiene el [ER completo](modelo-er-completo.pdf) ([fuente Mermaid](modelo-er-completo.mmd)) y los anexos 18–26 muestran las relaciones por dominio. El [modelo vectorial](modelo-datos-final.pdf) incluye además una ficha por tabla con todas las columnas y claves compuestas. |
| Prácticas, pruebas y calidad | 4–5 | Qué cambió en E4: auditorías de SonarQube (25 → 0) y Trivy (10 → 0), sus correcciones y la separación de los controles de calidad. SonarCloud calificó con D la mantenibilidad del código nuevo. Captura real de Lighthouse y métricas de navegación autenticada. |
| Plan, decisiones y pendientes | 6 | Línea base E3, alcance entregado, ampliaciones fuera del compromiso y exclusiones decididas. No queda pendiente del compromiso funcional. |
| Análisis del proceso | 7–8 | Lo que hicimos bien y dos aciertos; dos decisiones que no repetiríamos y dos errores, cada una con su efecto y qué haríamos distinto. Contexto en la [retrospectiva](../cierre/retrospectiva.md). |
| Demo en vivo | 9 | Cambiar al navegador. El [guion](guion.md) distribuye acciones y tiempos entre UC y UTFSM. |
| Evidencia y procesos corregidos | 10–26 | Capturas Sonar, Trivy y producto; diagramas de intentos/publicación, acceso/roles y tareas/entregas; modelo de datos completo. [Feedback del semestre](../cierre/feedback.md). |

## Compilación

Desde esta carpeta, ejecutar `latexmk -pdf -halt-on-error main.tex` y luego `latexmk -c main.tex`. Usa pdfLaTeX, Beamer y TikZ. Las nueve láminas principales acompañan la exposición; los diecisiete anexos quedan disponibles para preguntas. Los reportes y las fuentes de las láminas están en el [índice de evidencias](../cierre/README.md). El envío al curso y la evaluación individual corresponden al equipo.
