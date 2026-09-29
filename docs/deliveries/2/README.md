# Entrega 2

Base documental vigente para la segunda entrega de AcademiX. Las Entregas 0 y
1 se conservan como evidencia histórica y no describen la arquitectura actual.

## Orden de lectura

| Orden | Documento | Propósito |
| --- | --- | --- |
| 01 | [requisitos de entrega](01-delivery-requirements.md) | Trazabilidad contra pauta y evidencia. |
| 02 | [alcance](02-scope.md) | Qué entra, qué queda fuera y por qué. |
| 03 | [casos de uso y requerimientos](03-use-cases-and-requirements.md) | Casos de uso, RF, RNF y reglas. |
| 04 | [arquitectura](04-architecture.md) | PostgreSQL compartida, aislamiento lógico y despliegue Railway. |
| 05 | [modelo de dominio](05-domain-model.md) y [diagrama UML](05-domain-model-uml.md) | Conceptos, relaciones y reglas del dominio. |
| 06 | [modelo de datos](06-data-model.md) | Tablas, constraints, transacciones, índices y ERD. |
| 07 | [riesgos](07-risks.md) | Riesgos actualizados y mitigaciones. |
| 08 | [plan de trabajo](08-work-plan.md) | Orden de desarrollo. |
| 09 | [plan de walking skeleton](09-walking-skeleton-plan.md) | CI/CD, Railway y persistencia local. |
| 10 | [estado](10-status.md) | Qué está completo y qué falta. |

## Decisión central

El ADR
[PostgreSQL compartida para multi-tenancy](../../adr/adopt-shared-postgresql-multitenancy.md)
reemplaza el diseño database-per-tenant:

```txt
Cliente autenticado
-> /api/v1/institutions/{institutionSlug}/...
-> Backend API
-> InstitutionMembership + autorización contextual
-> lógica institution-scoped
-> una PostgreSQL compartida
```

`Institution` es la entidad de dominio que representa al tenant lógico. `User`
es global y puede pertenecer a varias Institutions mediante
`InstitutionMembership`. Las entidades académicas llevan `institution_id`, y
las relaciones usan constraints y FK institution-aware para impedir cruces.

UC y UTFSM siguen siendo Institutions demo, pero coexisten en la misma base.
El path identifica el contexto solicitado; nunca autoriza por sí solo.

## Plataforma

Railway es la plataforma de despliegue elegida para AcademiX. El repositorio
contiene configuraciones independientes para frontend y backend. PostgreSQL es
la persistencia compartida del MVP; el walking skeleton aún no implementa la
capa de persistencia.

No existe una migración planificada a Google Cloud. El dominio permanece
independiente de Railway y usa contenedores, HTTP y PostgreSQL estándar.

## Alcance académico conservado

- experiencias docente y estudiante;
- coordinador por curso y roles por sección;
- cursos, secciones, módulos y material;
- quizzes de alternativas autocorregidos;
- libro de notas y publicación explícita;
- JWT, memberships persistidas y auditoría inmutable;
- sin administrador institucional, entregas manuales, IA, chat, calendario,
  workers, Redis, réplicas ni microservicios en el MVP.

## Siguiente paso

El siguiente Spec Kit debe implementar solo lo respaldado por estos documentos:

- conectar el backend a una PostgreSQL compartida;
- modelar Institution, User global e InstitutionMembership;
- crear el contexto institution-scoped y tests de acceso cruzado;
- preparar bootstrap idempotente futuro para UC y UTFSM;
- mantener CI, CD Railway y desarrollo local reproducible.

No debe elegir ORM, implementar RLS ni agregar infraestructura no utilizada sin
un plan posterior que lo justifique.
