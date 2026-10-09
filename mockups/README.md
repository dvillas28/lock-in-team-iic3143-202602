# Mockups de interfaz — AcademiX

Wireframes exploratorios de alta fidelidad del LMS multi-tenant, en HTML estático. La galería organiza dos experiencias académicas, **Admin** y **No admin**, con acceso público compartido; «público» no es un rol académico. La puerta de entrada es `index.html`.

El [mapeo vigente por rol a CU-01–CU-16 y sus límites](../docs/deliveries/2/03-use-cases-and-requirements.md#revisión-de-mockups-por-rol--issue-22) está en la documentación de Entrega 2. El prototipo separa rol académico y administración del curso; la alineación de los permisos del dominio/API queda como dependencia explícita de implementación.

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

16 pantallas y una galería. Los HTML representan el flujo académico de Entrega 2 y la separación de UI acordada; los
estados y acciones son de demostración y no implementan backend ni permisos.

| Vista | Experiencia / perfil | CU | Qué muestra |
| --- | --- | --- | --- |
| [Landing](01-landing.html) | Público | Acceso previo | Propuesta de valor y acceso global. |
| [Acceso a AcademiX](02-login.html) | Compartido | Acceso previo | Acceso de demostración previo a elegir institución (RF1); sin invitación ni branding por subdominio. |
| [Mis cursos](03-dashboard.html) | No admin · estudiante, ayudante o docente | CU-02, CU-03 | Inicio no admin compartido; docente gestiona su sección y contenido, ayudante consulta y estudiante rinde. |
| [Curso y módulos](04-course-modules.html) | No admin · consulta | CU-03, CU-06 | Solo módulos publicados, lectura markdown y PDF; controles por teclado. |
| [Quizzes](05-evaluations.html) | Estudiante | CU-08, CU-09, CU-12 | Listado de quizzes, inicio/reanudación y acceso a notas publicadas; envío detallado en 14. |
| [Calificaciones](06-grades.html) | Estudiante | CU-12 | Notas propias publicadas, promedio parcial 6.1, ponderación 65 % y estado sin notas. |
| [Administrar mis cursos](07-teacher-dashboard.html) | Admin · docente | CU-02, CU-03 | Inicio admin con gestión académica de todas las secciones del curso. |
| [Libro de notas](08-teacher-gradebook.html) | Docente admin/no admin; ayudante (consulta) | CU-10, CU-11, CU-16 | Admin configura pesos comunes; ambos docentes publican dentro de su alcance. Ayudante solo consulta sección 2. |
| [Lector de documentos](09-pdf-reader.html) | Estudiante | CU-06 | PDF de ejemplo y retorno al módulo, sin IA; archivo condicionado al almacenamiento futuro. |
| [Elegir institución](10-institutions.html) | Usuario autenticado (compartido) | CU-01, CU-02 | Instituciones accesibles, roles disponibles, lista vacía, contexto no disponible y UTFSM sin cursos. |
| [Secciones y roles](11-course-management.html) | Docente admin/no admin | CU-04 | Admin gestiona todas las secciones y crea nuevas; docente no admin asigna/desactiva participantes solo en su sección. |
| [Módulos y material](12-content-editor.html) | Docente admin/no admin | CU-14, CU-05 | Contenido compartido: creación y orden de módulos, edición de ítems y check verde de publicación independiente por fila. |
| [Autoría de quiz](13-quiz-editor.html) | Docente admin/no admin | CU-07 | Ambos docentes crean quizzes y acceden a pauta; no admin dirige el quiz a su sección y admin puede seleccionar todas. |
| [Responder quiz](14-quiz-attempt.html) | Estudiante | CU-08, CU-09, CU-15 | Guardar/reanudar, envío sin nota anticipada, cancelación terminal y máximo; nota publicada o acceso a pauta bloquean rendición. |
| [Auditoría del curso](15-audit.html) | Docente admin/no admin | CU-13 | Auditoría sanitizada: admin consulta todas las secciones; docente no admin consulta la propia. |
| [Revisar intentos](16-attempt-review.html) | Docente admin/no admin; ayudante (consulta) | CU-16, CU-15 | Ambos docentes consultan/cancelan intentos dentro de su alcance; ayudante solo consulta su sección. |

### Dos experiencias, cuatro perfiles de demostración

- **Admin:** [docente con administración](07-teacher-dashboard.html?role=teacher&experience=admin), con gestión académica de todas las secciones del curso.
- **No admin:** [estudiante](03-dashboard.html?role=student&experience=non-admin), [ayudante](03-dashboard.html?role=assistant&experience=non-admin) y [docente sin administración](03-dashboard.html?role=teacher&experience=non-admin) comparten inicio y navegación adaptada al rol. El docente gestiona participantes, quizzes, intentos y publicación de notas de su sección; el ayudante consulta su sección y el estudiante ve sus propios resultados.
- Ambos docentes editan [módulos y material compartido](12-content-editor.html?role=teacher&experience=non-admin). Cada módulo e ítem tiene su propio control: check verde para publicado y círculo para sin publicar. Un ítem solo es visible al estudiante cuando él y su módulo están publicados; ocultar el módulo conserva los estados de sus ítems.
- [Libro de notas](08-teacher-gradebook.html?role=teacher&experience=non-admin) e [intentos](16-attempt-review.html?role=teacher&experience=non-admin) permiten escritura docente dentro de su alcance. El ayudante usa las mismas consultas con `role=assistant&experience=non-admin`, solo sección 2 y sin escritura. La creación de secciones, configuración del curso y ponderaciones comunes quedan para admin.

`role` describe el perfil académico; `experience=admin|non-admin` describe la
experiencia de ejemplo. Carla pertenece a la sección 2; como admin puede gestionar
todas las secciones del curso. La navegación mantiene ambos parámetros entre
páginas. Ayudante y estudiante permanecen no admin aunque la URL solicite admin.
Los enlaces «Escenarios del mockup» cambian el perfil de demostración y no
conceden permisos. Las rutas docentes deniegan acceso a estudiante/ayudante.
Indicar solo `role=teacher` permite gestionar su sección y contenido compartido,
sin activar administración. Los archivos docentes abiertos sin parámetros
representan su perfil admin predeterminado; la galería usa enlaces explícitos.

La [decisión de UI y dependencia de permisos](../docs/adr/ui-admin-non-admin-experiences.md)
aclara que **admin es una capacidad del curso, no un nuevo rol institucional**.
El modelo/API actual todavía asocia administración a `teacher`; este prototipo
no modifica esquemas ni contratos ni implementa autorización. La matriz de
acciones es la propuesta de UI que deberá reconciliarse antes de implementarla.
La galería [index.html](index.html) enlaza todas las vistas y perfiles.

Los enlaces «Escenarios del mockup» presentan estados vacíos, restricciones y
conflictos. Los datos son independientes entre páginas. El intento de 14 guarda
solo respuestas de ejemplo en `sessionStorage` (contexto uc); no ingreses datos reales.
El PDF de 09 es ilustrativo y no contiene un binario descargable.

## Validación de esta revisión

Se comprobaron los 17 HTML: enlaces y anclas locales, IDs únicos, sintaxis del
JavaScript y referencias a tokens. Las 55 verificaciones de lógica en una simulación del DOM
cubren alcance docente por sección, controles independientes de publicación,
creación/edición de contenido y rechazo de acciones de estudiante/ayudante.
Las revisiones anteriores incluyeron navegación con teclado, diálogos,
ambos temas y ancho móvil de 375 px; los últimos ajustes requieren repetir la
comprobación visual en navegador, bloqueada por el límite de uso de herramientas.
El texto verde de publicación supera 4.5:1 sobre sus fondos (mínimos 4.88 en
claro y 7.90 en oscuro). Los pares de texto/fondo de tokens revisados anteriormente
también superan 4.5:1 (mínimos 4.83 claro y 5.03 oscuro). Estas comprobaciones no equivalen a una
auditoría completa de accesibilidad ni a pruebas de autorización de backend.

## Cómo está armado el diseño

La dirección es **minimal académico light-first**: estilo Swiss/minimal con navy institucional como color primario, ámbar reservado para notas y highlights, fondo claro por defecto y tema oscuro opcional. Se eligió por sobre una estética dark decorativa porque el producto es una herramienta de gestión académica: la jerarquía la dan el espaciado y la tipografía, no el color.

La estructura separa tokens, componentes y layout:

- `assets/tokens.css` — única fuente de colores y métricas. Tema claro en `:root`, oscuro en `[data-theme="dark"]`. Ninguna vista hardcodea colores; el papel fijo del lector PDF también usa tokens dedicados, comunes a ambos temas.
- `assets/app.css` — componentes compartidos del shell: sidebar, header, cards, chips, tabla, botones, formularios, tabs y modal. Cada página solo agrega el CSS de su layout.
- `assets/app.js` — tema persistente con override `?theme=`, íconos, avisos/confirmaciones accesibles y experiencias admin/no admin y conservación del perfil académico entre páginas.

Decisiones de detalle que sostienen la dirección:

- **Tipografía**: EB Garamond para títulos (voz académica) e Inter para UI, con cifras tabulares (`tabular-nums`) en notas y tablas para que los números no bailen.
- **Estados**: un solo sistema de chips (dot + label) con semántica de color consistente en todas las vistas — borrador, en progreso, calificado, cancelado y publicado.
- **Accesibilidad**: contraste ≥ 4.5:1 en ambos temas, `:focus-visible` para teclado, `aria-label` en botones de ícono, `prefers-reduced-motion` respetado y cero emojis como íconos (solo SVG de Lucide).

Esto implica que un cambio de paleta o de tema se hace tocando solo `tokens.css`, y que cualquier vista nueva debe construirse sobre `app.css` en vez de duplicar estilos.
