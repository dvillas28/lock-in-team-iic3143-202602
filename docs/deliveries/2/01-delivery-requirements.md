# Requisitos formales Entrega 2

Este documento traza la pauta de Entrega 2 contra la documentación creada.

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

| Requisito | Estado documental | Criterio para implementación |
| --- | --- | --- |
| Repositorio creado | Existente | URL remota visible en entrega o informe. |
| Backend Hello World | Por implementar en Spec Kit | Endpoint `/health` y endpoint `/api/hello`. |
| Frontend Hello World | Por implementar en Spec Kit | Vista inicial consume backend. |
| Frontend conectado a backend | Por implementar en Spec Kit | UI muestra respuesta real del backend. |
| CI backend | Por implementar en Spec Kit | Instala, valida formato/tipos/tests mínimos. |
| CI frontend | Por implementar en Spec Kit | Instala, valida build/lint/tests mínimos. |
| CI con stages definidos | Por implementar en Spec Kit | Stages separados: install, validate, test/build. |
| CD a producción | Por implementar en Spec Kit | Railway con GitHub autodeploy y `railway.toml`. |
| CD manual justificado | Fallback | Solo si permisos/límites de cuenta bloquean automatización. |
| Tag + release GitHub | Por implementar en Spec Kit | Release creada desde tag versionado. |

## Feedback Entrega 1 incorporado

- El alcance se recorta para que sea implementable.
- Railway se usa para la primera versión funcional por rapidez y evidencia.
- Google Cloud queda como migración posterior con free tier/créditos asociados.
- Las tecnologías condicionadas no se documentan como obligatorias.
- El modelo de datos baja a tablas concretas del MVP.
- La auditoría académica inmutable, el coordinador de curso y JWT quedan
  explícitos en el MVP y alineados con el contrato OpenAPI.

## Evidencia esperada para la implementación posterior

- Links a workflows CI ejecutados.
- Link a release/tag.
- URL pública de frontend Railway.
- URL o captura del backend healthcheck.
- Variables de entorno documentadas sin secretos.
- `railway.toml` versionado para servicios desplegables.
- Justificación breve solo si CD queda manual.
