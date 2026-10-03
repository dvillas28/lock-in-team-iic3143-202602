# Documentación

## Fuente vigente

La [Entrega 2](deliveries/2/README.md) es la base documental actual de AcademiX.
Define una PostgreSQL compartida, aislamiento lógico por `Institution`, User
global con memberships y despliegue en Railway.

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

Los estados de los ADR indican cuáles fueron reemplazados parcialmente. El ADR
de PostgreSQL compartida es la autoridad vigente para persistencia, tenancy y
plataforma de despliegue.

## Contratos

- [OpenAPI de AcademiX](reference/openapi/README.md)

## Guías

- [Spec Kit](guides/speckit-flow.md)
- [CodeGraph](guides/codegraph-flow.md)
- [Git Flow](guides/git-flow.md)
- [Skills de agentes](guides/agent-skills.md)

## Documentación histórica

Las [Entregas 0](deliveries/0/) y [1](deliveries/1/) se conservan sin reescribir
porque registran lo presentado en esas iteraciones. Pueden contener referencias
a database-per-tenant, registry DB, GCP u otro alcance descartado. No deben
usarse como fuente para implementar la arquitectura actual.

Los PDF y ZIP de entregas también son artefactos históricos y no se modifican.
