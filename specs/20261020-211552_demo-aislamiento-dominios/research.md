# Research: Demo, hosts y persistencia institucional

**Fecha**: 2026-10-20. Investigación de código mediante CodeGraph y documentación primaria.

## 1. API central y selección explícita

**Decisión**: backend https://api.dvillasc.me y prefijo /api/v1/institution/{institutionSlug}.
UC/UTFSM bajo academix.dvillasc.me son frontend; el consumidor envía slug por ruta.
**Motivo**: aclaración del usuario sustituye el diseño anterior de API por subdominio.
Código existente usa institutions plural: ajustar esa nomenclatura a institution singular,
conservando el parámetro y validación central de formato/pertenencia.
**Alternativas**: resolver tenant por Host/Origin obliga al backend a asumir despliegue frontend;
eliminar slug o usar headers añade routing innecesario. No implementar esos mecanismos.
Mantener trust proxy=false; ningún forwarded header es fuente de contexto institucional.
[Express: proxies](https://expressjs.com/en/guide/behind-proxies/).

## 2. RLS mínima sobre pool existente

**Decisión**: ENABLE y FORCE RLS en las 12 tablas de [data-model](data-model.md).
Políticas USING/WITH CHECK comparan institution_id con contexto local a transacción.
**Motivo**: barrera frente a filtros omitidos; columnas/FK compuestas actuales permanecen.
**Alternativas**: solo contexto de aplicación no impide omisiones; clusters/índices no son controles de acceso.
No protege SQL injection arbitraria ni reemplaza permisos académicos; SQL sigue parametrizado.
[PostgreSQL: RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

## 3. Contexto y transacciones

**Decisión**: withInstitution usa BEGIN, mismo PoolClient, actor, institución y COMMIT/ROLLBACK.
Usar set_config(...,true), nunca SET global; conservar locks y revalidaciones write-time.
Un callback recibe contexto resuelto y client; ninguna query tenant usa pool.query.
**Motivo**: current DatabaseService expone Pool y varios reads son directos; writes ya tienen transaction().
**Alternativas**: interceptor con transacción de request y ALS añade lifecycle/propagación innecesarios;
SQL reescrito automáticamente o repositorio genérico oculta consultas y edge cases.
[pg: transactions](https://node-postgres.com/features/transactions).
[PostgreSQL: settings](https://www.postgresql.org/docs/current/functions-admin.html).

## 4. Identidad global acotada

**Decisión**: users/institutions son globales; sin nuevas rutas de altas.
RLS de memberships admite SELECT propio solo con actor local y tenant ausente para GET /institutions.
Al existir tenant, esa excepción no aplica; el scope institucional sigue obligatorio.
**Motivo**: listado global y login existentes no pueden depender de tener ya contexto institucional.
**Alternativas**: deshabilitar RLS por HTTP o pool con credenciales admin crea bypass académico;
funciones SECURITY DEFINER no son necesarias para este contrato y ampliarían superficie.
Tests verifican ausencia de actor, actor propio y actor con dos membresías usando contexto trusted del JWT.

## 5. Credenciales

**Decisión**: DATABASE_URL apunta a academix_runtime; MIGRATION_DATABASE_URL solo a comandos operativos.
Runtime: no owner, superuser, BYPASSRLS ni membresía de roles privilegiados; sin DDL/TRUNCATE/CREATE.
Predeploy aplica esquema y provisiona rol explícitamente; contraseña por secreto, no SQL versionado.
El arranque HTTP elimina secretos operativos de su entorno antes de cargar main; nunca fallback admin.
**Motivo**: owner/superuser puede eludir RLS; readiness actual LIMIT 0 solo verifica columnas.
**Alternativa**: una URL propietaria para todo invalida SC-002. Dos procesos en el mismo servicio bastan;
no se afirma aislamiento frente a un compromiso completo del contenedor/plano Railway.

## 6. Demo nueva, seed anterior preservado

**Decisión**: manifiesto v1 de diez identidades nuevas con IDs diferentes a 10000000-...001–005.
Reutilizar instituciones compatibles solo con adopción legacy explícita y evidencia, una transacción,
lock advisory, marcador global de ejecución y auditoría institucional restringida.
**Motivo**: seed viejo tiene 5 users/6 memberships, revocados/inactivos y dependencias en tests;
onboardInstitution rechaza un tenant existente sin su fingerprint. No puede orquestar este batch.
**Alternativas**: modificar el seed rompe fixtures; llamar onboarding dos veces no ofrece atomicidad conjunta.
En una base vacía total 2/10/10; en una poblada conservar extras y verificar solo el manifiesto.
Primera ejecución requiere secretos solo para usuarios faltantes; replay del marcador no los necesita.
La allowlist de audit_events debe admitir únicamente el nuevo evento operativo membership.demoProvisioned.

## 7. CORS y cambio de contrato

**Decisión**: enableCors una vez, orígenes exactos, credentials=false, preflight previo a guards.
Conservar slug y ajustar prefijo plural a singular en controllers, Location, regex, OpenAPI y consumidores.
BaseURL de createApiClient es el ORIGEN: las rutas ya incluyen /api/v1.
**Motivo**: evitar doble /api/v1 y la falsa equivalencia Origin=tenant.
**Alternativas**: CORS wildcard o regex por sufijo autoriza orígenes no acordados.
[Nest: CORS](https://docs.nestjs.com/security/cors).

## 8. Entrega y deuda

**Decisión**: Railway predeploy único: esquema → credencial runtime → demo opt-in → validación runtime.
CI reproduce ese camino en DB _test; no corre además migraciones remotas por GitHub Actions.
**Motivo**: un responsable de la carga, fallos impiden promover; no duplicar side effects.
[Railway: predeploy](https://docs.railway.com/deployments/pre-deploy-command).
[Railway: custom domains](https://docs.railway.com/networking/public-networking).
Alta general de cuentas/pertenencias por institución queda como deuda y no bloquea esta demo.
