# Cancelar intentos de quiz abandonados

Fecha: 2026-09-28

## Estado

Aceptado.

## Contexto

Publicar una nota exige que no exista un intento `in_progress` para el mismo
estudiante y quiz. Un intento abandonado no tenía transición de salida y podía
bloquear la publicación indefinidamente. `closes_at` es opcional y no cierra
intentos ya iniciados.

## Decisión

- Se agrega cancelación explícita de un intento `in_progress`. Puede ejecutarla
  su propietario con permisos estudiantiles vigentes o un coordinador del curso
  o docente autorizado de la sección histórica. La transición es atómica y
  audita actor y cambio; `cancelled` es terminal.
- La cancelación no califica el intento ni modifica notas. Un intento cancelado
  deja de bloquear la publicación, pero solo un intento calificado origina una
  nota publicable.
- `max_attempts` continúa contando todos los intentos iniciados, incluidos los
  cancelados; `attempt_number` no se reutiliza. Guardar o enviar un intento
  cancelado produce 409. Una nota ya publicada no se reabre.

## Consecuencias

El staff autorizado puede resolver un abandono antes de publicar sin cerrar
automáticamente intentos legítimamente activos ni requerir un scheduler en el
MVP. La implementación futura debe persistir `cancelled_at` y la auditoría en
la misma transacción, con aislamiento por tenant.
