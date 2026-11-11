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

## Transiciones del curso (PR 2)

- `CourseSectionSkeleton` (`components/courses/course-skeleton.tsx`): encabezado con el
  `<h1>` real de la sección, código, periodo y nombre como placeholders, dos pestañas
  como formas (las únicas que recibe todo rol: Módulos y Quizzes) y un área neutra. Sin
  enlaces ni landmark `nav`; las pestañas que dependen del rol llegan con la navegación real.
- `CourseRouteLoading` se usa en `app/courses/loading.tsx` y `app/courses/[courseId]/loading.tsx`.
  Según la ruta, renderiza el mismo skeleton que la página (`/courses` y las pestañas
  Módulos, Quizzes, Tareas, Mis notas, Libro de notas y Auditoría). En detalles, Secciones
  y rutas desconocidas mantiene `LoadingState`, igual que sus páginas.
- `useSkeletonDelay`: el `loading.tsx` y la página son árboles distintos. Al reemplazarse,
  el skeleton entrante continúa el tiempo transcurrido (se mide en `useLayoutEffect`, en
  el commit) en vez de reiniciar el retardo. Medido con la app real y una API simulada:
  el skeleton de ruta es visible a los ~250 ms y el de la página lo reemplaza con un
  retardo de −100 ms, sin parpadeo.
- Los placeholders de `PageHeaderSkeleton` siguen el mismo retardo y pulso
  (`.page-heading .skeleton`), y la región hereda `--skeleton-delay`.
- Límite conocido: en pantallas angostas, los roles con más de dos pestañas hacen crecer
  la fila de navegación al cargar (teléfono, docente: de 43 a 126 px). Se acepta para no
  anticipar permisos.

## Módulos (PR 3)

- `ModulesSkeleton` (`components/content/modules-skeleton.tsx`) reproduce `.module-workspace`:
  índice lateral y módulos colapsados. Con el curso conocido, Módulos mantiene su
  encabezado y pestañas reales y solo la lista es placeholder; sin curso, se usa dentro
  de `CourseSectionSkeleton` (también en la ruta).
- Recursos y «Enlazar cuestionario» usan filas reales (`.module-resource`, `.option`) tras
  `useDelayedFlag(350)`, sin sumar el retardo de la región (`.resource-skeleton`).
- Sobre superficies `--muted` (encabezado de módulo) las barras usan `--border-strong`.

## Quizzes e intentos (PR 4)

- `QuizSkeleton` (`components/quizzes/quiz-skeleton.tsx`) cubre listado, detalle, creación,
  edición, intentos y revisión sobre `CourseSectionSkeleton`. Solo los títulos estáticos
  («Quizzes», «Crear quiz») son `<h1>`; filtros, acciones y barras de guardado llegan con los datos.
- `quizzes/loading.tsx` y la página renderizan la misma composición.
- Los E2E esperan `loaded()` (sin `.skeleton-region` en `main`), no un encabezado.

## Tareas y entregas (PR 5)

- `AssignmentSkeleton` (`components/assignments/assignment-skeleton.tsx`) cubre listado y detalle
  sobre `CourseSectionSkeleton`; `assignments/loading.tsx` renderiza la misma composición.
- El detalle conserva el enlace real «Volver a Tareas» (`lead`), fuera de la región oculta.
- Entregas del docente, del estudiante y la revisión mantienen su título real; debajo, una
  región con la geometría medida (tabla con `caption`, zona de entrega, formulario de nota).
- Barras junto a un título real fuera de `.page-heading` usan `.skeleton-heading`.

## Pendiente para las siguientes PR

- Confirmar el retardo de 200 ms con la latencia real de Render.
- Llevar estas reglas a DESIGN.md cuando se divida ese archivo.

## Lectores y archivos (PR 6)

- `DocumentSkeleton` (`components/content/document-skeleton.tsx`) reproduce el encabezado y la
  hoja de `material-reader` y `academic-file-reader`. El `<article>` y «Volver a módulos» son
  reales y no se vuelven a montar al llegar los datos; la descarga llega con los datos.
