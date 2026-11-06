# Borrador de issue: USR-01 Especificar perfiles y altas institucionales por formulario y CSV

Estado: borrador local / Todo. **No publicar en GitHub por instrucción del usuario.**
Registro: 2026-11-06. Sin implementación; responsable: Matías (matiaraos).
Objetivo: semana 2–8 de noviembre de 2026, America/Santiago; estimación aún preliminar.

Cerrar la especificación por historias y reconciliar alcance/constitución/ADR con el nuevo permiso institucional. Registrar modelo global de cuenta, pertenencias, activación, CSV y auditoría sin implementar código.

La [especificación formal](../../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
organiza lo acordado; constitución 1.6.0 y plantillas ya sincronizadas. Este avance
documental no cierra USR-01: PEND-01 remitente y PEND-02 limpieza están resueltos;
aún falta el diseño técnico detallado antes de implementar.

## Trazabilidad

- ID: USR-01; área principal: DOC; tipo: docs; prioridad: P1.
- Estimación: 6 horas-persona; no es compromiso de calendario.
- CU: CU-17–21.
- RF: RF30–56.
- RNF: RNF11–20.
- Dependencias: identidad/contexto/cliente existentes (BE-01/03–08, FE-01/02, DOC-05).

## Criterios de aceptación

- [x] Especificación con trazabilidad CU/RF/RNF → USR → criterios de aceptación, exclusiones y dependencias existentes.
- [x] Permiso de alta = membership activa e isAdmin OR isSuperAdmin vigente; delegar isAdmin sigue siendo exclusivo de superadmin, sin acceso académico implícito.
- [x] Resend/S3, remitente elegido, CSV efímero, limpieza 7/30 aprobada y límites CSV/imagen registrados; Daniel prepara DNS/S3, Matías implementa.
- [x] Separar commit de invitaciones del correo, cuotas globales, fake local/CI y recuperación sin conservar códigos; contemplar USR-04/05.
- [ ] Plan de escrituras acotadas de identidad, grants/RLS/readiness y revocación por credential_version; conservar runtime sin bypass.
- [x] Distinguir esquema implementado de modelo propuesto y mantener docs <150 líneas.

## Límites

User es global y los permisos son institucionales. Altas por formulario/CSV no crean
Enrollment ni conceden isAdmin/isSuperAdmin. No editar credenciales ajenas ni revelar
otras instituciones. Sin cambio de correo, borrado de cuenta, recuperación de
contraseña olvidada o importación de matrículas.

Las pruebas propias acompañan la implementación de cada historia; USR-08 verifica
la integración y no permite posponer controles de aislamiento o integridad.

## Referencias

- [Requisitos](../requisitos.md)
- [Backlog y matriz](../backlog.md)
- [Modelo de datos](../modelo-datos.md)
- [Contrato CSV](../importacion-csv.md)
- [Plan Resend](../correo-resend.md)
- [ADR S3](../../../adr/s3-for-profile-photos.md) y [retención aprobada](../retencion.md)
- [Checklist formal](../../../../specs/20261106-170457_perfiles-altas-usuarios/checklists/requirements.md)

Pendiente de diseño técnico detallado/publicación e implementación; este borrador
no equivale a una issue remota, una tarjeta de Project ni una funcionalidad disponible.
