# Correo de invitaciones: DNS, Resend y recuperación

Daniel administra DNS/Resend; Matías integra el backend. [Índice](operacion.md).
Estado: adaptador implementado; dominio/configuración y prueba real pendientes.
[ADR](../../adr/resend-for-account-invitations.md) · [plan de estados](correo-resend.md).

## Preparación por Daniel

1. Crear/seleccionar la cuenta de Resend del equipo y registrar el dominio
   **mail.academix.dvillasc.me**. Confirmar que el equipo controla sus DNS.
2. Copiar exactamente los registros que muestra Resend: nombre, tipo, valor y
   prioridad de SPF/DKIM/MX cuando se solicite. No inventar valores de una guía.
   Comprobar propagación y estado verificado en Resend; revisar DMARC del dominio.
3. Crear una API key limitada al envío desde ese dominio. Guardarla en el backend.
4. Desactivar seguimiento de clics/aperturas para estos mensajes; no adjuntar
   datos académicos ni roles. La plantilla incluye alternativa de texto.

Remitente seleccionado: **AcademiX <no-reply@mail.academix.dvillasc.me>**.
Elegir una dirección no acredita verificación DNS ni recepción de mensajes.

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

El modo por defecto es disabled. Fake solo se admite con NODE_ENV=test y captura
los mensajes en memoria de cada prueba. No existe buzón ni endpoint para recuperar
códigos. La prueba manual requiere Resend real, dominio verificado y cuenta del equipo.
No activar envíos reales en CI. No imprimir cuerpos, enlaces ni códigos en logs.

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
