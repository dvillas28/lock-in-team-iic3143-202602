# F. Roadmap de PR

[← Índice](README.md). Base de integración: `dev`. Las ramas siguen el formato
`<type>/<short-name>` definido en AGENTS.md. Cada PR mantiene en verde `pnpm lint`,
`pnpm typecheck`, `pnpm test` y la suite E2E *regression*.

## Orden y dependencias

```text
PR1 base ──► PR2 curso + módulos ──┬─► PR3 quizzes + intentos ─┐
   (#279 fusionada antes de PR2)   ├─► PR4 tareas + entregas ──┤
                                   ├─► PR5 lectores y archivos ┼─► PR7 shell + retiro de LoadingState ─► PR8 vacíos contextuales
                                   └─► PR6 registros + admin ──┘
```

Las PR 3 a 6 son paralelizables entre sí después de la PR 2: tocan archivos disjuntos
y solo dependen de las primitivas y de `CourseHeader`.

| PR | Rama sugerida | Prioridad | Complejidad |
| --- | --- | --- | --- |
| 1 | `feat/skeleton-base` | P1 | Baja |
| 2 | `feat/skeleton-course-modules` | P1 | Media |
| 3 | `feat/skeleton-quizzes` | P1 | Media |
| 4 | `feat/skeleton-assignments` | P1 | Media |
| 5 | `feat/skeleton-readers` | P2 | Baja |
| 6 | `feat/skeleton-records-admin` | P2 | Media |
| 7 | `feat/skeleton-shell` | P2 | Alta |
| 8 | `feat/contextual-empty-states` | P2 | Baja |

## PR 1: componentes base y convenciones

- **Objetivo.** Primitivas, tokens y convenciones, con un piloto visible y de bajo riesgo.
- **Alcance.** `components/skeletons/` (`Skeleton`, `SkeletonRegion`,
  `PageHeaderSkeleton`, `CardGridSkeleton`, `ListSkeleton`, `TableSkeleton`). Sección
  Skeleton en `styles/app.css`. Alias `--skeleton` y `--skeleton-strong` en
  `styles/tokens.css` y `mockups/assets/tokens.css`. Utilidad `.sr-only` (sin retirar
  todavía las tres clases duplicadas). DESIGN.md: secciones §Componentes y §Motion.
  Piloto: Mis cursos (L-22).
- **Archivos.** `components/skeletons/*`, `styles/app.css`, `styles/tokens.css`,
  `components/courses/course-directory.tsx`, `DESIGN.md`, `mockups/assets/*` y tests nuevos.
- **Dependencias.** Las decisiones D1, D2, D3 y D7.
- **Riesgos.** Paridad de tokens con los mockups; la regla de movimiento reducido.
- **Pruebas.** Unitarias de las primitivas; render de `course-directory` en estado
  pendiente, con error y vacío.
- **Aceptación.** Ningún otro archivo cambia de comportamiento. Mis cursos muestra 6
  tarjetas placeholder sin salto de layout. Ningún `<h1>` duplicado.

## PR 2: encabezado del curso, módulos y transición de ruta

- **Objetivo.** Resolver el feedback principal: que las pestañas no desaparezcan.
- **Alcance.** `CourseHeader` y `CourseHeaderSkeleton`; `ModulesSkeleton`; ramas
  pendientes de `modules-panel.tsx` (L-06), `module-resources.tsx` (L-11) y
  `quiz-link-dialog.tsx` (L-12); `CourseWorkspace` (L-10);
  `app/courses/[courseId]/loading.tsx` y el reemplazo de `app/courses/loading.tsx` (L-03).
- **Dependencias.** PR 1 y la PR #279 fusionada.
- **Riesgos.** La `loading.tsx` de segmento se aplica a todas las subrutas del curso;
  los detalles necesitan su propia `loading.tsx` (PR 3 a 5) o un skeleton neutro. Un
  conflicto con #279. Que el foco se pierda al cambiar de pestaña.
- **Pruebas.** Actualizar `content-editor.test.ts:222-234` (el texto pasa a `.sr-only`)
  e `institution-layout.test.ts:61-66`. E2E de navegación Módulos → Quizzes → Tareas
  con la respuesta retenida.
- **Aceptación.** Durante la carga se ven el `<h1>` "Módulos y material" y 3 pestañas
  placeholder. Al resolver la carga, las pestañas reales ocupan el mismo lugar (CLS ≈ 0).
  Los errores 403, 404 y 500 muestran `ErrorState` sin un skeleton residual.

