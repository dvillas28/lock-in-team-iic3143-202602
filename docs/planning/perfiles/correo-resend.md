# Plan de correo: invitaciones mediante Resend

Fecha: 2026-11-06. Proveedor decidido; código/configuración/despliegue pendientes.
[ADR](../../adr/resend-for-account-invitations.md) · [Requisitos](requisitos.md) · [Backlog](backlog.md).
Alcance: CU-19/20, RF35–44/47–56, RNF11–16/18–20. Identidad/activación son de AcademiX.
Responsables confirmados: Matías implementa; Daniel administra DNS para verificar el remitente.
Objetivo: semana del 2 al 8 de noviembre de 2026. Remitente elegido, DNS aún sin verificar.
Decisión cerrada: [PEND-01](../../../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md).

## Preparación del servicio

1. Crear cuenta Resend y verificar un subdominio bajo control del equipo mediante
   sus registros DNS SPF/DKIM; revisar DMARC. Remitente elegido por delegación del usuario:
   `AcademiX <no-reply@mail.academix.dvillasc.me>`.
2. Usar ese remitente común para UC/UTFSM, pendiente de verificación; identificar institución en asunto/cuerpo,
   sin suplantar dominios universitarios. API key con permiso de envío solo al dominio.
3. Definir variables propuestas, sin editar .env.example ni Render todavía:

| Variable backend | Uso |
| --- | --- |
| MAIL_DELIVERY_MODE | fake en desarrollo/CI por defecto; resend en prueba manual/producción |
| RESEND_API_KEY | Secreto, nunca NEXT_PUBLIC ni versionado |
| MAIL_FROM | AcademiX <no-reply@mail.academix.dvillasc.me>; usar tras verificar dominio |
| ACTIVATION_ORIGINS_BY_INSTITUTION | Mapa explícito slug → origen frontend permitido |

En local, el mapa usa `http://uc.localhost:3000` y `http://utfsm.localhost:3000`;
en producción, los orígenes HTTPS UC/UTFSM configurados. La institución se deriva
del path y permiso; Host, Origin, body o CSV no pueden elegir un destino del enlace.
Fallar ante mapa/remitente incompleto en modo resend, sin fallback a direcciones arbitrarias.
Producción debe usar resend; fake es solo local/CI, no un fallback silencioso ante fallos.

## Cuenta e invitación, independientes del envío

Formulario/confirmación CSV crea invitación pendiente y evento en DB; todavía no
User/membership. Inicialmente token_hash/expires_at son null y delivery_version=0.
Al despachar se generan código aleatorio y hash; vence en 24 h desde esa emisión.
Aceptación exige hash vigente no nulo, código de un uso, User activo si existe,
institución activa y permiso admin OR superadmin vigente del emisor.

En account_invitations agregar metadatos mínimos de la última entrega:
delivery_status, delivery_version, delivery_key, provider_email_id,
delivery_attempts, delivery_started_at, last_delivery_at, last_delivery_error_code.
Mantener solo hash del código en DB. Historial de entregas/rotaciones va a audit_events
sanitizado y scoped; no hace falta una quinta tabla ni un outbox con secretos.

| Estado de envío | Significado y acción disponible |
| --- | --- |
| pending | No despachada; Enviar |
| sending | Operación reclamada; consultar estado, no duplicar |
| accepted | Resend devolvió ID; Reenviar con confirmación si aún no activó |
| failed | Rechazo conocido; corregir configuración/destinatario según error y reintentar |
| quota_blocked | Detener envíos; continuar tras recuperar cuota |
| unknown | Respuesta perdida; advertir y ofrecer reenvío explícito con enlace nuevo |

Activada/revocada/expirada son estados de invitación, distintos del correo.
accepted no significa entregado, leído ni activado. No habilitar envío de una
revocada/consumida. Una expirada requiere renovación explícita y nuevo código.

## Despacho y reintento

1. POST administrativo autoriza tenant/actor y bloquea invitación; solo admin OR
   superadmin activos. Reclamar versión/operación evita dos despachos concurrentes.
2. Persistir hash, vencimiento, estado sending, clave e historial; COMMIT.
3. Llamar SDK Resend con timeout acotado fuera de transacción; el código existe
   en memoria solo para componer HTML/texto. No devolverlo al admin ni en informes.
4. Persistir resultado con comparación de versión/clave: respuesta tardía nunca
   sobrescribe una rotación, revocación o aceptación posterior. Error no elimina el alta.
