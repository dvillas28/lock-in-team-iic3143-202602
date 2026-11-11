# G. Plan de pruebas y riesgos

[← Índice](README.md). Herramientas existentes: `node:test` con `jsdom` y
`renderToStaticMarkup` (`frontend/test`), y Playwright (`e2e/`). **No se agregan
dependencias**: no hay axe ni librerías de regresión visual.

## Pruebas unitarias de componentes

- Primitivas: los placeholders tienen `aria-hidden`; la región tiene `role="status"`
  y el texto `.sr-only` específico; no hay `a`, `button` ni `[tabindex]` en el árbol;
  no hay `<h1>`.
- Clases: revelado con retardo y regla `animation: none` presente en el CSS (se
  verifica leyendo `app.css`, como ya hacen otros tests de estilos).

## Pruebas de integración (render del componente con `fetch` simulado)

Con el patrón `deferred()` y `mount()` que ya usa `content-editor.test.ts`:

| Caso | Resultado esperado |
| --- | --- |
| Respuesta retenida | Hay skeleton, el `<h1>` real y `aria-busy="true"`. No aparece "Espera un momento". |
| Respuesta resuelta | El skeleton desaparece, los datos se ven y las pestañas reales están en el mismo contenedor. |
| 500 o fallo de red | `ErrorState` con reintento y **cero** skeletons. |
| 401, 403 o 404 | El mismo comportamiento de acceso que hoy (`accessDenied`) y cero skeletons. |
| Refresco con datos (foco o reintento) | No se monta un skeleton: solo `aria-busy`. |
| Lista vacía | Estado vacío y cero skeletons. |
| Expansión rápida de un módulo | Sin skeleton (se conserva `useDelayedFlag`). |

## E2E de navegación (Playwright)

- Interceptar con `page.route` y retener las respuestas, igual que en
  `courses.spec.ts:46`. Recorrido: Mis cursos → Módulos → Quizzes → Tareas → Libro.
  Verificar que `navigation[aria-label="Curso"]` **o** su skeleton está siempre presente.
- Medir CLS con `PerformanceObserver('layout-shift')` en `page.evaluate`, sin
  dependencias. Objetivo: < 0,1 por navegación.
- Errores: `route.fulfill({status: 500 | 403 | 404})` y `route.abort()`. Verificar que
  aparece `ErrorState` y que no queda `[aria-busy="true"]` después de 16 s (timeout de 15 s).
- Respuestas rápidas: sin retención, el skeleton no debe llegar a ser visible
  (`toHaveCSS('opacity','0')` o no presente).
- Red lenta: CDP `Network.emulateNetworkConditions` (Slow 3G) en Chromium.

## Verificación visual

| Dimensión | Cómo verificarla |
| --- | --- |
| Escritorio | 1440×900 y 1280×800, capturas antes y después por pantalla de la PR. |
| Móvil | 375×812 (sidebar colapsado, `.course-grid` de 1 columna, filas de quiz bajo 760 px). |
| Claro y oscuro | `document.documentElement.dataset.theme='dark'` (la app no lo expone, ver C.6). |
| Movimiento reducido | `page.emulateMedia({ reducedMotion: 'reduce' })`: el skeleton queda estático y sin destellos. |
| Roles | Estudiante, ayudante, docente, owner o administrador del curso sin rol académico (caso de `modules-panel.tsx:79`), administrador institucional y miembro sin cursos. Usar los actores de `e2e/data`. |
| Instituciones | UC y UTFSM (por subdominio). Confirmar que ningún skeleton anticipa pestañas de otra institución ni de otro rol. |
| Accesibilidad | VoiceOver y NVDA: un único anuncio "Cargando quizzes…" sin repeticiones; foco por teclado intacto en la navegación; zoom al 200 %. |

## Criterios de aceptación globales

1. Ningún `LoadingState` genérico visible en las rutas migradas.
2. El encabezado y las pestañas del curso están presentes (reales o como skeleton)
   en todo momento al cambiar de pestaña.
3. Un error siempre tiene prioridad sobre el skeleton, y ningún skeleton queda
   visible más de 15 s.
4. Los indicadores de acción no cambian.
5. No cambia ningún archivo de `lib/api`, `use-resource.ts`, `use-record-page.ts`,
   `session.ts`, backend ni configuración.
6. Los tokens existen en ambos temas, no hay colores literales y se respeta
   `prefers-reduced-motion`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Tests y E2E que dependen del texto "Cargando contenido" o del rol `status` (`institution-layout.test.ts:65`, `auth-ui.test.ts:176`, `content-editor.test.ts:222-234`, `courses.spec.ts:46`) | Mantener el texto en `.sr-only` dentro de `role="status"`. **Pendiente**: comprobar que Playwright considera visible un `.sr-only` de 1×1 px. Si no, actualizar la aserción en la misma PR. |
| `route-states.tsx` alimenta 52 puntos de carga | No cambiarlo hasta la PR 7. |
| Conflictos con trabajo abierto o reciente | #279 antes de la PR 2. Las PR 3 y 4 se coordinan con los responsables de las ramas `feat/quizzes-*` y `feat/tasks-*`. Cada PR es pequeña y por dominio. |
| Ocultar un error real | El orden de las ramas no cambia y hay tests explícitos de error sin skeleton. |
| Revelar estructura de un rol | Skeleton con una cantidad fija de pestañas y sin enlaces. |
| Regresión de foco o navegación | E2E de teclado: Tab hasta las pestañas después de navegar. |
| La `loading.tsx` del segmento no coincide con el detalle | Una `loading.tsx` propia en cada detalle (PR 3 a 5). |

## Pendientes de verificación (no comprobados en esta auditoría)

1. Tiempos reales de `loading.tsx` y de cada lectura en Render (sin entorno disponible).
2. Que la doble aparición (`loading.tsx` → `LoadingState`) se perciba en producción;
   en el código está comprobada, pero su duración no.
3. La línea base de los tests actuales (el worktree no tiene `node_modules`; no se
   instalaron).
4. El efecto real de O-3 al navegar entre Cursos y Perfil.
5. El comportamiento con lector de pantalla del `role="status"` actual.
