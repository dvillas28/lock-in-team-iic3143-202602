# Entrega 2

Base documental para la segunda entrega de AcademiX.

Esta version corrige el alcance de la Entrega 1: se mantiene la decision
arquitectonica fuerte de sharding por universidad, pero se reduce el producto a
un flujo academico implementable por un equipo pequeno durante el semestre.

## Orden de lectura

| Orden | Documento | Proposito |
| --- | --- | --- |
| 01 | [delivery requirements](01-delivery-requirements.md) | Trazabilidad contra pauta y puntajes. |
| 02 | [scope](02-scope.md) | Que entra, que queda fuera y por que. |
| 03 | [use cases and requirements](03-use-cases-and-requirements.md) | Casos de uso, RF, RNF y reglas. |
| 04 | [architecture](04-architecture.md) | Arquitectura actualizada y despliegue Railway. |
| 05 | [domain model](05-domain-model.md) | Entidades y reglas del dominio. |
| 06 | [data model](06-data-model.md) | Tablas, constraints, transacciones y ERD. |
| 07 | [risks](07-risks.md) | Riesgos actualizados y mitigaciones. |
| 08 | [work plan](08-work-plan.md) | Plan de desarrollo actualizado. |
| 09 | [walking skeleton plan](09-walking-skeleton-plan.md) | CI/CD, Hello World, Railway y release. |
| 10 | [status](10-status.md) | Que esta completo y que falta. |

## Decision central

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
schema. El walking skeleton debe probar esa decision con dos tenants: `uc` y
`utfsm`.

## Cambio respecto a Entrega 1

- Railway pasa a ser plataforma inmediata para walking skeleton y primera
  version funcional.
- CD sera automatizado con GitHub + `railway.toml`; fallback manual solo si la
  cuenta o permisos lo bloquean.
- Google Cloud queda como migracion posterior usando free tier/creditos de la
  cuenta asociada.
- IA, chat, calendario, auditoria historica, workers, Redis y replicas quedan
  fuera del MVP.
- Las evaluaciones dejan de ser entregas/correccion manual y pasan a ser
  cuestionarios de alternativas con autocorreccion.
- Los roles se simplifican a `teacher`, `student` y `assistant` por seccion.

## Siguiente paso

Crear un Spec Kit para implementar el walking skeleton:

- frontend Hello World;
- backend Hello World;
- endpoint backend consumido por frontend;
- portal home para elegir universidad;
- rutas por tenant: `/uc` y `/utfsm`;
- llamadas frontend-backend con header `x-tenant`;
- registry DB y dos tenant DB demo;
- CI basico para frontend y backend;
- CD automatizado a Railway con `railway.toml`;
- tag y release en GitHub.
