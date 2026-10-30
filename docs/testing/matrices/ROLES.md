# Matriz de permisos vigente

Fuente: [course-access](../../../backend/src/courses/course-access.ts),
[quiz-access](../../../backend/src/quizzes/quiz-access.ts),
[attempt-access](../../../backend/src/attempts/attempt-access.ts),
[gradebook-access](../../../backend/src/gradebook/gradebook-access.ts),
[audit](../../../backend/src/audit/audit.service.ts), [capabilities UI](../../../frontend/src/lib/gradebook/capabilities.ts).
Roles/flags son acumulables; columnas describen cada capacidad aislada. Una persona con varios toma
reglas de acción/contexto, con incompatibilidad explícita pauta/rendición; no aplicar «mayor rol gana».

A permitido; D denegado; C condicional; N/A rol/operación inexistente; V pendiente verificación runtime.
Todos los A/C están V en runtime de esta auditoría, definidos estáticamente por fuente.
SA=isSuperAdmin solo; Admin=isAdmin sin rol académico; Coord no existe; Doc=teacher; Ay=assistant; Est=student.
«Owner»=isAdmin vigente y createdBy actor; no boolean enviado por cliente.

| Recurso / operación | SA | Admin | Coord | Doc | Ay | Est | Condición / pruebas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Login / institutions / me | C | C | N/A | C | C | C | User activo; me exige tenant+membership; AUTH/TENANT |
| Courses listar/detalle | C | C | N/A | C | C | C | Owner o Enrollment; sin alcance lista vacía/detalle404; COURSE-001 |
| Courses crear | D | A | N/A | D | D | D | isAdmin; crea sección+teacher actor atómico; COURSE-006 |
| Course metadata PATCH | D | C | N/A | D | D | D | Owner; RBAC-002/003/004 |
| Sections listar/GET | D | C | N/A | C | C | C | Owner todo curso; otros solo secciones con roles; SECTION-001 |
| Sections crear/PATCH | D | C | N/A | D | D | D | Owner; SECTION-002/003 |
| Enrollment GET | D | C | N/A | C | C | D | Owner o teacher/assistant sección; assistant API sin panel; RBAC-005 |
| Enrollment POST/PATCH rol/active | D | C | N/A | C | D | D | Owner todas secciones; teacher propia; ENROLL-007–019 |
| Users search | D | D | N/A | A | D | D | Teacher en alguna sección institucional activa; ENROLL-005 |
| Memberships GET | A | D | N/A | D | D | D | SA activo solo tenant; ADMIN-001 |
| Membership course-admin PUT | A | D | N/A | D | D | D | Target activo mismo tenant, incluso propia; ADMIN-002–006 |
| isSuperAdmin asignar / onboarding HTTP | N/A | N/A | N/A | N/A | N/A | N/A | Solo operador CLI; ADMIN-007–010 |
| Modules GET/list | D | D | N/A | C | C | C | Teacher curso lee drafts; otros Enrollment+published; CONTENT-007/009 |
| Modules create/title/order/publish/unpublish | D | D | N/A | C | D | D | Teacher de cualquier sección curso; compartidos; CONTENT-001–006 |
| Material GET/list | D | D | N/A | C | C | C | Teacher drafts; otros módulo e ítem publicados; CONTENT-009 |
| Material create/PATCH/publish/unpublish | D | D | N/A | C | D | D | Teacher curso; CONTENT-008/010 |
| Quiz list/detalle seguro | D | D | N/A | C | C | C | SQL visibilidad: docente destino/owner+teacher, otros publicado destino; QUIZ-001 |
| Quiz create/PATCH draft/authoring/publish | D | D | N/A | C | D | D | Teacher destino; whole-course requiere owner+teacher; QUIZ-005/011/014 |
| Quiz PATCH publicado | D | D | N/A | D | D | D | 409 aunque sin intento; QUIZ-016 |
| Start / answers / submit propio | D | D | N/A | C | C | C | Student acumulado elegible sección, sin acceso pauta del quiz; RBAC-009–011 |
| Attempt GET propio | D | D | N/A | C | C | C | Student elegible propio; o vista staff autorizada; ATTEMPT-002/RBAC-011 |
| Attempt list / GET staff | D | D | N/A | C | C | D | Teacher/assistant sección histórica; owner+teacher global; ATTEMPT-031 |
| Attempt corrección por respuesta | D | D | N/A | C | D | D | Teacher autorizado y graded; RBAC-005 |
| Attempt cancel | D | D | N/A | C | D | C | Teacher sección histórica/owner+teacher o student propio elegible; ATTEMPT-028/029 |
| Grade-items GET / book | D | D | N/A | C | C | D | Teacher/assistant sección, owner+teacher global; GRADE-008 |
| Weights PUT | D | D | N/A | C | D | D | También owner; antes freeze; GRADE-014/017 |
| Publications POST | D | D | N/A | C | D | D | Teacher secciones seleccionadas o owner+teacher global; GRADE-021/032 |
| my-grades GET | D | D | N/A | C | C | C | Requiere student acumulado en curso; solo propias publicadas; GRADE-003/006 |
| Audit no-grade GET | D | C | N/A | C | D | D | Owner todos administrativos; teacher section histórica; AUDIT-002 |
| Audit grade GET | D | D | N/A | C | D | D | Teacher sección histórica; owner+teacher global; AUDIT-003/004 |
| DELETE académico / manual grade / binarios | N/A | N/A | N/A | N/A | N/A | N/A | Sin endpoints vigentes; exclusión explícita |
| CatálogoSwagger leer/descargar | A | A | N/A | A | A | A | Público sinJWT niAPI; CATALOG-001/002 |

## Ejecución exhaustiva de denegaciones por operación

Cada operación del [inventario API](../audit/API.md) se expande con:

1. Actor permitido, mismo tenant/recurso/estado y evidencia de persistencia cuando escribe.
2. Actor activo con recurso visible pero permiso insuficiente:403; UI sin control y URL directa segura.
3. Actor sin curso/sección visible o recurso de otro tenant:404; sin confirmar existencia.
4. Anónimo/token inválido:401 en endpoint privado; no depender de ocultación UI ni CORS.
5. Revocar permiso tras login y después repetir operación con mismo JWT/cursor/key: revalidar.
6. Probar actor con rol igual en otro curso/sección y multirol mixto; no herencia por institución.

Para mutación sin URL frontend propia, forzar API y verificar efecto/ausencia en pantalla de recurso.
No inventar formulario o ruta de delegación/alta/DELETE. La denegación exacta ocurre por orden de
validación: body/UUID inválido puede400 antes de roles; usar body válido en matriz403/404.
Owner solo puede tener curso visible y content/quiz404 por falta de Enrollment; book403;
no universalizar403 para todo recurso visible administrativo. Payload de filtro ajeno puede404.
Evento grade nunca se expone a owner sin teacher, aunque tenga student o notas publicadas propias.
La matrícula actual del alumno no mueve la sección histórica del intento/Grade al revisar staff.
