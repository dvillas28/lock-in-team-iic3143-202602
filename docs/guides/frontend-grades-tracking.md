# Notas y seguimiento frontend

Spec: `specs/20261021-141353_frontend-notas-seguimiento`, validación local 2026-10-22.
Estado: COMPLETA, 36/36 tareas verificadas localmente; US1–US4 y FE-20 aprobados.
Checklists iniciales: requirements.md 14/14, sin pendientes documentales.
Se conservaron los cambios previos de rendición y sesión. Sin commits ni despliegues.
Hooks opcionales de commit pre/post omitidos por instrucción explícita.

## Funcionalidad y permisos

| Historia | Ruta bajo `/courses/{courseId}` | Comportamiento |
| --- | --- | --- |
| US1 | `/grades` | Solo GET my-grades sin query; promedio/peso backend; null pendiente |
| US2 | `/gradebook`, `/quizzes/{quizId}/attempts[/{attemptId}]` | Libro histórico y revisión por sección/vista |
| US3 | `/gradebook` | Pesos completos, freeze global, publicación rectangular confirmada |
| US4 | `/audit` | Eventos de curso, filtros UTC inclusivos, snapshots como texto |

Teacher/assistant consultan secciones actuales autorizadas; teacher publica.
Teacher + isAdmin + ownership amplía curso y habilita pesos.
Owner sin teacher solo obtiene auditoría; superadmin aislado no sustituye teacher.
Multirol se evalúa por acción y sección; revisión propia puede ser estudiantil limitada.
Assistant no solicita pauta ni recibe corrección o controles de escritura.
La cancelación enlaza el flujo de rendición existente; no se duplica ni automatiza.

Filas se identifican por estudiante/sección histórica, incluso tras revocar matrícula.
Página, cursor y selección se reinician al cambiar contexto/filtro; respuestas tardías
no restauran datos. Logout/revocación limpia; no hay persistencia privada en URL/storage.

## Integridad de las escrituras

- Pesos: colección completa/única, dos decimales, suma exacta en centésimas.
- Freeze: recorrer libro global sin filtro hasta publicación o fin; unknown bloquea.
  Publicación confirmada y GRADE_WEIGHTS_LOCKED bloquean incluso no-op.
- Publicación: selección explícita de ítems/secciones/alumnos de la página revisada;
  todos los pares deben existir y estar sin publicar. Confirmación muestra cantidad.
- Backend verifica último graded, intentos activos y carreras; no hay éxito optimista.
- Cuerpo canónico/clave quedan inmóviles en memoria durante envío/incertidumbre.
  Un GET fallido conserva la operación; solo replay exacto puede recuperar recibo.
- Recarga sin clave solo consulta estado: no inventa recibo ni reenvía POST.
  Abandonar operación pendiente advierte pérdida de recuperación.
- PUT incierto requiere consulta y revisión explícitas; nunca reenvío automático.

## Evidencia de aceptación

API local `127.0.0.1:3001`, PostgreSQL local existente; frontend `:3000`.
UC/UTFSM usan orígenes `.localhost` explícitos. Credenciales operativas fuera del repo,
con configuración según [bootstrap local](../backend/demo-tenant-bootstrap.md).
Se crearon cursos exclusivos de aceptación, sin alterar cursos anteriores.

| Comprobación | Resultado |
| --- | --- |
| Suite API real principal | APROBADO: 124 requests UC/UTFSM, 16 comprobaciones |
| API peso cero y cursores | APROBADO: 40 requests adicionales, promedio null con nota publicada |
| Aislamiento y roles | APROBADO: tenant cruzado, owner sin teacher, assistant, superadmin, multirol |
| Revocación/historia | APROBADO: mismo JWT, replay reautorizado y sección histórica conservada |
| Concurrencia | APROBADO: POST simultáneos misma clave y PUT concurrente; freeze posterior 409 |
| Replay e historial | APROBADO: recibo original y un evento por nota publicada |
| Navegador real | APROBADO: 160 variantes, 375/1280 px y claro/oscuro; cero pageerrors |
| Pérdida de respuesta real | APROBADO UC/UTFSM: POST 200 descartado en transporte y replay exacto 200 |
| Diálogo | APROBADO: foco en Volver, Tab, Escape/retorno, cantidades y ocho capturas |
| Revisión final en navegador | APROBADO: texto seguro y cancelación autorizada UC/UTFSM, sin pauta |
| Contraste | APROBADO: 30 pares de tokens, mínimo 4,832:1 en ambos temas |

La pérdida de respuesta se inyectó después de ejecutar la solicitud real;
no se sustituyeron respuestas API con mocks. La lectura intermedia mostró el estado
publicado sin afirmar recibo; auditoría filtrada conservó exactamente un evento.

## FE-20: seis recorridos

| Recorrido | Responsive/temas/semántica | Teclado completo |
| --- | --- | --- |
| Login y contexto | APROBADO | APROBADO |
| Cursos y secciones | APROBADO | APROBADO |
| Módulos y lector de material real | APROBADO | APROBADO |
| Autoría de quiz real | APROBADO | APROBADO |
| Rendición de intento activo real | APROBADO | APROBADO |
| Notas/libro/intentos/publicación/auditoría | APROBADO | APROBADO |

Tablas verificadas con caption/th/scope; controles etiquetados, cifras tabulares,
focus-visible, aria-live y reduced motion. Pasada completa de Tab: 498 controles en 40 vistas a 375 px
en oscuro, con navegación Enter; las otras variantes verifican foco visible. Scroll horizontal queda dentro de tablas;
la página no desborda a 375 px. Auditoría usa details/pre, sin HTML interpretado.
Estas comprobaciones evalúan las rutas existentes; no implementan otras misiones.

## Checks, revisión y límites

`pnpm --dir frontend api:check`, `typecheck`, `lint`, `test` y `build`: APROBADOS.
Suite completa final: 274/274, incluidas las pruebas previas de rendición.
Preparación del PR: cobertura 94,07 % líneas / 86,49 % ramas, sin reducir umbrales.
Longitud documental (20 archivos) y `git diff --check`: APROBADOS.
Revisión lms-reviewer: permisos, aislamiento, historia, claves inciertas y regresiones
de rendición; sin hallazgos bloqueantes. Corregidas pérdida de clave ante GET fallido,
retorno con salto de línea y validación de cantidad del recibo.
Errores distinguen 400/409/422/503/red sin mostrar problem.detail.

Evidencia local efímera: `/tmp/academix-grades-evidence/` contiene `api.json`,
`extra-api.json`, `browser.json`, `browser-keyboard.json`, `browser-publication.json`,
`browser-review.json`, `contrast.json`, logs
de checks y capturas. Scripts `/tmp/academix-grades-*.mts` y
`/tmp/playwright-test-grade*.js`; sin JWT/passwords/claves en los artefactos.

Trazabilidad: CU-10/11/12/13/16; RF21–26/29; RNF1–4/7/9; FE-15–20; FR-001–021.
Excluidos: cálculo/recalificación, edición manual, exportación, auditoría institucional,
binarios y cambios API/DB/infraestructura/dependencias. Sin validación de producción
ni certificación WCAG completa. La recuperación después de recargar pierde la clave
por diseño; una lectura nunca prueba que terminó una escritura en vuelo.
Build conserva el aviso de Next por lockfiles múltiples; no se cambió configuración.
