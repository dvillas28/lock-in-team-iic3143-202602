# C. Diagnóstico técnico

[← Índice](README.md). Rutas relativas a `frontend/src/`.

## Cómo se implementa hoy la carga

**Stack:** Next 16.4.1 (App Router), React 19.3, CSS propio sin Tailwind ni librería de
componentes, y `lucide-react`. No hay ninguna librería de skeletons y no hace falta una.

**Obtención de datos (no se modifica).**

- Toda lectura de dominio pasa por `useResource` (`components/courses/use-resource.ts`),
  que llama a `session.request` (`lib/auth/session.ts`, con un timeout de 15 s y 90 s
  para archivos). El estado se reduce a `{ data?, error?, refreshing?, accessDenied? }`,
  asociado a una **clave** (`resource`).
- Con la misma clave y `preserve = true` (valor por defecto), un refresco conserva
  `data` y solo activa `refreshing`. Ya se usa para no mostrar un indicador de carga
  durante las revalidaciones por foco (`use-refresh-on-return.ts`).
- Si **cambia la clave** (cursor, filtro, sección o `JSON.stringify(user)`), `data`
  vuelve a `undefined` y el componente muestra `LoadingState` (L-18, L-23, L-24, L-26, L-27).
- `useRecordPage` conserva la última página **solo ante un error**, nunca durante la carga.
- Las páginas de `app/` son componentes de servidor `async` muy delgados (solo esperan
  `params`). Todo el fetching ocurre en el cliente, después del montaje.

**Orden de prioridad de los estados (correcto; debe conservarse).** En casi todos los
componentes el orden es: error (`ErrorState`) → datos → `LoadingState`. Si hay datos y
además un error, se muestra un aviso de "datos anteriores" junto a los datos
(`modules-panel.tsx:106`, `quiz-list.tsx:145`, `module-resources.tsx:118`). Un skeleton
debe ocupar **exactamente** el lugar de `LoadingState` en ese orden.

**Carga permanente.** No se encontró ninguna rama sin salida: toda petición termina por
timeout en un error que muestra `ErrorState` con reintento. Las ramas `if (!user)`
dentro de las rutas protegidas no pueden quedar atascadas, porque `ProtectedInstitution`
resuelve el contexto o su error antes de renderizar a los hijos.

## Qué está centralizado y qué está duplicado

| Pieza | Estado | Comentario |
| --- | --- | --- |
| `LoadingState`, `EmptyState`, `ErrorState` y `NotFoundState` | **Centralizados** en `route-states.tsx` | Esta es la ventaja: cambiar un solo componente afecta a 52 puntos de carga. También es el riesgo: no conviene cambiarlo todo de una vez. |
| Encabezado del curso y pestañas | **Triplicado**: `CourseWorkspace`, `QuizWorkspace` y bloques inline en `modules-panel.tsx:103`, `course-detail.tsx:32` y `assignments.tsx` | Conviene unificarlo en un `CourseHeader` presentacional antes de crear su skeleton, para que ambos compartan las mismas medidas. |
| Retardo antiparpadeo | Solo en `module-resources` y `quiz-link-dialog` (`use-delayed-flag.ts`) | Generalizar la idea con CSS (`animation-delay`), sin timers. |
| Clase visualmente oculta | **Triplicada**: `.gradebook-sr-only`, `.assignment-sr-only` y `.content-sr-only` | Unificar en `.sr-only` dentro de `app.css` (PR 1). |
| Estado vacío | Uno genérico más vacíos contextuales inline (`.empty-zone`) en módulos, quizzes, libro y auditoría | Patrón inconsistente (L-30). |
| Indicadores de acción | Distribuidos, pero con un criterio homogéneo ("Guardando…", `aria-busy`, progreso) | No hace falta centralizarlos. |

## Problemas visuales y de accesibilidad comprobados

1. **El spinner no gira.** `LoaderCircle` no tiene animación y no existe ningún
   `@keyframes` en `styles/`. Se percibe como un ícono decorativo.
2. **La carga se confunde con el vacío.** `.empty-zone` (borde discontinuo) es la clase
   de los estados vacíos y de la carga de archivos en DESIGN.md. La carga, el vacío y el
   error se ven iguales.
3. **`<h1>` duplicado.** `StatePanel` usa `<h1>` por defecto, incluso dentro de páginas
   que ya tienen su `<h1>` (por ejemplo `course-directory.tsx:27-30`) o dentro de un
   acordeón o un diálogo.
4. **Salto de layout.** El panel tiene una altura distinta a la del contenido final, y
   el encabezado y las pestañas aparecen después.
5. **Copia.** "Espera un momento." no informa qué se está cargando. Las reglas de
   interfaz recomiendan "Cargando quizzes…".
6. **Modo oscuro.** Los tokens existen (`[data-theme="dark"]` en `tokens.css`), pero
   ningún código de la aplicación aplica `data-theme`: hoy no se puede activar desde la
   interfaz. Hay que verificarlo forzando el atributo.
7. **Movimiento reducido.** La regla global de `app.css:29` reduce
   `animation-duration` a 0,01 ms. Con una animación infinita (pulso o shimmer) eso
   produce **destellos rapidísimos**. El skeleton debe declarar `animation: none` de
   forma explícita.

## Observaciones

Estas observaciones quedan fuera del alcance de los skeletons. No se proponen cachés.
Cada una sería una iniciativa aparte con su propio análisis.

| ID | Observación | Evidencia | Nota |
| --- | --- | --- | --- |
| O-1 | `getCourse` se vuelve a pedir en cada pestaña del curso. | `modules-panel.tsx:72`, `quiz-list.tsx:48`, `assignments.tsx:51`, `course-workspace.tsx:27`, `course-detail.tsx:18` | Lo resolvería un layout persistente (D4), no una caché. Requiere ADR. |
| O-2 | Lecturas **secuenciales** que podrían ser independientes. | `course-detail.tsx:18-19`, `material-reader.tsx:14-15`, `academic-file-reader.tsx:66-67`, `course-gradebook.tsx:48-49` | Regla `async-parallel`. Hay que confirmar antes si el orden es intencional por autorización. |
| O-3 | Al navegar entre `/courses`, `/admin` y `/profile` se desmonta un layout distinto, lo que llama a `session.clearContext()` y vuelve a pedir el contexto institucional. | `protected-institution.tsx:32`, `protected-account.tsx:17`, `session.ts:205` | Explica por qué el shell desaparece (L-01). La PR 7 solo lo disimula visualmente. |
| O-4 | Revalidación por foco y visibilidad del contexto y las listas. | `context-events.ts`, `use-refresh-on-return.ts` | Es intencional (aislamiento y revocación de acceso). El skeleton **no** debe mostrarse mientras dure `refreshing`. |
| O-5 | Las claves con `JSON.stringify(user)` vuelven a montar vistas completas cuando cambian las membresías. | `course-workspace.tsx:24`, `quiz-list.tsx:29` | Es intencional por aislamiento de roles. No tocar. |
| O-6 | La sesión vive en memoria y `pagehide` cierra la sesión. | `session-provider.tsx:17-19`, ADR `browser-session-in-memory` | Una recarga completa lleva al login, así que el skeleton del shell solo se ve después de iniciar sesión o al cambiar de sección. |
