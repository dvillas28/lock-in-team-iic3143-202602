# ADR: Seed completa de presentación con identidades existentes

Fecha: 2026-10-29. Estado: implementada; aplicación en producción pendiente de revisión.

## Contexto y decisión

El bootstrap institucional crea diez identidades. La seed académica legacy usa otras
cinco y solo incorpora cursos. Ninguna cubre la presentación solicitada sin requerir
credenciales o mezclar cuentas. Añadir una operación manual de datos académicos,
`db:seed:demo`, separada del aprovisionamiento de identidades, sobre el mismo esquema,
configuración de conexión y ledger operativo existentes. No invoca los bootstraps.

- Resolver diez usuarios por correo normalizado y tenants por slug; aceptar IDs existentes
  arbitrarios. Exigir cuentas/memberships activas, Admin y Superadmin efectivos.
- No actualizar usuarios, contraseñas ni memberships existentes. Matrículas nuevas
  en secciones nuevas conectan Teacher/Assistant/Student. Admin posee los cursos y
  recibe matrícula Teacher como en el flujo existente de creación de cursos.
- Usuarios adicionales con preimagen aleatoria descartada de 256 bytes, mayor al límite
  de entrada del login (128 bytes); hash Argon2id válido, sin credenciales utilizables.
- UUID determinista por namespace `academix-presentation-v1`; ledger con fingerprint,
  operador, fecha base y grafo de ownership completo. Colisión sin marcador = error.
- Una transacción incluye ambos tenants, resultados, recibos y ledger; advisory lock
  serializa aplicaciones concurrentes. Preview/check/verify son de solo lectura.
- Insert-only al aplicar; reejecución valida grafo y reporta diferencias editables sin
  repararlas. No restaurar revocaciones ni recalcular resultados persistidos.
- Reusar `calculateGrade` y `publicationInput`; cumplir pesos, historial y freeze de DB.
  Las respuestas y notas iniciales son simuladas; los recibos son parte de ese dataset.
- No inventar eventos académicos como si las cuentas hubieran ejecutado acciones HTTP.
  La evidencia de carga es `demo_data_runs`; el recorrido produce auditoría académica real.
- Exigir host/base esperados y opt-in en cada apply, incluso local. Sin hooks de arranque,
  despliegue automático, cambios de grants/RLS, esquema, API, autenticación o frontend.

## Consecuencias y validación

La seed no puede reparar falta de permisos o cuentas: el equipo debe resolverlos
mediante los mecanismos operativos existentes y repetir la verificación.
Los datos son duraderos y su historial no admite una limpieza general.
Las fechas se anclan al primer apply; no se desplazan al repetir.
Las dos seeds anteriores siguen compatibles para tests históricos/locales; la nueva
presentación no debe operarse con las contraseñas/flags de esos bootstraps.

[Matriz y limitaciones](../DEMO_SEED_AUDIT.md), [Render](../DEMO_SEED_RENDER.md),
[guía por rol](../DEMO_GUIDE.md). Pruebas nuevas: `presentation-{seed,http}.test.mjs`;
integridad, rollback, replay concurrente, preservación de identidades, permisos,
aislamiento HTTP y consumo con adaptadores del frontend.
