# Auditoría de estados de carga y plan de Skeleton UI

Fecha: 2026-11-10 · Base auditada: `9803009` (incluye `origin/dev` hasta `c2c1eed`, #277).
Etapa: solo diagnóstico y planificación. No se modificó código funcional.

## Documentos

| Sección | Archivo |
| --- | --- |
| A. Resumen ejecutivo y H. Decisiones pendientes | este archivo |
| B. Inventario completo | [01-inventario.md](01-inventario.md) |
| C. Diagnóstico técnico y observaciones de rendimiento | [02-diagnostico.md](02-diagnostico.md) |
| D. Propuesta de diseño y E. Arquitectura | [03-diseno-arquitectura.md](03-diseno-arquitectura.md) |
| F. Roadmap de PR | [04-roadmap-pr.md](04-roadmap-pr.md) |
| G. Plan de pruebas y riesgos | [05-validacion-riesgos.md](05-validacion-riesgos.md) |
| Sistema base implementado (PR 1) | [sistema-base.md](sistema-base.md) |

## Método y nivel de evidencia

- Revisión estática de `frontend/src` (38 archivos de ruta en `app/`, 96 módulos en `components/`, 11 hojas CSS),
  tests unitarios (`frontend/test`) y E2E (`e2e/specs`).
- Skills aplicadas: `vercel-react-best-practices` (Suspense, `useTransition`,
  fetching paralelo, parpadeo), `web-design-guidelines` (reglas de carga, `aria-live`,
  movimiento reducido, CLS, `…`), `frontend-design` (contención, identidad existente),
  `lms-ui-ux` (prioridades por rol).
- **Comprobado** = verificado leyendo el código citado (`archivo:línea`).
- **Pendiente** = requiere ejecución. No había entorno local activo (puertos 3000/8080
  cerrados, Docker detenido) y el worktree no tiene `node_modules`. Por la restricción
  de no instalar dependencias, no se ejecutaron tests ni se midieron tiempos reales.
  No se tocó producción.

## A. Resumen ejecutivo

**Diagnóstico.** AcademiX tiene un único indicador de carga, `LoadingState`
(`frontend/src/components/route-states.tsx:31`), que se renderiza en 52 puntos de 29 archivos, entre ellos
los dos `loading.tsx` de ruta. Es un panel con borde discontinuo (`.empty-zone`, la clase
que DESIGN.md reserva para zonas vacías y de carga de archivos), un ícono
`LoaderCircle` **estático** (no existe `@keyframes` en el CSS), un `<h1>` "Cargando
contenido" y el texto "Espera un momento.". Se muestra igual para una página completa,
una tabla paginada, un acordeón, un diálogo o la vista previa de una imagen.

**Causa del problema reportado (comprobado).** Al pasar de Módulos a Quizzes o a
Tareas, el encabezado del curso y sus pestañas **desaparecen y vuelven a aparecer**:

1. No existe `app/courses/[courseId]/layout.tsx`. Cada pestaña es un componente
   independiente que vuelve a pedir `getCourse` y renderiza el encabezado y
   `CourseNavigation` solo cuando terminan **todas** sus lecturas.
2. Mientras tanto, primero se muestra `app/courses/loading.tsx` (transición de ruta) y
   después el `LoadingState` del componente, en lugar del encabezado, las pestañas y
   la lista.
3. El encabezado del curso se implementa de tres formas distintas
   (`CourseWorkspace`, `QuizWorkspace` y bloques inline en `modules-panel`,
   `course-detail` y `assignments`).

Resultado: se pierde el contexto de navegación, hay un salto de layout y un panel vacío
grande en la sección que más se usa.

**Oportunidades principales.**

1. Skeletons que reproducen el layout final: el título de la pestaña (que ya se
   conoce) aparece de inmediato, y el código y nombre del curso, las pestañas y la
   lista se muestran como placeholders.
2. Que `loading.tsx` y el componente usen **el mismo** skeleton, para que la transición
   de ruta y la carga de datos se vean como un solo estado.
3. Un sistema chico: 1 primitiva, 1 contenedor accesible y 6 composiciones
   reutilizables, sin dependencias nuevas, sobre tokens existentes (`--muted`, `--border`).
4. Mantener lo que ya funciona bien: los botones de acción con estado "Guardando…" y
   `aria-busy`, el retardo antiparpadeo `useDelayedFlag` (350 ms) y la conservación de
   datos durante el refresco (`useResource` con `preserve`).
5. Corregir problemas de accesibilidad del estado actual: `<h1>` duplicados en páginas
   que ya tienen su propio `<h1>`, y que la carga se vea igual que un estado vacío.

**Alcance respetado.** No hay caché, no se cambian hooks, peticiones HTTP, backend ni
contratos. Los problemas de fetching se documentan como observaciones aparte
(ver [02-diagnostico.md](02-diagnostico.md#observaciones)).

## H. Decisiones pendientes (requieren confirmación antes de la PR 1)

Estado: D1, D2, D3 y D7 se resolvieron en la PR 1. D2 terminó en un solo alias,
`--skeleton`. Ver [sistema-base.md](sistema-base.md).

| ID | Decisión | Recomendación |
| --- | --- | --- |
| D1 | Movimiento: DESIGN.md prohíbe animaciones de entrada. ¿Skeleton estático o con un pulso de opacidad suave? | Pulso de opacidad de 1,6 s, desactivado con `animation: none` en movimiento reducido. Actualizar DESIGN.md §Motion. |
| D2 | Tokens: ¿alias nuevos `--skeleton` y `--skeleton-strong` en `tokens.css` (y en `mockups/assets/tokens.css`)? | Sí, como alias de `--muted` y `--border` en ambos temas. Sin colores nuevos. |
| D3 | Umbral antiparpadeo: hoy hay 350 ms en `useDelayedFlag`. | Revelado por CSS con retardo de 200 ms en los skeletons de página. Mantener 350 ms en el acordeón de módulos. |
| D4 | Layout persistente `app/courses/[courseId]/layout.tsx` que monte el encabezado y las pestañas una sola vez. | Fuera de esta iniciativa: cambia dónde se hace el fetching y necesita ADR. Solo se propone como trabajo posterior. |
| D5 | Paginación y filtros: hoy la tabla se reemplaza al cambiar el cursor. ¿Skeleton de filas o conservar las filas anteriores? | Skeleton de filas dentro de la tabla, sin cambiar hooks. Conservar filas implicaría modificar `useResource`, que está fuera de alcance. |
| D6 | Estado vacío contextual (reemplazar el genérico "Sin contenido para mostrar"). | PR separada (PR 8): cambia textos que los E2E verifican. |
| D7 | ¿Reflejar los skeletons en `mockups/` (fuente canónica de estilos)? | Sí, un escenario en el mockup 03 o 05 dentro de la PR 1. |
| D8 | Coordinación con la PR #279, abierta, que toca `modules-panel.tsx`, `protected-institution.tsx` y `courses.spec.ts`. | Integrar la PR 2 solo después de que se fusione #279. |
| D9 | El shell desaparece al navegar entre Cursos, Usuarios y Perfil porque `clearContext()` se ejecuta al desmontar el layout. | En esta iniciativa, solo un skeleton del shell (PR 7). La corrección de fondo queda como observación O-3. |
