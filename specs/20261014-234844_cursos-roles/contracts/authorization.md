# Contrato de autorización

## Requisitos comunes

JWT solo identifica User. Revalidar User, Institution e InstitutionMembership
activos por solicitud; institution_id viene del slug resuelto, actor del guard.
No aceptar userId del actor, createdBy, isAdmin o institutionId desde bodies.
userId en Enrollment es destinatario explícito, no identidad del actor.
Única escritura HTTP de isAdmin: endpoint de delegación protegido por is_super_admin.
isSuperAdmin siempre readOnly; no puede concederse por API.
Admin efectivo del curso = membership.is_admin AND course.created_by=actor.
La mera posesión del boolean no permite descubrir cursos ajenos.

| Operación | Permiso |
| --- | --- |
| Crear curso | is_admin institucional vigente |
| Ver curso | Admin dueño o Enrollment activo en alguna sección |
| Ver sección | Admin dueño o Enrollment activo en esa sección |
| Listar secciones | Todas al admin dueño; propias al resto |
| Configurar curso / crear o editar secciones | Admin dueño |
| Listar participantes | Admin dueño; teacher/assistant en sección propia |
| Asignar/cambiar/desactivar roles | Admin dueño o teacher de sección destino |
| Consultar auditoría curso | Admin dueño: todos los eventos de ese curso |
| Consultar auditoría docente | Solo eventos de sus secciones teacher activas |
| Student sin staff ni admin dueño | Sin listado de participantes ni auditoría |
| Listar memberships / conceder o revocar is_admin | is_super_admin vigente del tenant |
| Asignar/recuperar is_super_admin | Solo onboarding/migración operativa controlada |

Los roles múltiples se unen solo para acciones permitidas y su scope.
En consulta de auditoría, evaluar primero admin dueño y después teacher de sección;
si tiene ambos, prevalece el acceso administrativo a todo su curso.
El flag is_admin sin ownership nunca amplía el alcance docente de un curso ajeno.
Teacher sin admin sigue autor de contenido compartido (misión posterior).
Evaluar/liberar notas exige teacher: admin ownership amplía scope, no sustituye rol.
Assistant no escribe; student recibe datos propios en sus misiones.
Los conflictos pauta/intento estudiantil siguen las reglas de quizzes, fuera de aquí.

## Errores y revocación

401: identidad inválida/inactiva. 404: institución/recurso inexistente o invisible.
403: recurso visible pero acción prohibida; estudiante de sección ve su metadata
pero no puede listar sus participantes. Admin ajeno sin Enrollment obtiene 404.
Membership destinataria ausente/inactiva: 404 uniforme; sin datos de otra institución.
Revocar is_admin conserva created_by y Enrollments; solo persiste acceso por roles.
Revocar User/membership impide todo acceso aunque is_admin siga true.
Nada se autoriza mediante URL experience, rol demo ni contenido de JWT.
Sin caches; Cache-Control:no-store en respuestas protegidas.

## Escritura y eventos

Seguir orden de locks del modelo; comprobar permisos dentro de la transacción.
Si falla auditoría, no confirmar cambio; no devolver éxito antes del COMMIT.
Errores de constraint: 409 en unicidad, 422 en invariantes de dominio conocidas;
fallos inesperados 500, DB inaccesible 503, siempre Problem sanitizado.
Eventos incluyen actor, institution, recurso, fecha y before/after permitidos.
Cambios de privilegios llevan courseId/sectionId=null; no aparecen en auditoría
de cursos. Delegación HTTP usa actor autenticado; migraciones de onboarding o
superadmin usan actor nulo y source=operatorMigration con operatorRef/operationId.

## Onboarding y delegación

Contrato y validación en [onboarding.md](onboarding.md). is_super_admin no implica
is_admin, Enrollment, visibilidad de cursos ajenos ni acceso a pauta/notas.
Primera membership recibe ambos flags de forma explícita durante onboarding.
API solo modifica is_admin en membership existente y activa del mismo tenant;
no invita personas, modifica User ni concede otro superadmin.
