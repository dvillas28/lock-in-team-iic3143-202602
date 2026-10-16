# Research: Identidad y acceso institucional

Fecha: 2026-10-15. Investigación local con CodeGraph y fuentes primarias.
Sin incógnitas funcionales abiertas. Versiones seleccionadas y peers publicados
verificados en npm; instalación y lockfile quedan como trabajo de implementación.

## 1. Reutilizar base persistente

**Decision**: DatabaseService.pool, PostgreSQL 17 y SQL parametrizado existentes;
no cambiar seed ni crear sesiones persistidas. Migración nueva añade unicidad
lower(btrim(email)), sin reescribir datos. Colisiones abortan y requieren reparación explícita.
**Rationale**: User es global y FR-008 exige identificador inequívoco; el esquema
actual no contiene índice único de email. Seed ya compara email normalizado.
**Alternatives considered**: UUID como login es poco usable; unicidad solo en
aplicación falla bajo concurrencia; editar migración aplicada rompe historia.
Evidencia: backend/migrations/, backend/src/seeds/demo.ts y plan base-persistente.

## 2. JWT breve y verificación explícita

**Decision**: @nestjs/jwt 12.0.3, guard Nest propio, HS256 y 900 segundos. sub UUID,
iss=academix-api y aud=academix-clients; exigir iat/exp, algoritmo y firma.
AUTH_JWT_SECRET base64 de ≥32 bytes aleatorios, obligatorio y sin default.
**Rationale**: JWT ya es requisito de Entrega 2. La biblioteca valida exp cuando
existe; el guard debe exigirlo. JWT no transporta permisos ni contexto seleccionado.
**Alternatives considered**: Passport agrega una capa innecesaria para una
estrategia; crypto propio multiplica riesgo; refresh y SSO están fuera del spec.
Fuentes: [Nest authentication](https://docs.nestjs.com/security/authentication),
[@nestjs/jwt](https://github.com/nestjs/jwt),
[jsonwebtoken verify](https://github.com/auth0/node-jsonwebtoken/blob/master/README.md).

## 3. Argon2 y errores indistinguibles

**Decision**: argon2.verify reutiliza PHC existente. Hash dummy al arrancar para
cuenta inexistente; cuenta inactiva también realiza verificación. Mismo 401.
**Rationale**: Seed ya usa Argon2id m=19456 KiB, t=2, p=1. No cambiar hashes,
contraseñas ni estados al iniciar sesión. Sanitizar también errores internos.
**Alternatives considered**: Respuestas diferentes enumeran usuarios; omitir
verificación para desconocidos facilita una señal temporal; SHA plano es inadecuado.
Fuentes: [node-argon2](https://github.com/ranisalt/node-argon2),
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## 4. Rate limit acotado al demo

**Decision**: @nestjs/throttler 6.7.1 solo en login: limit=5, ttl=60000 ms,
blockDuration=60000 ms; sexta solicitud bloquea durante 60 s desde el exceso.
Retry-After refleja bloqueo restante. Cuenta válidos e inválidos antes de Argon2.
**Rationale**: FR-007 requiere un límite comprobable; librería de Nest evita
un contador propio. Parámetros son decisión del proyecto, no una norma universal.
**Alternatives considered**: Límite solo por email permite distribuir costo con
emails inventados; bloqueo de cuenta genera denegación dirigida; Redis agrega servicio.
Fuente: [Nest rate limiting](https://docs.nestjs.com/security/rate-limiting).
Memoria por proceso, una instancia demo; reinicio borra cuota. Con trust proxy
deshabilitado no se confía X-Forwarded-For, pero proxy/NAT comparte IP y cuota.
Revisar IP confiable y almacenamiento antes de exposición pública o escalado.

## 5. Contexto vivo y compatibilidad

**Decision**: US1 agrega login y listado; US2 agrega /me por slug con JOIN scoped.
Revalidar estados activos en cada consulta; mantener CurrentUser y operationIds.
Sin cursos, sectionMemberships=[]. 403 conserva semántica pero no se inventa
una acción privilegiada en este spec. Guard global deja solo sondas/login públicos.
**Rationale**: La siguiente consulta tras COMMIT debe observar revocación. DTO
existente evita romper consumidores; usuario con cero pertenencias puede autenticar.
**Alternatives considered**: Tenant/roles en JWT congela permisos; institución
global en servidor mezcla sesiones; nueva lista roles duplicaría sectionMemberships.
Evidencia: docs/reference/openapi/paths/platform.yaml, schemas/tenancy.yaml,
frontend/src/lib/api/institutions.ts y ADR de admin/no admin.

## 6. Historia y frontera de alcance

**Decision**: Sin escrituras de roles o registros académicos, no agregar auditoría
académica. Revocaciones de prueba son fixtures en DB exclusiva, no endpoints nuevos.
**Rationale**: AuditEvent del dominio requiere curso; esta misión no administra
pertenencias ni resuelve la capacidad admin del curso. Esa aclaración sigue
bloqueando las misiones académicas afectadas, no login ni contexto básico.
**Alternatives considered**: Inventar un admin institucional o un log genérico
persistido amplía alcance y contradice Entrega 2.
Fuentes locales: constitución y docs/adr/ui-admin-non-admin-experiences.md.

## 7. Versiones y compatibilidad declarada

**Decision**: Fijar @nestjs/jwt 12.0.3 y @nestjs/throttler 6.7.1 en T002.
**Rationale**: Consulta del registro npm el 2026-10-15 mediante pnpm view:
JWT declara @nestjs/common ^12.0.0; Throttler declara @nestjs/common/core
^12.0.0, reflect-metadata ^0.2.0 y Node >=24.0.0 entre sus rangos admitidos.
Coinciden con Nest 12.1.0, reflect-metadata 0.2.2 y Node 24 del proyecto.
JWT declara jsonwebtoken 9.0.3. No se requiere Passport ni cambio de stack.
**Alternatives considered**: Resolver latest al implementar deja la decisión
abierta; usar versiones que excluyan Nest 12 necesitaría overrides injustificados.
Metadatos primarios: [JWT 12.0.3](https://registry.npmjs.org/@nestjs/jwt/12.0.3),
[Throttler 6.7.1](https://registry.npmjs.org/@nestjs/throttler/6.7.1).
La compatibilidad declarada no sustituye build/tests durante implementación.
