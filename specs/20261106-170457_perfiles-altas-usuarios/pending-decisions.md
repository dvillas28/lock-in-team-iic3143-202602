# Registro de decisiones y tareas operativas

Actualizado: 2026-11-06. [Spec](spec.md). PEND-01/02 se conservan como IDs de
trazabilidad, cerrados como decisiones. Implementación y commits por avance autorizados.

## PEND-01 — Remitente de invitaciones: cerrado

- **Respuesta:** el usuario delegó elegir un ejemplo de remitente.
- **Selección:** `AcademiX <no-reply@mail.academix.dvillasc.me>`, común para UC/UTFSM;
  la institución se identifica en asunto/cuerpo. Dominio de envío: mail.academix.dvillasc.me.
- **Por ejecutar:** Daniel debe comprobar control del dominio, agregar registros DNS
  y verificarlo en Resend; no hay evidencia de verificación en esta documentación.
  Matías configurará MAIL_FROM, secreto backend y mapa de orígenes por institución.
- **Impacto:** decisión suficiente para planificar; el envío real exige dominio
  verificado y configuración efectiva. Local/CI mantienen fake por defecto.
- **Referencias:** FR-011/012/020, RF50/51/52, RNF20 y USR-04;
  [plan de correo](../../docs/planning/perfiles/correo-resend.md).

## PEND-02 — Limpieza de datos derivados: cerrado

- **Respuesta:** el usuario aprobó la limpieza propuesta a 7/30 días.
- **Política:** nombres/correos y fingerprints derivados del CSV se limpian a los
  7 días desde confirmación o expiración del lote; datos personales de invitaciones,
  a los 30 desde aceptación, revocación o vencimiento.
- **Default complementario de diseño:** solicitudes sin primera emisión de código
  se revocan/depuran a los 30 días desde creación; no dependen de expires_at inexistente.
- **Evidencia:** conservar solo IDs, referencias, institución/actor, resultados,
  contadores, fechas y claves opacas; sin copias de PII ni fingerprints personales en auditoría.
  Mantener FK e historia académica; no borrar cuentas ni pertenencias.
- **Por ejecutar:** Matías debe concretar diseño técnico, implementar mantenimiento
  idempotente acotado y probar cortes/carreras/recibos; no se ejecuta limpieza ahora.
- **Referencias:** FR-025/SC-010, RF56 y USR-01/04/05/08;
  [política completa](../../docs/planning/perfiles/retencion.md).

## Separación de conceptos

| Concepto | Situación |
| --- | --- |
| Archivo original | Efímero: nunca se conserva |
| Código y preview | Vigencia funcional de 24 h; distinta del plazo de limpieza |
| Filas e invitaciones | Política 7/30 aprobada; mantenimiento pendiente de implementar |
| Cuenta, pertenencias y notas | No se eliminan por limpiar datos temporales |
| Auditoría mínima | Se conserva sin secretos, copias de PII o CSV crudo |
| Remitente | Elegido; DNS/configuración/prueba real pendientes |

No quedan aclaraciones de producto abiertas en este registro. USR-01 aún requiere
[plan técnico](plan.md); las cinco issues están publicadas y su ejecución se registra en [tasks](tasks.md).
Sin configuración externa la aplicación inicia con servicios afectados disabled. Fake solo tests.
La infraestructura y prueba real siguen pendientes de Daniel; no se crean nuevas issues.