5. Repetir la misma petición HTTP de despacho devuelve su estado; no rota código.
   Clave propia de operación persistida; misma clave con otro propósito devuelve 409.
   Retener claves opacas anteriores, acción y versión en eventos sin fingerprint personal, con unicidad por
   invitación/operación; replay de una versión vieja no inicia ni sobrescribe la nueva.
6. Solo un reenvío explícito crea otra versión/código; invalida el anterior y exige
   otra clave. Confirmar “El enlace anterior dejará de funcionar”; limitar frecuencia,
   propuesta 60 s por invitación, y no sobrepasar una operación sending vigente.

Resend conserva claves idempotentes 24 h: en un reintento dentro de la misma
ejecución usar exactamente el mismo cuerpo/clave. Máximo dos intentos en un
presupuesto de 8 s; respetar Retry-After. Con código perdido por timeout/reinicio,
no reconstruir desde hash ni reutilizar clave con otro cuerpo: marcar unknown.
Un sending sin completar tras 30 s pasa a unknown al consultar/revalidar;
el reenvío explícito rota también si el primer mensaje pudo haber llegado.
No prometer exactly-once de correo, especialmente después de 24 h.

## Enlace y plantilla

Asunto “Activa tu acceso a AcademiX — {institución}”, nombre escapado, institución,
botón Activar cuenta, vencimiento, alternativa texto y aviso si no esperaba la invitación.
URL: origen configurado + `/activate#token=...`; leer a memoria, retirar fragmento
con replaceState y enviarlo por POST. Sin token en query/path API, logs o almacenamiento web.
GET/preview de enlace por scanners no consume ni crea cuenta. Para User existente,
conservar código solo en memoria durante login y exigir identidad/correo coincidente.
Sin redirección de documento para login ni refresco: si se pierde, reabrir el enlace.
Desactivar seguimiento de clics/aperturas, recursos externos y analítica en activación;
no incluir contraseñas, información académica ni roles en correo o metadata del proveedor.

## CSV y cuota

100/día y 3.000/mes Free; el día es UTC y todas las instituciones comparten cuenta.
Confirmar CSV registra invitaciones/recibo atómicamente; el cliente inicia luego
despachos individuales secuenciales con progreso, cada uno en solicitud corta.
Un lote no ocupa la transacción DB ni una sola petición de red durante 100 envíos.
Respetar rate limit y distinguir rate_limit_exceeded de daily/monthly_quota_exceeded;
cuota agotada pausa, error por destinatario deja resultado por fila, timeout deja unknown.
Cerrar pestaña/logout interrumpe coordinación; al volver, “Continuar envíos pendientes”
procesa pendientes no ambiguos tras revalidar permisos, sin repetir accepted/unknown.
Los already-member/ya-pendiente no reenvían. Cambios de envío nunca revierten un lote confirmado.
No prometer cuota restante exacta del tenant: el proveedor tiene autoridad sobre el total compartido.

## API y verificaciones propuestas

POST `/api/v1/institution/{slug}/invitations/{id}/send` para primer envío/pendiente;
POST `.../{id}/resend` para rotación confirmada. DTO con estado/fechas/error seguro,
sin token/hash/delivery_key ni respuesta cruda de Resend. GET del lote incluye entrega.
Actualizar OpenAPI, catálogo, parsers y errores sin convertir un fallo del mailer en 401.
Sin webhook ni autoentrega en background en esta fase: nunca mostrar “Entregado” sin evidencia.
Aplicar [limpieza aprobada](retencion.md): tras depurar no enviar/renovar; replay mutante da 410 y GET conserva recibo mínimo.
Tras error al guardar el resultado de Resend, conservar sending y recuperar como unknown;
auditar cada versión con metadata mínima, sin mensajes crudos del proveedor ni enlaces.

Tests: fake captura correo en memoria sin envíos ni logs sensibles; manual real
opt-in con destinatarios del equipo, dominio y enlaces locales; consume cuota.
Cubrir plantilla, orígenes UC/UTFSM, GET sin efecto, activación de un uso, permisos,
429 por cuota/rate, 5xx/timeout, fallo al persistir resultado, reenvío concurrente,
revocación durante envío, reinicio y pausa/reanudación CSV sin secretos ni duplicados.

## Fuentes oficiales consultadas el 2026-11-06

[SDK](https://resend.com/docs/send-with-nodejs), [dominio](https://resend.com/docs/add-a-domain),
[cuotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits),
[idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys),
[errores](https://resend.com/docs/api-reference/errors).
