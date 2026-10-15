# Feature Specification: Base persistente y datos demo

**Feature Branch**: `feat/base-persistente` (propuesta)
**Feature Directory**: `specs/20261014-234644_base-persistente`
**Created**: 2026-10-14
**Status**: US1/US2 implementadas; cierre de integración/operación pendiente (T025–T030).
**Input**: Backend MVP de Entrega 2: Base persistente y datos demo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar entorno reproducible (Priority: P1)

Como operador, preparo una instalación que conserva identidades y pertenencias entre reinicios.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Preparar entorno vacío, guardar una identidad, reiniciar y consultar el mismo registro.

**Acceptance Scenarios**:

1. Con instalación vacía, preparar persistencia deja una única fuente compartida sin registros parciales.
2. Con datos existentes, reiniciar conserva identificadores y relaciones.
3. Si falla persistencia, el servicio informa el fallo y no se declara listo.

### User Story 2 - Preparar demo repetible (Priority: P1)

Como equipo, dispongo de UC y UTFSM con identidades y pertenencias estables.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Ejecutar seed dos veces y comparar cantidades e identificadores.

**Acceptance Scenarios**:

1. Dos ejecuciones conservan exactamente una UC y una UTFSM, sin duplicar usuarios ni memberships.
2. Preparar la demo no borra registros ni sobrescribe credenciales existentes.

### Edge Cases

- Probar colisiones de identidad, relaciones institucionales inválidas, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia de migraciones/seed y conservación de identidades y memberships, incluidas pertenencias previamente revocadas.
- Rechazar configuraciones que desactiven validación TLS, incluidas variables de entorno. Las pruebas deben observar la política efectiva del cliente.
- Con conexión válida, contraseñas inválidas no intentan conectar; repetir sobre demo existente conserva todos los registros. Los fallos de pruebas tampoco imprimen datos sensibles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Persistir Institution, User global e InstitutionMembership; una identidad puede pertenecer a varias instituciones sin duplicarse.
- **FR-002**: Mantener slug globalmente único y una pertenencia estable por institución/persona; la membership no otorga roles académicos.
- **FR-003**: Separar migraciones de esquema/datos obligatorios del seed demo opcional y manual; fallos no dejan estados parciales y su repetición no duplica cambios.
- **FR-004**: Preparar memberships activas/inactivas y usuario multiinstitución; recibir credenciales desde el entorno, sin valores versionados.
- **FR-005**: Rechazar relaciones institucionales inválidas y configuraciones que desactiven validación de certificados TLS; conservar datos existentes ante fallos de preparación.
- **FR-006**: Documentar instalación local/desplegada, recuperación del conjunto compartido y compatibilidad de cambios con la versión anterior.
- **FR-007**: Restringir seed al operador; no agregar alta pública de instituciones, usuarios o privilegios; registrar ejecución y fallos de pruebas sin secretos, emails, hashes ni SQL con valores.

### Key Entities

- Institution, User global, InstitutionMembership.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dos ejecuciones demo conservan los mismos identificadores y cantidades de registros.
- **SC-002**: Todas las pruebas de unicidad y pertenencia inválida rechazan cambios sin pérdida de datos.
- **SC-003**: Instalación vacía y reinicio conservando datos se demuestran en ambos entornos.

## Assumptions

- No incluye login ni recursos académicos. Herramientas y procedimientos de persistencia se deciden en el plan.
- Pruebas con dos instituciones cubren integridad, sanitización, acceso exclusivo del operador al seed y conservación de estados revocados; no se cierra con pruebas negativas pendientes.
- JWT, autorización HTTP por institución/rol y operaciones sobre intentos/notas se validan en las specs posteriores, fuera de esta misión.

## Sources & Traceability

- Casos: Base habilitante de CU-01/CU-02. Requisitos: RF3, RF7–RF9; RNF4–RNF7, RNF9–RNF10.
- Backlog: PREP-04/05, INST-02, INF-01/02/04, BE-01/02, DOC-04; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.
