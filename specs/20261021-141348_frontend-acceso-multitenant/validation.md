# Validación de acceso por dominio — 2026-10-21

[Quickstart](quickstart.md), [contrato](contracts/access.md), [tareas](tasks.md).
Corrección de producto del usuario: sin selector; `/institutions` solo redirige.
No incluye homes académicos teacher/student ni cursos/secciones de la siguiente misión.

## Entorno y checks

- Node 24.14.0 y pnpm 9.15.9 existentes; ninguna dependencia añadida.
- Configuración pública local exacta UC/UTFSM del quickstart; secretos efímeros fuera del repo.
  Ambos hosts resolvieron a loopback; frontend 3000 y API browser 3001.
- PostgreSQL 17 aislado: demo manual `academix` y DB descartable `academix_test`, roles separados.
- Frontend final: `pnpm --dir frontend test:coverage`, 130/130 PASS;
  86,98% líneas / 89,98% ramas (umbrales 80/80 conservados).
- `pnpm --dir frontend lint`, `typecheck`, `api:check`, `build`: PASS.
- Backend `pnpm --dir backend test:integration` final aislado: **126/126 PASS**.
  Primera suite: 124/126; dos deadlines HTTP de arranque
  durante builds concurrentes. Archivo `content-revocation.test.mjs` repetido sin builds:
  4/4 PASS, sin modificar límite ni aserciones. Segunda suite: 124/126, un deadline
  y una aserción de cero conexiones globales contaminada por la demo concurrente.
  Demo detenida; suite aislada final **126/126 PASS**, sin omisiones ni cambios de tests/límites.
- Configuración CORS HTTPS/local en procesos separados, solo OPTIONS para intentos;
  login/me y revocación reales contra HTTP/PostgreSQL: PASS en primera ejecución.
- Docker Compose final: build y arranque healthy PASS; ambos hosts operativos con
  API_URL interno separado de NEXT_PUBLIC_API_URL browser. Sin allowlist Next adicional.
- Sin cambios en código de esquema/backend runtime, OpenAPI ni tipos generados; sin despliegues ni commits automáticos.
- Audit completo: HIGH previo en braces, tooling ESLint sin cambios de lockfile;
  no se ocultó ni cambió validación para ignorarlo. Audit productivo: sin vulnerabilidades conocidas.

## Trazabilidad FR

Tests: `frontend/test/session.test.ts` (S), `auth-ui.test.ts` (UI),
`institution-layout.test.ts` (L), `api.test.ts` (API) y
`backend/test/integration/login-session.test.mjs` (HTTP).

| FR | Código / evidencia |
| --- | --- |
| 001 | institution-origins + navigation; S/UI: origin exacto, desconocido sin requests |
| 002 | courses/layout + institutions/page: redirección sin directorio ni enlace; UI |
| 003 | api/institutions + Session.request; API, api:check, HTTP con path singular |
| 004 | ProtectedInstitution exige /me; S/UI/HTTP rechazan sin pertenencia e inactivos |
| 005 | Session/credentials existentes; S/UI: errores seguros, doble submit, sin refresh |
| 006 | Session/token: exp y comienzo de login +900 s; S/UI relojes y documentos nuevos |
| 007 | Session/provider: generación, abort y limpieza; S/UI cuerpos tardíos y DOM |
| 008 | S/UI: storage/cookies/URL sin credenciales; logout local offline |
| 009 | Corrección de producto: selector retirado; UI afirma ausencia y redirect |
| 010 | safeReturnPath + getAll(next); S/UI adversariales y compatibilidad segura |
| 011 | .env.example + Dockerfile + Compose; mapa local de ambos hosts exactos |
| 012 | UI: loopback no infiere contexto; legacy igual redirige, distinto rechaza |
| 013 | HTTP OPTIONS login/me/intentos, 3 headers permitidos, ajeno denegado |
| 014 | HTTP configura origins HTTPS/local; browser real local. HTTPS público pendiente |
| 015 | S/UI: carga/vacío/error, rechazo y recuperación, 401 sin identidad anterior |
| 016 | institutionHomePath limpio, shell + legacy guard; L/UI y revisión de links |
| 017 | Callers, fixtures, configuración, guías y ADR reconciliados; sin contrato nuevo |
| 018 | Provider por documento, SSR sin contexto ni fetch privado; UI/API |
| 019 | Error repetido recupera foco; labels/aria-live y cuatro recorridos browser PASS |
| 020 | S/UI/HTTP: UC/UTFSM/multi/revocado, generaciones, membresías y DTO inválidos |

