# Entrega 2

Base documental vigente para la segunda entrega de AcademiX. Las Entregas 0 y
1 se conservan como evidencia histórica y no describen la arquitectura actual.

## Orden de lectura

| Orden | Documento | Propósito |
| --- | --- | --- |
| 01 | [requisitos de entrega](01-delivery-requirements.md) | Trazabilidad contra pauta y evidencia. |
| 02 | [alcance](02-scope.md) | Qué entra, qué queda fuera y por qué. |
| 03 | [casos de uso y requerimientos](03-use-cases-and-requirements.md) | Casos de uso, RF, RNF y reglas. |
| 04 | [arquitectura](04-architecture.md) | PostgreSQL compartida, aislamiento lógico y configuración Render. |
| 05 | [modelo de dominio](05-domain-model.md) y [diagrama UML](05-domain-model-uml.md) | Conceptos, relaciones y reglas del dominio. |
| 06 | [modelo de datos](06-data-model.md) | Tablas, constraints, transacciones, índices y ERD. |
| 07 | [riesgos](07-risks.md) | Riesgos actualizados y mitigaciones. |
| 08 | [plan de trabajo](08-work-plan.md) | Orden de desarrollo. |
| 09 | [plan de walking skeleton](09-walking-skeleton-plan.md) | CI/CD, Render y persistencia local. |
| 10 | [estado](10-status.md) | Qué está completo y qué falta. |
| 11 | [evidencia CI/CD](11-cicd-evidence/README.md) | Capturas históricas de CI/Railway/release. |
| 12 | [catálogo de datos](12-data-catalog.md) | Tablas, columnas, tipos, PK/FK y planilla XLSX adjunta. |
| 13 | [guía de presentación](ppt/speaker-guide.md) | Punteo oral slide por slide y preguntas/respuestas probables. |
| 15 | [feedback E2 y polish](15-feedback-e2.md) | Línea base, respuestas existentes y cambios posteriores al feedback. |

## Paquete formal

| Entregable | Fuente | PDF |
| --- | --- | --- |
| Informe | [report/main.tex](report/main.tex) | [report/main.pdf](report/main.pdf) |
| Presentación | [ppt/main.tex](ppt/main.tex) | [ppt/main.pdf](ppt/main.pdf) |
| Guía oral | [ppt/speaker-guide.md](ppt/speaker-guide.md) | — |

## Decisión central

El ADR
[PostgreSQL compartida para multi-tenancy](../../adr/adopt-shared-postgresql-multitenancy.md)
reemplaza el diseño database-per-tenant:

```txt
Cliente autenticado
-> /api/v1/institution/{institutionSlug}/...
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

## Plataforma y capacidades existentes

Render configura frontend/API/PostgreSQL en [Blueprint](../../../render.yaml).
Persistencia pg/migraciones, JWT, memberships, cursos/roles, contenido, quizzes,
calificación/publicación, auditoría, RLS/runtime y provisión ya existían al corte
7f4334a. [Estado](10-status.md) distingue código, prueba local y operación remota.
[ADR Render](../../adr/deploy-on-render.md): sin HAProxy/HA/PgBouncer externo;
se difieren hasta necesidad medida. Binarios/object storage fuera del MVP.
Sin despliegue, push, PR o comprobación remota durante el polish.

## Roles y cuentas

Seis actores y límites en [dominio](05-domain-model.md). Superadmin institucional
delega is_admin; admin crea cursos y administra propios; roles académicos por
Enrollment. Sin superadmin global ni permisos académicos implícitos por flags.
[Cuentas/provisión](../../guides/demo-accounts.md): dataset institucional y seed
académico separados; onboarding inicial no equivale a alta general/invitaciones.

## Respuesta posterior a E2

[Fuente y corte](15-feedback-e2.md) preservados; cardinalidades, roles/cuentas,
arquitectura y formatos alineados. Solo auditoría grade cambia funcionalmente;
resto documenta/valida capacidades previas. F6/G6 positivos y dueños conservados.
[Evidencia local](../../backend/feedback-e2-validation.md) y
[privacidad](../../backend/audit-grade-privacy-validation.md) registran alcance real.
No se cierran tareas operativas o de otras misiones por este polish.
