# Contract: UI y API de autoría de quizzes

Fuente normativa: `docs/reference/openapi/paths/quizzes.yaml`, schemas quizzes y
`docs/reference/openapi/paths/gradebook.yaml`. Sin cambios al contrato servidor.

## Rutas frontend

| Ruta limpia | Comportamiento |
| --- | --- |
| /courses/[courseId]/quizzes | Lista segura y creación de draft autorizada |
| /courses/[courseId]/quizzes/[quizId] | Detalle seguro y enlace explícito al editor |
| /courses/[courseId]/quizzes/[quizId]/authoring | Configuración, pauta y publicación |

Todas bajo ProtectedInstitution y shell existente. Dominio configurado propone slug;
Session.request consume path institucional y backend autoriza. URL no concede permisos.
Validar identidad del quiz y courseId antes de mostrarlo; sección debe pertenecer al curso.
No prefetch de /authoring ni cargar pauta desde lista/detalle. Sin rutas de intentos.

## Operaciones

Base `I = /api/v1/institution/{institutionSlug}`.

| Operación | Método/ruta | Respuesta confirmada |
| --- | --- | --- |
| listCourseQuizzes | GET I/courses/{courseId}/quizzes | 200 items QuizSummary[] |
| getQuiz | GET I/quizzes/{quizId} | 200 QuizStudentView sin pauta |
| createQuiz | POST I/courses/{courseId}/quizzes | 201 QuizAuthoringView, Location |
| updateQuiz | PATCH I/quizzes/{quizId} | 200 QuizAuthoringView |
| getQuizAuthoringView | GET I/quizzes/{quizId}/authoring | 200 QuizAuthoringView |
| publishQuiz | POST I/quizzes/{quizId}/publish sin cuerpo | 200 QuizAuthoringView |
| listCourseGradeItems | GET I/courses/{courseId}/grade-items | 200 ítems del curso |

Lista permite filtro sectionId UUID; incluye globales visibles, sin paginación.
Tipos desde `frontend/src/lib/api/schema.d.ts`; validación de entradas y respuestas
según [data-model.md](../data-model.md). Parsers seguros proyectan solo campos permitidos.
Lista/detalle nunca contienen isCorrect, aunque el usuario también sea teacher.
Leer grade-items solo para autor autorizado; seleccionar item.quizId del quiz publicado.
No llamar endpoints de pesos, publicación de notas, intentos, delete o unpublish.

## Permisos reconciliados

| Actor activo | Consulta segura | Autoría/publicación |
| --- | --- | --- |
| Teacher ordinario | Visibilidad backend; drafts de secciones propias | Solo sus secciones |
| Teacher + isAdmin + dueño del curso | Curso completo | Secciones del curso y curso completo |
| Admin/superadmin sin teacher | Según Enrollment/visibilidad backend | Nunca |
| Assistant/student | Publicados globales y de secciones activas propias | Nunca |
| Teacher+student | Según ambos alcances | Si puede ver pauta, no puede rendir ese quiz |

Frontend calcula affordances; API revalida permisos actuales. PATCH requiere permiso
sobre destino original y nuevo, no solamente pertenecer a alguna sección del curso.
403/404 de autoría elimina pauta en memoria y revalida /me; no volver a mostrarla stale.

## Mutaciones y errores

- Crear admite título y questions vacío, más configuración; no exige pauta inicial.
- PATCH solo campos cambiados; sectionId omitido conserva, null pide curso completo.
  Retener IDs existentes y reemplazar questions completo solo si se editó.
- Publicar requiere cambios locales guardados y confirmación con destino, ventana,
  bloqueo de edición, generación de ítem con peso inicial cero y restricción multirol.
- Publicación y GradeItem se confirman desde respuestas; sin éxito optimista.
  Fallo al leer ítem tras POST exitoso muestra publicado y lectura pendiente, sin republicar.
- 400/422: feedback local seguro y foco al campo; preservar texto autorizado.
- 413: explicar tamaño total máximo; preservar texto sin recortar.
- 401: invalidar sesión y datos; 403/404: limpiar privados y revalidar contexto.
- 409: recargar estado; comunicar bloqueo de publicación/edición y posible congelación,
  sin afirmar causa única que respuesta no identifica; no modificar destino silenciosamente.
- 503/red/respuesta inválida en mutación: resultado incierto, bloquear envío y consultar
  estado. Lecturas se reintentan explícitamente; mutaciones nunca automáticamente.
- Create incierto: lista sin coincidencias no prueba ausencia; título no es clave.
  Mantener bloqueo y permitir revisar candidatos antes de iniciar otra creación consciente.
- Publish repetido: sin duplicados visuales; publicación ya confirmada conserva timestamp.
  No-duplicación de eventos/locks se verifica en backend, no se infiere de DOM.

## UX verificable

Carga/vacío/error separados, enlaces de retorno al curso/lista y estado textual.
Fieldsets para preguntas; alternativas con labels y radio de correcta por pregunta.
Agregar/quitar y reordenar por teclado con foco predecible y avisos aria-live.
Dialog nativo: foco inicial Volver, Escape, retorno al disparador y foco confinado.
Tokens/estilos existentes, EB Garamond/Inter, Lucide, cifras tabulares, foco visible,
ambos temas, 375 px, contraste ≥4.5:1 y prefers-reduced-motion.
