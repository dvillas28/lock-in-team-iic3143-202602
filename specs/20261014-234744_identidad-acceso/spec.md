# Feature Specification: Identidad global y acceso institucional

**Feature Branch**: `feat/identidad-acceso` (propuesta)
**Feature Directory**: `specs/20261014-234744_identidad-acceso`
**Created**: 2026-10-14
**Status**: Draft
**Input**: Backend MVP de Entrega 2: Identidad global y acceso institucional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingresar con identidad global (Priority: P1)

Como usuario demo, ingreso para consultar mis instituciones autorizadas.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Autenticar una cuenta y consultar sus instituciones.

**Acceptance Scenarios**:

1. Credenciales válidas de usuario activo permiten iniciar sesión con identidad verificable.
2. Credenciales incorrectas o usuario inactivo no inician sesión ni revelan cuál credencial falló.
3. Identidad ausente, inválida o expirada impide consultar recursos protegidos.

### User Story 2 - Elegir institución (Priority: P1)

Como usuario multiinstitución, cambio de contexto conservando separados mis datos académicos.

**Why this priority**: Cierra una capacidad necesaria del flujo MVP.
**Independent Test**: Revocar una pertenencia y repetir acceso con la misma sesión.

**Acceptance Scenarios**:

1. Solo aparecen instituciones activas con membership activa del usuario.
2. Tras revocar una membership, la siguiente operación deniega acceso a ese contexto.
3. Sin pertenencias activas se obtiene lista vacía sin datos de terceros.

### Edge Cases

- Probar identificador ajeno, pertenencia revocada, entrada inválida, operación repetida y fallo antes de confirmar: sin exposición ni cambios parciales.
- Verificar concurrencia al asignar identidad, orden, intento, nota o publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Autenticar cuentas demo con credenciales protegidas y resolver una identidad global activa; no confiar en identidad o rol declarados por el cliente.
- **FR-002**: Listar solo instituciones activas con membership activa y revalidar el contexto solicitado en cada operación.
- **FR-003**: Distinguir ausencia de autenticación, contexto no visible y acción prohibida sobre recurso visible sin revelar recursos ajenos.
- **FR-004**: Consultar permisos persistidos vigentes; una sesión no congela memberships ni roles.
- **FR-005**: Devolver identidad contextual y roles existentes; antes de incorporar cursos, la lista de roles es vacía.
- **FR-006**: Excluir contraseñas, hashes y tokens de logs, auditoría y respuestas ajenas al inicio de sesión.
- **FR-007**: Rechazar entradas malformadas y limitar intentos reiterados de autenticación; el plan fija parámetros comprobables.
- **FR-008**: Definir identificador de acceso inequívoco y vencimiento de sesión en el plan; sin registro público, SSO ni recuperación de cuentas.

### Key Entities

- User, Institution, InstitutionMembership.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos los escenarios sin identidad válida impiden acceder a datos protegidos.
- **SC-002**: La revocación se aplica en la siguiente operación en todos los escenarios de aceptación.
- **SC-003**: Ninguna consulta UC/UTFSM devuelve instituciones sin pertenencia activa.

## Assumptions

- El dataset demo proporciona identificadores de acceso inequívocos. JWT y rutas institucionales acordados en Entrega 2 se concretan en contratos durante el plan.
- Pruebas con dos instituciones incluyen permisos, integridad, sanitización y revocación; no se cierra con pruebas negativas pendientes.
- Dependencias: [base-persistente](../20261014-234644_base-persistente/spec.md).

## Sources & Traceability

- Casos: CU-01, CU-02. Requisitos: RF1–RF7, RF25; RNF1–RNF2.
- Backlog: PREP-07, INST-03, INF-03, BE-03–BE-08; conservar responsables del equipo sin reasignación implícita.
- Fuentes: [alcance](../../docs/deliveries/2/02-scope.md), [CU/RF/RNF](../../docs/deliveries/2/03-use-cases-and-requirements.md), [dominio](../../docs/deliveries/2/05-domain-model.md), [datos](../../docs/deliveries/2/06-data-model.md).
- [ADR de permisos](../../docs/adr/ui-admin-non-admin-experiences.md): resolver divergencias antes del plan afectado.
