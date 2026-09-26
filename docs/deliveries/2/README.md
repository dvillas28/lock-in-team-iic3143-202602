# Entrega 2

Base documental para la segunda entrega de AcademiX.

Esta versión corrige el alcance de la Entrega 1: se mantiene la decisión
arquitectónica fuerte de sharding por universidad, pero se reduce el producto a
un flujo académico implementable por un equipo pequeño durante el semestre.

## Orden de lectura

| Orden | Documento | Propósito |
| --- | --- | --- |
| 01 | [requisitos de entrega](01-delivery-requirements.md) | Trazabilidad contra pauta y puntajes. |
| 02 | [alcance](02-scope.md) | Qué entra, qué queda fuera y por qué. |
| 03 | [casos de uso y requerimientos](03-use-cases-and-requirements.md) | Casos de uso, RF, RNF y reglas. |
| 04 | [arquitectura](04-architecture.md) | Arquitectura actualizada y despliegue Railway. |
| 05 | [modelo de dominio](05-domain-model.md) | Entidades y reglas del dominio. |
| 06 | [modelo de datos](06-data-model.md) | Tablas, constraints, transacciones y ERD. |
| 07 | [riesgos](07-risks.md) | Riesgos actualizados y mitigaciones. |
| 08 | [plan de trabajo](08-work-plan.md) | Plan de desarrollo actualizado. |
| 09 | [plan de walking skeleton](09-walking-skeleton-plan.md) | CI/CD, Hello World, Railway y release. |
| 10 | [estado](10-status.md) | Qué está completo y qué falta. |

## Decisión central

AcademiX reduce el alcance funcional del LMS, pero conserva multi-tenancy real
por universidad mediante sharding:

```txt
Frontend
-> Backend API
-> Tenant Resolver
-> Registry DB
-> Tenant DB uc/utfsm
```

Cada universidad demo opera sobre una base PostgreSQL propia, con el mismo
schema. El walking skeleton debe probar esa decisión con dos tenants: `uc` y
`utfsm`.

## Cambio respecto a Entrega 1

- Railway pasa a ser plataforma inmediata para walking skeleton y primera
  versión funcional.
- CD será automatizado con GitHub + `railway.toml`; fallback manual solo si la
  cuenta o permisos lo bloquean.
- Google Cloud queda como migración posterior usando free tier/créditos de la
  cuenta asociada.
- IA, chat, calendario, auditoría histórica, workers, Redis y réplicas quedan
  fuera del MVP.
- Las evaluaciones dejan de ser entregas/corrección manual y pasan a ser
  cuestionarios de alternativas con autocorrección.
- Los roles se simplifican a `teacher`, `student` y `assistant` por sección.

## Siguiente paso

Crear un Spec Kit para implementar el walking skeleton:

- frontend Hello World;
- backend Hello World;
- endpoint backend consumido por frontend;
- portal home para elegir universidad;
- rutas por tenant: `/uc` y `/utfsm`;
- llamadas frontend-backend con header `x-tenant`;
- registry DB y dos tenant DB demo;
- CI básico para frontend y backend;
- CD automatizado a Railway con `railway.toml`;
- tag y release en GitHub.
