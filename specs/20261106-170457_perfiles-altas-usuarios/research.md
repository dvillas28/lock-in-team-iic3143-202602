# Research: decisiones técnicas de perfiles y altas

Fecha: 2026-11-07. [Plan](plan.md) · [Spec](spec.md). Decisiones cerradas para implementación.

## Identidad y permisos

- **Decisión:** conservar User global, Membership institucional y Enrollment académico.
- **Motivo:** ya implementados; un perfil o invitación no debe duplicar identidad ni roles.
- **Alternativas:** tabla de perfil separada o rol global; descartadas por falta de necesidad.
- **Decisión:** funciones SQL acotadas y auditadas, con rol propietario NOLOGIN mínimo.
- **Motivo:** triggers/runtime-check actuales prohíben escrituras generales de identidad.
- **Alternativas:** operador en HTTP o grants UPDATE generales; rechazan mínimo privilegio.

## Sesiones y concurrencia

- **Decisión:** credential_version en users y credentialVersion obligatorio en JWT.
- **Motivo:** el guard ya consulta User activo; puede invalidar sesiones sin Redis.
- **Compatibilidad:** conservar hashes Argon2id; JWT sin nuevo claim requiere nuevo login.
- **Decisión:** expectedUpdatedAt con timestamp de seis microsegundos serializado por SQL.
- **Motivo:** Date de JavaScript perdería precisión y causaría conflictos artificiales.

## Proveedores externos

- **Decisión:** S3 privado mediante SDK AWS v3, backend como único lector/escritor.
- **Motivo:** mantiene privacidad y evita URLs firmadas persistidas o bucket público.
- **Desarrollo:** archivos locales con directorio ignorado y volumen documentado.
- **Decisión:** SDK Resend HTTPS, no SMTP ni autenticación administrada.
- **Motivo:** elección del usuario; preserva identidad y activación existentes en AcademiX.
- **Decisión actualizada:** ausencia de configuración externa deshabilita solo esa integración.
- **Motivo:** usuario confirmó continuidad de la aplicación en producción sin credenciales.
- **Alternativas:** fallar arranque completo o simular éxito; descartadas expresamente.
- **Decisión:** fake de correo solo en tests, mensajes en memoria y sin logs/enlaces expuestos.
- **Motivo:** usuario eligió no agregar buzón de desarrollo. Manual requiere Resend real opt-in.

## Binarios, CSV y retención

- **Decisión:** sharp valida/reprocesa imagen estática ≤2 MiB, ≤16 MP a WebP ≤1024×1024.
- **Motivo:** acotar memoria, quitar metadatos y evitar servir contenido suplantado.
- **Decisión:** csv-parse, UTF-8 estricto, cabeceras exactas name,email y límites por lectura.
- **Motivo:** comillas/BOM/CRLF no se resuelven correctamente con split(',').
- **Decisión:** conservar solo staging derivado; archivo original efímero y nunca almacenado.
- **Retención aprobada:** PII CSV 7 días; invitaciones finalizadas/vencidas 30 días.
- **Default sin primera emisión:** revocar/depurar a 30 días desde creación.
- **Recibos:** mantener IDs, referencias, fechas/resultados y claves opacas sin PII duplicada.
- **Operación:** mantenimiento acotado, idempotente y por operador; sin worker nuevo.

## Fuentes primarias

- [AWS SDK v3 S3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html).
- [Resend Node.js](https://resend.com/docs/send-with-nodejs) e
  [idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [sharp](https://sharp.pixelplumbing.com/api-constructor/).
- [csv-parse](https://csv.js.org/parse/options/).
- Código vigente: AuthGuard/AuthService, DatabaseService, runtime-check, RLS y Session.
  CodeGraph fue intentado; ejecutable no disponible. Se investigó con lectura directa.
