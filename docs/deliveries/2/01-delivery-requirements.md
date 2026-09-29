# Requisitos formales Entrega 2

Este documento traza la pauta de Entrega 2 contra la documentación y el walking
skeleton existentes.

## Trazabilidad

| Item pauta | Puntos | Evidencia |
| --- | ---: | --- |
| Casos de uso y requerimientos | 0.5 | [03-use-cases-and-requirements.md](03-use-cases-and-requirements.md) |
| Arquitectura | 0.75 | [04-architecture.md](04-architecture.md) |
| Modelo de dominio | 0.75 | [05-domain-model.md](05-domain-model.md) |
| Modelo de datos | 2.0 | [06-data-model.md](06-data-model.md) |
| Lista de riesgos actualizada | 0.5 | [07-risks.md](07-risks.md) |
| Plan de desarrollo actualizado | 0.5 | [08-work-plan.md](08-work-plan.md) |
| CI/CD Walking Skeleton | 1.0 | [09-walking-skeleton-plan.md](09-walking-skeleton-plan.md) |

Total: 7.0 puntos.

## Requisitos operacionales

| Requisito | Evidencia actual | Criterio de cierre |
| --- | --- | --- |
| Repositorio creado | Existente | URL remota visible en la entrega. |
| Backend Hello World | `GET /health` implementado | Healthcheck exitoso local y desplegado. |
| Frontend Hello World | Frontend implementado | Vista consume respuesta real del backend. |
| Frontend conectado a backend | Implementado para health | UI muestra estado real del backend. |
| CI backend | Workflow existente | Instala, lint, test y build exitosos. |
| CI frontend | Workflow existente | Instala, lint y build exitosos. |
| Imágenes Docker | Dockerfiles existentes | Build reproducible para ambas aplicaciones. |
| CD | Configuración Railway por aplicación | Deploy Railway asociado al repositorio. |
| Tag + release GitHub | Pipeline de release existente | Release creada desde tag versionado. |
| PostgreSQL compartida | Diseño documental | Se incorporará al implementar persistencia. |

## Feedback arquitectónico incorporado

- El MVP utiliza una PostgreSQL compartida, no una base por Institution.
- `Institution` y `institution_id` forman la frontera lógica de persistencia.
- `User` es global y se relaciona mediante `InstitutionMembership`.
- Constraints y FK institution-aware complementan el scope de aplicación.
- Existe una sola secuencia de migraciones; los backfills futuros respetan
  `institution_id`.
- Railway es la plataforma de despliegue vigente, no una etapa temporal.
- El desarrollo local utiliza Docker Compose y una sola PostgreSQL.
- La auditoría académica, el coordinador de curso y JWT permanecen en el MVP.

## Evidencia esperada

- links a workflows CI ejecutados;
- link a release/tag;
- URL pública de frontend Railway;
- URL o captura del healthcheck backend;
- variables de entorno documentadas sin secretos;
- configuración Railway versionada para frontend y backend;
- evidencia de aislamiento entre UC y UTFSM cuando exista persistencia.
