# Issue: USR-01 Especificar perfiles y altas institucionales por formulario y CSV

Estado: issue publicada / implementación autorizada. [#233](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/233).
Registro: 2026-11-06; publicación: 2026-11-07. Responsable: Matías (matiaraos).
Objetivo: Semana 5 E4, 2–8 de noviembre de 2026, America/Santiago; estimación aún preliminar.

Cerrar la especificación por historias y reconciliar alcance/constitución/ADR con el nuevo permiso institucional. Registrar modelo global de cuenta, pertenencias, activación, CSV y auditoría sin implementar código.

La [especificación formal](../../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
organiza lo acordado; constitución 1.6.1 y plantillas ya sincronizadas. Este avance
documental incorpora [plan técnico](../../../../specs/20261106-170457_perfiles-altas-usuarios/plan.md),
modelo, contratos y tareas; las decisiones PEND-01/02 están resueltas.

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
- [x] Separar commit de invitaciones del correo, cuotas globales, fake exclusivamente en tests y recuperación sin conservar códigos; contemplar USR-04/05.
- [x] Plan de escrituras acotadas de identidad, grants/RLS/readiness y revocación por credential_version; conservar runtime sin bypass.
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

La publicación no acredita implementación, despliegue ni validación externa.
