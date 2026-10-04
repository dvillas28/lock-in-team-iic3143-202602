# Reglas de trabajo

Estas reglas ordenan cómo el [plan de trabajo detallado](08-work-plan-detail.md)
se traduce en trabajo trazable en GitHub. Aplican a todo el equipo desde la
semana 1.

## Tarjetas e issues

- Cada tarjeta del backlog es un issue de GitHub.
- Cada tarea del plan (por ejemplo, `BE-05`) corresponde a una tarjeta.
- El título del issue comienza con el ID de la tarea:
  `BE-05 Resolución de institutionSlug y guard de membership`.
- El issue indica el área, el tipo, la prioridad, el caso de uso relacionado,
  el responsable y la estimación en horas, tal como aparecen en el plan.

## Pull requests

- Toda PR debe asociarse a un issue.
- Quien abre la PR puede asociarla de dos formas:
  - escribiendo `Closes #<número>` en la descripción;
  - vinculando el issue desde la sección **Development** de la PR.
- Si la PR se abre sin issue asociado, el scrum master (Daniel Villaseñor) la
  asocia a la brevedad. Una PR sin issue no bloquea la revisión, pero sí queda
  pendiente de asociar antes de considerarse cerrada.
- Una PR puede cubrir más de un issue cuando las tareas son inseparables; en ese
  caso se asocian todos.

`Closes #<número>` solo cierra el issue automáticamente cuando la PR se integra
a `main`, la rama por defecto. Si la PR apunta a `dev`, el issue queda vinculado
y se cierra manualmente al integrarse.
