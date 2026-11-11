# Documentación

## Fuente vigente

La [Entrega 2](deliveries/2/README.md) es la base documental actual de AcademiX.
Define una PostgreSQL compartida, aislamiento lógico por `Institution`, User
global con memberships y despliegue en Railway, hoy reemplazado por
[Render](adr/deploy-on-render.md).

- [Alcance vigente](deliveries/2/02-scope.md)
- [Casos de uso y requerimientos](deliveries/2/03-use-cases-and-requirements.md)
- [Arquitectura](deliveries/2/04-architecture.md)
- [Modelo de dominio y UML](deliveries/2/05-domain-model.md)
- [Modelo de datos](deliveries/2/06-data-model.md)
- [Riesgos](deliveries/2/07-risks.md)
- [Plan de walking skeleton](deliveries/2/09-walking-skeleton-plan.md)
- [Estado de la entrega](deliveries/2/10-status.md)

## Decisiones de arquitectura

- [PostgreSQL compartida para multi-tenancy](adr/adopt-shared-postgresql-multitenancy.md)
- [Alcance del MVP de la Entrega 2](adr/choose-delivery-2-mvp-scope.md)
- [Dominio y API de la Entrega 2](adr/align-delivery-2-domain-and-api.md)
- [Cierre de intentos de quiz abandonados](adr/close-abandoned-quiz-attempts.md)
- [Bot PR reviewer: proveedor, seguridad y criterios](adr/define-bot-pr-reviewer.md)
- [Sesión del navegador en memoria](adr/browser-session-in-memory.md)

Los estados de los ADR indican cuáles fueron reemplazados parcialmente. El ADR
de PostgreSQL compartida es la autoridad vigente para persistencia, tenancy y
plataforma de despliegue.

## Contratos

- [Tareas del curso, CU-22 y CU-23](planning/course-assignments.md)
- [OpenAPI de AcademiX](reference/openapi/README.md)

## Backend y Pruebas

- [Mapa de misiones backend](backend/README.md)
- [Matriz de escenarios de aislamiento UC/UTFSM](backend/isolation-test-matrix.md)
- [Guía del Test Harness de aislamiento (BE-07 / BE-08)](backend/isolation-test-harness.md)

## Misiones frontend

- [Seis specs, dependencias y estado documental](frontend/README.md)
- [Cobertura de CU, backlog, vistas y evidencia](frontend/coverage.md)

## Guías

- Ampliación pendiente: [perfiles/altas por formulario y CSV](planning/perfiles/README.md),
  [requisitos](planning/perfiles/requisitos.md), [backlog/borradores](planning/perfiles/backlog.md)
  y [modelo propuesto de usuarios](planning/perfiles/modelo-datos.md).
- Correo para activación: [plan Resend](planning/perfiles/correo-resend.md) y
  [decisión de proveedor](adr/resend-for-account-invitations.md), pendientes de implementación.
- Fotos de perfil: [S3 privado en producción](adr/s3-for-profile-photos.md), Daniel provisiona.
- [Spec formal de perfiles/altas](../specs/20261106-170457_perfiles-altas-usuarios/spec.md),
  [trazabilidad](../specs/20261106-170457_perfiles-altas-usuarios/traceability.md) y [pendientes](../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md).
- E2E: [qué probamos y fases](testing/E2E_MASTER_PLAN.md) · [ejecución y navegador visible](testing/E2E_README.md).
- [Spec Kit](guides/speckit-flow.md)
- [CodeGraph](guides/codegraph-flow.md)
- [Git Flow](guides/git-flow.md)
- [Skills de agentes](guides/agent-skills.md)
- [Tablero y métricas de avance](guides/board-metrics.md)
- [Login y arquitectura de sesión](guides/login-session.md)
- [Probar la PR de login con Docker](guides/login-session-testing.md)
- [Probar login por dominios en producción](guides/login-session-production.md)

## Documentación histórica

Las [Entregas 0](deliveries/0/) y [1](deliveries/1/) se conservan sin reescribir
porque registran lo presentado en esas iteraciones. Pueden contener referencias
a database-per-tenant, registry DB, GCP u otro alcance descartado. No deben
usarse como fuente para implementar la arquitectura actual.

Los PDF y ZIP de entregas también son artefactos históricos y no se modifican.
