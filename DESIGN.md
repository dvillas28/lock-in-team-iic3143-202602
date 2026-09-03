# AcademiX — Style Reference

> biblioteca universitaria al mediodía: papel claro, tinta navy y un subrayado ámbar

**Theme:** light-first, dark opcional

**Fuente de verdad:** `mockups/assets/tokens.css` (colores y métricas), `mockups/assets/app.css` (componentes), `mockups/assets/app.js` (mecánica de tema). Este documento describe exactamente lo implementado en las 10 vistas de `mockups/`; si difiere del código, manda el código y este archivo debe actualizarse.

AcademiX se lee como una herramienta académica seria y calmada. El lienzo es un gris azulado casi blanco (`#F8FAFC`) con tarjetas blancas separadas por bordes hairline — la jerarquía la construyen el espaciado y la tipografía, no el color. EB Garamond da voz académica solo a los títulos; Inter hace todo el trabajo de interfaz con cifras tabulares en notas y tablas. El navy institucional (`#1E3A5F`) es el único color de acción; el ámbar (`#A16207`) queda reservado para calificaciones y highlights. El tema oscuro no invierte: usa tokens dedicados desaturados. La firma visual es la cifra de nota en serif con `tabular-nums` sobre un panel ámbar suave.

## Tokens — Colores

Todos los colores de las vistas referencian estas variables. Tema claro en `:root`, oscuro en `[data-theme="dark"]`.

| Rol | Light | Dark | Token |
| --- | --- | --- | --- |
| Primario (fills: botones, avatar sólido, día actual) | `#1E3A5F` | `#35598C` | `--primary` |
| Primario hover | `#24466F` | `#3F669C` | `--primary-hover` |
| Primario tinta (texto, links, íconos, estados activos) | `#1E3A5F` | `#9DB8DA` | `--primary-ink` |
| Primario suave (fondos activos, focus ring) | `rgba(30,58,95,0.08)` | `rgba(125,162,204,0.13)` | `--primary-soft` |
| Texto sobre primario | `#FFFFFF` | `#FFFFFF` | `--on-primary` |
| Acento ámbar (solo notas y highlights) | `#A16207` | `#D4A843` | `--accent` |
| Acento suave | `rgba(161,98,7,0.10)` | `rgba(212,168,67,0.12)` | `--accent-soft` |
| Lienzo de página | `#F8FAFC` | `#0B1220` | `--bg` |
| Superficie (cards, paneles) | `#FFFFFF` | `#111A2E` | `--surface` |
| Sidebar | `#FFFFFF` | `#0E1626` | `--sidebar-bg` |
| Header (translúcido + blur 10px) | `rgba(248,250,252,0.88)` | `rgba(11,18,32,0.88)` | `--header-bg` |
| Atenuado (chips neutros, tiles, search) | `#EEF2F7` | `#1A2540` | `--muted` |
| Hover de filas e ítems | `rgba(15,23,42,0.04)` | `rgba(255,255,255,0.05)` | `--hover` |
| Borde hairline | `#E2E8F0` | `rgba(255,255,255,0.08)` | `--border` |
| Borde fuerte (inputs, botones ghost) | `#CBD5E1` | `rgba(255,255,255,0.16)` | `--border-strong` |
| Texto principal | `#0F172A` | `#EDF2F9` | `--text-1` |
| Texto secundario | `#475569` | `#A9B8CC` | `--text-2` |
| Texto terciario (metadatos) | `#64748B` | `#8496AE` | `--text-3` |
| Éxito | `#047857` / soft `rgba(4,120,87,0.09)` | `#34D399` / soft `rgba(52,211,153,0.12)` | `--success`, `--success-soft` |
| Advertencia | `#B45309` / soft `rgba(180,83,9,0.10)` | `#FBBF24` / soft `rgba(251,191,36,0.12)` | `--warning`, `--warning-soft` |
| Peligro | `#DC2626` / soft `rgba(220,38,38,0.08)` | `#F87171` / soft `rgba(248,113,113,0.12)` | `--danger`, `--danger-soft` |

### Excepciones deliberadas (superficies fijas en ambos temas)

