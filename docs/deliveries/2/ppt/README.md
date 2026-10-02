# Presentación de Entrega 2 — AcademiX

**15 slides principales + 50 anexos**. Contenido oral estimado: **12 min 50 s**; con transiciones, **13 min 20 s**. Los anexos se usan durante preguntas.

- Principal: [`main.tex`](main.tex).
- PDF final: [`main.pdf`](main.pdf).
- Punteo de las 15 slides: [`presentation-speaker-notes.md`](presentation-speaker-notes.md).
- Assets: [`images/`](images/), con capturas originales, diagramas TikZ editables y fuentes Mermaid.
- Fuentes, evidencia y límites: [`sources-and-evidence.md`](sources-and-evidence.md).

## Compilación

Se conserva **pdfLaTeX**, el compilador indicado en Entrega 1. Desde esta carpeta:

```bash
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

También se puede subir `main.tex` e `images/` a Overleaf y seleccionar **pdfLaTeX**. No requiere shell-escape, Mermaid CLI ni paquetes nuevos respecto del preámbulo de Entrega 1.

El PDF se guarda en esta carpeta. `.gitignore` excluye los temporales de LaTeX. Para limpiar solo temporales:

```bash
latexmk -c main.tex
```

## Template y estructura

Copia del preámbulo de `docs/deliveries/1/ppt/main.tex`: Beamer Boadilla, 16:9, 10 pt, fuentes por defecto de Beamer, paleta navy/amber, encabezado, footer de página/total, comandos `\st` y `Y`, tablas `tabularx/booktabs` y lenguaje TikZ. Se conserva la estructura `ppt/main.tex`, `ppt/main.pdf`, `ppt/images/`. Los diagramas editables viven junto a las imágenes y se incorporan con `\input`.

La numeración mantiene el aspecto de Entrega 1 y cuenta todas las páginas (65), incluidos los anexos. `\appendix` separa explícitamente las 15 slides principales. La portada mantiene **Equipo Lock In**: la fuente no proporciona nombres individuales ni logos, profesor o ayudante. La fecha se identifica como preparación de versión, no como fecha de exposición.

## Uso y navegación de anexos

| Páginas PDF | Contenido |
| --- | --- |
| 1–15 | Exposición principal |
| 16 | Inicio de anexos |
| 17–18 | Matriz completa de actores y casos |
| 19–34 | Fichas resumidas CU-01 a CU-16: actor, meta, flujo y alternativas |
| 35–39 | RF1 a RF29 completos |
| 40–41 | RNF1 a RNF10 completos |
| 42–43 | Request autorizado y responsabilidades de backend |
| 44–46 | UML completo por áreas |
| 47–50 | ERD completo por áreas y claves transversales |
| 51–52 | Estados de intentos, escala y promedio |
| 53–54 | Plan completo de 10 iteraciones |
| 55–57 | Lista completa de 12 riesgos |
| 58–64 | Evidencia original CI, Railway y release |
| 65 | OpenAPI y alcance implementado |

Las fichas completas con triggers, pre/postcondiciones y flujos alternativos están en [`../03-use-cases-and-requirements.md`](../03-use-cases-and-requirements.md). El modelo de datos continúa siendo lógico: la presentación no afirma que existan ORM, migraciones, JWT ni aislamiento ejecutable.
