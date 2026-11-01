# Entrega 3 — Diapositivas de dfierro (Proceso y CI/CD)

Diapositivas y evidencia del bloque **Proceso de Desarrollo y CI/CD** para la Entrega 3, a cargo de Daniel Fierro (DF).
Responde a las **Issues #167, #168 y #173**, cubriendo los ítems `E3-04` a `E3-13`, `E3-22` y `E3-23` del [checklist E3](../../checklist-entrega-3.md).

Las diapositivas están diseñadas en Beamer (16:9, paleta institucional AcademiX) y estructuradas en módulos independientes con `frames.tex` para ser enlazadas directamente en la presentación consolidada del equipo.

## Estructura del Contenido

| Directorio | Temática Principal | Ítems del Checklist |
| :--- | :--- | :--- |
| [`01-ciclo-desarrollo`](01-ciclo-desarrollo/frames.tex) | Ciclo de desarrollo, flujo de ramas, PRs, gating y merges. | `E3-04`, `E3-05` |
| [`02-practicas-decisiones`](02-practicas-decisiones/frames.tex) | Prácticas adoptadas (TDD Detroit, Contract-First), beneficios y ADRs. | `E3-06`, `E3-08`, `E3-11` |
| [`03-deuda-y-bugs`](03-deuda-y-bugs/frames.tex) | Registro de deuda técnica en Sonar y resolución de bugs (PostgreSQL 23514). | `E3-09`, `E3-10` |
| [`04-definicion-done`](04-definicion-done/frames.tex) | Definition of Done (6 pilares) y transiciones de estado en el tablero. | `E3-12`, `E3-13` |
| [`05-pipeline-cicd`](05-pipeline-cicd/frames.tex) | Etapas de GitHub Actions, escaneo de seguridad, guion en vivo y pendientes E4. | `E3-22`, `E3-23`, `#173` |

## Fuentes y Evidencia Técnica

1. **Ciclo y PRs**: Flujo documentado en [git-flow.md](../../../guides/git-flow.md); evidencia en PRs reales #125 (tenancy), #91 (ADR bot), #151 (participantes) y PR #49/#76 (matriz de aislamiento).
2. **AcademiX PR Reviewer**: ADR formal en [define-bot-pr-reviewer.md](../../../adr/define-bot-pr-reviewer.md) y script en `.github/scripts/pr-reviewer.mjs`.
3. **Decisiones de Arquitectura**: Inventario en [docs/adr/](../../../adr/) (PostgreSQL multi-tenant, OpenAPI catalog, bot reviewer, Render deploy).
4. **Bugs y Deuda**: Bug de inmutabilidad de matrículas resuelto mediante desactivación y creación (`f.add`); métricas de mantenibilidad A en SonarQube Cloud.
5. **Testing y Pipeline**: 8 jobs configurados en [.github/workflows/ci.yml](../../../../../.github/workflows/ci.yml); cobertura backend reportada de 99.53% contra PostgreSQL 17 real.

## Compilación Local

Cada subdirectorio contiene su archivo `frames.tex`. Para compilar las vistas previas locales con Beamer:

```bash
./build.sh
```

O para compilar un módulo específico:

```bash
./build.sh 01-ciclo-desarrollo
```

## Integración en la Presentación Consolidada

Para incorporar estas secciones al documento principal de la presentación de E3:
1. Incluir el preámbulo de AcademiX ya estandarizado en `dvillas28/preamble.tex`.
2. Invocar cada módulo con `\input{dfierro/01-ciclo-desarrollo/frames}` en la sección correspondiente de la exposición.

