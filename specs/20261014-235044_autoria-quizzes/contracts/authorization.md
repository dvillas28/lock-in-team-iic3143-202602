# Autorización y protección de pauta

User, Institution e InstitutionMembership activos en cada solicitud.
El slug pide contexto; actor viene del guard, nunca del body ni perfiles de UI.
Reutilizar course-access y comprobar permisos vigentes dentro de las transacciones.

## Predicados

teacherSections = secciones de este curso con Enrollment teacher activo del actor.
academicOwner = membership.is_admin && Course.created_by=actor &&
teacherSections no vacío. Ser dueño sin teacher no concede evaluación.
canAuthorQuiz(scope,sectionId):
- academicOwner: cualquier destinatario de ese curso;
- resto: sectionId no-NULL y pertenece a teacherSections;
- flags admin/superadmin por sí solos nunca habilitan pauta.

Predicado idéntico para crear, editar, publicar y GET authoring.
Reasignación draft exige canAuthorQuiz en destino actual Y propuesto, dentro de
igual curso/tenant; ampliar a NULL exige academicOwner. Section.id nunca se modifica.
Pauta compartida por quiz, no por autor: createdBy no otorga permiso duradero.
Teacher ordinario no crea/edita/ve pauta de quiz global ni de otra sección.
Un quiz global solo se autoriza académicamente a academicOwner.
Revocar is_admin retira alcance global; teacher conserva quizzes de sus secciones.

## Matriz

| Actor vigente | Metadata/lista/GET seguro | Pauta / mutaciones |
| --- | --- | --- |
| Teacher + admin dueño | Todo quiz del curso, incluidos drafts | Todo quiz del curso |
| Teacher ordinario | Draft/publicado propio; global publicado si destinatario | Solo sección teacher propia |
| Assistant | Publicados globales y de secciones assistant propias | Nunca |
| Student | Publicados globales y de secciones student propias | Nunca |
| Admin dueño sin Enrollment teacher | Solo si otro Enrollment permite lectura publicada | Nunca |
| Admin ajeno / superadmin sin Enrollment | Ningún acceso académico | Nunca |

Para teacher ordinario, lectura global publicada requiere Enrollment vigente
en el curso; no concede authoring. Lista/GET seguros aplican la misma visibilidad.
Para sectionId concreto, basta cualquier rol académico activo en esa sección
para lectura publicada; draft exige canAuthorQuiz.
Sin rol, ni ownership administrativo ni superadmin habilitan lectura académica.
Ventana opensAt/closesAt informa disponibilidad; no oculta quiz publicado.
La ventana y máximo se aplicarán al iniciar intento, en la misión posterior.

## Roles acumulados y elegibilidad estudiantil

Resolver todos los Enrollments actuales, sin escoger un único rol principal.
canAuthorQuiz prevalece para denegar rendición, aunque también exista student.
Guard requireStudentAttemptEligibility recibe DB/contexto y quiz + sección:
exige student activo en sección, destino compatible y !canAuthorQuiz.
Una sección de otro curso/tenant o quiz invisible no se filtra en respuesta.
Exportar guard desde backend/src/quizzes/quiz-access.ts; probarlo ahora.
Inicio/guardado/envío/cancelación estudiantil futuros deberán invocarlo o
compartir exactamente ese predicado, además de sus propios controles de estado.
No se declara que FR-007 HTTP esté resuelto antes de implementar intentos.
Permiso se revalida; ni guard ni authoring dependen de JWT con roles.

## Sanitización, auditoría y revocación

Proyectar DTO seguro desde allowlist, también para actor con varios roles.
GET authoring es único GET con respuestas correctas; POST/PATCH/publish usan
la misma autorización de pauta antes de devolver su representación.
Los datos publicados permanecen JSON; no se renderiza HTML en esta misión.
Auditoría metadata-only desde foundation; no serializar questions para filtrar luego.
AuditService conserva su propio scope de lectores; no ampliar permisos previos.
Eventos sectionId=NULL no son visibles al teacher ordinario; admin dueño sí.
Al reasignar, evento quiz.updated usa sectionId=NULL; no exponer snapshot de sección
origen a docentes que solo tienen acceso a la sección destino.
Eventos de sección quedan restringidos a lectores autorizados existentes.
Usuario/tenant inactivo o membresía revocada quita acceso aunque flags persistan.
Tras COMMIT de revocación, siguiente petición no obtiene datos protegidos.
401 identidad inactiva; 404 contexto/recurso invisible; 403 acción denegada visible.
Probar UC/UTFSM, dos secciones, roles acumulados y revocación de cada capa.
Probar create/PATCH/publish tras revocar User, Institution, membership, teacher o
is_admin. Concurrencia: revocación primero deniega; escritura primero puede confirmar;
tras revocación confirmada ninguna escritura usa el permiso retirado.
