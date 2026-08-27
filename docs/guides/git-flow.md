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
