# Plan propuesto: altas institucionales y perfil personal

Fecha: 2026-11-06. Estado: investigación y propuesta; sin implementación.
Base investigada: `dev`; planificación actual en `docs/perfiles-altas-usuarios`, sin cambios desplegados.
Detalle: [requisitos](requisitos.md) · [backlog/borradores](backlog.md) · [modelo](modelo-datos.md)
· [CSV](importacion-csv.md) · [Resend](correo-resend.md) · [datos/seguridad](datos-seguridad.md) · [entregas](entregas.md).
Matías implementa; Daniel administra DNS y levanta S3. Objetivo: 2–8 de noviembre de 2026.
[Spec formal](../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md),
[matriz](../../../specs/20261106-170457_perfiles-altas-usuarios/traceability.md) y [pendientes](../../../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md).

## Conclusión

Sí se pueden agregar atributos a `users` para descripción y foto sin duplicar
personas ni cambiar matrículas. Eso resuelve almacenamiento, pero la feature
también necesita permisos de escritura, API, pantallas, activación de cuentas,
revocación de sesiones, auditoría y almacenamiento persistente de imágenes.
Recomendación: conservar User global + InstitutionMembership + Enrollment y
entregar cada capacidad de punta a punta, sobre NestJS, Next.js, PostgreSQL y pnpm.

## Qué existe y qué falta

| Área | Evidencia actual | Cambio necesario |
| --- | --- | --- |
| Identidad | `users`: UUID, email, password_hash, name, active y timestamps | Añadir bio, avatar_key y credential_version |
| Correo | Índice único global sobre `lower(btrim(email))` | Reutilizar normalización y manejar concurrencia |
| Envío de correos | Sin integración de mailer | Resend elegido; preparar dominio, SDK backend y estado de envío |
| Institución | Membership única por institución/usuario; is_admin e is_super_admin | Alta controlada de nuevas pertenencias |
| Rol académico | Enrollment por sección: teacher/student/assistant | Reutilizar asignación; no crear un rol global |
| Login | Argon2id + JWT de 900 s; guard consulta User activo | Cambio de contraseña e invalidación por versión |
| Cuenta actual | Solo `GET /api/v1/institution/{slug}/me` | Consulta/edición global de cuenta propia |
| Administración | Lista memberships y cambia isAdmin por API, solo superadmin | Lista para admin/superadmin y alta formulario/CSV |
| Búsqueda | `/institution/{slug}/users` exige teacher activo | Superadmin usa memberships; no ampliar búsqueda docente |
| Frontend | Sesión en memoria, shell, avatar con inicial y cierre de sesión | Mi perfil, Seguridad, foto y administración |
| Imágenes | Sin endpoints ni proveedor implementado; JSON limitado a 4096 bytes | S3 privado en producción y archivos locales en desarrollo, pendientes de integración |
| Base runtime | Usuarios de solo lectura; INSERT/UPDATE sensibles prohibidos | Operaciones específicas de identidad, sin credencial de operador HTTP |
| Auditoría | Eventos institucionales/académicos con constraints y snapshots permitidos | Eventos globales de cuenta y nuevas acciones institucionales |

Fuentes implementadas, prioritarias sobre planes históricos:

- [Tablas iniciales](../../../backend/migrations/20261015000100_institutional-foundation.sql),
  [correo único](../../../backend/migrations/20261015000400_unique_login_email.sql),
  [roles e historia](../../../backend/migrations/20261016000100_courses_roles.sql).
- [Barrera de escritura/RLS](../../../backend/migrations/20261020000200_tenant_isolation.sql),
  [verificación runtime](../../../backend/src/database/runtime-check.ts).
- [Autenticación](../../../backend/src/auth/auth.service.ts),
  [guard](../../../backend/src/auth/auth.guard.ts),
  [delegación](../../../backend/src/institutions/membership-admin.service.ts).
- [Sesión](../../../frontend/src/lib/auth/session.ts),
  [shell](../../../frontend/src/components/institutions/institution-shell.tsx),
  [protección institucional](../../../frontend/src/components/auth/protected-institution.tsx).

## Permisos propuestos

La ampliación solicitada autoriza **admin o superadmin de la institución**, no
operador global. Los flags son independientes del rol académico y entre sí.

| Actor | Mi perfil / contraseña / foto | Dar alta en su institución | Delegar isAdmin | Asignar roles de sección |
| --- | --- | --- | --- | --- |
| Usuario activo, tenga o no memberships | Propios | No | No | Solo si cumple permiso académico existente |
| Admin institucional | Propios | Sí, formulario/CSV | No | Según ownership/teacher existentes |
| Superadmin institucional | Propios | Sí, nuevo permiso | Sí, API existente | Sin permiso adicional por ese flag |
| Operador | Provisionamiento operativo existente | Fuera de UI | Operativo | Fuera de este plan |

