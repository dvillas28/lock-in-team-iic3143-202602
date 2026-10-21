# ADR: Contexto por ruta institucional y aislamiento obligatorio en PostgreSQL

**Fecha**: 2026-10-20. **Estado**: Aceptado para planificar; implementación pendiente.
**Misión**: [demo-aislamiento-dominios](../../specs/20261020-211552_demo-aislamiento-dominios/spec.md).

## Contexto

La selección por path y exclusión inicial de RLS simplificaron el walking skeleton.
Ahora UC/UTFSM tienen subdominios frontend y una API central; se exige impedir cruces si falta un filtro.
El stack SQL directo, pool, FK compuestas y autorización académica se conservan.
Esta decisión conserva selección por path y sustituye la exclusión RLS del [ADR previo](adopt-shared-postgresql-multitenancy.md).

## Decisión

- Una PostgreSQL compartida, users globales e institution_id en registros tenant-owned.
- Frontend: uc.academix.dvillasc.me y utfsm.academix.dvillasc.me. Backend: api.dvillasc.me.
- Conservar slug en /api/v1/institution/{institutionSlug}/...; ajustar plural actual al singular acordado.
- Validar slug centralmente desde params y comprobar pertenencia; Host/Origin/headers no seleccionan tenant.
- JWT autentica al User y pertenencia activa autoriza la institución solicitada por ruta.
- Un límite de operación usa mismo PoolClient y contexto local a transacción, sin ALS ni sesión persistente.
- RLS ENABLE/FORCE con USING/WITH CHECK en todas las tablas tenant-owned, incluidas memberships.
- Runtime no owner/superuser/BYPASSRLS ni miembro de roles privilegiados; sin DDL/TRUNCATE.
- Migración/carga usa credencial operativa separada y no un pool privilegiado del servidor HTTP.
- Users/institutions siguen globales; excepción de SELECT memberships propias solo sin tenant y con actor local.
- Ninguna excepción de lectura/escritura global para datos académicos; permisos de curso/sección no cambian.
- Mantener filtros SQL existentes, FK compuestas, locks de revocación y auditoría transaccional.
- CORS por lista exacta de orígenes frontend; no inferir tenant de Origin.
- Nueva migración demo opt-in, automática en predeploy, con marcador, atomicidad y auditoría.
- Seed antiguo se preserva; adopción de instituciones previa requiere compatibilidad y habilitación explícitas.

## Consecuencias

Resolver institución una vez reduce duplicación de aplicación; RLS sigue evaluándose en cada consulta.
Índices se basan en lookup real, no se agregan clusters/particiones ni se promete coste cero.
Hay que convertir reads pool.query a operaciones con contexto y separar las credenciales.
Readiness verifica rol y políticas, no solo columnas. Pruebas deben usar runtime real para demostrar RLS.
Routing, OpenAPI, cliente generado y consumidores actuales cambian juntos en un release coordinado.
No diseñar UI; un cliente usa https://api.dvillasc.me y rutas con institución explícita.
El prefijo canónico singular cambia la nomenclatura plural actual; no hay alias ni tenant por defecto.
El cliente traduce su contexto/subdominio al slug; el backend siempre autoriza la pertenencia.

## Límites

No se añaden roles de negocio, altas por API, servicios, ORM, schemas por tenant ni sharding.
Superadmin delega isAdmin; no obtiene acceso académico ajeno. Bootstrap inicial puede tener ambos flags.
RLS cubre filtros omitidos con contexto confiable, no SQL injection o control completo del contenedor.
Los secretos operativos están en el lifecycle Railway; el proceso HTTP no debe cargarlos como conexiones.
No asumir que un rollback de imagen revierte schema o políticas; despliegue/reversión se coordinan.

## Evidencia requerida

Path tampering, no-context, queries sin filtro, WITH CHECK, dos tenants y persona multi-institución.
Revocación concurrente, 100 operaciones alternadas y 20 reusos tras error sin contaminación.
Carga vacía/poblada/legacy, replay sin secretos, fallo final y dos ejecuciones concurrentes.
Preflight y solicitudes reales, contrato coherente y smoke HTTPS de API central con ambos slugs y orígenes frontend.

## Fuentes

- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- [node-postgres transactions](https://node-postgres.com/features/transactions).
- [Express proxies](https://expressjs.com/en/guide/behind-proxies/).
- Contratos de la misión: [persistencia](../../specs/20261020-211552_demo-aislamiento-dominios/contracts/persistence.md), [HTTP](../../specs/20261020-211552_demo-aislamiento-dominios/contracts/http.md), [demo](../../specs/20261020-211552_demo-aislamiento-dominios/contracts/demo-deployment.md).
