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
| [Mis cursos](03-dashboard.html) | No admin · estudiante, ayudante o docente | CU-02, CU-03 | Inicio compartido sin administración; avance propio para estudiante y seguimiento por sección para docente/ayudante. |
| [Curso y módulos](04-course-modules.html) | No admin · consulta | CU-03, CU-06 | Solo módulos publicados, lectura markdown y PDF; controles por teclado. |
| [Quizzes](05-evaluations.html) | Estudiante | CU-08, CU-09, CU-12 | Listado de quizzes, inicio/reanudación y acceso a notas publicadas; envío detallado en 14. |
| [Calificaciones](06-grades.html) | Estudiante | CU-12 | Notas propias publicadas, promedio parcial 6.1, ponderación 65 % y estado sin notas. |
| [Administrar mis cursos](07-teacher-dashboard.html) | Admin · docente | CU-02, CU-03 | Inicio admin: preparar participantes, contenido y quizzes del curso. |
| [Libro de notas](08-teacher-gradebook.html) | Admin / No admin · docente o ayudante | CU-10, CU-11, CU-16 | Admin configura/publica; docente no admin y ayudante consultan sus secciones sin escritura. |
| [Lector de documentos](09-pdf-reader.html) | Estudiante | CU-06 | PDF de ejemplo y retorno al módulo, sin IA; archivo condicionado al almacenamiento futuro. |
| [Elegir institución](10-institutions.html) | Usuario autenticado (compartido) | CU-01, CU-02 | Instituciones accesibles, roles disponibles, lista vacía, contexto no disponible y UTFSM sin cursos. |
| [Secciones y roles](11-course-management.html) | Admin · docente | CU-04 | Configuración de curso, creación de sección, asignación/desactivación de roles y rechazo de duplicados. |
| [Módulos y material](12-content-editor.html) | Admin · docente | CU-14, CU-05 | Crear/ordenar/publicar/ocultar módulos; borrador markdown, formatos admitidos y publicación condicionada a módulo visible. |
| [Autoría de quiz](13-quiz-editor.html) | Admin · docente | CU-07 | Preguntas, alternativas únicas, una correcta, puntajes, fechas e intentos; bloqueo de pauta al publicar. |
| [Responder quiz](14-quiz-attempt.html) | Estudiante | CU-08, CU-09, CU-15 | Guardar/reanudar, envío sin nota anticipada, cancelación terminal y máximo; nota publicada o acceso a pauta bloquean rendición. |
| [Auditoría del curso](15-audit.html) | Admin · docente | CU-13 | Eventos sanitizados de solo lectura, filtros por acción/actor/sección/fecha y estados sin coincidencias o permiso. |
| [Revisar intentos](16-attempt-review.html) | Admin / No admin · docente o ayudante | CU-16, CU-15 | Admin cancela intentos explícitamente; docente no admin y ayudante solo consultan sus secciones. |

### Dos experiencias, cuatro perfiles de demostración

- **Admin:** [docente con administración](07-teacher-dashboard.html?role=teacher&experience=admin).
- **No admin:** [estudiante](03-dashboard.html?role=student&experience=non-admin),
  [ayudante](03-dashboard.html?role=assistant&experience=non-admin) y
  [docente sin administración](03-dashboard.html?role=teacher&experience=non-admin)
  comparten inicio y navegación base. El estudiante ve sus quizzes/notas;
  docente y ayudante conservan consultas académicas de sus secciones.
- [Libro de notas](08-teacher-gradebook.html?role=teacher&experience=non-admin)
  e [intentos](16-attempt-review.html?role=teacher&experience=non-admin) reutilizan
  las mismas pantallas sin escritura para el docente no admin. El ayudante usa
  las mismas consultas con `role=assistant&experience=non-admin`, solo sección 2.

`role` describe el perfil académico; `experience=admin|non-admin` describe la
experiencia de ejemplo. Carla conserva identidad y secciones al cambiar de
administración. La navegación mantiene ambos parámetros entre páginas. Ayudante
y estudiante permanecen no admin aunque la URL solicite admin. Los enlaces
«Escenarios del mockup» cambian explícitamente el perfil de demostración; no son
controles para conceder permisos. El acceso directo a autoría/configuración con
perfil no admin muestra una vista sin acceso. Indicar solo `role=teacher` tampoco
activa administración. Los archivos admin abiertos sin parámetros representan
su perfil admin predeterminado de demostración; la galería usa enlaces explícitos.

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

Se verificaron los 17 HTML: enlaces y anclas locales, IDs únicos, sintaxis del
JavaScript y referencias a tokens. Se probaron publicación de material/quiz/notas,
guardado y cancelación de intentos, filtros de auditoría y consulta del ayudante. La revisión de experiencias agrega docente no admin,
navegación común sin administración, conservación del perfil en material y notas,
rechazo visual de rutas de escritura y perfiles que intentan solicitar admin sin
un rol admitido. Los cambios de perfil también se comprobaron con teclado.
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
- `assets/app.js` — tema persistente con override `?theme=`, íconos, avisos/confirmaciones accesibles y experiencias admin/no admin y conservación del perfil académico entre páginas.

Decisiones de detalle que sostienen la dirección:

- **Tipografía**: EB Garamond para títulos (voz académica) e Inter para UI, con cifras tabulares (`tabular-nums`) en notas y tablas para que los números no bailen.
- **Estados**: un solo sistema de chips (dot + label) con semántica de color consistente en todas las vistas — borrador, en progreso, calificado, cancelado y publicado.
- **Accesibilidad**: contraste ≥ 4.5:1 en ambos temas, `:focus-visible` para teclado, `aria-label` en botones de ícono, `prefers-reduced-motion` respetado y cero emojis como íconos (solo SVG de Lucide).

Esto implica que un cambio de paleta o de tema se hace tocando solo `tokens.css`, y que cualquier vista nueva debe construirse sobre `app.css` en vez de duplicar estilos.
