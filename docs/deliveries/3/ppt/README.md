# Entrega 3 — Presentación

[`main.tex`](main.tex) es la presentación consolidada ([PDF](main.pdf)), con el estilo de
[Entrega 2](../../2/ppt/main.tex). Sigue las dimensiones de la pauta: proceso, calidad,
CI/CD, métricas, plan y demo.

Cada integrante itera sus diapositivas en `<integrante>/NN-tema/frames.tex` y las suma
aquí con `\input`. Hoy están las de [`dvillas28`](dvillas28/README.md).

## Compilar

Requiere pdfLaTeX con `beamer` y `pgfplots`, además de `latexmk`.

```bash
latexmk -pdf main.tex && latexmk -c main.tex
```

## Pendiente

- Guion de demo (#165): el recorrido de la diapositiva «Demo» es una propuesta.
- Ensayo con tiempo (#166) sobre el [guion](guion.md); si se pasa, recortar lo que indica.
- Cobertura actual y óptima, defectos y estabilidad (E3-15, E3-16, E3-20, E3-21) no tienen
  diapositiva.
