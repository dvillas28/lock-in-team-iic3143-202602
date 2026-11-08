# Perfiles: entregas, archivos afectados y aceptación

Complementa el [plan](README.md) y [datos/seguridad](datos-seguridad.md).
Backlog/issues publicadas: [registro](backlog.md). Implementación autorizada; evidencia por tarea.
Matías implementa; Daniel prepara DNS/S3. Objetivo: 2–8 noviembre de 2026 (Semana 5 E4).

## Preparación antes de implementar

1. Preparación en `docs/perfiles-altas-usuarios`; [spec formal](../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
   creado, con SPECIFY_FEATURE_DIRECTORY explícito y sin cambiar la rama.
2. Cerrar supuestos del plan: perfil global, altas por admin/superadmin, nombre
   visible, correo fijo, activación por titular y visibilidad inicial propia.
3. Constitución 1.6.1, plantillas y [ADR](../../adr/institutional-account-lifecycle.md)
   sincronizados documentalmente; no confundir alcance especificado con implementación.
4. ADR para escrituras acotadas de identidad y revocación por versión;
   [ADR S3 elegido](../../adr/s3-for-profile-photos.md), bucket por configurar. No agregar framework ni proveedor
   mientras una necesidad y su operación no estén definidas.
5. Spec/matriz/checklist y diseño técnico registrados; implementar las tareas,
   contratos y migraciones acordados. Superadmin no hereda permisos académicos.
6. Resend y despacho común se incluyen en USR-04; CSV/reanudación en USR-05;
   [ADR](../../adr/resend-for-account-invitations.md) y [plan](correo-resend.md).

## Entregas verticales sugeridas

| Orden | Historia entregable | Trabajo incluido | Criterio de cierre |
| --- | --- | --- | --- |
| 1 | Cualquier usuario edita su perfil | bio, escritura propia, auditoría global, GET/PATCH /me, UI | Cuenta sin memberships también edita; no puede editar otro User |
| 2 | Cualquier usuario cambia su contraseña | credential_version, login/guard, cambio auditado, UI Seguridad | Contraseña anterior y todos los JWT previos dejan de servir |
| 3 | Admin/superadmin da alta individual | Invitación, correo Resend, activación y lista admin | Titular activa; fallos de correo recuperables sin sobreescrituras |
| 4 | Admin/superadmin importa CSV | Preview, commit atómico y correo posterior con progreso | Sin duplicados; pausa/reanudación ante cuota o error de envío |
| 5 | Cualquier usuario gestiona su foto | Local/S3, Daniel provisiona, Matías integra validación/API/UI | Subir/reemplazar/eliminar persiste y respeta autorización |

Son incrementos funcionales; en el backlog se agrupan en cinco issues: USR-01
(preparación), USR-02 (filas 1/2/5), USR-04 (fila 3), USR-05 (fila 4), USR-08 (validación).
Cada incremento incluye migración, backend, contrato, frontend y pruebas aplicables.
La 3 usa identidad/auditoría institucional existentes; la 4 reutiliza alta de la 3;
la 5 se implementa con local/S3/disabled; Daniel configura producción por separado.
La 2 y la 3 pueden especificarse separadamente; no hacen falta fotos para crear cuentas.
Prioridad sugerida: 1 y 3 para habilitar perfiles/altas; 2 antes de uso real con
credenciales propias; 4 para volumen y 5 para completar la foto solicitada.
Objetivo semanal solicitado; revisar las 112 h preliminares y disponibilidad antes de prometer cierre.

## Mapa de cambios

Rutas desde la raíz del repositorio; archivos nuevos son propuestas, no existentes.

| Área | Archivos actuales a revisar/modificar | Adiciones propuestas |
| --- | --- | --- |
| Esquema | backend/migrations; runtime-check.ts; database.service.ts | Migraciones aditivas de perfil, invitaciones, seguridad y operaciones autorizadas |
| Identidad | backend/src/auth/auth.service.ts; auth.guard.ts; auth.controller.ts | backend/src/accounts con controller/service/validación propia |
| Institución | backend/src/institutions/membership-admin.*; institutions.service.ts | Invitaciones, lectura admin, lotes/filas CSV y confirmación |
| Auditoría | backend/src/audit/audit.service.ts y constraints SQL | Registro de eventos globales con lista de campos permitidos |
| HTTP | backend/src/app.module.ts; main.ts; http/problem.filter.ts; http/cors.ts | Registro de rutas nuevas, límites y errores específicos |
| API | docs/reference/openapi/openapi.yaml, paths y components/schemas | Contratos de cuenta/invitación/avatar; catálogo regenerado |
| Cliente | frontend/src/lib/api/client.ts; schema.d.ts; auth/validation.ts | lib/api/accounts.ts e invitations.ts; validación de perfil |
| Sesión | frontend/src/lib/auth/session.ts; navigation.ts | Protección global, recarga de perfil sin perder borradores académicos |
| Shell | components/institutions/institution-shell.tsx; auth/protected-institution.tsx | Enlaces Mi perfil/Usuarios y avatar reutilizable |
| Pantallas | frontend/src/app y components; estilos compartidos | /profile, /profile/security, /activate y /admin/users |
| Pruebas | backend/test/integration; frontend/test; e2e/specs | Casos de cuentas, invitaciones, fotos y revocación real |
| Operación | Seeds, readiness, runbooks y variables de ejemplo | Limpieza de archivos, Resend backend/fake, DNS, secretos y orígenes de activación |

No editar schema.d.ts manualmente: generar desde OpenAPI con pnpm.
No reutilizar el onboarding del operador como API web: usa privilegios distintos
y también crea Institution, que ya existe en el flujo de altas propuesto.
Preservar reejecución de seeds: no restituir contraseña, nombre, foto o permisos editados.

## Aceptación y pruebas que deben acompañar la implementación

- **Perfil propio:** student/teacher/assistant/admin/superadmin y usuario sin
  memberships pueden consultar/editar lo propio; nombre vacío, exceso de longitud,
  campos de privilegios y actor ajeno se rechazan. Texto se muestra sin HTML.
- **Concurrencia de perfil:** edición obsoleta no pisa cambios nuevos; guardar
  sin cambios no genera evento; fallo de auditoría revierte la escritura.
- **Instituciones:** admin/superadmin UC no da altas en UTFSM sin su permiso;
  teacher y flags enviados desde frontend no conceden creación; delegación solo superadmin.
- **Alta nueva:** pendiente → activada crea una sola identidad/pertenencia;
  no crea Enrollment ni isAdmin/isSuperAdmin implícitos. Aparece luego en búsquedas
  docentes autorizadas y puede matricularse con el flujo existente.
- **Cuenta existente:** aceptación requiere su login; un superadmin no puede
  cambiar credenciales, nombre ni instituciones ajenas; lo mismo aplica al admin. No revelar existencia global
  mediante diferencias entre respuestas de emisión de invitaciones.
- **Invitaciones:** códigos vencidos, revocados, usados o alterados fallan;
  retirar ambos permisos de alta al emisor invalida aceptación pendiente. Usuario/membership
  inactivos no se reactivan. Alta concurrente por mismo correo respeta unicidad.
- **Reintentos:** doble clic, timeout y aceptación concurrente no duplican datos
  ni auditoría; pérdida del código exige rotación explícita, no recuperar secretos.
- **Correo:** fake no envía; Resend se llama fuera de DB, estado accepted no implica
  entrega; cuota/rate/timeout y cierre de pestaña preservan pendientes y recibos.
- **Contraseña:** verificar actual, límites de bytes, límite de intentos y
  cambios concurrentes; jamás hash/token en respuesta, logs o auditoría.
- **Sesiones reales:** JWT anterior se rechaza en cuenta y rutas académicas de
  UC/UTFSM; login previo deja de funcionar y el nuevo sí. Cubrir carrera login/cambio.
- **SQL directo/runtime:** UPDATE/INSERT arbitrarios siguen prohibidos;
  funciones no editan terceros ni privilegios; policies nuevas conservan RLS;
  conexión devuelta al pool no conserva contexto. Probar owner no superusuario.
- **Foto:** firma/tamaño/dimensiones, archivo falso o truncado, SVG, exceso de
  píxeles y lecturas ajenas; reemplazo fallido conserva anterior, eliminación y
  reinicio/redeploy no pierden referencias ni dejan residuos sin recuperación.
- **Frontend:** estados de carga/error/éxito, cambios sin guardar, contraseñas
  limpiadas y fuera de snapshots; logout/401 descarta respuestas tardías.
  Guardar perfil actualiza avatar/nombre sin resetear trabajo académico montado.
- **Accesibilidad:** labels, teclado, foco, aria-live, contraste en ambos temas,
  móvil de 375 px; no depender solo de ocultar botones para autorización.
- **Regresión:** cursos/matrículas, permisos de docencia, intentos, notas y
  auditoría académica conservan su comportamiento y sus identificadores.

Validar por historia con node:test/integración PostgreSQL, tests frontend y
Playwright existente, omitido en esta validación por instrucción del usuario del
2026-11-08; aceptación de interfaz manual reportada por Matías. Integración solo
en base descartable `_test` con runtime real.
Ejecutar build/lint, typecheck, generación/verificación API y lint/catálogo OpenAPI.
Agregar pruebas de migración desde esquema poblado y de despliegue/readiness;
rollback de aplicación no debe borrar columnas ni deshacer contraseñas cambiadas.

## Trazabilidad

Base: CU-01/02 (identidad/contexto), CU-04 (roles), RF1–12/25/26;
RNF1–4/6/8–10. RNF8 requiere excepción explícita para avatar global por titular.
Backlog reutilizable como dependencia: BE-01/03–08, FE-01/02 y DOC-05;
no son tickets de perfiles ni se consideran ampliados automáticamente.
Crear nuevos requisitos/historias para perfil, contraseña, alta y foto en la spec;
usar CU-17–21, RF30–56 y RNF11–20 del [registro nuevo](requisitos.md), incluido CSV/Resend.
Referencias: [CU/RF/RNF](../../deliveries/2/03-use-cases-and-requirements.md),
[backlog](../../deliveries/2/08-work-plan-detail/08-work-plan-detail.md),
[ADR de permisos](../../adr/institution-admin-and-course-ownership.md).
