# Correo de invitaciones: DNS, Resend y recuperación

Daniel administra DNS/Resend; Matías integra el backend. [Índice](operacion.md).
Estado: adaptador implementado; Daniel reportó dominio verificado, key en Render y envío recibido el 2026-11-08.
Matías reportó prueba manual desde AcademiX el 2026-11-08; no repetida por el agente. [Evidencia de Daniel](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/235#issuecomment-6717211571).
[ADR](../../adr/resend-for-account-invitations.md) · [plan de estados](correo-resend.md).

## Preparación por Daniel

Infraestructura confirmada por Daniel: Resend Forge, región us-east-1, dominio
mail.academix.dvillasc.me y remitente AcademiX <no-reply@mail.academix.dvillasc.me>.
La key de producción tiene Sending access restringido al dominio y está en Render
como RESEND_API_KEY. No se comparte con desarrollo. Tracking desactivado.

| Tipo | Host en dvillasc.me | Valor |
| --- | --- | --- |
| TXT | resend._domainkey.mail.academix | Clave pública DKIM indicada por Resend |
| CNAME | send.mail.academix | send.forge.rmta.net. |
| CNAME | rsend.mail.academix | rsend.forge.rmta.net. |
| TXT | _dmarc.mail.academix | v=DMARC1; p=none; |

No sustituir estos CNAME por instrucciones antiguas de Amazon SES. Para cambios
futuros usar los valores del dashboard. El dominio raíz conserva su reenvío previo.
La prueba de Daniel acredita envío recibido en Gmail; no acredita aún activación
ni reenvío desde los endpoints de AcademiX. Matías confirmó después su prueba
manual desde la aplicación; las variantes no desglosadas no se dan por realizadas.

## Variables backend

| Variable | Valor |
| --- | --- |
| MAIL_DELIVERY_MODE | resend para envío real; disabled para detenerlo |
| RESEND_API_KEY | Clave restringida al dominio |
| MAIL_FROM | AcademiX <no-reply@mail.academix.dvillasc.me> |
| ACTIVATION_ORIGINS_BY_INSTITUTION | JSON slug → origen frontend exacto |

Producción:

```json
{
  "uc": "https://uc.academix.dvillasc.me",
  "utfsm": "https://utfsm.academix.dvillasc.me"
}
```

Para una prueba manual real en desarrollo, configurar los orígenes
http://uc.localhost:3000 y http://utfsm.localhost:3000, ambos en el mapa.
HTTP se acepta únicamente para localhost fuera de producción. No incluir rutas,
query, fragmentos, credenciales o barra final en los valores del mapa.
El contexto y permisos se resuelven por el backend; el CSV/body/Host no decide el enlace.

Mantener RESEND_DEBUG sin definir/false. El modo resend queda no disponible con
configuración incompleta, mapa inválido o debug habilitado; no se cae la aplicación.
El SDK usa HTTPS al API oficial. No se requieren puertos SMTP de Render.

## Prueba local y CI

En desarrollo normal el modo por defecto es disabled. Fake solo se admite con NODE_ENV=test y captura
los mensajes en memoria de cada prueba. No existe buzón ni endpoint para recuperar
códigos. La prueba manual requiere Resend real, dominio verificado y cuenta del equipo.
No activar envíos reales en CI. No imprimir cuerpos, enlaces ni códigos en logs.

```bash
# Tests de proveedor: sin key y sin acceso a Resend.
NODE_ENV=test MAIL_DELIVERY_MODE=fake pnpm --dir backend test
```

Las pruebas de integración requieren además la base PostgreSQL descartable de
quickstart. No arrancar el servidor de desarrollo con NODE_ENV=test para obtener
fake: este adaptador sirve a las pruebas y no ofrece buzón o enlace en la UI.
Para prueba manual real, pedir a Daniel una key de desarrollo separada y activar
resend explícitamente. delivered@resend.dev permite probar el API, pero no ofrece
un buzón para hacer clic; la activación manual usa una cuenta controlada del equipo.
Las pruebas reales consumen cuota. Nunca cargar la key productiva en local.

## Prueba real opt-in

1. Configurar las variables, habilitar resend y reiniciar el backend.
2. Invitar a una cuenta del equipo desde el formulario. Comprobar institución,
   remitente, enlace permitido, texto alternativo y vencimiento indicado.
3. Confirmar explícitamente la activación: define contraseña nueva o inicia sesión
   en la cuenta existente. Repetir el enlace no crea otra pertenencia.
4. Probar reenvío explícito: el enlace anterior deja de servir. Abrir GET o un
   scanner del enlace no consume el código.
5. Repetir el flujo con un CSV pequeño; comprobar recibo y envío por fila.
6. Registrar evidencia sanitizada y fecha en #237, sin datos del mensaje/token.

## Estados, fallos y cuota

Invitación pendiente no equivale a cuenta activa. Aceptado por Resend no garantiza
entrega/lectura. La UI no informa Entregado sin evidencia de un mecanismo adicional.
El código vence en 24 h; un reenvío autorizado lo rota y exige cooldown de 60 s.
Los reintentos dentro de una misma ejecución usan cuerpo y clave idénticos;
el adaptador hace como máximo dos intentos dentro de 8 s y respeta Retry-After.
Timeout/respuesta incierta conserva evidencia de resultado desconocido: no repetir
automáticamente; el administrador solicita reenvío explícito con código nuevo.

El plan Free presupuestado es 100/día UTC y 3.000/mes compartidos por la cuenta,
incluidos reenvíos y pruebas reales; verificar límites vigentes en el dashboard.
Cuota agotada pausa el envío y conserva el lote; rate limit aplica espera acotada.
No asumir una cuota independiente por institución ni margen de 100 mensajes por CSV.

## Deshabilitar y volver a habilitar

Cambiar MAIL_DELIVERY_MODE=disabled y reiniciar. Crear invitaciones/lotes sigue
permitido, pero enviar/reenviar devuelve 503 sin emitir ni rotar códigos.
No elimina invitaciones ni cancela códigos anteriores aún válidos.
Cuando Daniel restaure configuración y active resend, continuar pendientes desde
la UI. No reenviar accepted/unknown mediante una confirmación repetida del CSV.

Diagnóstico: verificar DNS, remitente permitido, alcance de key, mapa de orígenes,
cuota, rate limit y conectividad. No copiar secretos ni respuestas crudas en issues.

Fuentes: [dominio](https://resend.com/docs/add-a-domain),
[SDK](https://resend.com/docs/send-with-nodejs),
[idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys) y
[cuotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits).
