# Estado Entrega 2

## Completo en esta base documental

- Scope MVP actualizado.
- Requisitos y casos de uso del MVP.
- Arquitectura ajustada a Railway.
- Migracion posterior a Google Cloud documentada.
- Modelo de dominio del flujo academico minimo.
- Modelo de datos registry + tenant DB.
- Riesgos actualizados.
- Plan de trabajo actualizado.
- Plan de walking skeleton.
- Trazabilidad contra pauta de Entrega 2.

## Falta antes de entregar implementacion

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

## Falta para MVP academico posterior

- Cursos y secciones.
- Enrollments por seccion y rol.
- Material markdown y archivos.
- Quizzes de alternativas.
- Calculo automatico de nota.
- Libro de notas con ponderaciones.
- Publicacion de notas.
- Vista estudiante de notas publicadas y promedio.

## Deuda aceptada

- Auth mock inicial.
- Rutas `/uc` y `/utfsm` + header `x-tenant` antes de subdominios.
- Sin auditoria historica.
- Sin Redis/workers.
- Sin replicas.
- Sin admin institucional separado.
- Sin recorrecciones.

## Referencias conservadas

Los documentos de Entrega 1 quedan como antecedente en `docs/deliveries/1`.
Entrega 2 no los reemplaza por completo: los recorta y actualiza para guiar la
implementacion inmediata.
