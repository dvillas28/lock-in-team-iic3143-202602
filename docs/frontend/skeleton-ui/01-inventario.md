# B. Inventario de estados de carga

[← Índice](README.md). Rutas relativas a `frontend/src/`. Todo lo que aparece aquí está
**comprobado en el código**. La frecuencia se deduce del flujo y queda **pendiente de
medir** en un entorno real.

Leyenda de patrones: **PS** skeleton de página · **CH** skeleton del encabezado del curso
· **LS** lista · **TS** tabla · **DS** detalle o documento · **AI** indicador de acción
· **EV** estado vacío · **ER** error.
Prioridad: P1 (alta) a P3. Riesgo y complejidad: B (bajo), M (medio), A (alto).

## Shell, sesión y navegación

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | Todas las rutas protegidas | `auth/protected-institution.tsx:35,38` `ProtectedInstitution` | `state.status` y `state.context` (Session) | `<main><LoadingState/></main>` **sin sidebar ni header**. Aparece al entrar después del login y al cambiar entre Cursos, Usuarios y Perfil (ver O-3) | Pantalla vacía y salto brusco al montarse el shell | **PS** `AppShellSkeleton`: sidebar y header como bloques, sin enlaces | P2 | A: afecta a todas las rutas y a la autorización |
| L-02 | `/profile`, `/profile/security` | `accounts/protected-account.tsx:19,23` | `state.account` | Mismo caso sin shell y, dentro del shell, mientras carga la cuenta | Igual que L-01 | **PS** + `FormSkeleton` | P3 | M |
| L-03 | Transición a cualquier `/courses/*` | `app/courses/loading.tsx` (`Suspense` de ruta) | Navegación RSC: las páginas son `async` y esperan `params` | Panel discontinuo dentro del shell en **cada** navegación, antes del montaje del cliente | Precede a otro `LoadingState` (doble estado) | Archivos `loading.tsx` por segmento que usen **el mismo** skeleton que el componente | P1 | M |
| L-04 | `/institutions/[slug]` (legado) | `app/institutions/[institutionSlug]/loading.tsx` | Ídem | Solo durante la redirección del slug legado | Poco visible | PS neutro | P3 | B |
| L-05 | `/`, `/login` | `public/domain-entry.tsx:19`, `auth/login-form.tsx:47` | `origin` (`useSyncExternalStore`, servidor `undefined`) | Texto "Preparando acceso…" mientras se hidrata | Correcto y breve. El helper E2E `e2e/helpers/browser.ts:36` depende de este texto | Mantener el texto | P3 | B |

