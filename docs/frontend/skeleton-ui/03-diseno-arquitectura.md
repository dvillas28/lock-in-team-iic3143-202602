# D. Propuesta de diseño y E. Arquitectura

[← Índice](README.md). Es solo una propuesta: no hay nada implementado.

## D.1 Qué patrón usar en cada caso

| Situación | Patrón | Criterio concreto |
| --- | --- | --- |
| No hay datos y hay que pintar la vista completa (cambio de pestaña o de ruta) | **Skeleton de página** | El layout final ya se conoce. Lo estático (título de la pestaña, enlace de retorno, controles fijos) se renderiza **real**; solo lo que depende de datos va como placeholder. |
| Se espera una colección (cursos, módulos, quizzes, tareas, intentos o filas) | **Skeleton de lista o tabla** | Dentro del contenedor real (`.course-grid`, `.quiz-group`, `<tbody>`). Entre 3 y 6 elementos, o el tamaño de la página si se conoce. |
| Se abre un recurso concreto (material, archivo, quiz o intento) | **Skeleton de detalle o documento** | Se mantienen el retorno y el encabezado. El cuerpo se muestra como hoja o bloques. |
| El usuario guarda, publica, reemplaza o elimina | **Indicador de acción** | Nunca un skeleton. Texto en el botón ("Guardando…"), `aria-busy` en el formulario y progreso en las cargas de archivos. Ya se hace así (L-29). |
| Se refresca algo que ya está visible (foco, reintento o mutación) | **Sin indicador nuevo** | Se conservan los datos y el `aria-busy` actual. No se monta un skeleton (O-4). |
| La consulta terminó bien y no hay elementos | **Estado vacío** | Título y orientación según el contexto, con una acción si el rol puede crear. Sin borde de carga. |
| La consulta falló | **Estado de error** | `ErrorState` con reintento. Tiene prioridad sobre el skeleton. Con datos previos se muestra como aviso. |
| Búsqueda incremental o pasos de una operación | **Texto de estado** | "Buscando participantes…", "Preparando acceso…". Se mantiene así. |

## D.2 Comportamiento esperado

- **Sin salto de layout.** Cada skeleton usa las mismas clases de layout que el
  contenido final (`.page-heading`, `.course-navigation`, `.course-grid`,
  `.module-workspace`, `.data-table`) y alturas equivalentes.
- **Mismo skeleton en la ruta y en el componente.** `loading.tsx` del segmento y la
  rama pendiente del componente renderizan el mismo elemento. La transición RSC y el
  fetching del cliente se perciben como un solo estado (corrige L-03).
- **Sin parpadeo en respuestas rápidas.** El skeleton de página aparece con
  `opacity: 0` y se revela con `animation-delay: 200ms`, solo con CSS y sin timers. El
  espacio queda reservado desde el primer frame. El acordeón de módulos mantiene
  `useDelayedFlag(350)` (D3).
- **Movimiento contenido.** Opcionalmente, un pulso de opacidad (1 → 0,55, 1,6 s,
  `ease-in-out`). Sin shimmer en degradé ni desplazamientos. Con
  `prefers-reduced-motion: reduce` se aplica `animation: none` (no basta la regla
  global, ver C.7). Pendiente D1.
- **Sin duración mínima.** Cuando llegan los datos o el error, el skeleton se desmonta.

## D.3 Convenciones visuales

| Elemento | Valor |
| --- | --- |
| Color base | `var(--skeleton)`, alias de `--muted` (claro `#EEF2F7`, oscuro `#1A2540`). Pendiente D2. |
| Color fuerte (íconos, chips) | `var(--skeleton-strong)`, alias de `--border`. |
| Hoja de documento | `--paper-skeleton` y `--paper-skeleton-strong`, que ya existen y son constantes entre temas (mockup 09). |
| Radios | Línea de texto: `4px`. Bloque: `var(--radius-sm)`. Tarjeta: `var(--radius-lg)`. Pestaña o chip: `999px`. |
| Tipografía simulada | Altura de línea del rol: h1 serif de 30 px → barra de 28 px. `.hint` de 13 px → 10 px. |
| Superficies | Se reutilizan `.card` y `.panel` **reales**, sin borde discontinuo (reservado a vacío y carga de archivos). |
| Responsive | Hereda los *media queries* de las clases reales (`.course-grid` con `auto-fill`, `.module-workspace` a 1 columna bajo 1100 px, filas de quiz bajo 760 px). |
| Íconos | Ninguno en el skeleton: se usan círculos o cuadrados del tamaño del ícono real. |

