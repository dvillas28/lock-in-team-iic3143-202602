# Skeleton UI: sistema base (PR 1)

[← Índice de la iniciativa](README.md) · Issue #280. Este documento complementa
[DESIGN.md](../../../DESIGN.md) mientras ese archivo no pueda crecer: tiene 230 líneas,
y el control de longitud de la CI rechaza modificar un documento de más de 200.

## Piezas

`frontend/src/components/skeletons.tsx` contiene solo marcado: no usa `"use client"`,
no tiene estado ni hace peticiones, así que también puede usarse desde un `loading.tsx`.

| Pieza | Uso |
| --- | --- |
| `Skeleton` | Barra decorativa con `aria-hidden`. `line` ocupa una línea (`1lh`) del contenedor tipográfico donde se coloca; `block` y `pill` reciben un tamaño explícito. |
| `SkeletonRegion` | Anuncia un único `role="status"` específico (`.sr-only`), oculta los placeholders a las tecnologías de apoyo y aplica el retardo y el pulso. |
| `PageHeaderSkeleton` | Encabezado de página. Si el título ya se conoce, renderiza un `<h1>` real. Se usa **fuera** de `SkeletonRegion`. |
| `CardGridSkeleton` | Reproduce `.course-grid` > `.card.course-card`. Piloto: Mis cursos. |
| `ListSkeleton` | Filas con ícono, dos líneas y un chip (para las PR de Módulos, Quizzes y Tareas). |
| `TableSkeleton` | Usa `.data-table`, así que conserva el padding, los bordes y el alto de fila (para las PR de registros). |

## Reglas de uso

1. Reemplazar solo la rama pendiente (`!data`). Se mantiene el orden error → datos →
   carga, y un refresco con datos nunca muestra un skeleton.
2. Lo estático (títulos conocidos, retorno, controles fijos) se renderiza real, fuera
   de la región.
3. Para que no salte el layout, cada línea va dentro del mismo elemento tipográfico que
   tendrá el texto real (`.section-label`, `.hint`, título de tarjeta). En el piloto, la
   tarjeta placeholder y la real miden lo mismo (363×233 px en escritorio y 343×233 en
   móvil, con las mismas alturas internas).
4. Los placeholders no llevan encabezados, enlaces, botones ni `tabindex`.
5. Texto del estado: "Cargando *qué*…", con `…`.
6. No se usa para acciones: "Guardando…", "Publicando…" y el progreso de subida se
   mantienen como están.

## Decisiones visuales

| Tema | Decisión |
| --- | --- |
| Color | `--skeleton` en `tokens.css`: alias de `--border` en claro (equivale a `--paper-skeleton` del mockup 09) y de `--muted` en oscuro. Sin colores nuevos. `--muted` en claro se descartó por casi invisible sobre `--surface`. |
| Superficie | Las tarjetas son `.card` reales (fondo, borde y sombra estables). Solo pulsan las barras. |
| Geometría | Radios existentes: barra de 4 px (8 px con relleno interno), `--radius-sm` en bloques y 999 px en chips. |
| Movimiento | Pulso de opacidad 1 → 0,6 en 1,8 s `ease-in-out`. Sin shimmer ni desplazamientos. Es un indicador de progreso, no una animación de entrada, así que no contradice §Motion. |
| Antiparpadeo | `--skeleton-delay: 200ms` con `animation-delay` y relleno `both`: la opacidad 0 existe solo durante el retardo, nunca como estado de base. Medido en el navegador: oculto hasta los 180 ms y visible desde los 213 ms, sin fundido. |
| Movimiento reducido | `animation: none` en la región y las barras: el skeleton es visible desde el primer frame, estático, con opacidad 1. La regla global de `app.css` (duración de 0,01 ms) por sí sola produciría destellos con una animación infinita. |
| Temas | Verificado con `data-theme="dark"` (la app todavía no expone un selector de tema). |

## Pendiente para las siguientes PR

- Confirmar el retardo de 200 ms con la latencia real de Render antes de aplicarlo a
  las pestañas del curso (PR 2).
- Llevar estas reglas a DESIGN.md cuando se divida ese archivo.
- Retirar `.gradebook-sr-only`, `.assignment-sr-only` y `.content-sr-only` a favor de
  `.sr-only` en la PR de limpieza final.
