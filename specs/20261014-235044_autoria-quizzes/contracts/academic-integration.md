# Integración académica con misiones posteriores

Este contrato se implementa parcialmente ahora y es requisito obligatorio de
intentos-calificacion y notas-publicacion-auditoria. No crea sus endpoints/tablas.
El spec de autoría distingue aceptación local de integración; los specs de ambas
misiones consumidoras enlazan este contrato y exigen sus pruebas reales al cierre.

## Entregable actual

- Quiz publicado inmutable; no hay PATCH ni retorno a draft tras publish.
- GradeItem único por Quiz, peso inicial 0 y creación transaccional.
- Course.grade_items_locked_at monotónico; trigger impide insertar GradeItem
  después de congelar. Sin API que permita fijar/restablecer el marcador.
- canAuthorQuiz y requireStudentAttemptEligibility reutilizables y probados.
- Locks Course→Quiz coherentes con cursos-roles; snapshots sin pauta.
- Reasignación sectionId solo en draft, con autorización origen/destino y mismo
  curso/tenant. Quiz.id/Section.id no cambian; publicado no se reasigna.

## Futuro inicio y uso de intentos

1. Bloquear identidad/contexto con protocolo heredado.
2. Bloquear Course FOR UPDATE, luego Enrollments autorizantes y Quiz FOR UPDATE.
3. Revalidar student de la sección histórica, destino y ausencia de canAuthorQuiz.
4. Exigir publishedAt, ventana y política de intentos; después asignar intento.
5. Guardar/responder sin pauta; guardado/envío revalidan permisos actuales.

Primer intento solo existe para Quiz publicado. Toda edición ya está prohibida;
no agregar tabla placeholder ni consulta a quiz_attempts inexistente aquí.
Intento cancelado no reabre Quiz ni elimina ese bloqueo.
Carrera publish/inicio: inicio primero observa draft y falla; publish primero
habilita validación normal de inicio. La prueba HTTP completa pertenece a intentos.

## Futura publicación de Grade y configuración de pesos

Bajo Course FOR UPDATE, validar todos los registros seleccionados y pesos.
En la misma tx que primera Grade.published_at:
- fijar grade_items_locked_at con COALESCE(valor, timestamp de publicación);
- conservar valor existente si ya estaba fijado;
- publicar Grades y auditar; si falla cualquier paso, rollback íntegro.

Esa misión agrega enforcement DB de la relación Grade publicada→marcador;
no basta confiar en que un controller recuerde actualizar Course.
Prohibir cambios de pesos si marcador no-NULL; ni fixture ni API pueden restablecerlo.
No duplicar grade_items ni moverlos a otro Quiz/curso al implementar notas.
Antes de fijar marcador, publicación de quiz gana el lock y agrega ítem normalmente;
después de fijarlo solo publish de quiz ya publicado sigue siendo no-op exitoso.
No calcular congelación mirando solo notas de una sección; es global al curso.

## Validación actual y futura

Ahora: fixtures SQL fijan marcador y compiten con publish usando dos conexiones;
probar ambos órdenes, rollback y unicidad; no llamar a esto nota publicada real.
Ahora: fixtures publicadas prueban PATCH 409 y guard student+teacher denegado,
sin depender de endpoints de US1 ni de tabla de intentos.
Después: prueba integrada con Grade real, triggers de publicación, pesos,
inicio concurrente y revocaciones. Es condición de cierre de cada misión futura.
No marcar misiones posteriores como completadas por pasar fixtures de este plan.

## Persistencia y auditoría

Conservar institution/course/section históricos conforme al modelo vigente.
Todas las operaciones usan un PoolClient por transacción, sin lock upgrades.
No introducir serialización por proceso, caché de roles ni locks que inviertan orden.
No incluir pauta en eventos, respuestas estudiantiles, errores o logs futuros.
