# Flujo Spec Kit

Los specs usan timestamp: `YYYYMMDD-HHMMSS_descripcion-mision`.

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

- Specs viven en `specs/<timestamp>_<descripcion-mision>/`.
- La rama separada es convencion de PR, no bloqueo tecnico. Ver
  [Git Flow](git-flow.md).
- `.specify/feature.json` es local y no se versiona.
- Para trabajar un spec especifico desde cualquier rama:
  ```bash
  export SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>_<descripcion-mision>
  ```
- Si no hay spec explicito, los scripts usan el spec mas reciente.
- Mantener los specs tecnologicamente agnosticos hasta `/speckit-plan`.
- Cada user story debe poder implementarse y probarse por separado.
- Registrar decisiones duraderas en `docs/adr/`.

## Documentación y misiones backend

- Objetivo: <150 líneas físicas por documento nuevo o modificado.
- Entre 150 y 200: justificar con `<!-- length-exception: motivo -->`.
- Máximo obligatorio: 200; dividir por responsabilidad y enlazar desde un índice.
- Regla para docs, specs, memoria/plantillas Spec Kit, README, AGENTS y DESIGN.
  Entregas históricas sin cambios y fuentes importadas de herramientas quedan exentas.
- Validar con `python3 .github/scripts/check-doc-length.py`; CI comprueba el diff.
- Nombres anteriores siguen válidos. Los scripts legacy de creación de ramas
  conservan su formato; para specs nuevas, usar el directorio explícito mostrado arriba.
- Cada spec enlaza CU/RF/RNF, tareas/issues, dependencias, exclusiones y aceptación.
- [Mapa backend](../backend/README.md): orden, cobertura y decisiones pendientes.
