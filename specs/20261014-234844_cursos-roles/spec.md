# Feature Specification: Cursos, secciones, roles y auditoría mínima

**Feature Branch**: `feat/cursos-roles` (propuesta)
**Feature Directory**: `specs/20261014-234844_cursos-roles`
**Created**: 2026-10-14
**Status**: Clarified; ready for implementation planning
**Input**: Backend MVP de Entrega 2: Cursos, secciones, roles y auditoría mínima.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar mis cursos (Priority: P1)

Como participante, encuentro cursos y secciones según mis permisos vigentes.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Consultar el mismo curso con docente, ayudante y estudiante.

**Acceptance Scenarios**:

1. Inscripción activa permite consultar únicamente cursos y secciones autorizados.
2. Desactivar inscripción elimina el acceso dependiente de ese rol y conserva su historial; otros roles o administración propia vigentes mantienen su alcance.

### User Story 2 - Mantener secciones y participantes (Priority: P1)

Como administrador de mis cursos o docente de sección, organizo secciones y roles dentro de mi alcance.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Asignar dos roles distintos, repetir uno y desactivarlo.

**Acceptance Scenarios**:

1. Asignar un rol a miembro activo conserva contexto y genera historial.
2. Repetir un rol ya activo no lo duplica; desactivarlo conserva los otros roles.
3. Fallo al registrar historial impide confirmar el cambio de rol.
4. Admin de UC crea un curso con primera sección y rol docente; no obtiene ese privilegio en UTFSM.
5. Admin administra únicamente cursos propios; otro admin no puede modificarlo por conocer su identificador.
6. Teacher sin admin conserva contenido y participantes de sus secciones; no crea cursos ni secciones.
7. Revocar admin impide creación y administración, conservando los roles docentes vigentes.

### User Story 3 - Habilitar administradores de mi institución (Priority: P1)

Como responsable institucional, recibo acceso durante onboarding con el PM y
habilito administradores para que creen y gestionen sus cursos.

**Why this priority**: Permite delegación sin depender del PM en cada concesión.
**Independent Test**: Onboardear UC, conceder/revocar admin a un miembro activo;
UTFSM permanece intacta, sin cursos ni endpoints US2 necesarios.

**Acceptance Scenarios**:

1. Una migración de datos controlada crea Institution y su primera membership con is_super_admin e is_admin; puede reutilizar identidad global existente sin duplicarla.
2. Reejecutar onboarding no duplica registros ni repone privilegios revocados; un fallo no deja datos parciales.
3. Superadmin lista miembros activos de su institución y concede/revoca solo is_admin; cada cambio efectivo se audita.
4. Admin ordinario, teacher y superadmin de otro tenant no pueden delegar; alterar is_super_admin por API se rechaza.
5. Revocación se observa en la siguiente operación sin modificar Enrollment, ownership o datos académicos.
6. PM recupera el acceso mediante migración operativa auditada; revocar el último superadmin activo exige reemplazo en la misma transacción.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Crear Course con dueño igual al creador, primera Section y rol teacher del creador como una operación indivisible; nunca confirmar una creación sin esa sección e inscripción docente iniciales.
- **FR-002**: Permitir crear cursos solo con pertenencia institucional activa y privilegio is_admin vigente en esa institución; conceder/revocar el privilegio mediante superadmin de esa institución y auditoría, sin acceso anónimo ni administración general de usuarios.
- **FR-003**: Permitir crear/actualizar secciones y configuración del curso solo al dueño con is_admin vigente; validar código único por curso y capacidad no negativa.
- **FR-004**: Asignar, cambiar y desactivar roles teacher/student/assistant solo a miembros activos de la misma institución; admitir varios roles sin duplicar el mismo rol activo.
- **FR-005**: Limitar ayudante a lectura de seguimiento y estudiante al recorrido propio; membership no concede escrituras académicas.
- **FR-006**: Impedir vínculos entre instituciones y relaciones inconsistentes de sección/curso aun con identificadores manipulados.
- **FR-007**: Registrar historial inmutable y sanitizado junto a cada cambio sensible: institución, actor, recurso, curso y sección cuando apliquen, fecha y antes/después. Cambios académicos requieren curso; cambios de privilegios se auditan en contexto institucional. Migraciones del PM identifican origen operativo sin atribuir actor autenticado ficticio.
- **FR-008**: Conservar roles y registros académicos referenciados; revocación no elimina evidencia. La garantía de docente inicial aplica a la creación; revocar después al último teacher no borra ni transfiere el curso y no se bloquea por esa garantía.
- **FR-009**: Separar is_admin de InstitutionMembership de los roles teacher/student/assistant de Enrollment. Admin solo administra cursos cuyo creador es el actor; teacher sin admin gestiona participantes de sus secciones y contenido compartido. Ni admin ni ownership conceden por sí solos permisos docentes de evaluación.
- **FR-010**: Exponer el privilegio institucional vigente en la identidad contextual; impedir su modificación desde bodies académicos, JWT o parámetros de demostración.
- **FR-011**: Conservar creador inmutable y un dueño por curso en este MVP; excluir transferencia, coadministración, coordinador e investigador como nuevos roles.

