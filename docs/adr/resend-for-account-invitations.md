# Resend para invitaciones y activación de cuentas

Fecha: 2026-11-06. Estado: proveedor elegido por el usuario; implementación pendiente.
Rama documental: `docs/perfiles-altas-usuarios`. Sin infraestructura provisionada.
Responsables: Matías implementa; Daniel administra DNS. Objetivo: 2–8 noviembre de 2026.

## Contexto

El usuario eligió alta con invitación y activación, tanto individual como CSV,
y después seleccionó Resend. AcademiX ya administra identidad global, Argon2id,
JWT y pertenencias institucionales; el proveedor cubrirá correo transaccional.
Esta decisión acota el canal antes pendiente; no implementa aún las altas.

## Decisión

- Integrar el SDK oficial `resend` únicamente en backend NestJS, mediante un
  servicio pequeño de correo y una plantilla propia HTML/texto. Usar pnpm cuando
  se implemente; no instalar dependencias durante esta preparación.
- Enviar por HTTPS. Render Free bloquea los puertos SMTP habituales,
  según [sus limitaciones](https://render.com/docs/free).
- Remitente elegido por delegación del usuario: AcademiX <no-reply@mail.academix.dvillasc.me>.
  Daniel verificará el dominio; dirección elegida no acredita DNS listo.
- Configurar ese remitente verificado común, API key de solo envío y
  orígenes de activación permitidos por institución; secretos solo en backend.
  Ver [SDK](https://resend.com/docs/send-with-nodejs) y
  [dominios](https://resend.com/docs/dashboard/domains/introduction).
- AcademiX crea/consume invitaciones y protege permisos; Resend envía el enlace.
  El primer GET del enlace no activa ni consume nada; el titular confirma por POST.
- Confirmar DB antes de llamar a Resend. El correo y PostgreSQL no comparten
  transacción: registrar estado de envío separado del estado de activación.
- Persistir solo hash del código y metadatos de entrega en account_invitations.
  Ante pérdida del código o resultado incierto, un reenvío explícito rota código
  y versión. No guardar el enlace ni el código legible para recuperarlos después.
- CSV confirma invitaciones atómicamente; el envío posterior se realiza en
  solicitudes cortas, con progreso y reanudación desde UI. Sin Redis, workers,
  cola externa ni promesa de envío automático con la pestaña cerrada en esta entrega.

## Límites y recuperación

El plan Free permite 100 correos/día y 3.000/mes; la cuota diaria cambia a las
00:00 UTC. Cuenta/team compartido incluye pruebas reales, reenvíos y otras
instituciones; no son cuotas independientes por tenant o API key.
Fuente: [cuotas de Resend](https://resend.com/docs/knowledge-base/account-quotas-and-limits).
Un CSV de 100 nuevas altas puede agotar el día. Conservar pendientes y mostrar
cuota agotada; no cancelar invitaciones válidas ni afirmar entrega al destinatario.
La API del proveedor determina disponibilidad real; no inferirla de contadores del tenant.

La [idempotencia de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys)
dura 24 h. Reintentar el mismo envío exige misma clave y mismo cuerpo; no cubre
activación, reenvío con otro código ni deduplicación indefinida de altas.
El plan detalla la recuperación sin conservar secretos en
[correo Resend](../planning/perfiles/correo-resend.md).

## Consecuencias y alternativas

En local/CI se usa correo simulado por defecto; una prueba manual puede usar
Resend real con enlace a localhost y consume cuota. Producción exige dominio
verificado, secreto y orígenes HTTPS correctos. SDK/mailer no sustituyen pruebas
de tokens, RLS, concurrencia ni revocación.
Resend puede aceptar un mensaje sin que haya llegado al buzón; el MVP informa
“Aceptado por Resend”. Webhooks de entrega/rebote quedan para una ampliación.
El proveedor necesariamente recibe destinatario y contenido de activación;
no incluir contraseñas, notas o roles, ni registrar cuerpos sensibles en la aplicación.

Brevo y MailerSend fueron alternativas consideradas; se elige Resend por
preferencia explícita del usuario. Migrar a autenticación administrada o agregar
servicios de background no responde a esta decisión y queda fuera.
Trazabilidad: RF50–55, RNF18–20 y USR-04/05 (absorbe USR-09/10), con dependencias en
[backlog](../planning/perfiles/backlog.md). No publicar issues por ahora.
