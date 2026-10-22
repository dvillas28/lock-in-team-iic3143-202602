# Tasks: Acceso frontend y multitenancy por dominio

**Corrección 2026-10-21**: usuario retira selector; `/institutions` solo redirige a `/courses`.
Las tareas US3 se reconcilian con esa decisión; homes académicos quedan excluidos.

**Input**: `specs/20261021-141348_frontend-acceso-multitenant/`.
**Prerequisites**: [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/access.md), [quickstart](quickstart.md) y Session de #124 integrada.
**Owners**: conservar asignación FE-01–04/20 (JC/MA) del backlog; sin reasignación aquí.
**Organization**: setup → fundación → US1 P1 / US2 P1 → US3 P2 → integración.
**UI obligatoria**: leer `DESIGN.md`, `mockups/README.md` y `docs/guides/frontend-styles.md`;
reusar tokens/clases/componentes de `frontend/src/styles/` según `contracts/access.md`.
`[P]` permite trabajo en archivos distintos después de los prerrequisitos declarados.
Pruebas exigidas por FR-020; ejecución y pendientes en [quickstart](quickstart.md).

## Phase 1: Setup

- [X] T001 Confirmar base #124, cobertura CU-01/02, FE-01–04/20, exclusiones y ADR de routing en `specs/20261021-141348_frontend-acceso-multitenant/plan.md`; crear/usar rama `feat/frontend-acceso-multitenant` sin incluir documentación ajena (FR-017).
- [X] T002 Ejecutar baseline test/lint/typecheck/api:check de `frontend/package.json` y registrar resultados reales en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`; no instalar stack nuevo (FR-005/017).

## Phase 2: Foundation

- [X] T003 Definir y validar mapa público origin→slug en `frontend/src/lib/auth/institution-origins.ts`: defaults HTTPS exactos, variable presente inválida bloquea, origins canónicos, slugs únicos y HTTP solo hosts locales configurados según contrato (FR-001/011).
- [X] T004 Conectar NEXT_PUBLIC_INSTITUTION_ORIGINS al build en `.env.example`, `frontend/Dockerfile` y `docker-compose.yml`; declarar ambos origins locales y CORS exacto sin modificar backend runtime ni producción (FR-011/013).
- [X] T005 Exponer origin completo desde `frontend/src/components/auth/session-provider.tsx` manteniendo instancia Session, cleanup, foco/visibilidad/pagehide y snapshot servidor sin contexto; documentar prohibición de fetch privado servidor en `docs/adr/frontend-domain-routing.md` (FR-007/018).

**Checkpoint**: mapa válido y origen disponible; sin nuevas dependencias ni cambios DB.

## Phase 3: US1 — Ingresar al contexto del dominio (P1)

**Goal**: login del dominio abre `/courses` tras validar pertenencia, sin selector obligatorio.
**Independent Test**: fixtures UC/UTFSM/multi, sin cursos; host desconocido no envía credenciales.

- [X] T006 [P] [US1] Adaptar pruebas de host/login en `frontend/test/session.test.ts` para origins exactos, puerto/esquema, config inválida, sufijo engañoso y ausencia de fallback por path (FR-001/003/011/012).
- [X] T007 [P] [US1] Adaptar fixture/router DOM en `frontend/test/auth-ui.test.ts` a `/courses` y origins UC/UTFSM; probar multi sin selector, UC-only rechazado en UTFSM, sin `/me` privado en unknown host ni children antes de autorización (US1.1–4, FR-004/018).
- [X] T008 [US1] Adaptar hostInstitution/matchesHost/loginDestination en `frontend/src/lib/auth/navigation.ts` al mapa exacto; cambiar inicio a `/courses` en `frontend/src/lib/institution-routes.ts` conservando isInstitutionSlug y actualizar callers activos (FR-001/002/003/017).
- [X] T009 [US1] Adaptar `frontend/src/components/auth/login-form.tsx` para bloquear submit antes de origin válido, orientar localhost y usar destino limpio; conservar validación, contraseña efímera, busy y mensajes seguros (FR-001/005/012/015).
- [X] T010 [US1] Adaptar `frontend/src/components/auth/protected-institution.tsx` para derivar slug del origin, rechazar slug legacy discordante sin adoptarlo y host inválido antes de redirect anónimo; validar `/me` de la generación vigente antes del shell y revalidar foco/visible (FR-004/015/018).
- [X] T011 [US1] Crear `frontend/src/app/courses/layout.tsx` y `frontend/src/app/courses/page.tsx` con guard cliente e integración pendiente; reutilizar loading/error/not-found en `frontend/src/app/courses/` sin fetch privado servidor ni datos de cursos inventados (FR-002/004/018).
- [X] T012 [US1] Adaptar `frontend/src/components/institutions/institution-shell.tsx` y `frontend/test/institution-layout.test.ts` a links limpios y badge validado; conservar roles sin conceder permisos por URL y retiro del shell ante 403/404 (FR-015/016/017).
- [X] T013 [US1] Verificar US1 y registrar rechazo sin pertenencia, tenant inactivo, response inválida y carga/vacío/error en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`; ejecutar tests adaptados (FR-004/015/020, SC-001/002).

