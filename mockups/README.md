# Mockups de interfaz — AcademiX

Wireframes exploratorios de alta fidelidad del LMS multi-tenant, en HTML estático. La galería agrupa superficies públicas, estudiantiles y docentes; «público» no es un rol académico. La puerta de entrada es `index.html`.

El [mapeo vigente por rol a CU-01–CU-16 y sus límites](../docs/deliveries/2/03-use-cases-and-requirements.md#revisión-de-mockups-por-rol--issue-22) está en la documentación de Entrega 2. Los HTML se ajustan al MVP; el ayudante (`assistant`) comparte las vistas de consulta con alcance de sección y sin controles de escritura.

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

## Vistas y casos de uso vigentes

16 pantallas y una galería. Los HTML corresponden al MVP de Entrega 2; los
estados y acciones son de demostración y no implementan backend ni permisos.

| Vista | Rol | CU | Qué muestra |
| --- | --- | --- | --- |
| [Landing](01-landing.html) | Público | Acceso previo / marketing | Propuesta de valor y acceso global. |
| [Acceso a AcademiX](02-login.html) | Compartido | Acceso previo / marketing | Acceso de demostración previo a elegir institución (RF1); sin invitación ni branding por subdominio. |
| [Mis cursos](03-dashboard.html) | Estudiante | CU-02, CU-03 | Identidad institucional, inscripción, acceso a curso y estado sin cursos. |
| [Curso y módulos](04-course-modules.html) | Estudiante | CU-03, CU-06 | Solo módulos publicados, lectura markdown y PDF; controles por teclado. |
| [Quizzes](05-evaluations.html) | Estudiante | CU-08, CU-09, CU-12 | Listado de quizzes, inicio/reanudación y acceso a notas publicadas; envío detallado en 14. |
| [Calificaciones](06-grades.html) | Estudiante | CU-12 | Notas propias publicadas, promedio parcial 6.1, ponderación 65 % y estado sin notas. |
| [Cursos del equipo docente](07-teacher-dashboard.html) | Docente / ayudante | CU-02, CU-03 | Curso/secciones por rol; ayudante sección 2 sin administración. |
| [Libro de notas docente](08-teacher-gradebook.html) | Docente / ayudante (lectura) | CU-10, CU-11, CU-16 | Pesos al 100 %, filas individuales, selección por evaluación/sección, bloqueo tras publicación; ayudante solo sección 2. |
| [Lector de documentos](09-pdf-reader.html) | Estudiante | CU-06 | PDF de ejemplo y retorno al módulo, sin IA; archivo condicionado al almacenamiento futuro. |
| [Elegir institución](10-institutions.html) | Usuario autenticado (compartido) | CU-01, CU-02 | Instituciones accesibles, roles disponibles, lista vacía, contexto no disponible y UTFSM sin cursos. |
| [Secciones y roles](11-course-management.html) | Docente | CU-04 | Configuración de curso, creación de sección, asignación/desactivación de roles y rechazo de duplicados. |
| [Módulos y material](12-content-editor.html) | Docente | CU-14, CU-05 | Crear/ordenar/publicar/ocultar módulos; borrador markdown, formatos admitidos y publicación condicionada a módulo visible. |
| [Autoría de quiz](13-quiz-editor.html) | Docente | CU-07 | Preguntas, alternativas únicas, una correcta, puntajes, fechas e intentos; bloqueo de pauta al publicar. |
| [Responder quiz](14-quiz-attempt.html) | Estudiante | CU-08, CU-09, CU-15 | Guardar/reanudar, envío sin nota anticipada, cancelación terminal y máximo; nota publicada o acceso a pauta bloquean rendición. |
| [Auditoría del curso](15-audit.html) | Docente | CU-13 | Eventos sanitizados de solo lectura, filtros por acción/actor/sección/fecha y estados sin coincidencias o permiso. |
| [Revisar intentos](16-attempt-review.html) | Docente / ayudante (lectura) | CU-16, CU-15 | Resultados e intentos de sección; cancelación explícita por docente; ayudante no cancela ni accede a autoría. |

Las variantes de ayudante reutilizan [cursos](07-teacher-dashboard.html?role=assistant),
[libro](08-teacher-gradebook.html?role=assistant) e
[intentos](16-attempt-review.html?role=assistant) con identidad y alcance de solo
lectura en sección 2. No acceden a autoría, publicación, edición ni cancelación.
La galería [index.html](index.html) enlaza todas las vistas.

Los enlaces «Escenarios del mockup» presentan estados vacíos, restricciones y
conflictos. Los datos son independientes entre páginas. El intento de 14 guarda
solo respuestas de ejemplo en `sessionStorage` (contexto uc); no ingreses datos reales.
El PDF de 09 es ilustrativo y no contiene un binario descargable.

## Validación de esta revisión

Se verificaron los 17 HTML: enlaces y anclas locales, IDs únicos, sintaxis del
JavaScript y referencias a tokens. Se probaron publicación de material/quiz/notas,
guardado y cancelación de intentos, filtros de auditoría y consulta del ayudante.
La revisión visual incluyó ambos temas y ancho móvil de 375 px; las tablas
conservan desplazamiento horizontal dentro de su contenedor. Los pares de texto
y fondo de tokens comprobados superan 4.5:1 (mínimos 4.83 claro y 5.03 oscuro).
Estas comprobaciones corresponden al prototipo, no a una auditoría completa de
accesibilidad ni a pruebas de autorización de una aplicación implementada.

## Cómo está armado el diseño

La dirección es **minimal académico light-first**: estilo Swiss/minimal con navy institucional como color primario, ámbar reservado para notas y highlights, fondo claro por defecto y tema oscuro opcional. Se eligió por sobre una estética dark decorativa porque el producto es una herramienta de gestión académica: la jerarquía la dan el espaciado y la tipografía, no el color.

La estructura separa tokens, componentes y layout:

- `assets/tokens.css` — única fuente de colores y métricas. Tema claro en `:root`, oscuro en `[data-theme="dark"]`. Ninguna vista hardcodea colores; el papel fijo del lector PDF también usa tokens dedicados, comunes a ambos temas.
- `assets/app.css` — componentes compartidos del shell: sidebar, header, cards, chips, tabla, botones, formularios, tabs y modal. Cada página solo agrega el CSS de su layout.
- `assets/app.js` — tema persistente con override `?theme=`, íconos, avisos/confirmaciones accesibles y variante de consulta del ayudante.

Decisiones de detalle que sostienen la dirección:

- **Tipografía**: EB Garamond para títulos (voz académica) e Inter para UI, con cifras tabulares (`tabular-nums`) en notas y tablas para que los números no bailen.
- **Estados**: un solo sistema de chips (dot + label) con semántica de color consistente en todas las vistas — borrador, en progreso, calificado, cancelado y publicado.
- **Accesibilidad**: contraste ≥ 4.5:1 en ambos temas, `:focus-visible` para teclado, `aria-label` en botones de ícono, `prefers-reduced-motion` respetado y cero emojis como íconos (solo SVG de Lucide).

Esto implica que un cambio de paleta o de tema se hace tocando solo `tokens.css`, y que cualquier vista nueva debe construirse sobre `app.css` en vez de duplicar estilos.
