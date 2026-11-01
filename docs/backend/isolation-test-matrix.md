# Matriz de Escenarios de Aislamiento UC/UTFSM

**Tarea**: PREP-09 (Issue #49). **Área**: Backend / Testing.
**Misión vinculada**: [demo-aislamiento-dominios](../../specs/20261020-211552_demo-aislamiento-dominios/spec.md).

## 1. Fundamentos y Reglas Canónicas HTTP

En AcademiX el aislamiento es lógico sobre PostgreSQL compartida con RLS obligatoria.
La seguridad ante cruce de tenants se rige por el principio de **no enumeración**:

* **`401 Unauthorized`**: Ausencia de token JWT, token malformado, expirado o usuario global inactivo (`active=false`).
* **`404 Not Found` (Ocultamiento de Tenant y Recurso)**:
  * Si un actor de la UC consulta una ruta de la UTFSM (`/api/v1/institution/utfsm/...`), la API **debe responder `404` y nunca `403`**. Responder `403` confirmaría la existencia del tenant o recurso ajeno.
  * Si un actor solicita un ID ajeno bajo el path legítimo (ej. curso UTFSM en `/institution/uc/courses/{id}`), responde `404`.
  * Membresías inactivas o revocadas (`active=false`) reciben `404` en el contexto institucional.
* **`403 Forbidden` (Permiso insuficiente intra-tenant)**:
  * Aplica **únicamente cuando el actor sí pertenece a la institución**, pero su rol no autoriza la acción (ej. estudiante intentando crear curso o consultar pauta).
* **`400 Bad Request`**: Slugs malformados (regex `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`) o payloads corruptos.

## 2. Catálogo de Actores de Prueba

Utiliza los fixtures sembrados en `demo-manifest.ts` y `seeds/demo.ts`:

| Actor | Membresía UC | Membresía UTFSM | Roles de Sección | Propósito en la Matriz |
| :--- | :--- | :--- | :--- | :--- |
| **Superadmin UC** | Activa (`superAdmin`) | Sin membresía | — | Gestión institucional UC; vetado en UTFSM. |
| **Admin UC** | Activa (`admin`) | Sin membresía | Creador cursos UC | Autoría y gestión UC; vetado en UTFSM. |
| **Teacher UC** | Activa (ordinaria) | Sin membresía | `teacher` Sec 1 UC | Docencia UC; vetado en UTFSM y en Sec 2 UC. |
| **Assistant UC** | Activa (ordinaria) | Sin membresía | `assistant` Sec 1 UC | Apoyo lectivo UC; sin pautas ni notas. |
| **Student UC** | Activa (ordinaria) | Sin membresía | `student` Sec 1 UC | Rendición y notas propias; vetado en UTFSM. |
| **Multi-Tenant** | Activa (ordinaria) | Activa (ordinaria) | `student` en ambas | Prueba de cambio de contexto sin fuga. |
| **Revocado UC** | Inactiva (`active=false`) | Sin membresía | — | Prueba de corte de acceso institucional. |
| **Inactivo Global**| Inactiva (`user.active=false`) | — | — | Prueba de bloqueo en login global. |

## 3. Matriz Maestra de Escenarios

Cada escenario sigue la estructura **Given-When-Then** para pruebas parametrizadas (`test.each`):

| ID | Grupo | Actor (Given) | Solicitud (When) | Payload / IDs | Esperado (Then) | Invariante / Verificación |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **AUT-01** | Identidad | Anónimo | `GET /api/v1/institution/uc/me` | Sin header `Authorization` | `401` | Bloqueo en AuthGuard. |
| **AUT-02** | Identidad | Token corrupto | `GET /api/v1/institution/uc/me` | Bearer `invalido.firma` | `401` | Rechazo de firma JWT. |
| **AUT-03** | Identidad | Inactivo Global | `POST /api/v1/auth/login` | Credenciales de inactivo | `401` | Credencial bloqueada globalmente. |
| **SPO-01** | Spoofing | Multi-Tenant | `GET /api/v1/institution/uc/me` | Header `Host: utfsm.academix...` | `200` | Resuelve UC; ignora Host. |
| **SPO-02** | Spoofing | Multi-Tenant | `GET /api/v1/institution/uc/me` | Header `X-Institution-Id: utfsm` | `200` | Resuelve UC; ignora headers custom. |
| **SPO-03** | Spoofing | Teacher UC | `GET /api/v1/institution/BAD_SLUG!/me` | Slug malformado en path | `400` | Rechazo por regex de validación. |
| **TEN-01** | Tenancy | Teacher UC | `GET /api/v1/institution/utfsm/courses` | Path ajeno UTFSM | `404` | Anti-enumeración (no revela UTFSM). |
| **TEN-02** | Tenancy | Revocado UC | `GET /api/v1/institution/uc/courses` | Membresía inactiva UC | `404` | Acceso revocado indistinguible de 404. |
| **TEN-03** | Tenancy | Multi-Tenant | `GET /api/v1/institution/uc/courses` | Path UC | `200` | Retorna solo cursos UC. |
| **TEN-04** | Tenancy | Multi-Tenant | `GET /api/v1/institution/utfsm/courses` | Path UTFSM alternado | `200` | Retorna solo cursos UTFSM; sin leak. |
| **XTR-01** | Lectura Cruzada | Teacher UC | `GET /api/v1/institution/uc/courses/{id_utfsm}` | ID de curso UTFSM bajo path UC | `404` | Recurso ajeno no visible. |
| **XTR-02** | Lectura Cruzada | Teacher UC | `GET /api/v1/institution/uc/quizzes/{id_utfsm}` | ID de quiz UTFSM bajo path UC | `404` | Pauta/evaluación ajena oculta. |
| **XTR-03** | Lectura Cruzada | Student UC | `GET /api/v1/institution/uc/grades` | Query sin filtro en BD | `200` | RLS fuerza aislamiento en tabla grades. |
| **XTW-01** | Mutación Cruzada| Admin UC | `POST /api/v1/institution/uc/courses` | Body con `institution_id: utfsm` | `400` | Regla Path vs Body: body no fija tenant. |
| **XTW-02** | Mutación Cruzada| Admin UC | `POST /api/v1/institution/uc/sections` | Body con `course_id: id_utfsm` | `404` | FK compuesta rechaza curso foráneo. |
| **XTW-03** | Mutación Cruzada| Teacher UC | `POST /api/v1/institution/uc/enrollments` | Inscribir `user_id` de UTFSM en UC | `404` | Membresía de usuario debe ser UC. |
| **XTW-04** | Mutación Cruzada| Teacher UC | `POST /api/v1/institution/uc/grades` | Calificar `student_id` de UTFSM | `404` | Matrícula debe pertenecer a sección UC. |
| **ROL-01** | Roles Internos | Student UC | `POST /api/v1/institution/uc/courses` | Crear curso en UC | `403` | Rol insuficiente intra-tenant. |
| **ROL-02** | Roles Internos | Assistant UC | `GET /api/v1/institution/uc/quizzes/{id}/key` | Solicitar pauta de corrección | `403` | Ayudante no accede a pautas. |
| **ROL-03** | Roles Internos | Student UC | `GET /api/v1/institution/uc/quizzes/{id}/key` | Solicitar pauta de corrección | `403` | Estudiante no accede a pautas. |
| **ROL-04** | Roles Internos | Teacher UC Sec 1| `PUT /api/v1/institution/uc/sections/{sec2}/grades`| Calificar sección no asignada | `403` | Permiso acotado a sección asignada. |
| **AUD-01** | Auditoría | Teacher UC | `GET /api/v1/institution/uc/audit-events` | Consultar auditoría | `403` | Solo superadmin/admin institucional. |
| **AUD-02** | Auditoría | Superadmin UC | `GET /api/v1/institution/utfsm/audit-events` | Consultar auditoría UTFSM | `404` | Auditoría ajena completamente oculta. |

