# Capacidad de sección = cupos de estudiantes

Fecha: 2026-11-12

## Estado

Aceptado en PR-4 (issue #300, epic #297). Reemplaza la definición implícita de
PR-3 (#306), que comparaba la capacidad con todas las matrículas activas.

## Contexto

`sections.capacity` existía sin una regla al matricular: se podía superar el
máximo. PR-3 sí la usaba al editar la sección, pero contando docentes y
ayudantes, de modo que el personal docente ocupaba cupos de estudiantes. No
se encontró un requisito previo (specs, entregas, OpenAPI) que defina la
capacidad incluyendo al personal.

## Decisión

- La capacidad cuenta **solo matrículas `student` activas**. Docentes y
  ayudantes nunca consumen cupos.
- `null` es ilimitada. Un valor numérico se aplica en todas las vías que
  pueden crear un estudiante activo:
  - alta (`POST …/enrollments`, rol student),
  - cambio de rol hacia student (`PATCH` role),
  - reactivación de una matrícula student (`PATCH` active: true).
  Sin cupo, todas responden `409 SECTION_FULL` sin escritura ni auditoría.
- Repetir una matrícula student que ya está activa sigue siendo idempotente
  (200, mismo ID) y no consume otro cupo.
- Editar la capacidad usa la misma definición:
  `SECTION_CAPACITY_BELOW_ENROLLMENTS` compara con los estudiantes activos.
  El código no cambia de nombre para conservar el contrato.
- Concurrencia: toda escritura de matrículas y de capacidad toma el bloqueo
  `FOR UPDATE` del curso (`sectionScope(..., lock=true)`), así que el conteo y
  la inserción quedan serializados. Las pruebas de integración lanzan
  solicitudes simultáneas por el último cupo.
- El historial se conserva: los cupos se liberan revocando o cambiando el rol,
  nunca borrando filas.
- Una sección heredada con capacidad 0 no admite estudiantes; sí personal.

## Consecuencias

- Una única definición vive en `backend/src/sections/section-capacity.ts`
  (`activeStudents`, `requireStudentSeat`).
- La interfaz explica la regla junto al rol («Docentes y ayudantes no ocupan
  cupos de estudiantes») y muestra `SECTION_FULL` junto al rol, sin cerrar
  el modal ni perder la selección.
- Las secciones existentes que antes no se podían reducir porque contaban al
  personal ahora admiten una capacidad menor, siempre que cubra a sus
  estudiantes activos (y nunca por debajo de la capacidad actual).
