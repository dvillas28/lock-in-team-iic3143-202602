# Research: Cursos y roles

Fecha: 2026-10-16. Investigación local; decisiones resueltas con el usuario.

## Identidad, privilegios y ownership

- Decision: InstitutionMembership.is_admin e is_super_admin, default false; Course.created_by
  identifica al único dueño, inmutable y derivado del actor.
- Rationale: una persona puede administrar sus cursos en UC sin ese permiso en
  UTFSM; no hacen falta nuevas tablas ni un coordinador.
- Alternatives considered: User.is_admin cruzaría instituciones; admin en
  Enrollment no permite autorizar la creación previa al curso; grants múltiples
  agregan una capacidad no solicitada.
- Fuente: aclaración del usuario; [ADR vigente](../../docs/adr/institution-admin-and-course-ownership.md).

## Persistencia existente

- Decision: conservar NestJS, pg y migrador SQL ya instalados; agregar migración
  sin editar DDL histórico aplicado. Reutilizar DatabaseService.pool.
- Rationale: esquema real contiene solo identidad/instituciones/memberships;
  el modelo académico aún no tiene tablas ni callers de producto.
- Alternatives considered: ORM, RLS o repositorio genérico no aportan al alcance.
- Fuentes: backend/package.json, backend/migrations/20261015000100_institutional-foundation.sql;
  inspección CodeGraph de DatabaseService, InstitutionsService y seed/demo.

## Roles y visibilidad

- Decision: Enrollment por sección/usuario/rol; roles múltiples activos distintos.
  Admin ve sus cursos; teacher/assistant/student ven cursos con Enrollment activo.
  Teacher no admin solo administra participantes de sus secciones.
- Rationale: preserva la distinción del ADR UI y no concede poderes en curso ajeno.
- Alternatives considered: teacher global contradiría la aclaración; ownership
  solo no habilita pauta/notas sin Enrollment docente.
- Fuente: docs/adr/ui-admin-non-admin-experiences.md y spec FR-004/005/009.

## Concurrencia y auditoría

- Decision: un PoolClient por transacción, locks compartidos de identidad/membership
  y lock del curso para serializar sus escrituras; unicidades y FK en PostgreSQL.
  Leer permisos otra vez bajo locks; UPDATE de revocación toma locks incompatibles.
- Rationale: evita autorización obsoleta, duplicados y cambios sin historial.
- Alternatives considered: chequeo previo fuera de tx o pool.query entre BEGIN y
  COMMIT podrían usar conexiones distintas y no aseguran atomicidad.
- Decision: AuditEvent append-only con snapshots por lista permitida; course_id
  nullable para privilege de membership, obligatorio para recursos académicos.
- Rationale: auditar creación/revocación admin aun sin cursos existentes.
- Alternatives considered: curso ficticio o segunda tabla de auditoría duplican datos.

## Cambios de rol e idempotencia

- Decision: cambiar role desactiva origen y crea sucesor; nunca reinterpreta
  Enrollment histórico. Rol destino activo devuelve esa fila; no se duplica.
- Rationale: preserva referencias y roles paralelos; repetición sin cambio no audita.
- Alternatives considered: mutar role de fila referenciada alteraría la historia.
- Decision: asignación POST retorna 200 si ya existe, 201 si crea; eliminar
  Idempotency-Key obligatorio de esa operación, manteniendo el componente para
  otras misiones. Creación de curso usa unicidad natural y 409 al repetir.
- Rationale: satisface la repetición solicitada sin tabla genérica de idempotencia.

## Onboarding y delegación (ampliación confirmada)

- Decision: is_super_admin por membership; endpoint restringido modifica solo
  is_admin; primer responsable mediante migración de datos operativa versionada.
- Rationale: la institución delega creación de cursos sin intervención recurrente
  del PM; conserva ownership y todos los límites académicos anteriores.
- Alternatives considered: volver al coordinador o RBAC genérico no es necesario;
  asignar todos los admins desde CLI impediría autonomía institucional.
- Decision: onboarding y cambios operativos de superadmin admiten actor nulo, origen
  operatorMigration y referencia operativa; los cambios HTTP exigen actor.
- Fuente: solicitud del usuario 2026-10-16; constitución 1.4.0 y contracts/onboarding.md.

## Alcance y límites

- Decision: sin UI, transferencia, varios owners, investigador ni administración general de usuarios.
  Onboarding PM mediante migración de datos; superadmin delega is_admin por API.
  Sin endpoint para promover superadmins; seed jamás repone revocaciones.
- Rationale: cubre el flujo solicitado con una superficie mínima.
- Fuente: decisión del usuario y constitución; límites en quickstart y tasks.

Todas las decisiones de este alcance están resueltas. No se eligieron nuevas tecnologías ni se requirió
investigación externa: decisiones basadas en archivos y dependencias instaladas.

## Precisiones tras speckit-analyze

- Admin dueño prevalece en auditoría sobre teacher; teacher sin ownership/admin
  conserva scope de sección. Probar ambas condiciones juntas.
- El docente inicial es una garantía de creación, no un bloqueo de revocaciones.
- Entrega US1→US3→US2; cada historia usa fixtures, integración cruza endpoints al final.
- FR-014 incluye migración operativa set-superadmin y pruebas propias; no autoservicio.
- Otros destinatarios requieren User/membership provisionados por PM fuera de esta
  misión; delegación no crea esas identidades ni sus pertenencias.
