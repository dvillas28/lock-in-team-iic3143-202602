# Contract: Cursos y participación frontend

Consumidor del OpenAPI existente; este documento no amplía la API.
Prefijo privado `B = /api/v1/institution/{institutionSlug}`.
Slug desde resolver de dominio configurado, nunca desde perfil o campo del formulario.
Todas las operaciones pasan por Session.request con Bearer capturado y no-store.

## Navegación y superficies

| Ruta browser | Contenido | Historia |
| --- | --- | --- |
| `/courses` | Cursos visibles, vacío real, formulario de alta si isAdmin | US1/US2 |
| `/courses/{courseId}` | Curso confirmado, roles/secciones, configuración propia | US1/US2 |
| `/courses/{courseId}/sections` | Secciones visibles, configuración y participantes autorizados | US1/US2/US3 |

Participantes se seleccionan dentro del panel de secciones; sin ruta nueva.
Navegación conserva contexto por dominio, no agrega tenant ni perfil a URL.
Validar UUID y relaciones antes de pintar; 404 ajeno no confirma existencia.
Shell indica institución, identidad, roles y alcance; enlaces futuros no fabrican datos.

## Operaciones existentes

| Operación | HTTP relativo a B | Request → respuesta |
| --- | --- | --- |
| listCourses | GET `/courses` | — → items CourseSummary |
| getCourse | GET `/courses/{courseId}` | — → Course |
| createCourse | POST `/courses` | CourseCreate → Course (201) |
| updateCourse | PATCH `/courses/{courseId}` | CourseUpdate → Course |
| listSections | GET `/courses/{courseId}/sections` | — → items Section |
| getSection | GET `/sections/{sectionId}` | — → Section |
| createSection | POST `/courses/{courseId}/sections` | SectionCreate → Section (201) |
| updateSection | PATCH `/sections/{sectionId}` | SectionUpdate → Section |
| listSectionEnrollments | GET `/sections/{sectionId}/enrollments` | cursor/limit → items Enrollment + PageInfo |
| createSectionEnrollment | POST `/sections/{sectionId}/enrollments` | userId, role → Enrollment (200/201) |
| updateSectionEnrollment | PATCH `/sections/{sectionId}/enrollments/{enrollmentId}` | role O active → Enrollment |
| searchInstitutionUsers | GET `/users` | search/cursor/limit → items UserSummary + PageInfo |

**Dependencia runtime**: [DEP-FE-SEARCH-001](../dependencies/participant-search.md).
searchInstitutionUsers está declarado, pero no implementado
en backend. Mockear contrato para desarrollo; bloquear aceptación real de búsqueda
hasta que otra misión entregue handler autorizado. No alterar API en esta misión.

Esquemas exactos: `docs/reference/openapi/components/schemas/{courses,sections,tenancy}.yaml`.
Paginación: `common.yaml#/PageInfo`; búsqueda `parameters.yaml#/Search`.
Alta de curso devuelve Course, no incluye sección ni teacher: consultar listSections
para obtener IDs y `/me` para recuperar Enrollment inicial confirmado.

## Permisos de UI y alcance

| Acción | Condición para ofrecerla |
| --- | --- |
| Ver cursos/secciones | Solo respuestas autorizadas backend |
| Crear curso | isAdmin activo |
| Editar curso, crear/editar sección | isAdmin activo + createdBy=actor |
| Listar/gestionar participantes en esta vista | Admin dueño o teacher activo de sección |
| Buscar personas existentes | Teacher activo institucional |
| Asignar con UUID conocido | Admin dueño sin teacher; validación final backend |

La API admite lectura assistant de matrículas; esta superficie no la utiliza por FR-007.
No consultar `/memberships` ni conceder flags institucionales. Un teacher de otro
curso puede usar búsqueda institucional, pero no administrar secciones ajenas.
Sin owner confirmado, acciones de configuración permanecen ocultas.

## Confirmación, historia y concurrencia

- CreateEnrollment 200 es rol ya activo, no alta nueva; 201 sí es alta.
- PATCH contiene una sola propiedad. Cambio de rol puede devolver ID sucesor o
  matrícula destino ya activa; no mutar por userId ni borrar fila origen.
- Revocar requiere diálogo previo con persona/rol/sección, botón cancelar inicialmente
  enfocado, Escape y retorno al disparador; último teacher se puede revocar.
- Recargar historial después de confirmar; varias matrículas/roles no se colapsan.
- No optimistic success, reintentos automáticos ni idempotency keys inventadas.
- Timeout/red en mutación deja resultado incierto: consultar listado/detalle antes
  de habilitar repetición. Alta de curso se reconcilia por code/term observado;
  si no se puede resolver, mantener incertidumbre y pedir revisión manual del estado.
  Alta de sección: recargar listSections del curso y revisar código/capacidad antes
  de permitir repetir; coincidencia es estado observado, no confirmación de autoría.
  Si la consulta falla o no resuelve el resultado, mantener bloqueo e incertidumbre.
- Capturar generación, slug, recurso y secuencia; cleanup impide finalizaciones de
  una sección anterior, búsquedas viejas o sesión previa. Refrescar `/me` ante autocambios.

## Errores y estados

| Resultado | Comportamiento esperado |
| --- | --- |
| 400/422 | Errores de campo anunciados y asociados; conservar valores no sensibles |
| 401 | Session invalida acceso; limpiar árbol y volver a login |
| 403/404 | Sin datos del recurso; revalidar contexto sin bucle automático |
| 409 | Conflicto explícito; recargar estado, nunca declarar éxito ficticio |
| 500/503/red | Error recuperable de lectura; mutación incierta si no hay confirmación |
| StaleSessionError | Descartar resultado; no sobrescribir estado de nueva sesión |

Loading, empty, error y unavailable son estados distintos; empty requiere 200 válido.
Formularios bloquean doble envío. Tras perder permisos no conservar filas privadas visibles.
Avisos con role=status/alert; labels persistentes, foco visible, Lucide, tokens CSS,
375 px, ambos temas y prefers-reduced-motion según DESIGN.md.