Ningún formulario de perfil acepta userId, active, email, institutionId, roles,
isAdmin ni isSuperAdmin. El servidor deriva actor e institución autorizada.
Promover superadmins y recuperar ese privilegio sigue siendo una operación del PM.
Editar el perfil o crear una pertenencia no concede acceso a cursos ni notas.

## Experiencia propuesta

1. **Mi perfil**, `/profile`: nombre visible, correo de solo lectura y descripción
   en texto plano; guardar, cancelar, errores por campo y aviso de cambios pendientes.
   Mostrar explícitamente que nombre, foto y descripción se comparten entre instituciones.
2. **Seguridad**, `/profile/security`: contraseña actual, nueva y confirmación;
   tras éxito se cierran todas las sesiones y se solicita nuevo login.
3. **Foto**, dentro de Mi perfil: previsualizar, subir, reemplazar y eliminar;
   conservar inicial si no hay foto y mantener la anterior si falla la subida.
4. **Usuarios institucionales**, `/admin/users`: admin o superadmin, miembros activos
   e invitaciones pendientes; formulario name/email o CSV con preview/confirmación.
   Conceder isAdmin sigue siendo una acción separada exclusiva de superadmin.
5. **Activación**, `/activate`: el titular establece su contraseña si es nuevo;
   si ya tiene cuenta, inicia sesión con esa identidad y acepta la nueva pertenencia.

El alta elegida queda pendiente hasta la activación: crear la invitación no
crea todavía User ni membership. Se evita que el superadmin conozca contraseñas
o cambie una cuenta existente de otra institución. El listado distingue pendiente/activo.
Resend enviará el enlace desde un remitente verificado; correo fake en local/CI
y prueba real opt-in. Crear invitación, aceptar correo y activar son estados distintos.
CSV confirma DB antes de despachar; cuota/fallo dejan pendientes recuperables, sin workers.

Las rutas de cuenta requieren autenticación global, sin exigir membership activa.
Reutilizar SessionProvider y añadir protección global: ProtectedInstitution depende
de `/me` institucional y bloquearía a una cuenta sin pertenencias.
Actualizar navegación, retornos seguros, shell y parsers tipados; evitar remontar
todo el espacio académico por cambiar nombre/foto, hoy incluidos en la key del shell.
Reutilizar DESIGN.md, tokens, componentes, Lucide, foco visible, ambos temas y móvil.

## Decisiones y detalles por cerrar en la especificación

- Perfil global; nombre editable como nombre visible, sin agregar identidad legal/RUT.
- Descripción opcional de hasta 500 caracteres; nombre entre 1 y 200 tras trim.
- Correo no editable inicialmente: cambiarlo afecta login/unicidad y requiere verificación propia.
- Alta con activación por titular; sin contraseñas compartidas o predefinidas.
- Resend elegido por el usuario; dominio, secreto y orígenes se configuran al implementar.
- CSV name,email: validar primero y confirmar lote completo sin errores; ver contrato enlazado.
- Archivo CSV efímero confirmado: solo memoria durante procesamiento, sin guardar copia.
- Perfil y foto inicialmente consultables por su dueño; exponerlos a compañeros
  exige definir visibilidad por curso/institución, DTO mínimo y consentimiento pertinente.
- Recuperación de contraseña olvidada, borrado de cuenta, cambios de correo,
  perfiles públicos, importación de matrículas y edición global de cuentas ajenas quedan fuera.
- Fotos: [S3 privado en producción](../../adr/s3-for-profile-photos.md), Daniel provisiona;
  local en desarrollo. La spec debe fijar límites y configuración concreta del bucket.
- [Retención](retencion.md): archivo no se conserva; limpieza de derivados a 7/30 días aprobada.

## Alcance documental

La ampliación está registrada en requisitos, backlog y borradores de issues; USR-01
ya tiene spec y constitución 1.6.0 sincronizados; remitente/limpieza resueltos.
USR-01 aún requiere diseño técnico detallado; DNS y configuración siguen por ejecutar.
Ver [ADR de fronteras](../../adr/institutional-account-lifecycle.md). Los documentos base
conservan el MVP implementado y enlazan la extensión pendiente, sin fingir nuevas capacidades.
CodeGraph fue intentado porque existe `.codegraph/`, pero el ejecutable no está
disponible; la investigación continuó con lectura de código, SQL, contratos y tests.