**Checkpoint**: US1 entregable sobre Session existente; no requiere misión de cursos ni US3.

## Phase 4: US2 — Mantener sesión acotada y recuperable (P1)

**Goal**: conservar sesión interna y limpiar datos ante expiración, logout o nueva identidad.
**Independent Test**: reloj/red controlados, operaciones y cuerpos diferidos, logout offline.

- [X] T014 [P] [US2] Ampliar `frontend/test/session.test.ts` con exp/900 s, timers suspendidos, 401 viejo, login/directorio/me y cuerpos tardíos tras logout/nueva identidad; afirmar token capturado y cero contaminación entre generaciones (FR-006/007/008/020).
- [X] T015 [P] [US2] Ampliar `frontend/test/auth-ui.test.ts` con recarga/nueva instancia, dos documentos independientes, pagehide/pageshow, limpieza real del DOM, revocación en vuelo y logout offline; afirmar storage/cookies/URLs sin credenciales (FR-006/007/008/020).
- [X] T016 [US2] Corregir solo fallos revelados por T014/T015 en `frontend/src/lib/auth/session.ts` y `frontend/src/components/auth/session-provider.tsx`, preservando generación, secuencias, abort, timeout y expiración conservadora de #124 (FR-005/006/007).
- [X] T017 [US2] Ajustar limpieza y retorno limpio tras logout/401/expiración en `frontend/src/components/auth/session-actions.tsx` y `frontend/src/components/auth/protected-institution.tsx`; datos anteriores no deben reaparecer por atrás/bfcache (FR-007/010/015).
- [X] T018 [US2] Verificar 400/401/403/404/413/415/429/503, red, response inválida y Retry-After en `frontend/test/auth-ui.test.ts`; ajustar `frontend/src/components/auth/login-form.tsx` solo donde falte bloqueo doble submit, foco al error o anuncio accesible (FR-005/015/019).
- [X] T019 [US2] Ejecutar suite Session/DOM y registrar escenarios US2 en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`, incluyendo ninguna mutación reintentada ni revocación backend prometida (FR-008/020, SC-003).

**Checkpoint**: US2 verificable con fixtures; US1 reutiliza sus garantías reforzadas.

## Phase 5: US3 — Navegar entre instituciones y entrar directamente (P2)

**Goal**: acceso por dominio y retorno seguro, sin selector, con equivalencia local/HTTPS.
**Independent Test**: dos hosts, usuario multi, rutas directas, retornos y legacy adversariales.

- [X] T020 [P] [US3] Ampliar `frontend/test/session.test.ts` para retornos exactos/repetidos/externos/codificados, next legacy, destinos no configurados y misma/otra institución en ambos entornos (FR-009/010/016).
- [X] T021 [P] [US3] Adaptar pruebas DOM para ausencia de selector/enlace, redirección `/institutions`, navegación interna y documentos independientes; probar deep link, legacy y cero credenciales en URL (FR-009/010/012/016).
- [X] T022 [US3] Implementar safeReturnPath e institutionHref con allowlist e intersección de configuración en `frontend/src/lib/auth/navigation.ts`; actualizar lectura de next en `frontend/src/components/auth/login-form.tsx` para rechazar parámetros repetidos sin doble decode (FR-009/010).
- [X] T023 [US3] Retirar `institution-picker.tsx` y enlace de `session-actions.tsx`; `/institutions/page.tsx` redirige a `/courses` sin renderizar directorio, según corrección explícita de producto (FR-009/015).
- [X] T024 [US3] Convertir `frontend/src/app/institutions/[institutionSlug]/layout.tsx` y `frontend/src/app/institutions/[institutionSlug]/page.tsx` a compatibilidad sin autoridad del path; adaptar/eliminar estados hermanos obsoletos y redirigir solo slug igual al dominio a `/courses` (FR-012/016).
- [X] T025 [US3] Inventariar callers y enlaces de app/auth/shell; cero enlaces nuevos a selector o legacy; sincronizar fixtures de frontend (FR-016/017).
- [X] T026 [P] [US3] Extender `backend/test/integration/login-session.test.mjs` con ambos origins HTTPS/local en configuraciones separadas, OPTIONS al path de creación de intentos para POST con Authorization/Content-Type/Idempotency-Key (sin enviar POST), header no permitido, exposición declarada Location/Retry-After, origin denegado y requests sin Origin; conservar rechazo cruzado y revocación (FR-013/014/020).
- [X] T027 [US3] Ejecutar ambos hosts locales desde `frontend/next.config.ts` actual y `docker-compose.yml`; añadir allowlist dev exacta solo si ejecución lo exige y registrar resolución hosts/rebuild en `docs/guides/login-session-testing.md` (FR-011/012).
- [ ] T028 [US3] Ejecutar escenarios US3, incluyendo `/` pública, y prueba browser CORS frente a fetch servidor; levantar servidor node:http efímero con `/exposed` y `/hidden` según quickstart para comprobar lectura real de Location/Retry-After sin escribir datos, registrando evidencia o bloqueo real de HTTPS en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`; no sustituir browser por Node (FR-013/014, SC-001/002).

