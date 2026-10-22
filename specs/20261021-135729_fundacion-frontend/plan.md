# Implementation Plan: Fundación del frontend AcademiX

**Branch**: `docs/frontend-specs` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261021-135729_fundacion-frontend/spec.md`.

## Summary

Entregar seis specs frontend y un índice de cobertura, sin implementar producto.
Una US produce cada spec hijo y su checklist. Auditoría se integra con notas y
seguimiento; accesibilidad, estados de UI, aislamiento y permisos son transversales.
Contrato: dominio frontend → slug solicitado → ruta API → autorización backend.
Las rutas visibles del frontend son limpias.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje de entrega | Markdown; validación con Python 3 y Git existentes |
| Dependencias | Spec Kit y fuentes locales; sin nuevas dependencias ni servicios |
| Persistencia | Archivos versionados; sin cambios de datos, schema ni migraciones |
| Validación | Checklist por spec, cobertura CU/FE/vistas, links, longitud y diff |
| Plataforma | Repositorio local; UC/UTFSM/local son escenarios de specs hijas |
| Proyecto | Misión documental; no construye UI ni modifica backend |
| Stack existente | Next.js/React/TypeScript y cliente OpenAPI; NestJS/PostgreSQL detrás de API |
| Rendimiento | Sin objetivo runtime en esta fase; seis misiones y docs <150 líneas |
| Alcance | CU-01–16, FE-01–20, 16 pantallas; FE-21/binarios excluidos |
| Restricciones | Reutilizar memoria de #124; sin SSO, proxy nuevo ni cookies |

## Constitution Check

Pre-research: PASS. Post-design: PASS documental; specs hijos revisados al cerrar la misión.

- Aislamiento: dominio solo selecciona contexto frontend; backend recibe slug explícito,
  valida pertenencia y mantiene RLS/runtime sin bypass. No hay acceso directo a DB.
- Excepciones globales: login y directorio de instituciones propias; no datos académicos globales.
- Roles: preservar Enrollment y admin dueño; superadmin solo delega isAdmin en su institución.
  La ADR vigente resuelve la ambigüedad del prototipo antes de planes académicos.
- Historial: misión sin escrituras académicas; specs hijas conservan auditoría backend.
- Independencia: specs revisables con fixtures; no requieren implementar otras US.
- Longitud: archivos <150 líneas; cobertura y exclusiones en índice/contrato de entrega.
- Complejidad: seis capacidades, sin infraestructura nueva ni violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-135729_fundacion-frontend/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/spec-delivery.md
  quickstart.md
  tasks.md
  checklists/requirements.md
```

El modelo representa artefactos documentales, no tablas. El contrato define
cobertura y aceptación; el research explica partición y precedencia de fuentes.

### Output of implementation of this documentary mission

```text
docs/frontend/README.md
docs/frontend/coverage.md
specs/20261021-141348_frontend-acceso-multitenant/{spec.md,checklists/requirements.md}
specs/20261021-141349_frontend-cursos-participacion/{spec.md,checklists/requirements.md}
specs/20261021-141350_frontend-modulos-material/{spec.md,checklists/requirements.md}
specs/20261021-141351_frontend-autoria-quizzes/{spec.md,checklists/requirements.md}
specs/20261021-141352_frontend-rendicion-quizzes/{spec.md,checklists/requirements.md}
specs/20261021-141353_frontend-notas-seguimiento/{spec.md,checklists/requirements.md}
```

Se reservan estos nombres al planificar para dar rutas exactas a las tareas.
Generar cada hijo con `speckit-specify` y `SPECIFY_FEATURE_DIRECTORY` explícito;
respetar esa ruta aunque la fecha de ejecución sea posterior. No crear planes/tasks
de código de los hijos ni ejecutar sus implementaciones en esta misión.
Base actualizada a `upstream/dev` (`ee4a329`): #124 ya entrega login/sesión/protección.
`frontend/src/`, `frontend/test/`, backend, OpenAPI y mockups se consultan sin modificarlos.
Solo el bloque gestionado de `AGENTS.md` cambia para apuntar a este plan.

## Delivery Sequence

1. Preparar índice, cobertura y criterios comunes desde el contrato documental.
2. US1: acceso/multitenancy, incluyendo transición de rutas y decisiones de sesión.
3. US2: navegación/cursos/participación con matriz de permisos vigente.
4. US3 y US4: contenido y autoría, redactables por separado.
5. US5: rendición; US6: notas y seguimiento, delimitando acciones compartidas.
6. Consolidar cobertura, enlaces, dependencias y evidencia documental.

Dependencias de implementación futura: `1 → 2 → {3,4}; 4 → 5 → 6`.
Envío corresponde a misión 5; publicación y consulta de resultados, a misión 6.
Cancelación docente se especifica en misión 5 y se enlaza desde misión 6.

## Validation & Rollout

- Ejecutar [quickstart.md](quickstart.md) ahora sobre planificación; al cerrar
  exigir seis specs/checklists y mapa completo.
- Revisar seis historias, FR-001–014 y SC-001–004 contra el contrato de entrega.
- Sesión reutiliza ADR en memoria; routing limpio/configuración local quedan para
  plan hijo, con comportamiento ya acotado en su spec.
- No deploy, DNS, secretos, llamadas autenticadas ni cambios remotos.
- Hooks opcionales git antes/después de plan/tasks: omitidos. Actualización de
  contexto ejecutada como paso requerido; no cambiar `.specify/feature.json`.

## Complexity Tracking

Sin violaciones constitucionales. Seis specs agrupan auditoría con seguimiento;
estados y permisos acompañan cada capacidad, sin spec técnica extra.
