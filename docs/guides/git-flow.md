# Git Flow Del Equipo

Usamos ramas cortas por cambio y PR hacia `main`. La rama ayuda a ordenar el
trabajo, pero Spec Kit no debe bloquear por nombre de rama.

## Rama

Formato:

```text
<type>/<short-name>
```

Ejemplos:

```text
feat/course-sections
fix/grade-publication
docs/update-roadmap
```

## Tipos

- `feat`: funcionalidad nueva.
- `fix`: correccion de bug.
- `docs`: documentacion.
- `test`: pruebas.
- `refactor`: cambio interno sin modificar comportamiento.
- `chore`: mantencion, config o tareas de repo.
- `style`: formato sin cambio funcional.
- `perf`: mejora de rendimiento.
- `ci`: cambios de integracion continua.
- `build`: build system, dependencias o empaquetado.

## Flujo Corto

```bash
git switch -c feat/course-sections
export SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>-<short-name>
pnpm install
git status
git push -u origin HEAD
```

Abrir PR hacia `main` con link al spec usado. Si el cambio no tiene spec, decir
por que en la descripcion del PR.

## Versionado

El workflow `Release` crea los tags solo; no se crean tags a mano.

- Cada push a `dev` crea un tag de prerelease `vX.Y.Z-dev.N`.
- Cada push a `main` crea el tag estable `vX.Y.Z` y su release en GitHub.

`X.Y.Z` sale de los commits desde el ultimo tag estable, por eso el titulo del
PR (que queda como commit al hacer squash en `dev`) debe usar uno de los tipos
de arriba:

| Commits desde el ultimo tag estable | Version |
| --- | --- |
| `tipo!:` o `BREAKING CHANGE:` en el cuerpo | major (minor mientras estemos en `0.x`) |
| algun `feat` | minor |
| cualquier otro tipo | patch |

Ejemplo: con `v0.2.0` publicado, un `fix` en `dev` crea `v0.2.1-dev.1`; un
`feat` posterior crea `v0.3.0-dev.1`; el merge a `main` publica `v0.3.0`.

## Trivy en CI

El job `<app> (docker build + trivy)` revisa dependencias, secretos y
Dockerfile de la app, y luego la imagen construida. Falla solo con
vulnerabilidades HIGH o CRITICAL que ya tienen version corregida; las demas
quedan visibles en la pestana Security del repo.

Si un PR falla por Trivy:

1. Leer en el log del job el paquete, el CVE y la version corregida.
2. Actualizar la dependencia directa, o forzar la transitiva con
   `pnpm.overrides` en el `package.json` de la app.
3. Si no se puede corregir ahora, agregar el CVE a `.trivyignore` en la raiz
   con un comentario que diga por que y hasta cuando.

Para reproducirlo local (requiere Docker):

```bash
.github/scripts/trivy.sh fs --ignore-unfixed --severity HIGH,CRITICAL frontend
```

## SonarQube en CI

El job `SonarQube (quality gate)` analiza el codigo propio (`backend/src`,
`frontend/src`) en SonarQube Cloud. El quality gate "Sonar way" evalua solo el
codigo nuevo del PR: la deuda existente no bloquea, pero el PR no puede
agregar bugs, vulnerabilidades, hotspots sin revisar ni duplicacion excesiva.
La configuracion esta en `sonar-project.properties`.

El gate solo bloquea en los PRs. En `main` el analisis corre igual y alimenta
el dashboard, pero no espera el gate: un problema de calidad que ya paso
revision no debe bloquear el deploy a produccion.

Si un PR falla por SonarQube:

1. Abrir el link al dashboard que deja el job o el comentario del bot en el PR.
2. Corregir los issues marcados en el codigo nuevo.
3. Si es un falso positivo o un hotspot seguro, marcarlo en SonarQube
   ("Accept" o "Safe") con un comentario que diga por que.