## PR 3: quizzes e intentos

- **Alcance.** L-07, L-17, L-18, L-19 y L-20: `quiz-list`, `quiz-detail`,
  `quiz-editor`, `quiz-create`, `attempt-list`, `attempt-detail`, `attempt-review` y
  `attempt-start`; `QuizWorkspace` usa `CourseHeader`; `loading.tsx` en
  `quizzes/[quizId]/` y `attempts/[attemptId]/`.
- **Dependencias.** PR 2. Revisar con los responsables de `feat/quizzes-*`.
- **Riesgos.** El guardado de respuestas y el temporizador del intento no deben quedar
  ocultos. `QuizLeaveGuard`. Los filtros en la URL (`quizListLocation`).
- **Pruebas.** `quiz-list.test.ts`, `attempt-ui.test.ts`, `quiz-experience.test.ts`;
  E2E de `quizzes.spec.ts` y del intento como estudiante.
- **Aceptación.** La barra de filtros es visible durante la carga cuando ya se conoce.
  Una lista vacía muestra el vacío contextual, no un skeleton.

## PR 4: tareas y entregas

- **Alcance.** L-08 y L-21: `assignments.tsx` (lista y detalle), `teacher-submissions`,
  `student-submissions`, `submission-review`; `loading.tsx` en `assignments/[assignmentId]/`.
- **Dependencias.** PR 2. Coordinar con `feat/tasks-list-ux` y `feat/assignment-submissions`.
- **Riesgos.** El progreso de subida de entregas (AI) no debe reemplazarse. El reloj
  de `setInterval` del componente.
- **Pruebas.** `assignments-ui.test.ts`, `submissions-ui.test.ts`; E2E de entrega y
  corrección.
- **Aceptación.** El detalle mantiene el retorno a Tareas mientras carga.

## PR 5: lectores y archivos

- **Alcance.** L-13 a L-16: `DocumentSkeleton` con tokens de papel; `material-reader`,
  `academic-file-reader` y sus vistas previas, y el fondo de `pdf-preview`;
  `loading.tsx` en `materials/[materialId]/` y `files/[fileId]/`.
- **Dependencias.** PR 1 (no necesita `CourseHeader`).
- **Riesgos.** `URL.createObjectURL` y la limpieza de blobs; el alto reservado de las
  imágenes; los textos "Abriendo PDF…" y "Cargando página…" se mantienen.
- **Pruebas.** `content-reader.test.ts`, `academic-files.test.ts`; E2E del visor.

## PR 6: registros académicos y administración

- **Alcance.** L-09, L-23 a L-27: `course-detail`, `sections-panel`,
  `participants-panel`, `course-gradebook`, `student-grades`, `course-audit` e
  `institution-users`, con `TableSkeleton` dentro de `<tbody>` o la tarjeta.
- **Dependencias.** PR 2 (`CourseHeader`). Decisión D5.
- **Riesgos.** El libro de notas usa `tabular-nums` y columnas dinámicas. La paginación
  no debe mover los controles. Vistas solo para administradores.
- **Pruebas.** `gradebook-book-ui.test.ts`, `participants.test.ts`,
  `sections-workspace.test.ts`, `audit-ui.test.ts`, `accounts-ui.test.ts`.

## PR 7: shell, sesión y retiro de `LoadingState`

- **Alcance.** L-01, L-02 y L-04: `AppShellSkeleton` en `ProtectedInstitution` y
  `ProtectedAccount`; `LoadingState` pasa a ser el fallback neutro (E.4); se retiran las
  clases `*-sr-only` duplicadas.
- **Dependencias.** PR 2 a 6 fusionadas, porque esta PR cambia el fallback de todas las
  vistas no migradas.
- **Riesgos (alto).** Autenticación, redirección a `/login`, `InstitutionAccessNotice`,
  la advertencia de acceso, `fieldset.access-boundary` y E2E de `auth.*` y
  `rbac.security`. Ver la observación O-3.
- **Aceptación.** Nunca se renderizan enlaces del shell antes de que el contexto esté
  autorizado. `e2e/specs/courses.spec.ts:46` se actualiza.

## PR 8: estados vacíos contextuales (opcional)

- **Alcance.** L-30 y L-31: `EmptyState` con `title`, `message` y `action`; el nivel de
  encabezado de `ErrorState` y `NotFoundState`.
- **Riesgos.** Cambia textos que verifican `courses.spec.ts:23`, `content-reader.test.ts:87`
  y `quiz-list.test.ts:56`.