- **Panel de marca del login** (`02-login.html`): gradiente navy `linear-gradient(155deg, #16293F 0%, #1E3A5F 60%, #24466F 100%)`, texto `#F1F5F9` con alphas `0.72`/`0.5`, pill del tenant en `#E8D5A8`. Es superficie institucional, idéntica en claro y oscuro. Única excepción a la regla "sin gradientes".
- **Hoja de papel del lector PDF** (`09-pdf-reader.html`): papel `#FFFFFF` con tinta `#1F2937`, título `#111827`, metadatos `#9CA3AF`, skeletons `#E5E7EB`/`#D1D5DB`, bloque de código `#F3F4F6`, highlight de selección `rgba(161,98,7,0.22)`, sombra `0 2px 16px rgba(15,23,42,0.18)`. El papel no cambia con el tema.

## Tokens — Tipografía

**Familias:** EB Garamond (títulos, pesos 500–700) + Inter (interfaz, pesos 400–700). Carga vía Google Fonts con `display=swap`. Clase `.serif` aplica EB Garamond; el resto hereda Inter del `body`.

**Cifras:** clase `.tnum` (`font-variant-numeric: tabular-nums`) obligatoria en notas, ponderaciones, puntajes y columnas numéricas.

| Rol | Tamaño | Familia / peso | Uso implementado |
| --- | ---: | --- | --- |
| ui-xs | 12px | Inter 400–600 | chips, labels, breadcrumb, metadatos, th de tablas, `.section-label` (uppercase, tracking 0.06em) |
| ui-sm | 13px | Inter 500–600 | nav items, botones, celdas de tabla, tabs |
| ui-base | 14px | Inter 400 | body, inputs, prosa de cards |
| title-sm | 17–18px | Garamond 600 | nombre de curso en panel, títulos de card y de tabla |
| title | 20–21px | Garamond 600 | encabezados de panel de detalle |
| view-title | 26–30px | Garamond 600 | h1 de cada vista (saludo, "Evaluaciones", "Libro de notas") |
| section-display | 32–36px | Garamond 600 | h2 de landing, título de índice (44px) |
| display | clamp(40px, 6vw, 68px) | Garamond 600, tracking −0.01em | hero de landing, con `em` itálica en ámbar |
| grade | 19–20px | Garamond 600 + tnum | notas en tablas y listas |
| grade-lg / stat | 32–46px | Garamond 600–700 + tnum | nota destacada (46px), stats docente (32px) |
| avg | 64px | Garamond 700 + tnum | promedio del curso |

**Line-height:** 1.5 en body; 1.12–1.3 en títulos serif. **Mínimo absoluto: 12px** — nada de texto más chico.

## Tokens — Espaciado y formas

**Unidad base:** grilla 4/8. Gaps usados: 8, 10, 12, 16, 20, 24, 28, 32. Padding de contenido: 28–32px; padding de cards: 16–26px.

### Radios

| Elemento | Valor | Token |
| --- | ---: | --- |
| Botones, inputs, nav items, tiles | 8px | `--radius-sm` |
| Tab groups | 10px | `--radius-md` |
| Cards, paneles, modal, zonas dashed | 12px | `--radius-lg` |
| Chips, pills, dots, avatar | 999px | — |
| Hoja PDF | 4px | — (excepción papel) |

### Sombras

| Nombre | Light | Dark | Uso |
| --- | --- | --- | --- |
| card | `0 1px 2px rgba(15,23,42,0.05)` | `none` | cards en reposo, tab activa |
| lift | `0 4px 12px rgba(15,23,42,0.07)` | `0 4px 12px rgba(0,0,0,0.35)` | hover de `card-hover` |
| float | `0 8px 24px rgba(15,23,42,0.12)` | `0 8px 24px rgba(0,0,0,0.45)` | modal |

### Layout (medidas implementadas)

