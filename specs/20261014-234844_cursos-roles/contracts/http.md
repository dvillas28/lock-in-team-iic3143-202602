# Contrato HTTP: Cursos y roles

Contrato implementado y alineado con OpenAPI canónico y tipos regenerados.
Base: /api/v1/institutions/{institutionSlug}; JWT Bearer, JSON camelCase.
Conservar operationIds existentes. No se implementan rutas modules de sections.yaml.

## US1: lecturas

| Método y ruta relativa | operationId | Respuesta |
| --- | --- | --- |
| GET /courses | listCourses | 200 {items: CourseSummary[]} |
| GET /courses/{courseId} | getCourse | 200 Course |
| GET /courses/{courseId}/sections | listSections | 200 {items: Section[]} |
| GET /sections/{sectionId} | getSection | 200 Section |
| GET /me | getCurrentUser (conservar existente) | 200 CurrentUser |

Cursos ordenados por code,term,id sin duplicados; secciones por code,id.
/me conserva estructura y agrega institutionMembership.isAdmin e isSuperAdmin boolean readOnly;
sectionMemberships deja de ser [] fijo: incluye solo Enrollment activo del actor,
con courseId,sectionId,role. No exponer otras personas ni roles revocados.
CourseSummary: id,code,name,term. Course agrega createdAt y createdBy UUID readOnly.
Section: id,courseId,code,capacity nullable,createdAt. Sin institutionId en bodies.
Ver [autorización](authorization.md) para scope de cada lectura.

## US2: creación y mantenimiento

| Método y ruta relativa | operationId | Permiso / resultado |
| --- | --- | --- |
| POST /courses | createCourse (nuevo) | Admin institucional; 201 Course |
| PATCH /courses/{courseId} | updateCourse | Admin dueño; 200 Course |
| POST /courses/{courseId}/sections | createSection | Admin dueño; 201 Section |
| PATCH /sections/{sectionId} | updateSection | Admin dueño; 200 Section |
| GET /sections/{sectionId}/enrollments | listSectionEnrollments | Staff autorizado; página |
| POST /sections/{sectionId}/enrollments | createSectionEnrollment | Admin dueño/teacher propio; 201 o 200 |
| PATCH /sections/{sectionId}/enrollments/{enrollmentId} | updateSectionEnrollment | Admin dueño/teacher propio; 200 Enrollment |
| GET /courses/{courseId}/audit-events | listCourseAuditEvents | Eventos según scope; página |

POST curso body: {code,name,term,initialSection:{code,capacity?}}.
Servidor asigna createdBy y Enrollment teacher; Location apunta a curso creado.
PATCH curso admite code,name,term; PATCH sección code,capacity; POST sección
code,capacity?. capacity omitida al crear equivale null, entero entre 0 y 2147483647.
Cadenas trim no vacías: code sección/curso máximo 32, name 200, term 16.
UUID válidos; slug con validación existente. Rechazar propiedades extra,
tipos incorrectos y PATCH vacío con 400; restricciones de negocio 422.
No aceptar cambio de dueño, curso de sección, institución o rol vía /me.
Unicidad curso(code,term) o sección(code) dentro del scope produce 409.

POST enrollment body {userId,role}; miembro/usuario destinatario debe estar activo.
role enum teacher/student/assistant. Devuelve 201 si crea, 200 si ya está activo
sin nueva auditoría. Location al crear. Quitar Idempotency-Key obligatorio de
esta operación: unicidad persistida define repetición; no cambiar otras rutas.
Enrollment conserva id,sectionId,user:{id,email,name,active},role,active,createdAt.
PATCH enrollment: {role?} o {active?}, exactamente uno; ambos juntos dan 400.
Cambiar role requiere origen activo, de otro modo 409; mismo role es no-op.
Cambio desactiva origen y devuelve sucesor nuevo o destino ya activo (id puede variar).
active=false repetido es no-op; active=true revalida pertenencia y unicidad (409).
Se permite desactivar al último teacher: la garantía de docente inicial no es
un requisito permanente; se conservan curso, createdBy e historial.
GET participantes incluye estados activos e inactivos, nunca otras secciones.

## Paginación y auditoría

Participantes y audit usan limit 1..100/default 20 y cursor opaco validado.
Respuesta PageInfo canónica: items, nextCursor y hasMore; no agregar campos.
Orden estable por (created_at,id) en Enrollment, (occurred_at,id) en AuditEvent.
Cursor base64url JSON con última fecha/UUID y scope/filtros; revalidar siempre
contexto autorizado, rechazar cursor inválido o de otro scope con 400.
Audit mantiene filtros action,resourceType,resourceId,actorUserId,sectionId,from,to.
Fechas ISO UTC válidas y from<=to; filtros no amplían permisos; sección ajena 404.
Primero aplicar admin dueño: recibe todos los eventos del curso, incluidos
sectionId=null. Solo si no cumple esa condición, teacher recibe eventos de sus
secciones activas, nunca sectionId=null. Con ambas condiciones prevalece admin dueño.
AuditEvent conserva DTO canónico; courseId nullable solo para evento institucional,
que nunca se retorna desde esta ruta. Snapshot sanitizado, sin endpoints mutantes.

## US3: onboarding y delegación

Ver [onboarding.md](onboarding.md) para GET /memberships y PUT
/memberships/{membershipId}/course-admin; ambas exigen superadmin del tenant.
No hay endpoint de provisioning ni para cambiar isSuperAdmin.

## Errores e integración

400 entrada inválida, 401 identidad, 403 permiso, 404 invisibilidad, 409 conflicto,
422 dominio, 500 fallo inesperado, 503 dependencia; application/problem+json común.
La creación repetida de curso devuelve 409 sin duplicar sección ni eventos.
Agregar respuestas faltantes al OpenAPI, mantener las rutas futuras sin implementarlas.
Actualizar schemas CourseCreate, Course.createdBy, InstitutionMembershipSummary.isAdmin/isSuperAdmin,
EnrollmentUpdate y AuditEvent.courseId/actorUserId; regenerar frontend/src/lib/api/schema.d.ts.
