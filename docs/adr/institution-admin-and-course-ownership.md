# Admin institucional y dueño de curso

Fecha: 2026-10-16. Estado: aceptado por usuario; implementación pendiente.

## Decisión

Agregar `is_admin` e `is_super_admin` boolean NOT NULL DEFAULT false a
`institution_memberships`. superadmin solo delega is_admin en su institución.
User conserva identidad global; Enrollment conserva teacher/student/assistant.
Una persona puede ser admin en UC y no admin en UTFSM sin duplicar User.
No existe administrador institucional con acceso general a datos académicos.

Crear curso exige usuario, institución y membership activos, e is_admin vigente.
El servidor fija `Course.created_by` al actor; ese campo es inmutable y expresa
el único dueño del curso. El docente inicial se exige al crear; revocarlo después
conserva curso e historia. Crear Course, Section inicial, Enrollment teacher y
sus eventos ocurre en una transacción. No se acepta owner desde el cliente.

Administrar configuración y secciones exige is_admin y ownership. Admin puede
listar sus cursos y sus secciones aunque ya no conserve Enrollment; ese acceso
administrativo no habilita automáticamente contenido docente, pauta o notas.
Teacher gestiona contenido compartido y participantes de sus secciones;
assistant consulta seguimiento propio y student usa el recorrido propio.
El dueño admin gestiona participantes de todas sus secciones y eventos del curso;
en auditoría ese alcance prevalece aunque también tenga rol teacher.
Las funciones docentes de evaluación siguen exigiendo teacher activo; ownership
solo amplía el alcance a las secciones del curso cuando admin sigue vigente.

Un admin ajeno no adquiere visibilidad ni permisos por tener el boolean.
Si además es teacher del curso ajeno, conserva solo el alcance docente ordinario.
Revocar is_admin retira creación/administración, pero conserva Enrollment y datos.
Revocar membership o User impide todo acceso al contexto afectado.

## Concesión y auditoría

El PM realiza onboarding por migración de datos versionada, creando Institution,
identidad inicial nueva/existente y membership con ambos flags explícitos.
Sin credenciales en código; repetición no repone privilegios ni resetea passwords.
El superadmin lista miembros activos y concede/revoca is_admin por API autenticada.
No concede is_super_admin ni administra cursos ajenos; este último flag solo
se asigna/recupera por operación controlada del PM, sin autoservicio.
No implica is_admin: ambos flags son independientes y se validan en DB.
La especificación detallada está en
[onboarding y delegación](../../specs/20261014-234844_cursos-roles/contracts/onboarding.md).

Eventos institucionales admiten course_id/section_id nulos. Onboarding y cambios operativos de
superadmin admiten actor nulo únicamente con source=operatorMigration y
operatorRef/operationId; delegación HTTP exige actor autenticado. Los cambios
académicos requieren curso y sección consistente; los eventos institucionales
no aparecen en historial de curso. Seed nunca repone privilegios revocados.

## Alternativas y límites

Se descarta User.is_admin: extendería privilegios entre instituciones.
Se descarta inferir admin de teacher: eliminaría la distinción confirmada.
No se agregan coordinador, tablas de grants, RBAC genérico ni is_admin en Enrollment.
Un dueño inmutable por curso; transferencia y varios administradores requieren
ampliar el diseño. El boolean no habilita administrar otros usuarios o tenants.

## Impacto

Alinea spec cursos-roles, ADR UI y modelos con la decisión del usuario.
OpenAPI y futuros módulos de contenido/evaluación deben aplicar la matriz.
Los artefactos históricos que todavía equiparen teacher y admin quedan
subordinados a esta decisión; su alineación se rastrea en tasks.md.