- **Sidebar:** 248px (`--sidebar-w`); **header:** 56px (`--header-h`) translúcido con `backdrop-filter: blur(10px)`.
- **Paneles secundarios:** módulos 264px, detalle de evaluación 400px, asistente IA 360px, rail derecho del dashboard 300px.
- **Login:** panel de marca 44% del ancho.
- **Landing/índice:** contenido centrado `max-w-5xl`/`max-w-6xl` (1024–1152px).
- **App shell:** `.app` flex a `100vh`, scroll solo en `.content` y paneles.

## Componentes (clases de `app.css`)

### Botones

- **`.btn.btn-primary`** — fondo `--primary`, texto `--on-primary`, 13px/600, radio 8px, padding 9px 16px; hover: `--primary-hover` + `translateY(-1px)`. **Uno por vista.**
- **`.btn.btn-ghost`** — superficie con borde `--border-strong`, texto `--text-2`; hover: texto `--text-1`, borde `--text-3`.
- **`.btn.btn-danger`** — `--danger-soft` + texto `--danger`. Solo acciones destructivas.
- **`.icon-btn`** — 34×34px, borde hairline, radio 8px; **siempre con `aria-label`**; `.notif-dot` 7px para badge de notificación.

### Chips de estado

`.chip` base: `--muted` + `--text-2`, 12px/500, padding 2px 9px, radio 999. Variantes semánticas: `.chip-primary`, `.chip-accent` (publicada/nota), `.chip-success`, `.chip-warning`, `.chip-danger`. Patrón dot+label con `.status-dot` (7px) cuando acompaña listas. **Máximo 2 chips por card.**

### Navegación

- **`.nav-item`** — 13px/500, radio 8px; hover `--hover`; activo `.active`: fondo `--primary-soft`, texto `--primary-ink`, peso 600, más `aria-current="page"`. Contador `.nav-count` neutro.
- **`.tenant-badge`** — pill del tenant con `.tenant-dot` verde (aislamiento multi-tenant visible siempre).
- **`.breadcrumb`** — 12px, jerarquía por color (`--text-3` → `--text-1` en el activo).
- **`.tab-group` + `.tab-btn`** — control segmentado: fondo `--muted`, activa = `--surface` + sombra card + peso 600.

### Superficies y datos

- **`.card`** — `--surface` + borde hairline + sombra card, radio 12px. **`.card-hover`** agrega borde `--border-strong` + sombra lift + `translateY(-1px)`.
- **`.data-table`** — th 12px uppercase `--text-3`, td 13px, separadores hairline, `.row-hover` con `--hover`; sub-fila de comentario en `--muted`.
- **`.avatar`** — 32px círculo, `--primary-soft` + `--primary-ink` (sólido navy solo en logo).
- **`.empty-zone` / `.upload-zone`** — dashed `--border-strong`, radio 12px; upload hover → borde `--primary-ink`.
- **`.modal-backdrop`** — `rgba(15,23,42,0.45)`; `.modal` 440px máx, radio 12px, sombra float. Cierre por botón, click en backdrop y tecla Escape.

### Formularios

`.field` — 14px, borde `--border-strong`, radio 8px; focus: borde `--primary-ink` + ring `0 0 0 3px var(--primary-soft)`. `.field-label` 12px/500. Inputs con `type` y `autocomplete` correctos; toggle mostrar/ocultar contraseña con `aria-label` dinámico. Placeholders nunca reemplazan labels.

## Motion

- **Transiciones:** 150ms ease (color, fondo, borde) y 200ms ease (borde/sombra de cards). Sin animaciones de entrada ni scroll-reveal.
- **Hover físico:** `translateY(-1px)` en botones y cards — único desplazamiento permitido.
- **`prefers-reduced-motion: reduce`:** colapsa toda transición/animación a 0.01ms (regla global en `app.css`).

## Iconografía

Lucide (CDN `unpkg`, `data-lucide` + `lucide.createIcons()`), stroke por defecto. Tamaños: 14px (`w-3.5`) en chips y botones compactos, 16px (`w-4`) estándar, 20px (`w-5`) en file-icons e icon-boxes. **Cero emojis como íconos.** Íconos decorativos van junto a texto visible; controles de solo ícono llevan `aria-label`.

## Mecánica de temas

