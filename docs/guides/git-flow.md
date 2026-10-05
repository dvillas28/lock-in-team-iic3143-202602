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
