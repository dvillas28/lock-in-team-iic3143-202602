---
id: mockups-design-tokens-light-first
date: 2026-09-02
scope: project
tags: [mockups, design-system, tokens, dark-mode, ui]
source: user-correction
confidence: 0.7
related: []
---

# La dirección visual del producto es light-first académico y los colores viven solo en tokens.css

## Context
Rediseño de los mockups HTML del LMS (`mockups/`). La primera versión era dark-first indigo/dorado con colores hardcodeados en cada archivo, lo que rompía el light mode.

## Mistake
Cada vista duplicaba su CSS y hardcodeaba hex/rgba (headers, gradientes, chips), así que el toggle de tema dejaba superficies oscuras en modo claro. Además se asumió que refinar la identidad dark existente era la dirección deseada.

## Lesson
- Dirección elegida por el equipo: **minimal académico light-first** — navy `#1E3A5F` + ámbar `#A16207`, EB Garamond (títulos) + Inter (UI), fondo claro por defecto y dark opcional.
- Todo color debe referirse a variables de `mockups/assets/tokens.css` (light en `:root`, dark en `[data-theme="dark"]`). Excepciones deliberadas: panel de marca del login y la "hoja de papel" del lector PDF, que son superficies fijas en ambos temas.
- Componentes compartidos (sidebar, chips, tabla, botones, forms) viven en `mockups/assets/app.css`; las páginas solo llevan CSS de layout propio.
- El toggle de tema (`assets/app.js`) acepta override por URL `?theme=dark|light` — útil para capturas headless (`google-chrome --headless=new --screenshot`) donde no hay localStorage precargado.

## When to Apply
Al crear o editar cualquier vista en `mockups/`, al diseñar la UI real del LMS, o al verificar visualmente con screenshots headless en ambos temas.