**Checkpoint**: navegación completa sin slugs visibles ni credenciales transportadas.

## Phase 6: Integration and delivery

- [X] T029 Actualizar `docs/guides/login-session.md`, `docs/guides/login-session-testing.md` y `docs/guides/login-session-production.md` con dominios exactos, configuración/build, rutas limpias y límites de memoria; dividir si exceden longitud (FR-011/017).
- [X] T030 Verificar teclado, foco al error, anuncios, contraste ≥4.5:1, 375 px, temas y reduced motion en login/retorno/logout y apertura independiente de otro dominio, sin selector; registrar evidencia (FR-019, SC-004).
- [X] T031 Ejecutar test:coverage/lint/typecheck/api:check/build de `frontend/package.json` y test:integration de `backend/package.json`; conservar OpenAPI y tipos generados sin cambio de contrato, registrar fallos/precondiciones sin ocultarlos (FR-003/017/020).
- [X] T032 Ejecutar `.github/scripts/check-doc-length.py`, git diff --check y revisión de callers/fixtures/config en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`; confirmar sin cambios DB/auditoría ni credenciales persistidas (FR-008/017/020).
- [X] T033 Reconciliar FR-001–020 y SC-001–004 con resultados en `specs/20261021-141348_frontend-acceso-multitenant/quickstart.md`; actualizar estado de `docs/adr/frontend-domain-routing.md` solo con evidencia y dejar cursos fuera del alcance.

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005. Foundation bloquea implementación de historias.
- US1: T006 ∥ T007 → T008 → T009 → T010 → T011 → T012 → T013.
- US2: T014 ∥ T015 → T016 → T017 → T018 → T019; verificar sobre US1 integrado.
- US3: T020 ∥ T021 → T022 → T023 → T024 → T025; T026 es independiente de
  código frontend tras fundación y puede correr en paralelo a T022–T025; luego T027 → T028.
- US1 → US3 por rutas/guard; US2 se prueba con fixtures sobre Session y no requiere US3.
  Orden recomendado US1 → US2 → US3; no paralelizar ediciones de session.test/auth-ui/navigation.
- Integración T029–T033 tras checkpoints; no hay migraciones, escrituras o auditoría nuevas.

## Parallel Execution Examples

- US1: T006 (unit host/login) ∥ T007 (DOM fixtures), luego implementación compartida secuencial.
- US2: T014 (reloj y concurrencia Session) ∥ T015 (documentos/DOM), luego correcciones.
- US3: T020 (retornos unit) ∥ T021 (compatibilidad DOM); T026 (integración HTTP/CORS) ∥ T022–T025.

## Implementation Strategy

1. MVP: fundación + US1, reutilizando seguridad de Session existente y validando su regresión.
2. US2 refuerza comportamiento de sesión; US3 completa navegación multiinstitución/local.
3. Ejecutar cada checkpoint y entregar incrementalmente, sin marcar tareas futuras completadas.
4. Cerrar con guías, accesibilidad, evidencia FR/SC y comprobación de configuración productiva.
