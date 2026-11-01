# Cualquier docente activo puede editar ponderaciones del curso

Fecha: 2026-11-01. Estado: aceptado por instrucción del usuario.

## Decisión

Un Enrollment teacher activo en cualquier sección del curso autoriza editar sus
ponderaciones comunes. No se exige is_admin institucional ni ser dueño del curso.
La membresía institucional, institución y usuario deben seguir activos.

Esta decisión reemplaza la restricción admin+ownership para ponderaciones de
los ADR anteriores. No modifica permisos para configurar cursos, crear secciones,
publicar notas ni consultar participantes, intentos o notas de otras secciones.
Assistant, student, admin sin teacher y superadmin sin teacher no adquieren este
permiso. La revocación del rol teacher se revalida en cada escritura.

Los porcentajes afectan a todas las secciones y la interfaz lo explica.
La colección debe ser completa, los pesos estar entre 0 y 100 con hasta dos
decimales, y sumar exactamente 100 %. La primera publicación de notas bloquea
cambios en todo el curso, incluso si ocurrió fuera de las secciones del docente.

La consulta de ítems devuelve weightsLocked como metadato del curso, sin exponer
notas de otras secciones. El backend conserva la autoridad ante concurrencia.
No hay migraciones, cambios de roles persistidos ni alteraciones de notas.
La escritura sigue siendo transaccional y registra gradebook.weightsUpdated con
actor y valores anteriores/nuevos; un no-op no agrega un evento.
