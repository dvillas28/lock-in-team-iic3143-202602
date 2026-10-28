# Data model: Cursos y participación frontend

Modelos de transporte y estado de UI; no tablas, migraciones ni SQL nuevos.
Tipos derivados de `frontend/src/lib/api/schema.d.ts`, sin duplicar DTO manualmente.
Fuentes: `docs/reference/openapi/components/schemas/{courses,sections,tenancy,common}.yaml`.

## Entidades y relaciones

| Entidad | Campos relevantes | Uso |
| --- | --- | --- |
| CurrentUser | id, name, email, institutionMembership, sectionMemberships | Contexto confirmado `/me` |
| InstitutionMembership | institution, active, isAdmin, isSuperAdmin | Tenant y capacidad de creación |
| SectionMembershipSummary | courseId, sectionId, role | Roles activos del actor; no historia |
| CourseSummary | id, code, name, term | Directorio visible, sin owner |
| Course | resumen + createdBy, createdAt | Detalle y ownership inmutable |
| Section | id, courseId, code, capacity, createdAt | Una sección pertenece a un curso |
| Enrollment | id, sectionId, user, role, active, createdAt | Roles e historia por matrícula |
| UserSummary | id, name, email, active | Persona existente; no alta de identidad |
| PageInfo | hasMore, nextCursor | Paginación opaca de personas/matrículas |

Tenant está en el contexto de solicitud: DTO no necesita agregar institutionId.
Un Course tiene varias Section; cada Section tiene varias Enrollment, incluso
varias para una misma persona con roles distintos e historia inactiva.

## Validación en fronteras

- Curso: code 1–32, name 1–200, term 1–16; initialSection requerido al crear.
- Sección: code 1–32; capacity null o entero 0–2147483647. Vacío del formulario
  representa null; cero es capacidad válida. No usar conversión que convierta vacío en cero.
- IDs: UUID; rol únicamente teacher/assistant/student; usuario destino existente activo.
- PATCH de curso/sección: al menos un campo y solo propiedades contractuales;
  no enviar PATCH vacío. createdBy y createdAt nunca son editables.
- EnrollmentCreate: userId y role. EnrollmentUpdate: exactamente role o active.
  Revocación envía active=false; no DELETE ni campos administrativos.
- Validar respuestas desconocidas antes de renderizar campos o capacidades; relación
  section.courseId y enrollment.sectionId debe corresponder al recurso solicitado.
- nextCursor opaco, limit 1–100 (default 20); no fabricar totales ni páginas completas.
- Sin reglas nuevas de formato de período, unicidad o protección del último teacher.
  La aceptación final, permisos y conflictos siempre provienen del backend.

## Capacidades de presentación

- Crear curso: membership activa con isAdmin.
- Configurar curso/secciones: isAdmin y Course.createdBy === CurrentUser.id.
- Gestionar participantes: condición anterior o teacher activo de la sección elegida.
- Buscar personas: teacher activo en institución según sectionMemberships.
- Assistant/student sin capacidad adicional: sin gestión de participantes.
- isSuperAdmin aislado no habilita ninguna de estas acciones.
- Capacidad visual puede quedar obsoleta; 403/404 desmonta datos y revalida `/me`.

## Estados y transiciones

Lectura: loading → ready(items) | empty | error | unavailable; sesión perdida
sale del árbol protegido. Refrescar no debe presentar datos revocados como vigentes.
Mutación: idle → submitting → confirmed | rejected | uncertain.
Solo confirmed aplica DTO; uncertain exige recargar estado antes de ofrecer repetir.
Conflicto no equivale a éxito; comparar estado observado y explicar resultado.

Cambio de rol: origen activo → origen inactivo + sucesor activo, ID posiblemente nuevo.
Si el rol destino ya existe, el backend puede devolver ese ID; recargar toda la lista.
Revocación: active → false conservando fila, curso y eventos. Mantener roles hermanos.
No agregar reactivación como función nueva: queda fuera del recorrido solicitado.

## Integridad e historial

Curso/sección se actualizan en backend con auditoría; Enrollment conserva historia.
Frontend no crea eventos ni reconstituye auditoría. Después de mutación, recargar
páginas desde cursor inicial para evitar cursores/filas obsoletos y refrescar `/me`
si cambió el actor. Si este pierde acceso, dejar de consultar y limpiar la vista.
