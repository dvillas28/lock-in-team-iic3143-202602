# Base visual del frontend de AcademiX

La referencia visual es `DESIGN.md` y `mockups/assets/`.

## Estilos y tema

El layout raíz (`frontend/src/app/layout.tsx`) importa una sola vez
`frontend/src/styles/tokens.css` y después `app.css`.

Los archivos reutilizan los tokens y componentes de los mockups. Viven dentro de
`frontend/` para incluirse en su contexto Docker; los cambios del diseño deben
sincronizarse con estas copias. Las únicas adaptaciones son las variables de
fuentes de Next.js y el nombre `--modal-backdrop`, conservado como alias de
`--overlay` para mantener la integración de Issue #24 sin duplicar el color.
La copia incluye los tokens de contraste y papel PDF, los layouts adaptables,
diálogos y controles de publicación por módulo e ítem.

Al sincronizar `app.css`, adaptar **todas** las declaraciones de Inter y
EB Garamond a `var(--font-inter)` y `var(--font-eb-garamond)`, incluidos los
nuevos encabezados, paneles y métricas. Los imports del layout raíz y la carga
de fuentes siguen siendo los definidos en Issue #24.

El frontend usa estos estilos con componentes React e iconos de `lucide-react`;
no se incorpora Tailwind CDN, Google Fonts por `<link>` ni `mockups/assets/app.js`.
Las interacciones y permisos de los HTML continúan siendo demostraciones.

El modo claro es el predeterminado. El oscuro se activa con `data-theme="dark"`
en `<html>`. Para nuevas vistas, usar tokens y clases de `app.css`, con CSS local
para su layout.

## Fuentes

El layout configura ambas familias con `next/font/google` y `display: "swap"`:

- **Inter** (400–700): interfaz, mediante `--font-inter`.
- **EB Garamond** (500–700, normal e itálica): títulos con `.serif`, mediante
  `--font-eb-garamond`.

Usar `.tnum` para notas y columnas numéricas.

## Iconos

Importar directamente desde `lucide-react`:

```tsx
import { Search } from "lucide-react";

<button className="icon-btn" aria-label="Buscar">
  <Search size={16} aria-hidden="true" />
</button>
```

Usar tamaños de 14, 16 o 20 px según los mockups; los controles de módulos
y publicación usan 18 px. Para ese estado usar `CircleCheck` (publicado) y
`Circle` (sin publicar), con las clases `.publish-toggle` y `.is-published`. Los controles de solo icono
requieren `aria-label`; los iconos decorativos llevan `aria-hidden="true"`.