## D.4 Accesibilidad

- El contenedor (`SkeletonRegion`) lleva `role="status"`, `aria-live="polite"` y un
  texto `.sr-only` específico ("Cargando quizzes…"). Los placeholders llevan
  `aria-hidden="true"`.
- La región que se reemplaza recibe `aria-busy="true"`.
- **Sin elementos enfocables ni enlaces** dentro del skeleton. Las pestañas
  placeholder no son `<a>`, así no se anuncian rutas que el rol quizás no tiene.
- No se repite el `<h1>`: si el título de la pestaña ya se conoce, el `<h1>` real se
  renderiza; si no, no hay encabezado.
- Contraste: los placeholders son decorativos (no aplica el 4,5:1). El texto real
  que convive con ellos mantiene sus tokens.

## E. Arquitectura propuesta

**Ubicación.** `frontend/src/components/skeletons/`, solo marcado y sin `"use client"`,
para poder usarlo tanto en `loading.tsx` (servidor) como en componentes cliente.
Estilos en `styles/app.css` (§ Skeleton, componentes de shell compartidos) y espejo en
`mockups/assets/app.css` (D7).

| Pieza | Responsabilidad | Usos |
| --- | --- | --- |
| `Skeleton` (primitiva) | `<span aria-hidden>` con `shape` (`line`, `title`, `block`, `circle`, `pill`) y `width` | Todas las composiciones |
| `SkeletonRegion` | `role="status"`, texto `.sr-only`, revelado con retardo y `aria-busy` | Envuelve cada composición |
| `PageHeaderSkeleton` | Etiqueta de sección, `<h1>` real opcional y descripción | Directorio, perfil, administración |
| `CourseHeaderSkeleton` | `PageHeaderSkeleton` + fila fija de 3 pestañas `pill` | Todas las pestañas del curso (L-06 a L-10, L-17) |
| `ListSkeleton` | `rows`, `variant: "row" \| "compact"`, ícono, 2 líneas y chip | Quizzes, tareas, intentos, recursos del módulo, entregas, diálogo de quiz |
| `CardGridSkeleton` | Tarjetas `.course-card` | Mis cursos |
| `TableSkeleton` | `columns`, `rows` y la cabecera real opcional | Libro, participantes, miembros, invitaciones, auditoría, intentos |
| `DocumentSkeleton` | Retorno real + título + hoja con líneas (tokens de papel) | Material, archivo, vista previa de texto y PDF |

**No se crean** `QuizListSkeleton`, `AssignmentListSkeleton` ni similares: son
`ListSkeleton` con props. La única composición específica que se justifica es
`ModulesSkeleton` (índice lateral más acordeones, con un layout de 2 columnas único),
ubicada junto a `modules-panel.tsx` y armada con primitivas.

**Cambios mínimos.**

1. Sustituir solo la rama pendiente: `if (!result.data) return <LoadingState/>` pasa a
   `return <XSkeleton/>`. No se tocan claves, `useResource`, `useRecordPage`,
   `session.request` ni el orden error → datos → carga.
2. Agregar `loading.tsx` por segmento (`courses/[courseId]/` y los detalles) que
   exporte el mismo skeleton. Es una convención existente de Next, no un mecanismo
   nuevo.
3. Extraer `CourseHeader` (presentacional) de `CourseWorkspace`, `QuizWorkspace` y los
   bloques inline, y compartir las medidas con `CourseHeaderSkeleton`.
4. `LoadingState` se mantiene durante la migración. Al final se convierte en un
   fallback neutro (`SkeletonRegion` + bloque), sin `<h1>` ni borde discontinuo, y
   conserva el texto accesible "Cargando contenido…" para la compatibilidad de los tests.
5. Sin dependencias, sin caché y sin cambios en backend, contratos ni configuración.

**Guardas de arquitectura.** El skeleton se renderiza **después** de las guardas de
`ProtectedInstitution` y de las capacidades de rol. No revela ninguna estructura
específica de un rol antes de conocer al usuario: la cantidad de pestañas es fija
(3) hasta que llega el curso. El aislamiento UC/UTFSM no cambia: los skeletons no
leen el contexto institucional ni hacen peticiones.