- `materials/[materialId]/loading.tsx` y `files/[fileId]/loading.tsx` renderizan lo mismo.
- `PreviewSkeleton`: tarjeta y hoja del PDF, marco 4:3 para imágenes y página de texto. Las
  fases se nombran («Cargando vista previa…», «Preparando la imagen…»).
- PDF: la hoja (`--paper`) queda visible y reserva el ancho ajustado con proporción A4; solo
  el lienzo y la capa de texto esperan. Las líneas usan `--paper-skeleton` y
  `--paper-skeleton-strong`. «Abriendo PDF…» y «Cargando página…» se mantienen.

## Registros académicos y administración (PR 7)

- `RecordRowsSkeleton` (`components/academic/record-skeleton.tsx`): con columnas conocidas,
  el `caption` y el `thead` son reales y anunciados; solo el `tbody` es placeholder
  (`aria-hidden`, `.skeleton-rows`, mismo retardo y pulso). Paginación, filtros y cambio de
  sección no mueven la cabecera. Lo usan participantes, auditoría, invitaciones, miembros y
  el libro de notas (que comparte `BookHead` entre la tabla real y la de carga).
- Sin columnas conocidas (libro antes de `meta`, Mis notas, detalle de sección) se usa una
  tabla neutra dentro de `SkeletonRegion`; `TableSkeleton` admite `caption`.
- `CourseWorkspace` recibe `skeleton`: Libro de notas y Mis notas dibujan el mismo cuerpo en
  la ruta y en la página. Secciones también tiene fallback de ruta (`SectionsSkeleton`), con
  título placeholder porque depende del rol.
- No se dibujan acciones (ponderaciones, publicación, corrección, gestión, invitaciones);
  las ramas `!context.user` conservan `LoadingState` hasta la PR del shell.
- Medido (escritorio): filas, cabecera y anchos de columna del libro idénticos al real;
  Mis notas, auditoría y cuentas con alturas iguales. En móvil difieren solo filas cuyo
  contenido real se ajusta (auditoría, acciones de invitaciones) y la barra del docente.

## Shell, sesión y limpieza final (PR 8)

- `AppShellSkeleton` (`components/institutions/app-shell-skeleton.tsx`) reemplaza el estado
  de `ProtectedInstitution` con sesión iniciada y contexto pendiente. Usa las clases del shell
  real, aria-hidden y sin landmarks, enlaces, nombres, institución ni roles: solo la marca y
  las dos filas que recibe todo miembro. Las superficies aparecen al instante; las barras
  (`.skeleton-shell`) siguen el retardo. Anónimos, slug heredado y host incorrecto no lo usan.
- Las guardas no cambian: `/login?next=`, `InstitutionAccessNotice`, `contextWarning`,
  `fieldset.access-boundary` y el error de contexto (401/403/404/500) quitan el marco.
- `LoadingState` es el fallback neutro: `SkeletonRegion` con «Cargando contenido…», sin
  `<h1>`, controles, borde discontinuo ni `aria-busy`. Lo conservan las rutas sin geometría
  conocida (detalles, slug heredado, redirecciones), la carga de la cuenta e `InstitutionUsers`
  (no anticipa la vista administrativa). Las ramas `!context.user` restantes usan su skeleton.
- `.sr-only` reemplaza a `.gradebook-`, `.assignment-`, `.content-` y `.quiz-sr-only`.
- Medido: escritorio y móvil, el marco coincide con el shell real en barra lateral, insignia,
  filas, encabezado y contenido; solo el pie lateral es más bajo (sin «Cerrar sesión»).
  Sin scroll horizontal, sin parpadeo en respuestas de 150 ms y barras visibles en oscuro.
- Pendiente: el `<h1>` de `ErrorState` se duplica dentro de vistas con título (estados vacíos).
