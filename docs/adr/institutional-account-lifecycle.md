# Fronteras de perfil propio y altas institucionales

Fecha: 2026-11-06. Estado: alcance especificado, implementación pendiente.
Complementa [administración/ownership](institution-admin-and-course-ownership.md);
no afirma que el backend actual permita escribir identidades o crear cuentas por UI.
[Spec](../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
· [Constitución 1.6.0](../../.specify/memory/constitution.md).

## Contexto

El usuario pidió perfil propio y creación administrada por formulario/CSV,
eligió invitación/activación, Resend y S3 privado en producción. El MVP previo
excluye altas generales, y el rol HTTP mantiene la identidad como solo lectura.
La ampliación debe separar cuenta global, pertenencia institucional y roles académicos.

## Decisión funcional

- User sigue siendo global: nombre visible, descripción, foto y credencial
  propios. No duplicar la identidad por institución ni crear un rol académico global.
- Usuario activo edita solo su cuenta, incluso sin pertenencias. Correo, estado,
  flags administrativos y matrículas no se cambian desde el perfil.
- Dar altas/listar pendientes/enviar/reenviar exige pertenencia activa y
  is_admin OR is_super_admin vigente del tenant; ambos flags son independientes.
  Delegar is_admin sigue siendo exclusivo de superadmin; is_super_admin es operativo.
- Invitación pendiente no crea User/membership. Al activar se crea la cuenta
  nueva o se exige login del titular existente, sin sobrescribir sus credenciales
  o reactivar revocados. La pertenencia nueva no tiene flags ni Enrollment implícitos.
- Los permisos anteriores no permiten administrar cursos ajenos, ver notas,
  obtener pauta o actuar como teacher sin la matrícula/permisos académicos existentes.
- CSV efímero confirmado: solo memoria acotada, sin archivo/copia codificada en
  disco, storage, DB, caché o logs. Datos extraídos mínimos/recibos son otra categoría.

## Integridad y complejidad

Invitaciones/lotes/filas conservan tenant y relaciones consistentes; perfil y
eventos de cuenta son globales propios con excepción acotada. El plan debe
justificar operaciones de escritura específicas sin credencial de operador HTTP,
sin privilegios genéricos ni omisiones de aislamiento.
Cambios efectivos y auditoría confirman juntos. Historial académico inmutable;
no borrar o reasignar cuentas/notas/matrículas al editar perfil o limpiar temporales.
Las cuatro tablas propuestas responden a activación, preview/recibo y auditoría
global. No agregar RBAC genérico, workers ni una cola externa para esta extensión.
Confirmar un lote crea invitaciones atómicamente; el correo externo ocurre después
y puede quedar pendiente/aceptado/incierto. No prometer entrega de buzón sin evidencia.

## Decisiones técnicas y pendientes

Proveedores elegidos: [Resend](resend-for-account-invitations.md) y
[S3 para fotos](s3-for-profile-photos.md); detalles fuera del spec funcional.
Matías implementa; Daniel prepara DNS/S3. Objetivo semanal 2–8 noviembre de 2026;
112 h preliminares no revalidadas como capacidad disponible.

PEND-01 cerrado como selección: AcademiX <no-reply@mail.academix.dvillasc.me>; DNS pendiente.
PEND-02 cerrado: limpieza 7/30 aprobada; default sin primera emisión: 30 días desde creación.
Ver [decisiones](../../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md) y
[política con campos/recibos mínimos](../planning/perfiles/retencion.md). Falta diseño/ejecución técnica.
No se ejecutan envíos, limpieza, infraestructura o migraciones por registrar este ADR.
Su formalización es un cambio documental de alcance, no evidencia de implementación.