- **FR-012**: Separar is_super_admin de is_admin en InstitutionMembership. El primero permite listar miembros activos y conceder/revocar is_admin solo dentro de esa institución; no concede acceso académico ni administración de cursos ajenos.
- **FR-013**: PM realiza onboarding con migración de datos versionada, controlada y atómica: Institution, identidad inicial nueva o existente, membership y evidencia auditada; sin secretos versionados ni reseteo de credenciales al repetir.
- **FR-014**: Concesión/revocación de is_super_admin y su recuperación permanecen operativas, sin endpoint de autoservicio; no incluir invitaciones, altas de personas por superadmin ni administración general de usuarios.

### Key Entities

- InstitutionMembership (privilegio administrativo), Course (creador/dueño), Section, Enrollment, AuditEvent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los roles se verifican en dos instituciones sin lecturas, escrituras ni relaciones cruzadas.
- **SC-002**: Cada cambio sensible confirmado tiene evento; todos los fallos conservan el estado previo.
- **SC-003**: Repetir asignación no produce duplicados y desactivar un rol conserva los demás.

- **SC-004**: Onboarding repetido y delegación aislada se verifican en dos instituciones; ninguna petición de admin ordinario modifica privilegios.

## Assumptions

- Ampliación confirmada 2026-10-16: onboarding PM y superadmin institucional para delegar is_admin; sin superadmin global.
- Decisión confirmada 2026-10-16: is_admin pertenece a InstitutionMembership, no a User; creación institucional y administración de cursos propios se distinguen de los roles académicos.
- Enrollment sigue siendo la fuente académica vigente: no agregar CourseMembership ni SectionMembership. Privilegio y ownership no reemplazan sus roles.
- Sin UI en esta misión; módulos/material, quizzes, notas, ponderaciones y sus endpoints pertenecen a sus specs, que deberán aplicar esta política.
- Pruebas exigidas: dos tenants, admin ajeno/propio, teacher sin admin, rollback y carreras de asignación/revocación.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Precondición de delegación: PM entrega los UUID de User y memberships activos ya provisionados; ver contrato de onboarding. Las altas generales de personas y su vinculación institucional son externas a esta misión.
- Dependencias: [identidad-acceso](../20261014-234744_identidad-acceso/spec.md).

## Sources & Traceability

- Casos: CU-03, CU-04; extensión US3 de onboarding/delegación autorizada el 2026-10-16, sin atribuirla a CU históricos inexistentes. Requisitos: RF8–RF12, RF25–RF26; RNF1–RNF4.
- Backlog: PREP-10, BE-09–BE-14; US3 requiere ticket adicional sin asignar responsables implícitamente; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.