## Curso: encabezado y pestañas

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-06 | Módulos y material | `content/modules-panel.tsx:77-86` `CourseContent` | `useResource` `course:` y `modules:` en paralelo | El encabezado y las pestañas solo aparecen cuando terminan **ambas** lecturas. Ocurre en cada entrada y en cada cambio de pestaña | **Causa principal del feedback**: se pierden las pestañas y el layout salta | **CH** + `ModulesSkeleton` (índice y acordeones) | P1 | M (#279 abierta toca este archivo) |
| L-07 | Quizzes | `quizzes/quiz-list.tsx:77-79` | `useResource` (`Promise.all` de curso, secciones y quizzes) | Igual que L-06 | Igual | **CH** + barra de filtros + **LS** agrupada | P1 | M |
| L-08 | Tareas (lista y detalle) | `assignments/assignments.tsx:57-58` | `useResource` (`Promise.all` de 4 lecturas) | Igual. Cuando hay `assignmentId` es la vista de detalle | Igual | **CH** + **LS**, o **DS** en el detalle | P1 | M |
| L-09 | Secciones y participantes | `courses/course-detail.tsx:22-27` | `useResource` **secuencial** (O-2) | Igual | Igual, y además es más lento | **CH** + **TS** | P2 | M |
| L-10 | Notas, Libro y Auditoría | `courses/course-workspace.tsx:29,37` `CourseWorkspace` | `useResource(getCourse)` | Igual en las tres pestañas | Igual | **CH** dentro de `CourseWorkspace` | P1 | M |

## Contenido, archivos y lectores

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-11 | Expandir un módulo | `content/module-resources.tsx:90` | `useResource` + `useDelayedFlag` | Bloque vacío `.resource-pending` de 72 px; después de 350 ms, `LoadingState` **dentro** del acordeón | Buen patrón antiparpadeo, pero el panel discontinuo dentro de otro panel es pesado | **LS** compacta (2 filas). Conservar el retardo. Un test (`content-editor.test.ts:234`) verifica el texto | P2 | B |
| L-12 | Diálogo "Vincular quiz" | `content/quiz-link-dialog.tsx:45` | Ídem | Ídem, dentro de `<dialog>` | Igual | **LS** compacta | P3 | B |
| L-13 | Página o material | `content/material-reader.tsx:18-20` | `useResource` secuencial (módulo y luego material) | Panel genérico, **sin** enlace "Volver a módulos" | Sin forma de volver ni contexto mientras carga | **DS** `DocumentSkeleton`: enlace de retorno real + título + hoja | P2 | B |
| L-14 | Archivo (detalle) | `content/academic-file-reader.tsx:74-76` | `useResource` secuencial | Igual que L-13 | Igual | **DS** | P2 | B |
| L-15 | Vista previa del archivo | `academic-file-reader.tsx:29,47,56` (`Image`, `Text`, `FilePreview`) | Descarga del blob (timeout de 90 s) y decodificación | `LoadingState` dentro del artículo ya renderizado | Panel discontinuo con `<h1>` duplicado | Hoja de papel con `--paper-skeleton`, como en `mockups/09-pdf-reader.html`; imagen con alto reservado | P2 | B |
| L-16 | Visor PDF | `content/pdf-preview.tsx:88,103` | pdf.js | Textos "Abriendo PDF…" y "Cargando página…" con `aria-busy` | Correcto. Falta reservar la hoja | Hoja con skeleton detrás del texto | P3 | B |

## Quizzes, intentos, tareas y entregas

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-17 | Quiz: detalle, autoría y creación | `quizzes/quiz-detail.tsx:38-40`, `quiz-editor.tsx:37-39`, `quiz-create.tsx:45-47` | `useResource` | Panel genérico en lugar de `QuizWorkspace` | Se pierden las pestañas | **CH** + **DS** o `FormSkeleton` | P2 | M |
| L-18 | Intentos (lista) | `attempts/attempt-list.tsx:22,51` | `useResource` con los filtros y el cursor en la clave | Al filtrar o paginar, la tabla se reemplaza por el panel | Salto de layout y pérdida de foco visual | **TS** dentro de la tabla (D5) | P2 | M |
| L-19 | Rendir y revisar un intento | `attempt-detail.tsx:46-48`, `attempt-review.tsx:33,39` | `useResource` | Panel genérico | Flujo crítico del estudiante sin contexto | **DS** con bloques de pregunta | P2 | M |
| L-20 | Historial propio de intentos | `attempts/attempt-start.tsx:52` | `history.refreshing` | Texto "Cargando tus intentos…" | Aceptable | Opcional: **LS** de 2 filas | P3 | B |
| L-21 | Entregas | `assignments/teacher-submissions.tsx:31`, `student-submissions.tsx:38`, `submission-review.tsx:22` | `useResource` | Panel genérico dentro del detalle de la tarea | Panel dentro de panel | **TS** o **LS** compacta | P2 | B |

## Registros académicos y administración

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-22 | Mis cursos | `courses/course-directory.tsx:17,30` | `useResource(listCourses)` | El encabezado se mantiene. El panel genérico ocupa el lugar de la grilla | Primera pantalla después del login | **LS** `CardGridSkeleton` (6 tarjetas, `.course-grid`) | P1 | B: piloto de la PR 1 |
| L-23 | Sección y participantes | `sections-panel.tsx:66-68`, `participants-panel.tsx:155` | `useResource`; el cursor cambia la clave | La tabla se reemplaza al paginar | Igual que L-18 | **TS** | P2 | B |
| L-24 | Libro de notas | `gradebook/course-gradebook.tsx:56,210` | `meta` secuencial (O-2); `book` con la sección y el cursor en la clave | Panel genérico al cambiar de sección o de página | Igual que L-18 | **TS** con las columnas conocidas por `meta` | P2 | M |
| L-25 | Mis notas | `gradebook/student-grades.tsx:29` | `useResource` | Panel genérico | Igual | Resumen + **TS** | P2 | B |
| L-26 | Auditoría | `audit/course-audit.tsx:303` | `useRecordPage` (conserva solo ante error) | Panel genérico al paginar | Igual | **TS** | P3 | B |
| L-27 | Usuarios institucionales | `accounts/institution-users.tsx:15,23,70` | `useResource` (invitaciones; miembros con `preserve=false`) | Panel genérico dentro de las tarjetas | Panel dentro de panel | **TS** | P2 | B |
| L-28 | Buscar personas para inscribir | `courses/enrollment-form.tsx:72` | `useResource` | Texto "Buscando participantes…" | Correcto: es una búsqueda | Mantener | P3 | B |

## Acciones, vacíos y errores

| ID | Ruta o función | Archivo:línea · componente | Origen del estado | Comportamiento actual y cuándo aparece | Problema | Propuesta y reutilización | Prio | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-29 | Formularios y publicación | `use-mutation.ts`, `assignment-form.tsx:181`, `quiz-publish.tsx:134`, `grade-publication.tsx:184`, `file-upload-form.tsx:104` y otros | `busy`, `progress` | Botón con "Guardando…", "Publicando…" o "Subiendo N %", formularios con `aria-busy` | **Correcto**: cumple las reglas de botones y de `…` | **AI**: no usar skeletons aquí. Solo auditar la consistencia | — | B |
| L-30 | Estado vacío genérico | `route-states.tsx:35`; usado en `course-directory`, `participants-panel`, `sections-panel` (×2) y `module-resources` | Lista vacía | "Sin contenido para mostrar", sin acción | No orienta. Contrasta con los vacíos contextuales de módulos, quizzes, libro y auditoría | **EV** con `title`, `message` y `action` (PR 8). `e2e/specs/courses.spec.ts:23` lo verifica | P2 | M |
| L-31 | Error y no encontrado | `route-states.tsx:39,51`; 37 usos | `RouteFeedback` | Panel discontinuo con `<h1>` y "Volver al inicio" siempre visible | `<h1>` duplicado cuando está anidado; se ve igual que un estado vacío | **ER**: nivel de encabezado según el contexto. Conservar los textos y el reintento | P3 | B |
