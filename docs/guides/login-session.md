# Login y sesión — Issue #80

## Flujo implementado

- `/` enlaza a `/login`; login global envía correo normalizado y contraseña exacta
  con `openapi-fetch` y tipos generados a `POST /api/v1/auth/login`.
- Correo: trim, ASCII 3–254, lowercase, un `@`, dominio con punto y sin espacios interiores.
  Contraseña: entre 1 y 128 bytes UTF-8; sin trim ni truncamiento.
- Se impiden envíos simultáneos. Errores 400/401/413/415/429/503 y fallos de red
  muestran mensajes seguros; nunca detalles Problem, contraseñas o tokens.
- 429 conserva `Retry-After` (segundos o fecha, hasta 24 horas; fallback 60 segundos).
  La cuota real permanece en backend: cinco solicitudes por IP/minuto, una instancia.
- Después de login se verifica el JWT consultando `GET /api/v1/institutions`.
  El login abre `/courses` en el dominio actual; no hay selector de instituciones.
- `/courses` no muestra el shell privado hasta validar
  `GET /api/v1/institution/{slug}/me`. No se inventan roles ni dashboards.
- 401 limpia toda la sesión. 403/404 retiran el contexto; 503/red/respuesta inválida
  muestran recuperación sin reutilizar identidad anterior. No hay reintentos automáticos.
- Abrir institución, volver a la pestaña o recuperar foco revalida `/me`.
  Revocar una membresía impide la siguiente operación autorizada por backend;
  no existe notificación push para borrar una pantalla inactiva inmediatamente.

## Sesión y concurrencia

Ver [ADR de almacenamiento](../adr/browser-session-in-memory.md).
La sesión dura como máximo 900 segundos; cada petición comprueba vencimiento,
además del temporizador y eventos de foco/visibilidad. Los relojes deben estar sincronizados:
claims con emisión futura se rechazan de forma conservadora.
Cada solicitud tiene cancelación y timeout de 15 segundos, incluido el consumo del cuerpo.
Los temporizadores suspendidos no permiten enviar un token vencido.
Logout borra token, directorio, identidad y contexto; cancela solicitudes pendientes,
descarta respuestas de generaciones anteriores y redirige a `/login`, aun sin backend.
La navegación interna conserva memoria; abrir otro subdominio requiere
nuevo login. Recargar o abandonar el documento también cierra la sesión local.
Un JWT copiado no queda revocado en servidor. No hay refresh token ni endpoint de logout.

Toda futura lectura privada debe usar `session.request(client => operaciónTipada(client))`
y estados ligados a la generación/slug; no usar un singleton ni un cliente servidor compartido.
Los Server Components actuales solo entregan estructura pública; el guard cliente no
puede impedir que un Server Component futuro ejecute una consulta privada por su cuenta.

## Contexto institucional

`NEXT_PUBLIC_INSTITUTION_ORIGINS` es un JSON público origin→slug incorporado al build.
Si falta, admite exclusivamente `https://uc.academix.dvillasc.me` y
`https://utfsm.academix.dvillasc.me`. Si está presente e inválido, bloquea el acceso.
Esquema y puerto son parte del origin; no se admiten sufijos, aliases ni defaults por path.
Cada slug tiene un único destino; HTTP solo se permite para hosts locales explícitos.
El origin propone el slug para `/api/v1/institution/{slug}/me`; backend autoriza por
path, JWT y pertenencia activa, con RLS. Host/Origin nunca conceden permisos.
No se presenta el directorio como selector. `/institutions` solo redirige a `/courses`,
sin contenido ni enlace para elegir institución. Otro dominio requiere login independiente.
Localhost/loopback sin contexto no envía credenciales: orienta a los hosts configurados.
`next` acepta un único valor exacto `/courses` o `/institutions`; cualquier otro valor
cae en `/courses`, incluidos repetidos, query/hash, externos y encoding residual.
URLSearchParams decodifica una sola vez. Legacy `/institutions/{slug}` solo compara
slug con el origin: igualdad redirige a `/courses`; diferencia rechaza sin adoptar tenant.
No hay consultas académicas ni fetch privado servidor: el inicio indica integración pendiente.

## Configuración y ejecución

- [Pasos reproducibles para probar la PR con Docker](login-session-testing.md): configuración, generación de claves, seed y casos manuales.
- [Prueba por dominios en producción](login-session-production.md): servicios, variables y recorrido UC/UTFSM.

Node 24 y pnpm 9.15.9. NEXT_PUBLIC_API_URL se incorpora al construir; API_URL es solo del servidor.
El JWT y las contraseñas son secretos diferentes; `.env` local no configura Railway.

## Verificación

- `pnpm --dir frontend test`, `lint`, `typecheck`, `build`, `api:check`.
- `pnpm --dir backend test`, `test:integration`, `test:coverage`, `lint`.
- `pnpm docs:api:lint`, `docs:api:test`, `docs:api:build`.
- Cobertura frontend: comando c8 de `.github/workflows/ci.yml`; incluye tests DOM de React.
  jsdom es dependencia de desarrollo para verificar formularios, navegación y limpieza real del DOM.
- `python3 .github/scripts/check-doc-length.py`.
- `node backend/test/compose-smoke.mjs` y builds Docker requieren motor Docker operativo.

Tests controlados cubren errores, expiración sin esperas reales, cuerpos tardíos, logout,
401 concurrentes, cambio de usuario/tenant, hosts y retornos manipulados. La integración
`login-session.test.mjs` ejecuta el Session real contra HTTP/PostgreSQL con UC, UTFSM,
usuario multiinstitución, membresías revocadas, preflight CORS y headers adversariales.
El Quality Gate de esta rama queda **PENDIENTE DE VALIDACIÓN EN CI**; la cobertura local
no sustituye el análisis remoto de SonarQube.

Resultado histórico tras integrar #125, 2026-10-21: frontend 96/96, backend 157/157,
catálogo API 4/4 y test del smoke postdeploy 1/1.
Cobertura frontend: 89,68% líneas y 90,10% ramas; backend: 99,65% y 95,49%.
La configuración CORS consolidada tiene 100% de líneas y ramas.
Lint, tipos, build, contrato generado, documentación y Compose aislado pasaron.
`docker compose config` pasó con defaults y overrides, incluyendo CORS y build arg público.
Trivy, con configuración de CI, pasó para fuentes e imágenes de ambas aplicaciones:
sin hallazgos HIGH/CRITICAL corregibles en dependencias productivas, secretos o configuración.
`pnpm audit` también informa un HIGH previo en `braces@3.0.3`, dependencia de desarrollo
de eslint-config-next ya presente en dev, sin versión corregida publicada según el aviso.
No se incorpora al runtime productivo; no se alteraron reglas ni exclusiones para ocultarlo.

Misión de dominio posterior: frontend 130/130 (86,98% líneas / 89,98% ramas),
integración backend aislada 126/126. Sin selector de instituciones.
[Evidencia y bloqueo HTTPS público](../../specs/20261021-141348_frontend-acceso-multitenant/validation.md).
