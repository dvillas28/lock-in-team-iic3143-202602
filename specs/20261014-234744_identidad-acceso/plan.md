# Implementation Plan: Identidad global y acceso institucional

**Branch**: `feat/identidad-acceso` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261014-234744_identidad-acceso/spec.md`.
**Status**: Planificado; implementación y validación funcional pendientes.

## Summary

Autenticar usuarios demo mediante email global y contraseña Argon2id, emitir JWT
breve y consultar instituciones autorizadas. Reutilizar NestJS y DatabaseService.
La institución se solicita por slug; cada consulta revalida los estados vigentes
en PostgreSQL. JWT solo identifica al usuario, nunca concede roles ni tenants.
US1 entrega login y listado; US2 agrega identidad contextual y cambio de institución.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, NestJS 12.1.0 existentes |
| Dependencias | Reusar pg 8.23.1 y argon2 0.45.1; agregar @nestjs/jwt 12.0.3 y @nestjs/throttler 6.7.1 |
| Compatibilidad verificada | Peers publicados admiten Nest 12; Throttler admite Node 24; instalar versiones exactas y generar lockfile en T002 |
| Storage | PostgreSQL 17 compartida, tres tablas existentes; índice único normalizado de email |
| Testing | node:test/assert, HTTP real y PostgreSQL exclusiva; c8 y CI existentes |
| Plataforma/tipo | Monolito modular HTTP en Node/Docker; una instancia demo |
| Sesión | HS256, 900 s, iss=academix-api, aud=academix-clients, sin refresh |
| Login | Email trim/lowercase, contraseña exacta; cinco solicitudes por IP cada 60 s |
| Objetivos | JWT rechazado antes de consultar DB si inválido; limitación antes de Argon2 |
| Alcance | Cinco cuentas demo, UC/UTFSM; tres operaciones; sin UI ni permisos académicos |

AUTH_JWT_SECRET: secreto aleatorio codificado base64 de al menos 32 bytes,
obligatorio al arrancar, sin default ni exposición NEXT_PUBLIC. Validar antes de
escuchar HTTP; no imprimir su valor. Bearer solo por Authorization y HTTPS fuera
de localhost. No cookies, tokens en URL ni almacenamiento de sesión en servidor.
La limitación en memoria requiere una instancia; reiniciar borra contadores.
No confiar X-Forwarded-For: trust proxy permanece deshabilitado; un proxy/NAT puede
compartir cuota entre usuarios. Documentar este límite y verificarlo antes de uso público.

## Constitution Check

Evaluación inicial y posterior al diseño: PASS dentro del alcance de identidad.

| Gate | Evidencia |
| --- | --- |
| Tenant | JOIN por user_id autenticado, institution_id y estados activos en cada lectura |
| Roles | sectionMemberships=[]; nombres demo, JWT y URL no conceden teacher/student/assistant/admin |
| Capacidad admin | ADR UI revisada; esta misión no crea cursos ni evalúa privilegios académicos |
| Historia | Sin escrituras académicas o de roles; no introducir AuditEvent dependiente de Course |
| Integridad | Índice único lower(btrim(email)); duplicados hacen fallar migración sin borrar filas |
| Entregabilidad | US1 usable con fixtures base; US2 depende de login US1, se comprueba aisladamente |
| Checked changes | Negativos, dos tenants, revocación y sanitización obligatorios en spec |
| Complejidad | Sin Passport, ORM, Redis, proveedor externo ni tablas de sesión |
| Documentación | Cada documento <150 líneas; trazabilidad y límites explícitos |

La revocación se prueba mediante fixture SQL controlado, sin crear un endpoint
administrativo. Su gestión/auditoría productiva requiere otra misión. No registrar
payloads, hashes, Authorization, tokens ni contraseñas en errores o assertions.

## Project Structure

### Documentation (this feature)

- [research.md](research.md): decisiones y fuentes primarias.
- [data-model.md](data-model.md): invariantes, consultas y estados.
- [contracts/http.md](contracts/http.md): operaciones, DTO, errores y validación.
- [contracts/security.md](contracts/security.md): JWT, rate limit y revocación.
- [quickstart.md](quickstart.md): guía de validación posterior a implementación.
- [tasks.md](tasks.md): ejecución por historia.
- [ADR](../../docs/adr/global-identity-and-live-institution-access.md): decisión duradera.

### Source Code (repository root)

```text
backend/migrations/<timestamp>_unique_login_email.sql
backend/src/auth/auth.service.ts          # login, Argon2, JWT y configuración
backend/src/auth/auth.controller.ts       # POST login y límite local
backend/src/auth/auth.guard.ts            # JWT y usuario activo persistido
backend/src/http/problem.filter.ts        # contrato Problem sanitizado
backend/src/institutions/institutions.service.ts  # SQL scoped y DTO explícitos
backend/src/institutions/institutions.controller.ts # listado y /me
backend/src/app.module.ts                 # registrar providers/controladores/guard
backend/src/main.ts                       # límites JSON y filtro de errores
backend/test/auth.test.mjs
backend/test/integration/auth.test.mjs
backend/test/integration/institutions.test.mjs
backend/test/integration/helpers.mjs
backend/package.json / backend/pnpm-lock.yaml
.env.example / docker-compose.yml
frontend/src/lib/api/client.ts / schema.d.ts / frontend/test/api.test.ts
docs/reference/openapi/openapi.yaml
docs/reference/openapi/paths/auth.yaml / paths/platform.yaml
docs/reference/openapi/components/schemas/auth.yaml
```

**Structure Decision**: providers específicos en AppModule con DatabaseService
existente; sin módulos ni repositorios genéricos. Guard global con excepciones
explícitas solo para /health, /ready y login. Rutas académicas futuras heredarán
identidad, pero deberán implementar además autorización contextual del recurso.
El servicio institucional combina scope y lectura en la misma consulta; no
almacena una institución seleccionada globalmente ni cachea permisos.
Filtro Problem común preserva contratos públicos de sondas existentes.
Frontend solo requiere regeneración de tipos y corrección del envío de Bearer
a operaciones públicas; no incluye pantallas ni persistencia del token.

## Execution and Verification

1. Confirmar base-persistente disponible: migrador, seed y fixtures de dos tenants.
2. US1: contrato OpenAPI de login/listado, unicidad de email, protección global,
   implementación y cliente tipado verificados antes de cerrar el incremento.
3. US2: /me contextual, slug validado y revocación observable con el mismo JWT;
   sincronizar su contrato OpenAPI y regenerar tipos dentro de la historia.
4. Conservar operationIds actuales y comprobar contratos/consumidores en cada historia.
5. Probar 400/401/404/429/503 y semántica 403 sin inventar acciones privilegiadas.
6. Ejecutar checks existentes y dejar evidencia sin secretos en docs/backend/.

| Cobertura | Evidencia exigida |
| --- | --- |
| CU-01; FR-001/006/007/008 | Login, JWT estricto, errores indistinguibles, límites y sanitización |
| CU-02; FR-002/003/004/005 | Lista visible, /me, revocación, estados activos y roles vacíos |
| RF1–RF7, RF25; RNF1–RNF2 | Identidad global, institución por path, aislamiento vigente |
| SC-001/002/003 | Negativos completos, siguiente consulta tras COMMIT y UC/UTFSM aisladas |

Backlog: PREP-07, INST-03, INF-03, BE-03–BE-08; conservar responsables actuales.
Exclusiones: registro, SSO, recuperación, refresh/logout remoto, provisioning,
usuarios institucionales /users, cursos/Enrollments, administración y UI.
Base-persistente tiene cierre operativo pendiente; esta misión no lo da por hecho.

## Complexity Tracking

Sin violaciones. @nestjs/jwt evita criptografía propia; @nestjs/throttler limita
antes del costo Argon2 sin incorporar infraestructura. El índice nuevo hace
inequívoco un identificador que el esquema actual todavía no garantiza.
