# Perfiles y altas institucionales: planificación e implementación

Actualizado: 2026-11-08. Implementación autorizada; [tareas/evidencia](../../../specs/20261106-170457_perfiles-altas-usuarios/tasks.md).
Base investigada: `dev`; planificación actual en `docs/perfiles-altas-usuarios`, sin cambios desplegados.
Detalle: [requisitos](requisitos.md) · [backlog/borradores](backlog.md) · [modelo](modelo-datos.md)
· [CSV](importacion-csv.md) · [Resend](correo-resend.md) · [datos/seguridad](datos-seguridad.md) · [entregas](entregas.md) · [operación para Daniel](operacion.md).
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

## Base inicial e implementación en la rama

| Área | Base inicial investigada | Implementación actual, pendiente de integración final |
| --- | --- | --- |
| Identidad | User global, correo único normalizado y memberships separadas | bio, avatar_key y credential_version; altas sin Enrollment ni flags implícitos |
| Correo | Sin mailer | Adaptadores Resend/disabled; fake solo tests; infraestructura reportada por Daniel y recorrido real pendiente |
| Institución | Membership única; flags admin/superadmin independientes | Formulario, invitaciones y CSV autorizados por cualquiera de esos flags vigentes |
| Login | Argon2id y JWT de 900 s, User activo | Cambio de contraseña auditado; credentialVersion revoca sesiones previas en todas las instituciones |
| Cuenta propia | GET institucional, dependiente de membership | GET/PATCH /me global, contraseña y foto, con conflictos de edición por timestamp preciso |
| Administración | Lista y delegación de isAdmin exclusivas de superadmin | Lectura también para admin; delegación conserva exclusividad de superadmin |
| Búsqueda docente | /institution/{slug}/users exige teacher activo | Mantiene su permiso académico; administración reutiliza memberships |
| Frontend | Sesión en memoria y shell académico | /profile, /profile/security, /admin/users y /activate; navegación actualiza identidad sin desmontar trabajo |
| Imágenes | Sin endpoints ni proveedor | Lectura privada backend; local en desarrollo, adaptador S3 privado o disabled en producción |
| Base runtime | Escrituras generales de identidad prohibidas | Funciones específicas bajo propietario NOLOGIN, sin credencial operadora en HTTP |
| Auditoría | Eventos institucionales y académicos | Eventos globales de seguridad y auditoría atómica de invitaciones/importaciones |
| CSV | Sin alta masiva | Archivo efímero en memoria; preview, confirmación atómica, recibos y envíos recuperables |
| Retención | Sin datos derivados de altas | Comando operador con dry-run, límites 7/30 días y limpieza acotada de objetos huérfanos |

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

## Permisos aplicados en la rama

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

## Experiencia implementada en la rama

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
Resend envía desde remitente verificado; fake exclusivamente en tests, manual real opt-in.
Sin configuración, correo/fotos permanecen disabled y el resto de la aplicación inicia. Crear invitación, aceptar correo y activar son estados distintos.
CSV confirma DB antes de despachar; cuota/fallo dejan pendientes recuperables, sin workers.

Las rutas de cuenta requieren autenticación global, sin exigir membership activa.
La protección global reutiliza SessionProvider sin exigir `/me` institucional.
Navegación, retornos seguros y parsers tipados preservan el contexto académico
al cambiar nombre/foto; la validación integrada verifica este comportamiento.
Reutilizar DESIGN.md, tokens, componentes, Lucide, foco visible, ambos temas y móvil.

## Decisiones adoptadas

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
  local en desarrollo; contrato limita 2 MiB/16 MP y salida WebP 1024×1024.
- [Retención](retencion.md): archivo no se conserva; limpieza de derivados a 7/30 días aprobada.

## Estado y evidencia

La ampliación tiene cinco issues publicadas (#233–237), spec, constitución 1.6.1,
contratos y tareas trazables. Backend, migraciones, frontend y adaptadores están en
la rama; esto no acredita despliegue ni cierre automático de las issues.
Consultar [evidencia de validación](evidencia.md): la suite completa y los recorridos
integrados deben quedar aprobados antes del cierre. Daniel tiene asignados DNS,
Resend y S3; DNS/correo recibido ya reportados en #235, con S3 y recorrido
real desde AcademiX pendientes.
Ver [ADR de fronteras](../../adr/institutional-account-lifecycle.md).
CodeGraph no está disponible; la investigación usó código, SQL, contratos y tests.
