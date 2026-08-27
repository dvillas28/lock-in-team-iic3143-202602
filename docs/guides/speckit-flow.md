# Flujo Spec Kit

Los specs usan timestamp: `YYYYMMDD-HHMMSS-nombre-feature`.

## Ciclo

1. `/speckit-specify <descripcion funcional>`
2. Crear una rama separada para trabajar claro, por ejemplo
   `feat/course-sections`. No es bloqueo del comando de spec.
3. `/speckit-clarify` si quedan decisiones ambiguas.
4. `/speckit-plan`
5. `/speckit-tasks`
6. `/speckit-implement`
7. `/speckit-analyze` antes de cerrar cambios grandes.

## Convenciones

- Specs viven en `specs/<timestamp>-<short-name>/`.
- La rama separada es convencion de PR, no bloqueo tecnico. Ver
  [Git Flow](git-flow.md).
- `.specify/feature.json` es local y no se versiona.
- Para trabajar un spec especifico desde cualquier rama:
  ```bash
  export SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>-<short-name>
  ```
- Si no hay spec explicito, los scripts usan el spec mas reciente.
- Mantener los specs tecnologicamente agnosticos hasta `/speckit-plan`.
- Cada user story debe poder implementarse y probarse por separado.
- Registrar decisiones duraderas en `docs/adr/`.
