# CSV efímero y retención de datos temporales de altas

Estado: **política de limpieza aprobada por el usuario el 2026-11-06**: 7 días
para datos personales derivados del CSV y 30 para invitaciones finalizadas/vencidas.
Solo planificación: no se ejecutan borrados ni se conserva el archivo como respaldo.
Decisión cerrada: [PEND-02](../../../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md).

## Decisión confirmada: no conservar el archivo

Procesar el upload de forma acotada en memoria y descartar sus bytes al terminar
la validación/parsing, también ante error, cancelación o solicitud malformada.
Sin archivo temporal en disco, S3, base de datos, logs, caché ni copias codificadas
como base64/JSON para conservar el original. Aplicar límite antes y durante la lectura.
Los datos extraídos necesarios para preview/altas y recibos son distintos del archivo;
su persistencia mínima se describe en el modelo y se limpia según esta política.

## Qué significa

Retención es cuánto tiempo permanece guardada cada clase de dato. Expiración es
hasta cuándo se puede usar una acción: un enlace vencido puede seguir teniendo
un registro histórico en DB hasta que corresponda limpiar sus datos temporales.

| Dato | Política | Qué pasaría al cumplirse |
| --- | --- | --- |
| Código de activación | 24 h desde emisión | Deja de activar; no elimina una cuenta |
| Vista previa CSV | 24 h desde validación | Ya no se puede confirmar; debe validarse otra vez |
| Archivo CSV original | Confirmado: efímero, solo memoria | Descartar bytes tras procesar; no hay plazo de retención del archivo |
| Copias de nombre/correo en filas CSV | 7 días desde confirmación o expiración del lote | Limpiar copias temporales, mantener resultado/recibo mínimo |
| Datos personales de invitación | 30 días desde aceptación, revocación o vencimiento | Limpiar nombre/correo/hash del código/fingerprint; mantener ID, referencias, resultado y fechas |
| Invitación sin primera emisión de código | Default de diseño: 30 días desde creación | Revocar y limpiar datos personales; no inventar expires_at de un código inexistente |
| Auditoría/recibos mínimos | Sin borrado automático en esta política | Conservar evidencia sin contraseñas, códigos ni CSV crudo |

El caso sin primera emisión adopta el mismo límite de 30 días como default de
diseño, complementando los plazos aprobados; no equivale a 30 días tras un token inexistente.
Las filas eliminan name, normalized_email, mensajes con valores personales y
input_fingerprint del lote a los 7 días. Las invitaciones limpian invited_name,
normalized_email, token_hash e input_fingerprint a los 30. Marcar pii_purged_at.
El inicio del plazo se registra una vez; consultar, reintentar o repetir una operación
no lo desplaza. Fechas en UTC; vencimiento funcional y limpieza son controles separados.

## Ejemplo

Un CSV incorpora a Ana y ella activa su cuenta. El nombre/correo de Ana vive
normalmente en users. Limpiar la fila temporal del CSV no elimina ese usuario,
su pertenencia, foto, contraseña, matrículas, intentos ni notas.
Después puede conservarse evidencia mínima de que el lote generó esa invitación
y fue aceptada, sin mantener otra copia del nombre/correo en cada paso del proceso.

## Impacto en la planificación

USR-04 implementa limpieza de invitaciones; USR-05, filas/lotes; USR-08 verifica ambas.
El diseño técnico de USR-01 debe concretar constraints y una operación de mantenimiento
ejecutada por operador en lotes acotados, idempotente y con corte UTC; sin worker nuevo.
Bloquear filas y revalidar estado antes de limpiar; una carrera con envío/aceptación
no puede borrar una invitación vigente. Registrar resultado y fecha, sin copiar PII.
No borrar en cascada invitaciones, lotes o filas que sostienen auditoría/FK.
Conservar IDs, institución/actor, número de fila, resultado, contadores, fechas y
claves opacas de operación; no snapshots de nombres/correos ni fingerprints personales
en auditoría. Los informes antiguos muestran datos depurados, sin reconstruir PII.
Tras depurar, rechazar mutaciones/replays con 410 sin crear ni enviar nuevamente;
GET autorizado conserva recibo mínimo. Una nueva alta requiere operación nueva.
La limpieza necesita su propia prueba, separada de la expiración del enlace.
La evidencia mínima debe ser específica; no conservar el CSV o el cuerpo del correo
como si fueran auditoría necesaria. La política afecta a registros de AcademiX;
no elimina mensajes ya enviados ni datos de cuentas, pertenencias o historia académica.

[Requisitos](requisitos.md) · [Modelo](modelo-datos.md) · [Backlog](backlog.md).
