# Alinear dominio académico y contrato de Entrega 2

Fecha: 2026-09-28

## Estado

Aceptado. Supera la parte de roles, intentos, autenticación y auditoría de
[Elegir alcance MVP para Entrega 2](choose-delivery-2-mvp-scope.md). Ratifica
su sharding por universidad, Railway como plataforma inmediata y el recorte de
entregas manuales, IA, chat, calendario y operación distribuida.

## Contexto

El modelo inicial de Entrega 2 no representaba al coordinador de curso, dejaba
la política de intentos sin definir y posponía auditoría. El contrato OpenAPI
ya exigía pertenencias de coordinador, JWT y eventos de auditoría. Esto
dejaba dos fuentes incompatibles para implementar el mismo MVP.

## Decisión

- `coordinator` es una pertenencia de curso; `teacher`, `assistant` y
  `student` son pertenencias de sección. Una persona puede tener varios
  roles activos, incluso en la misma sección. Los permisos se validan por
  operación y alcance.
- Los cursos demo se aprovisionan junto con su primera pertenencia de
  coordinador. El header `x-tenant` selecciona DB; la API académica exige JWT
  y pertenencias activas. La sesión mock solo sirve al walking skeleton.
- Cada intento guarda `section_id` histórico y `attempt_number`. Un quiz
  define un máximo positivo de intentos o `null` para ilimitados. El último
  intento calificado determina la nota vigente mientras no esté publicada.
- Se bloquean nuevos intentos y cambios de una nota ya publicada. Desde
  la primera nota publicada del curso se bloquean nuevos ítems y cambios de
  ponderación. La escala y el promedio parcial se calculan
  en backend como describen los modelos.
- La pauta se valida antes de publicar, no se expone en vistas estudiantiles
  y no cambia después de existir intentos.
- El MVP académico incluye eventos de auditoría inmutables y sanitizados,
  persistidos en la DB del tenant y en la misma transacción que el cambio.
  No se implementa un RBAC global ni un sistema general de observabilidad.

## Consecuencias

El MVP requiere más trabajo que el recorte original, pero sus modelos y API
quedan consistentes en permisos, calificaciones e historial académico. El
walking skeleton continúa acotado a conexión frontend/backend, tenancy,
CI/CD y despliegue; JWT y auditoría son puertas de entrada obligatorias antes
de habilitar el flujo académico.
