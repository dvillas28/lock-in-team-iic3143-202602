# Estado Entrega 2

## Completo en esta base documental

- Alcance MVP actualizado.
- Requisitos y casos de uso del MVP.
- Arquitectura ajustada a Railway.
- Migración posterior a Google Cloud documentada.
- Modelo de dominio del flujo académico mínimo.
- Modelo de datos registry + tenant DB, con coordinador, sección histórica,
  intentos configurables, cálculo de notas y auditoría.
- Riesgos actualizados.
- Plan de trabajo actualizado.
- Plan de walking skeleton.
- Trazabilidad contra pauta de Entrega 2.

## Falta antes de la implementación

- Spec Kit del walking skeleton.
- Implementar frontend Hello World.
- Implementar backend Hello World.
- Conectar frontend con backend.
- Crear registry DB y tenant DBs demo.
- Crear portal home con rutas `/uc` y `/utfsm`.
- Configurar CI frontend/backend.
- Configurar CD Railway automatizado con `railway.toml` o documentar fallback
  manual si la cuenta lo bloquea.
- Crear tag y release GitHub.
- Guardar evidencia de pipeline y despliegue.

## Falta para MVP académico posterior

- Cursos y secciones.
- Pertenencias de coordinador y enrollments por sección con roles acumulables.
- JWT para operaciones académicas.
- Material markdown y archivos.
- Quizzes de alternativas con pauta protegida y límite opcional de intentos.
- Cálculo automático de nota desde el último intento.
- Libro de notas con ponderaciones y bloqueo tras publicar.
- Publicación de notas.
- Vista estudiante de notas publicadas y promedio.
- Auditoría inmutable de cambios sensibles.

## Deuda aceptada

- Auth mock solo para Hello World del walking skeleton.
- Rutas `/uc` y `/utfsm` + header `x-tenant` antes de subdominios.
- Sin Redis/workers.
- Sin réplicas.
- Sin admin institucional separado.
- Sin recorrecciones.

## Referencias conservadas

Los documentos de Entrega 1 quedan como antecedente en `docs/deliveries/1`.
Entrega 2 no los reemplaza por completo: los recorta y actualiza para guiar la
implementación inmediata.
