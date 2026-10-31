# Entrega 3 — Diapositivas de dvillas28

Diapositivas de gestión, tablero y CI/CD de Daniel Villaseñor para la Entrega 3.
Se iteran aquí mientras avanza cada compromiso y **se enlazarán más adelante en el
documento consolidado de la presentación de E3**, que reunirá las diapositivas de todo el equipo.
Hasta entonces, este directorio es el borrador de trabajo; la versión final será la del consolidado.

Estilo: el mismo de [Entrega 2](../../../2/ppt/main.tex) (Beamer, Boadilla, 16:9, paleta AcademiX).

## Contenido

| Directorio | Diapositivas | Ítems del [checklist](../../checklist-entrega-3.md) |
| --- | --- | --- |
| [`01-tablero`](01-tablero/preview.pdf) | Tablero conciliado; por qué no reflejaba el avance; Done y cambio de estado | E3-12, E3-13, E3-33 |
| [`02-metricas`](02-metricas/preview.pdf) | Burnup en horas, CFD, lead y cycle time, falta de `Real (h)` | E3-24, E3-02 |
| [`03-render`](03-render/preview.pdf) | Decisión Railway → Render; trabajo no planificado y bug #177 | E3-08, E3-10, E3-29, E3-30 |
| [`04-practicas-abandonadas`](04-practicas-abandonadas/preview.pdf) | Semgrep, drafts, `Real (h)`, Railway y PITR | E3-07 |
| [`05-completo-pendiente`](05-completo-pendiente/preview.pdf) | 357 h hechas; 111 h pendientes por categoría | E3-33, E3-34 |

Faltan la proyección y el plan hacia el MVP (E3-25 a E3-28, E3-32): se agregan como
nuevos subdirectorios cuando esté listo el plan actualizado.

Cada subdirectorio contiene:

- `frames.tex`: solo los `\begin{frame}…\end{frame}`, sin preámbulo. Es lo que se
  enlaza en el consolidado.
- `preview.tex`: envoltorio generado por `build.sh` (preámbulo + `frames.tex`).
- `preview.pdf` y `preview-N.png`: vista previa de cada diapositiva.

## Fuentes de los datos

Corte: 30/10/2026, tras la conciliación del tablero.

- [Conciliación del tablero](../../conciliacion-tablero-e3.md): antes y después, drafts y bloques A–F.
- Snapshots diarios de la rama `metrics` procesados con
  [`board-metrics.mjs`](../../../../../scripts/board-metrics.mjs) `--csv`; los datos de
  los gráficos están escritos dentro de `02-metricas/frames.tex`.
- [ADR de Render](../../../../adr/deploy-on-render.md) e issues #175–#178.

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
3. Las diapositivas no usan imágenes externas (todo es TikZ/pgfplots), así que no hay
   rutas que ajustar.