## SC y evidencia browser

| SC | Estado final |
| --- | --- |
| 001 | PASS local final: UC/UTFSM, ingreso/directa, rutas limpias, sin selector ni prefijos |
| 002 | PASS S/UI/HTTP y browser: UC en UTFSM, revocado, usuario/tenant inactivos |
| 003 | PASS S/UI: logout/expiración/otra identidad y cuerpos tardíos, sin datos anteriores |
| 004 | PASS final: 375/1280 px × claro/oscuro, teclado, foco y dominio independiente |

Chromium real con `playwright-skill`, scripts efímeros en `/tmp`, sin runner añadido.
Prueba CORS controlada node:http: `/exposed` retorna Location `/cors-fixture` y
Retry-After `2` legibles; `/hidden` oculta ambos a JS. UC y UTFSM PASS en la imagen final.
Origin denegado produce fallo CORS en browser; Node sin Origin recibe HTTP 401.
La API real declara exposición; la respuesta controlada no prueba un handler académico.
No se envió POST de intentos en esta validación CORS. La suite académica existente
sí usa escrituras exclusivamente en su base descartable de integración.

Contraste final de imagen Compose: mínimo 5,93:1 claro / 5,74:1 oscuro en pares de tokens de texto/acción.
No se cambiaron CSS/tokens. Cuatro combinaciones PASS: foco visible (outline solid),
375/1280 px sin overflow, labels, aria-live, Inter/EB Garamond y reduced motion.
Navegación Inicio conserva sesión; otro dominio exige login y logout borra datos.
Cuenta UTFSM propia y volver atrás tras abandonar documento: sin restaurar datos privados.
`/institutions` redirige sin renderizar selector; no existen enlaces ni input de slug.
Fixtures browser finales: UC en UTFSM, pertenencia revocada, usuario inactivo y tenant
inactivo rechazados sin shell; recarga/nueva pestaña requieren login; raíz pública PASS.
Nueva prueba DOM: /me revocado prevalece sobre cuerpo exitoso antiguo de igual slug/generación.
Secretos generados ausentes del diff, logs sanitizados y 38 assets públicos del build.
No se acredita prueba humana con lector de pantalla ni validación productiva.

## Bloqueo externo y límites

- UC/UTFSM públicos no resolvieron DNS (`curl`: código 6), API pública `/health` 200 TLS;
  OPTIONS público a login devolvió 404. No se usaron credenciales remotas.
- T028 queda pendiente: falta verificar ambos frontend HTTPS y CORS real de ese entorno.
  Resolver DNS/provisionamiento remoto requiere operación externa; no se desplegó ni alteró DNS.
- Revocación se detecta en próxima revalidación/operación: no hay push ni SSO.
- Un JWT copiado no se revoca individualmente al cerrar sesión local.

## Cierre

32/33 tareas verificadas: T001–027 y T029–033. T028 pendiente por HTTPS público.
Matriz FR-001–020 reconciliada: FR-014 pendiente en entorno público; resto verificado localmente.
SC-001–004 PASS en alcance local documentado; no acreditan producción.
Lint frontend/backend, tipos, api:check, build, Compose, check-doc-length y diff --check PASS.
Hook opcional git before/after omitido por instrucción explícita de no crear commits.

## Corrección de CI — PR #128

El primer CI aprobó backend 157/157 y cobertura 99,65% líneas / 95,49% ramas,
pero el smoke de Compose omitía NEXT_PUBLIC_INSTITUTION_ORIGINS, ahora obligatoria.
Error reproducido localmente; fixture corregido con ambos origins locales exactos.
`node backend/test/compose-smoke.mjs`: PASS completo tras la corrección; limpieza incluida.
`node --check` y lint backend: PASS. Sin relajar configuración, tests ni umbrales.
