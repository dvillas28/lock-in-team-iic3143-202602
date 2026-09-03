# Mockups de interfaz — AcademiX

Wireframes de alta fidelidad del LMS multi-tenant, en HTML estático, para validar el flujo académico antes de implementar. Cubren los roles público, estudiante y docente, y cada vista declara las historias de usuario que valida. La puerta de entrada es `index.html`.

No hay backend: los datos son de ejemplo y las interacciones (tabs, selección, modal, toggle de tema) existen solo para demostrar el flujo.

## Cómo verlos: servidor local o archivo directo

```bash
# Opción recomendada (desde la raíz del repo)
python3 -m http.server 8899 -d mockups
# → http://localhost:8899/index.html

# Opción directa, sin servidor
xdg-open mockups/index.html
```

Requieren internet: Tailwind CDN, Google Fonts (EB Garamond + Inter) e íconos Lucide.

El toggle claro/oscuro está arriba a la derecha de cada vista y persiste entre páginas (`localStorage`). Para forzar un tema por URL —útil en demos y capturas headless— agrega `?theme=dark` o `?theme=light`.

## Vistas y historias de usuario que cubren

| # | Vista | Rol | US | Qué valida |
|---|---|---|---|---|
| — | `index.html` | — | — | Galería de vistas agrupada por rol. |
| 01 | `01-landing.html` | Público | — | Propuesta de valor y flujo académico completo. |
| 02 | `02-login.html` | Público | — | Acceso institucional con branding del tenant y activación por token. |
| 03 | `03-dashboard.html` | Estudiante | US1–US3, US24, US25 | Cursos con sección, próximas evaluaciones ordenadas, estado vacío de actividad, anuncios y mini-calendario. |
| 04 | `04-course-modules.html` | Estudiante | US9–US12, US30 | Módulos publicados/ocultos, material con título/tipo/fecha/estado y equipo docente con roles. |
| 05 | `05-evaluations.html` | Estudiante | US13–US16, US21, US22 | Ciclo completo de estados de entrega, envío con evidencia, comentarios publicados y recorrección. |
| 06 | `06-grades.html` | Estudiante | US17–US20 | Libro de notas, promedio parcial con advertencia y comentario del corrector. |
| 07 | `07-teacher-dashboard.html` | Docente | US4, US15, US21 | Entregas por corregir por curso y corrección con nota + comentario sin publicación automática. |
| 08 | `08-teacher-gradebook.html` | Docente | US17, US18 | Ponderaciones con validación de suma 100% y liberación manual de notas con confirmación. |
| 09 | `09-pdf-reader.html` | Estudiante | US26–US29 | Lector de PDF en plataforma y asistente IA con citas por página, explicación de selección y caso "sin evidencia". |

Los criterios de aceptación de cada US están en [docs/deliveries/0/user-stories.md](../docs/deliveries/0/user-stories.md).

## Cómo está armado el diseño

La dirección es **minimal académico light-first**: estilo Swiss/minimal con navy institucional como color primario, ámbar reservado para notas y highlights, fondo claro por defecto y tema oscuro opcional. Se eligió por sobre una estética dark decorativa porque el producto es una herramienta de gestión académica: la jerarquía la dan el espaciado y la tipografía, no el color.

La estructura separa tokens, componentes y layout:

- `assets/tokens.css` — única fuente de colores y métricas. Tema claro en `:root`, oscuro en `[data-theme="dark"]`. Ninguna vista hardcodea colores; las dos excepciones deliberadas son el panel de marca del login y la "hoja de papel" del lector PDF, superficies fijas en ambos temas.
- `assets/app.css` — componentes compartidos del shell: sidebar, header, cards, chips, tabla, botones, formularios, tabs y modal. Cada página solo agrega el CSS de su layout.
- `assets/app.js` — tema persistente con override `?theme=` e inicialización de íconos.

Decisiones de detalle que sostienen la dirección:

- **Tipografía**: EB Garamond para títulos (voz académica) e Inter para UI, con cifras tabulares (`tabular-nums`) en notas y tablas para que los números no bailen.
- **Estados**: un solo sistema de chips (dot + label) con semántica de color consistente en todas las vistas — pendiente, atrasada, en corrección, publicada.
- **Accesibilidad**: contraste ≥ 4.5:1 en ambos temas, `:focus-visible` para teclado, `aria-label` en botones de ícono, `prefers-reduced-motion` respetado y cero emojis como íconos (solo SVG de Lucide).

Esto implica que un cambio de paleta o de tema se hace tocando solo `tokens.css`, y que cualquier vista nueva debe construirse sobre `app.css` en vez de duplicar estilos.
