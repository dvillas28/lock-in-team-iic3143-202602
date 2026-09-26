# Requisitos Formales Entrega 2

Este documento traza la pauta de Entrega 2 contra la documentacion creada.

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

| Requisito | Estado documental | Criterio para implementacion |
| --- | --- | --- |
| Repositorio creado | Existente | URL remota visible en entrega o informe. |
| Backend Hello World | Planificado | Endpoint `/health` y endpoint `/api/hello`. |
| Frontend Hello World | Planificado | Vista inicial consume backend. |
| Frontend conectado a backend | Planificado | UI muestra respuesta real del backend. |
| CI backend | Planificado | Instala, valida formato/tipos/tests minimos. |
| CI frontend | Planificado | Instala, valida build/lint/tests minimos. |
| CI con stages definidos | Planificado | Stages separados: install, validate, test/build. |
| CD a produccion | Planificado | Railway con GitHub autodeploy y `railway.toml`. |
| CD manual justificado | Fallback | Solo si permisos/limites de cuenta bloquean automatizacion. |
| Tag + release GitHub | Planificado | Release creada desde tag versionado. |

## Feedback Entrega 1 incorporado

- El alcance se recorta para que sea implementable.
- Railway se usa para la primera version funcional por rapidez y evidencia.
- Google Cloud queda como migracion posterior con free tier/creditos asociados.
- Las tecnologias condicionadas no se documentan como obligatorias.
- El modelo de datos baja a tablas concretas del MVP.
- La auditoria academica queda como decision explicita fuera del MVP, no como
  requisito silencioso.

## Evidencia esperada en la entrega

- Links a workflows CI ejecutados.
- Link a release/tag.
- URL publica de frontend Railway.
- URL o captura del backend healthcheck.
- Variables de entorno documentadas sin secretos.
- `railway.toml` versionado para servicios desplegables.
- Justificacion breve solo si CD queda manual.