- Atributo `data-theme` en `<html>`; sin atributo = claro, `data-theme="dark"` = oscuro.
- `app.js` aplica el tema **antes del primer paint** (script síncrono en `<head>`), persiste en `localStorage` (`lms-theme`) y acepta override por URL `?theme=dark|light` (persiste el valor) — útil en demos y capturas headless.
- Toggle: `.only-light` muestra luna en claro, `.only-dark` muestra sol en oscuro; botón con `aria-label="Cambiar tema"`.

## Superficies

| Nivel | Nombre | Light | Dark | Propósito |
| ---: | --- | --- | --- | --- |
| 0 | Lienzo | `#F8FAFC` | `#0B1220` | fondo de página y `.content` |
| 1 | Sidebar | `#FFFFFF` | `#0E1626` | navegación y paneles laterales |
| 1 | Superficie | `#FFFFFF` | `#111A2E` | cards, tablas, modal |
| 2 | Atenuado | `#EEF2F7` | `#1A2540` | chips neutros, tiles, search, tab-group |
| — | Header | translúcido 0.88 + blur | translúcido 0.88 + blur | barra superior sticky |
| — | Fijas | panel login navy · papel PDF blanco | idénticas | marca institucional y documento |

## Do's y Don'ts

### Do

- Referencia todo color a `var(--token)` de `tokens.css`; un cambio de paleta debe ser un cambio de un archivo.
- Reserva el navy de fill (`--primary`) para **una** acción primaria por vista; el resto va en ghost.
- Usa `--accent` ámbar solo para notas, promedios y highlights académicos.
- Aplica `.tnum` a toda cifra comparable (notas, ponderaciones, puntajes, fechas en columnas).
- Serif solo desde 17px hacia arriba; interfaz siempre en Inter.
- Máximo 2 chips por card; estados con dot+label y color semántico consistente.
- Mantén contraste ≥ 4.5:1 en ambos temas y texto mínimo de 12px.
- Conserva `:focus-visible` (outline 2px `--primary-ink`, offset 2px) en todo elemento interactivo.

### Don't

- No hardcodees hex/rgba en vistas — las dos únicas excepciones documentadas son el panel de marca del login y el papel del PDF.
- No uses emojis como íconos ni mezcles sets de íconos.
- No agregues gradientes decorativos (única excepción: panel institucional del login).
- No inviertas colores para el tema oscuro: usa los tokens dedicados de `[data-theme="dark"]`.
- No animes entrada de contenido ni uses transiciones sobre 200ms.
- No pongas texto bajo 12px ni deshabilites el ring de foco.
- No dupliques estilos de shell en páginas: sidebar, header, chips, tabla y botones viven en `app.css`.

## Guía rápida para agentes

1. **Vista nueva de la app:** estructura `<div class="app">` + `<aside class="sidebar">` + `<div class="main">` con `.top-header` y `.content`. Importa `tokens.css`, `app.css`, `app.js` (síncrono en head, después de Lucide). Marca el nav item activo con `.active` y `aria-current="page"`.
2. **Card de curso:** `.card.card-hover` con padding 20px — código del curso 12px/600 en `--primary-ink`, chip de estado a la derecha, título en `.serif` 18px, línea "Sección N · Prof. X" en `--text-3`, y actividad próxima tras un separador hairline (o "Sin actividad próxima" en `--text-3` si no hay).
3. **Estado nuevo:** agrega la variante `.chip-*` en `app.css` usando el par `--color`/`--color-soft` de `tokens.css` — nunca un hex inline.

## Marcas de referencia

- **Linear** — estructura monocroma, hairlines y jerarquía por espaciado.
- **Stripe** — tipografía editorial con color funcional contenido.
- **Notion** — calidez de papel y composición documental (inspiración de tono; la paleta de AcademiX es propia).

## Quick Start

Tokens y componentes viven en [`mockups/assets/tokens.css`](./mockups/assets/tokens.css), [`mockups/assets/app.css`](./mockups/assets/app.css) y [`mockups/assets/app.js`](./mockups/assets/app.js). Vistas y mapa vista → historia de usuario en [`mockups/README.md`](./mockups/README.md).
