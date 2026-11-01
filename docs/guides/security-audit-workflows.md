# Auditorías manuales de Trivy y SonarQube

Workflows pedidos por el curso para la demo, equivalentes a las plantillas del
profesor (`trivy-manual.spec.md` y `sonarqube-manual.spec.md`). No reemplazan
los gates de CI descritos en [git-flow](git-flow.md): esos bloquean PRs; estos
generan evidencia descargable bajo demanda.

| Workflow | Archivo | Artifact |
|---|---|---|
| Trivy - Dependencias y vulnerabilidades | `.github/workflows/trivy-manual.yml` | `trivy-report` |
| SonarQube - Issues y calidad local | `.github/workflows/sonarqube-manual.yml` | `sonarqube-reports` |

## Cómo ejecutarlos

1. Los workflows deben estar en `main`: GitHub solo muestra "Run workflow" para
   archivos que existen en la rama predeterminada.
2. Actions → elegir el workflow → Run workflow → rama `main`.
   El de SonarQube omite el job si se elige otra rama.
3. Revisar el resumen del run y descargar el artifact (14 días de retención).

Ninguno necesita secrets ni variables del repositorio.

## Trivy

Escanea con `fs` todo el repositorio (`.`), solo vulnerabilidades y todas las
severidades, incluidas las sin corrección. Publica `trivy-report.json` y luego
falla si hay al menos un hallazgo HIGH o CRITICAL.

Diferencias con la plantilla, sin cambiar el resultado:

- Usa `.github/scripts/trivy.sh` (imagen oficial fijada por digest) en vez de
  `aquasecurity/trivy-action`, cuyos tags son mutables.
- Reutiliza la caché diaria de la base de vulnerabilidades del CI.

Trivy omite las dependencias de desarrollo de pnpm. Por eso los lockfiles de la
raíz y de `e2e/`, que solo tienen `devDependencies`, no aparecen en el reporte.

## SonarQube

Levanta SonarQube Community en Docker dentro del runner, crea un proyecto y un
token temporales, analiza, exporta y elimina la instancia. El artifact trae
`issues.json`, `metrics.json`, `quality-gate.json`, `analysis-task.json`,
`run.json`, `server.log` y `container-state.json`.

Adaptaciones al repositorio (el punto de adaptación de la plantilla):

- Antes del análisis corre los tests con cobertura de backend (con Postgres
  efímero, igual que el job `Backend integration + coverage`) y de frontend.
- Fuentes, tests, tsconfigs y rutas LCOV salen de `sonar-project.properties`,
  compartido con CI. Solo cambian el servidor y la clave `ci-project`.
- El umbral de cobertura del frontend no se aplica aquí: el job reporta
  métricas y el gate es el de SonarQube.

Cómo leer el gate: es la primera y única ejecución de un servidor nuevo, así que
no hay código nuevo contra el cual evaluar. En una prueba local el gate quedó
`OK` con `conditions: []`. El gate real del proyecto es el de SonarQube Cloud en
los PRs; este reporte sirve para mostrar issues y métricas absolutas.

## Probarlos localmente

```bash
.github/scripts/trivy.sh fs --scanners vuln --format json --output trivy-report.json .
```

Para SonarQube basta repetir el `docker run` del workflow y ejecutar sus scripts
Python con `SONAR_HOST_URL`, `GITHUB_ENV` y `RUNNER_TEMP` apuntando a archivos
temporales. Borrar el contenedor al terminar.
