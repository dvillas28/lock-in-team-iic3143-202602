# Persistence Contract: Contexto y credenciales sin bypass

## Roles

DATABASE_URL: academix_runtime, LOGIN, NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE.
No propietario de tablas ni miembro de roles con privilegios, sin DDL, CREATE, TRUNCATE o SET ROLE privilegiado.
MIGRATION_DATABASE_URL: conexión operativa existente; solo migraciones, seed, onboarding y recuperación.
Los comandos operativos no toman DATABASE_URL como fallback en producción.
DatabaseService usa solo DATABASE_URL; rechaza al iniciar un rol que puede eludir RLS.
provision-runtime.ts usa conexión migradora y secreto de DATABASE_URL para habilitar el rol inicial.
La migración crea el rol sin LOGIN; el provisionador solo fija contraseña al habilitarlo por primera vez.
Si ya tiene LOGIN, verificar conexión y privilegios; no resetear contraseña automáticamente.
No aceptar nombres de rol arbitrarios ni valores SQL sin validación; no loguear URLs ni DDL con secretos.

## Grants runtime

- SELECT de campos de users/institutions requeridos por identidad/directorio; sin escrituras de altas.
- SELECT memberships y UPDATE solo is_admin/updated_at; sin INSERT ni UPDATE is_super_admin.
- Tablas académicas: grants por operaciones actuales; conservar triggers/invariantes de historial.
- audit_events: SELECT/INSERT, sin UPDATE/DELETE; evento operativo de actor nulo no concedido a HTTP.
- demo_data_runs, pgmigrations y comandos de provisioning: sin grants runtime.
- Revocar CREATE de PUBLIC y no otorgar roles privilegiados al runtime.

## Límite central

withInstitution(actor,slug,fn) obtiene un PoolClient, inicia transacción y establece actor local.
Consulta institución activa por slug validado del path; fija institution_id local; valida membership/usuario activos.
Entrega fn(client,context) con UUID y pertenencia ya resueltos; confirmar o revertir antes de release.
Usar set_config con parámetros y is_local=true; jamás interpolar UUID ni usar SET de sesión.
Las sentencias de la operación usan ese mismo client; ningún pool.query académico ni BEGIN anidado.
Ante fallo de rollback/conexión, destruir el client en lugar de devolver conexión incierta al pool.
La resolución inicial se hace una vez; locks actuales vuelven a leer autorización en escrituras sensibles.
No cachear membership/flags entre solicitudes ni usar claims JWT para conferir roles académicos.

withIdentity(actor|null,fn) delimita consultas globales: login, usuario activo y directorio propio.
actor=null no habilita datos tenant-owned; actor proviene del JWT validado; slug procede del path y no otorga permisos.
No reutilizar client de una operación tenant dentro de global, ni viceversa.

## RLS

ENABLE y FORCE en las 12 tablas del inventario de data-model.md.
Política tenant para academix_runtime con USING y WITH CHECK:
institution_id = NULLIF(current_setting('academix.institution_id',true),'')::uuid.
Establecer además academix.actor_id para el directorio global y evidencia del actor.
Sin tenant, SELECT académico no devuelve filas; DML no puede crear o cambiar filas de otra institución.
Un UPDATE/DELETE sobre filas ajenas no las afecta; WITH CHECK bloquea mover filas propias a otro tenant.
Mantener filtros explícitos y FK compuestas: RLS es defensa ante omisión, no motivo para reescribir SQL.
No permitir que datos de la petición controlen settings ni ejecutar SQL arbitrario del usuario.

Excepción SELECT de memberships: solo cuando tenant está vacío y user_id coincide con actor local.
Cuando hay tenant, esa política global DEBE ser falsa; no OR incondicional entre actor y tenant.
No hay excepción DML ni política global para courses, grades o ninguna otra tabla académica.
users e institutions son globales; los servicios proyectan solo campos del contrato, jamás hashes.
Login necesita hash internamente; ni login ni /institutions exponen un API SQL o credencial privilegiada.

## Auditoría y operaciones

Reusar lockContext/courseScope/sectionScope con UUID del contexto; preservar locks User → Institution → Membership.
Las escrituras académicas y AuditService comparten transacción. No mover auditoría después del commit.
El rol migrador puede actuar globalmente por tarea controlada; no es un endpoint ni un flag de request.
AuditEvent WITH CHECK exige actor_user_id igual al actor local y excluye membership.demoProvisioned,
membership.onboarded y membership.superAdminChanged del runtime, incluso con actor no nulo.
Acciones demo null-actor solo desde proceso migrador; probar INSERT operativo con runtime y esperar rechazo.
Las políticas no reemplazan la autorización de propietario/teacher ni visibilidad de notas publicadas.

## Readiness

Preservar comprobaciones de columnas y agregar inspección de rol efectivo, ownership, membresías y grants.
Verificar ENABLE/FORCE y políticas esperadas de las 12 tablas; runtime no puede alterarlas.
/ready devuelve 503 si el proceso usa owner/superuser/BYPASSRLS o carece de barrera esperada.
Comprobar schema no requiere tenant ni lectura de filas; no añadir pool administrador a readiness.

## Pruebas obligatorias

Fixtures usan TEST_DATABASE_URL operativa; assertions y app usan TEST_RUNTIME_DATABASE_URL de la misma DB _test.
SELECT sin filtro, sin tenant, UPDATE institución, INSERT ajeno y relaciones cruzadas bajo runtime real.
Actor global solo obtiene memberships propias; actor con dos tenants sigue aislado cuando hay tenant.
100 operaciones concurrentes y 20 reusos tras error; membresías y grants no cambian entre tests.
Repetir revocaciones concurrentes y rollback de auditoría del backend actual con RLS habilitada.
Comparar planes EXPLAIN representativos antes/después; sin índices especulativos ni cache nueva.

## Límite del diseño

RLS cubre omisiones de filtros con contexto confiable. No promete resistir control completo del proceso
capaz de ejecutar SQL o leer secretos operativos del entorno Railway. Mantener SQL parametrizado,
separación de procesos/roles y controles del proveedor; no incorporar más infraestructura al MVP.
