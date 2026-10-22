# Research: Acceso frontend por dominio

## Fuentes y método

Inspección local con CodeGraph y lectura de spec, constitución, ADRs, configuración,
Session y tests actuales. Versiones tomadas de `frontend/package.json`; no se elige
stack nuevo ni se requiere investigación externa. Decisiones resueltas para planificar.

## R1 — Contexto de navegador y autorización

- **Decision**: origin exacto del navegador selecciona slug; `/me` autoriza antes del shell.
- **Rationale**: la API ya valida path, identidad, membership y RLS. La constitución
  prohíbe usar Host/Origin para autorizar en backend, no para proponer el path desde UI.
- **Alternatives considered**: inferir slug libre desde subdominio, usar path legacy,
  headers tenant o SSR autenticado; no cumplen dominio configurado ni sesión en memoria.
- **Evidence**: `frontend/src/lib/auth/navigation.ts`, `protected-institution.tsx`,
  `docs/adr/institution-context-and-database-isolation.md`.

## R2 — Tabla de orígenes y local

- **Decision**: `NEXT_PUBLIC_INSTITUTION_ORIGINS` es JSON público origin→slug al build,
  con defaults exactos UC/UTFSM HTTPS cuando falta; una configuración presente inválida
  no activa defaults. Local configura ambos origins localhost con puerto 3000.
- **Rationale**: `hostname` pierde puerto/esquema y hoy permite cualquier slug productivo;
  localhost hoy obtiene contexto desde path. Una tabla resuelve el contexto configurado.
- **Alternatives considered**: wildcard, sufijos, default UC, DNS público nuevo, proxy;
  ampliarían autorización aparente o infraestructura sin necesidad.
- **Evidence**: `.env.example`, `frontend/Dockerfile`, `docker-compose.yml`.
- **Resolution**: hosts deben resolver a loopback; si el sistema no resuelve `.localhost`,
  documentar `127.0.0.1 uc.localhost utfsm.localhost` en hosts del equipo, sin editarlo aquí.
  No usar `0.0.0.0`, localhost o loopback desnudo como institución.

## R3 — Rutas y retornos

- **Decision**: `/courses` es inicio; `/institutions` solo redirige por compatibilidad. Retornos exactos
  `/courses` o `/institutions`, fallback `/courses`; ningún query, fragmento o decode adicional.
- **Rationale**: solo esas rutas privadas estarán implementadas. El alcance no necesita
  autorización de recursos académicos ni un parser genérico de destinos.
- **Alternatives considered**: rewrite que conserva slug oculto, rutas futuras por regex,
  retorno arbitrario o confiar en params legacy; aumentan superficie sin valor actual.
- **Resolution**: legacy mismo slug redirige en cliente después de resolver origin;
  slug distinto rechaza, origin desconocido no solicita credenciales.

## R4 — Concurrencia y datos privados

- **Decision**: reutilizar Session.request, generación, token capturado, abort y timer;
  cambiar solo lo que fallen las pruebas de adaptación. No reescribir auth.
- **Rationale**: #124 ya descarta resultados y errores tardíos, valida claims y membresías;
  login consulta directorio global para confirmar JWT y guard consulta `/me` del dominio.
- **Alternatives considered**: store global, cookies, refresh, compartir sesión por link;
  contradicen spec y `docs/adr/browser-session-in-memory.md`.
- **Resolution**: una instancia por documento; limpieza al salir, revalidación al foco,
  y ningún fetch privado servidor detrás de un guard meramente visual.

## R5 — CORS y configuración

- **Decision**: conservar implementación backend y contrato; adaptar solo configuración
  local, paso de build args y pruebas de integración de sus consumidores.
- **Rationale**: CORS existente soporta lista exacta, headers y exposición; browser usa
  NEXT_PUBLIC_API_URL y health servidor usa API_URL. CORS no prueba pertenencia.
- **Alternatives considered**: wildcard, credentials/cookies, proxy Next; no necesarios.
- **Resolution**: verificar ambas instituciones en HTTPS y local, preflight Authorization,
  Content-Type, Idempotency-Key; Location/Retry-After legibles según operación.
  Node fetch no demuestra bloqueo de lectura por navegador: añadir recorrido browser.

## R6 — UI y permisos

- **Decision**: conservar shell/estados/tokens, identidad AcademiX y badge institucional;
  `/courses` muestra integración pendiente, sin inventar lista ni permisos académicos.
- **Rationale**: `lms-ui-ux`, DESIGN y mockups priorizan contexto, foco y estados claros.
  `isAdmin` habilita creación; ownership y Enrollments siguen autorizando en backend.
- **Alternatives considered**: dashboards por rol, landing nueva o rediseño del login;
  pertenecen a otras misiones o no son requeridos.
- **Resolution**: alcance read-only de acceso; no historial académico ni auditoría nueva.

## Corrección de producto — 2026-10-21

El usuario retiró explícitamente el selector `/institutions`: esa ruta redirige a
`/courses` y no hay enlace para elegir institución. Esta decisión sustituye la
propuesta de selector de R2/R3/R6; cada dominio inicia sesión independientemente.
Los homes por perfil y cursos/secciones siguen fuera de la misión de acceso.
