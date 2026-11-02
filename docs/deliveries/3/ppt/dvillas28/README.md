# Entrega 3 — Diapositivas de dvillas28

Diapositivas de gestión, tablero y CI/CD de Daniel Villaseñor para la Entrega 3.
Se iteran aquí mientras avanza cada compromiso y **se enlazan en el
[documento consolidado de la presentación de E3](../main.tex)**, que reúne las diapositivas de todo el equipo.
Este directorio es el borrador de trabajo; la versión final es la del consolidado.

Estilo: el mismo de [Entrega 2](../../../2/ppt/main.tex) (Beamer, Boadilla, 16:9, paleta AcademiX).

## Contenido

| Directorio | Diapositivas | Ítems del [checklist](../../checklist-entrega-3.md) |
| --- | --- | --- |
| [`01-tablero`](01-tablero/preview.pdf) | Cómo se mueve una tarjeta: estados, reglas de cambio y snapshot diario | E3-12, E3-13 |
| [`02-metricas`](02-metricas/preview.pdf) | Burnup en horas, CFD, lead y cycle time, estimado vs. real | E3-24, E3-02 |
| [`03-render`](03-render/preview.pdf) | Decisión Railway → Render | E3-08, E3-29, E3-30 |
| [`04-practicas-abandonadas`](04-practicas-abandonadas/preview.pdf) | Semgrep, drafts, `Real (h)`, Railway y PITR | E3-07 |
| [`05-completo-pendiente`](05-completo-pendiente/preview.pdf) | 386 h hechas; 79 h pendientes por categoría | E3-33, E3-34 |
| [`06-proceso`](06-proceso/preview.pdf) | Ciclo de la tarjeta a producción; PR #86 con sus checks; prácticas y beneficios | E3-04, E3-05, E3-06, E3-11 |
| [`07-cicd`](07-cicd/preview.pdf) | Pipeline; SCA (Trivy), SAST (SonarQube) y bot de revisión con IA; capturas de las auditorías | E3-14, E3-22 |
| [`08-calidad`](08-calidad/preview.pdf) | Estrategia de testing y flujos de usuario probados | E3-17, E3-18, E3-19 |
| [`09-proyeccion`](09-proyeccion/preview.pdf) | ¿Alcanzamos? Proyección del pendiente, supuestos y riesgos | E3-25, E3-26 |
| [`10-plan-mvp`](10-plan-mvp/preview.pdf) | Plan semanas 5–7 con responsables; orden de corte y compromiso E4 | E3-27, E3-28, E3-32 |
| [`11-feedback-e2`](11-feedback-e2/preview.pdf) | Cambios tras el feedback de E2 (PR #160) | E3-31 |

Los bloques ya están incluidos en la [presentación consolidada](../main.tex) ([PDF](../main.pdf)).
`08-calidad` comparte responsable con FierroD (#168).

Cada subdirectorio contiene:

- `frames.tex`: solo los `\begin{frame}…\end{frame}`, sin preámbulo. Es lo que se
  enlaza en el consolidado.
- `preview.tex`: envoltorio generado por `build.sh` (preámbulo + `frames.tex`).
- `preview.pdf` y `preview-N.png`: vista previa de cada diapositiva.

## Fuentes de los datos

Corte: 01/11/2026, snapshot manual de la rama `metrics` tomado tras cargar las horas reales
(incluye la conciliación del 30/10).

- [Conciliación del tablero](../../conciliacion-tablero-e3.md): antes y después, drafts y bloques A–F.
- Snapshots diarios de la rama `metrics` procesados con
  [`board-metrics.mjs`](../../../../../scripts/board-metrics.mjs) `--csv`; los datos de
  los gráficos están escritos dentro de `02-metricas/frames.tex`.
- [ADR de Render](../../../../adr/deploy-on-render.md) e issues #175–#178.
- PR integradas y rulesets de `dev` y `main` (`gh`); ejecuciones de workflows desde el 11/10.
- Auditorías manuales del 01/11: Trivy (run 41338835122) y SonarQube (run 41338849373),
  que también dieron los conteos de tests de backend y frontend.
- E2E: último push a `dev` (run 41338806749) y [catálogo de `docs/testing`](../../../../testing/E2E_TEST_CATALOG.md)
  (248 fichas, corrida completa del 31/10).

Si cambian las cifras del tablero, hay que actualizar los números en los `frames.tex`.
No se recalculan solos.

## Compilar

Requiere pdfLaTeX con `beamer` y `pgfplots`, además de `latexmk` y `pdftoppm` (poppler).

```bash
./build.sh
```

```bash
./build.sh 02-metricas
```

## Enlazar en el consolidado

1. Agregar al preámbulo del `main.tex` de E3 lo que [`preamble.tex`](preamble.tex) suma
   al de E2: `\usepackage{pgfplots}`, `\pgfplotsset{compat=1.18}` y el estilo
   `academix` de los gráficos.
2. Incluir cada bloque donde corresponda en el relato, por ejemplo
   `\input{dvillas28/02-metricas/frames}`.
3. Las capturas viven en [`img/`](img/). El preámbulo de las vistas previas las busca en
   `../img/`; el consolidado declara `\graphicspath{{dvillas28/img/}}`.
