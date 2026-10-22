# Implementation Plan: Acceso frontend y multitenancy por dominio

**Branch de implementación**: `feat/frontend-acceso-multitenant` | **Date**: 2026-10-21
**Implementación**: `feat/frontend-acceso-multitenant` | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261021-141348_frontend-acceso-multitenant/spec.md`.

## Summary

Adaptar #124 a dominios institucionales exactos y rutas visibles `/login`,
`/courses` y compatibilidad `/institutions`. El navegador resuelve un slug solicitado; la API central
mantiene `/api/v1/institution/{institutionSlug}/...`, pertenencia activa y RLS.
Reutilizar Session, cliente OpenAPI, shell y estados.
Corrección de producto (usuario, 2026-10-21): retirar selector y enlace a instituciones;
`/institutions` solo redirige a `/courses`. Homes por perfil se implementan en misión académica. `/courses` presenta integración
pendiente, sin consultar cursos ni implementar administración académica.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, pnpm 9.15.9 existentes |
| Dependencias | Next.js 16.3.8 App Router, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Persistencia | JWT y datos privados en memoria por documento; ninguna tabla/migración nueva |
| Testing | node:test + tsx, jsdom, c8; integración HTTP/PostgreSQL existente |
| Plataforma | Navegador móvil/escritorio, UC/UTFSM HTTPS y dos hosts locales explícitos |
| Tipo | Aplicación web sobre API central existente; sin proxy/BFF ni SSR autenticado |
| Rendimiento | Sin SLO nuevo; conservar timeout 15 s, no duplicar login ni reintentar mutaciones |
| Restricciones | Vigencia ≤900 s; recarga pide login; sin SSO, refresh, cookies ni tokens en URL |
| Alcance | Tres historias; tres rutas limpias y compatibilidad legacy limitada |
| Configuración | NEXT_PUBLIC_INSTITUTION_ORIGINS público al build; CORS_ALLOWED_ORIGINS exacto |

## Constitution Check

Pre-research: PASS. Post-design: PASS; no aclaraciones pendientes para este alcance.

- Tenant: origin exacto → slug → path API validado → membership activa → RLS existente.
  Host/Origin nunca autorizan en backend; login y directorio propio son excepciones globales.
- DB: no SQL ni cambios en runtime, políticas, transacciones o barrera por omisión.
- Roles: `/me` conserva isAdmin/isSuperAdmin y Enrollments; ninguna URL concede permisos.
  La [política vigente](../../docs/adr/institution-admin-and-course-ownership.md) resuelve
  creación por isAdmin y administración por ownership. No se crean controles académicos aquí.
- Historial: sin escrituras académicas, cambios de roles ni migraciones; auditoría existente intacta.
- Independencia: US1 entrega acceso con Session vigente; US2 endurece su ciclo usando fixtures;
  US3 entrega navegación. Comparten fundación, sin depender de la futura misión de cursos.
- Cobertura: CU-01/02, RF1–9/25, RNF1–4/7/9, FE-01–04/20 y #80/#124 según spec.
- Complejidad: sin dependencias nuevas; docs <150 líneas; validación ejecutable planificada.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141348_frontend-acceso-multitenant/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/access.md
  quickstart.md
  tasks.md
```

Decisión durable: [routing por dominio](../../docs/adr/frontend-domain-routing.md).
La ADR de sesión se conserva; las guías de login se adaptan al implementar.

### Source Code (repository root)

```text
frontend/src/lib/auth/{institution-origins.ts,navigation.ts,session.ts,validation.ts}
frontend/src/lib/institution-routes.ts
frontend/src/components/auth/{session-provider,login-form,protected-institution,session-actions}.tsx
frontend/src/components/institutions/institution-shell.tsx
frontend/src/app/{layout.tsx,page.tsx,login/page.tsx,institutions/page.tsx}
frontend/src/app/courses/{layout.tsx,page.tsx,loading.tsx,error.tsx,not-found.tsx}
frontend/src/app/institutions/[institutionSlug]/{layout.tsx,page.tsx,loading.tsx,error.tsx,not-found.tsx}
frontend/test/{session,auth-ui,institution-layout,api}.test.ts
backend/test/integration/login-session.test.mjs
.env.example
frontend/{Dockerfile,next.config.ts}
docker-compose.yml
docs/guides/login-session{,-testing,-production}.md
```

`institution-origins.ts` y `courses/` son nuevos; el resto se adapta o verifica.
Conservar `isInstitutionSlug` para DTO/API y legacy. `institutionHomePath` pasa a
`/courses` y todos sus callers/tests se actualizan juntos. Legacy solo compara slug
con el dominio antes de redirigir; nunca monta un contexto desde params.

## Design & Delivery

1. Fundación: tabla validada origin→slug para el resolver; ausencia
   usa solo UC/UTFSM HTTPS conocidos. Configuración inválida falla cerrada.
2. US1: SessionProvider expone origin completo (incluye esquema/puerto), LoginForm
   bloquea hosts desconocidos, ProtectedInstitution obtiene slug del resolver y exige
   `/me`. No cargar datos privados desde Server Components ni layouts servidor.
3. US2: conservar generación, captura del token, abort/timeout y secuencias de requests;
   cubrir expiración, bfcache, logout offline, 401/403/404 y finalizaciones tardías.
4. US3: compatibilidad sin selector; apertura de otro dominio crea documento independiente.
   Retorno allowlist exacta y legacy según contrato actualizado.
5. Local: build arg público, API browser localhost:3001, API_URL servidor independiente;
   CORS admite ambos hosts locales explícitos. HTTPS productivo conserva su allowlist.
6. Validar [quickstart.md](quickstart.md), compatibilidad API, accesibilidad y guías.

### Sistema visual existente

Leer [DESIGN.md](../../DESIGN.md), [mockups](../../mockups/README.md) y
[guía integrada](../../docs/guides/frontend-styles.md) antes de frontend. Reusar
`frontend/src/styles/{tokens,app}.css`, derivados de `mockups/assets/`, y componentes
actuales. Colores, radios, sombras y métricas tienen tokens; spacing sigue grilla 4/8
y clases compartidas, sin escala completa --space-*. Conservar temas claro/oscuro,
Inter/EB Garamond, Lucide, foco y reduced motion. Sin duplicar shell ni hardcodear
colores. Sincronizar copias solo si cambia una base compartida, preservando fuentes Next.

## Validation & Rollout

- Generar fixtures de dos tenants, usuario multi, revocado e inactivo; reusar tests actuales.
- Checks automatizados unit/DOM e integración; recorridos browser reales manuales,
  teclado, 375 px, ambos temas, foco y reduced motion, sin incorporar runner nuevo.
- Comparar solicitud browser con servidor sin Origin: CORS solo limita lectura browser.
- Evidencia por FR/SC en quickstart al implementar, sin afirmar pruebas futuras como ejecutadas.
- Implementación local sobre #124; no despliega ni cambia DNS o configuración remota.
- Hooks git opcionales se omiten; actualización de contexto requerida se ejecuta.

## Complexity Tracking

Sin violaciones. Una tabla pública de orígenes satisface puertos, aliases
locales y configuración de builds; no requiere servicio de descubrimiento ni middleware.
