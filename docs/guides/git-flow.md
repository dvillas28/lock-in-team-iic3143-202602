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

### Version desplegada

Al publicar un release, el workflow fija `APP_VERSION` en los servicios
`backend` y `frontend` de Railway sin redesplegar. Railway espera al workflow y
solo redespliega el servicio cuyos archivos cambiaron (`watchPatterns`), asi que
cada servicio muestra **el release con el que se desplego por ultima vez**:

- Release con cambios en ambos: los dos muestran la misma version.
- Release con cambios solo en `frontend/`: el frontend muestra la nueva y el
  backend sigue con la anterior. Es correcto: es el codigo que esta corriendo.

El frontend muestra su version en la home; el backend la expone en `/health`.
En local, sin `APP_VERSION`, ambos muestran `dev`.

## Rollback

Pendiente de definir como proceso. Lo que ya sabemos:

- Un rollback en Railway (Deployments → menu del deployment sano → Rollback)
  restaura la imagen **y las variables** de ese deployment, incluida
  `APP_VERSION`, por lo que la version mostrada sigue siendo la real.
- Solo esta disponible dentro de la retencion de imagenes del plan; despues hay
  que usar Redeploy, que reconstruye desde el codigo original.
- Si el release cambio el contrato de la API, revertir ambos servicios juntos:
  un frontend nuevo contra un backend viejo puede romperse.
- El rollback no cambia git: `main` sigue con el codigo malo y el proximo deploy
  lo vuelve a subir. El arreglo definitivo es un `git revert` mergeado, que
  publica un tag nuevo (por ejemplo `v0.3.1`); los tags nunca se reutilizan.
- Cuando haya base de datos, un rollback de codigo no revierte el esquema; las
  migraciones deberan ser compatibles hacia atras (decision pendiente de ADR).

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
