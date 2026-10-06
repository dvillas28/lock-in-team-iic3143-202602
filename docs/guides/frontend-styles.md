# Base visual del frontend de AcademiX

La Issue #24 (INST-01) integra el sistema existente de `DESIGN.md` y `mockups/`.
El frontend usa Next.js App Router, React y pnpm 9.15.9. Antes de esta integración
no tenía CSS global, fuentes locales ni una dependencia de iconos.

## Estilos globales

`frontend/src/app/layout.tsx` importa una sola vez, en este orden:

1. `frontend/src/styles/tokens.css`.
2. `frontend/src/styles/app.css`.

Son copias de `mockups/assets/tokens.css` y `mockups/assets/app.css`. Se conservan
los colores claros/oscuros, radios, sombras, métricas, reset, foco de teclado,
movimiento reducido y clases de componentes. No existe un `globals.css` paralelo.
El tema claro es el predeterminado; el oscuro se activa con `data-theme="dark"`
en `<html>`. Esta issue no agrega selector ni persistencia de tema.

Las copias viven dentro de `frontend/` porque su Dockerfile y CI construyen esa
carpeta de forma independiente. No se importa CSS desde fuera del contexto Docker
ni se añade una etapa de generación. Los mockups siguen siendo la referencia:
al cambiar el diseño, actualizar estas copias conservando las adaptaciones siguientes:

- Las declaraciones de Inter y EB Garamond usan las variables de `next/font`.
- El color ya existente del backdrop del modal se traslada a `--modal-backdrop`
  en `tokens.css`; mantiene exactamente el mismo valor en ambos temas.

No se incorpora Tailwind CDN ni `mockups/assets/app.js`: sus utilidades y su
inicialización imperativa de iconos pertenecen a las demostraciones HTML. Las
próximas pantallas deben reutilizar las clases de `app.css` y los tokens, con CSS
local para su layout.

## Fuentes

Los mockups cargan Google Fonts; no hay archivos `.woff`, `.woff2`, `.ttf` ni
`.otf` propios en el repositorio. El layout configura una sola instancia por
familia con `next/font/google`, subset latino y `display: "swap"`:

- Inter: pesos 400, 500, 600 y 700; variable `--font-inter` para body, botones,
  campos y tabs.
- EB Garamond: pesos 500, 600 y 700, normal e itálica; variable
  `--font-eb-garamond` para `.serif`. La landing de referencia usa itálica.

Las clases de variables se aplican a `<html>` para que alcancen toda la aplicación.
Usar `.serif` en títulos y `.tnum` en notas y columnas numéricas. Next.js descarga
las fuentes durante el build y sirve los archivos desde la aplicación; el browser
no necesita cargar Google Fonts. El build requiere acceso a Google Fonts.

Referencia técnica: [fuentes en Next.js](https://nextjs.org/docs/app/getting-started/fonts).

## Iconos

Los mockups usan Lucide vía CDN. En React se usa únicamente `lucide-react`:

```tsx
import { Search } from "lucide-react";

<button className="icon-btn" aria-label="Buscar">
  <Search size={16} aria-hidden="true" />
</button>
```

Usar 14, 16 o 20 px según la referencia; conservar `currentColor` y stroke por
defecto. Los iconos decorativos acompañan texto; los controles de solo icono
necesitan `aria-label`. La página inicial conserva el healthcheck y muestra
`GraduationCap` a 16 px, como el logo de los mockups, para verificar la integración.

Referencia técnica: [Lucide para React](https://lucide.dev/guide/react).

## Validación

Los scripts existentes del frontend son `dev`, `build`, `start` y `lint`.
Ejecutar desde la raíz:

```sh
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend lint
pnpm --dir frontend build
```

El build de Next.js también verifica TypeScript. No hay scripts de tests ni
typecheck independientes en el frontend.

Para esta implementación, la instalación con lockfile congelado, `lint` y `build`
pasaron con pnpm 9.15.9. Los scripts se ejecutaron sobre una copia idéntica de
fuentes, configuración y lockfile en `/tmp/academix-issue24-validation`, con un
almacén pnpm nuevo: algunos archivos de `node_modules` del checkout estaban
marcados como `dataless` por macOS y bloqueaban su lectura. Se comprobó la igualdad
byte a byte de la copia antes de validar. Comandos ejecutados en esa carpeta:

```sh
corepack pnpm@9.15.9 install --frozen-lockfile --store-dir /tmp/academix-issue24-pnpm-store
corepack pnpm@9.15.9 lint
corepack pnpm@9.15.9 build
```

También pasó la comparación de todos los valores de tokens y reglas compartidas
contra los mockups, aplicando únicamente las adaptaciones documentadas. El daemon
Docker local no estaba activo, por lo que el build de imagen corresponde a la CI.

La salida standalone se inició con el script `start` existente (puerto local 3024),
copiando `.next/static` como hace el Dockerfile. La comprobación HTTP confirmó la
respuesta 200, el healthcheck visible, SVG de Lucide, ausencia de enlaces CSS
duplicados, tokens de ambos temas, familias conectadas a las variables, foco,
movimiento reducido, `.tnum` y archivos WOFF2 servidos por Next.js.
