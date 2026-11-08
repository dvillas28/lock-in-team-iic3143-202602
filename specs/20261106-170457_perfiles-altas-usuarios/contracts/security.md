# Contrato de identidad, aislamiento y escrituras acotadas

[Plan](../plan.md) · [Modelo](../data-model.md). Actor/contexto se fijan por transacción,
no por body; el rol HTTP sigue siendo academix_runtime sin owner/BYPASSRLS.

## Operaciones de identidad

| Función SQL | Precondiciones y efecto |
| --- | --- |
| account_update_profile(name,bio,expected,version) | Actor activo propio, timestamp/versión esperados no nulos; campos válidos; UPDATE y evento mínimo juntos |
| account_change_password(hash,version) | Actor activo y versión esperada no nula; hash preparado tras verificar actual; incrementa versión y registra evento |
| account_set_avatar(key,expected,version) | Actor activo, timestamp/versión esperados no nulos; clave propia o null; devuelve referencia previa y audita cambio |
| account_accept_invitation(token,hash,version) | Token aleatorio vigente; emisor/institución activos; cuenta nueva con hash o titular existente autenticado; consume y crea pertenencia sin flags |

Las funciones pertenecen a academix_account_writer NOLOGIN, NOSUPERUSER,
NOBYPASSRLS, NOCREATEDB/NOCREATEROLE y sin pertenencia del rol HTTP.
search_path fijo y objetos calificados; revocar EXECUTE a PUBLIC y conceder
solo las cuatro funciones al runtime. Sin SQL dinámico ni operaciones genéricas.
El escritor recibe solo columnas/INSERT requeridos, no privilegios DDL permanentes.
Locks SHARE/UPDATE necesitan privilegio UPDATE en alguna columna; usar el grant
mínimo sobre id para tablas solo bloqueadas, sin exponer una función que lo modifique.

## Autorización

- Cuenta propia: actor JWT activo; no exigir tenant ni membership.
- Administración: withInstitution establece contexto; revalidar User/institución/
  membership activos e isAdmin OR isSuperAdmin. Bloquear precondiciones al mutar.
- Delegación course-admin mantiene exclusivamente isSuperAdmin; flags no son rol académico.
- Invitación válida no autoriza edición de un User existente. El titular inicia sesión
  y su correo debe coincidir; no reactivar User o Membership revocados/inactivos.
- Excepción pública por token se limita a su invitación; no ofrece SELECT global HTTP.
- Las tablas institucionales rechazan contexto cruzado incluso sin WHERE de tenant.
- Snapshot/metadata de auditoría nunca contiene contraseña, token, hash, CSV crudo,
  nombre/correo duplicados o fingerprint personal que sobreviva su plazo de limpieza.

## Concurrencia y sesiones

Perfil/foto comparan timestamp completo de PostgreSQL bajo lock; PATCH obsoleto da 409.
No convertir expectedUpdatedAt a Date con pérdida de microsegundos. Sin cambio efectivo,
no actualizar timestamp ni crear evento. Cambio y auditoría se confirman o revierten juntos.
Credenciales usan versión esperada después de verificar hash fuera del lock largo.
JWT de login incluye credentialVersion; guard compara active y versión de DB.
Versión ausente/distinta invalida sesión; no ampliar TTL 900 s o aceptar algoritmo distinto.

Activación toma lock estable de correo normalizado antes de sus escrituras globales,
revalida permiso emisor y token tras reclamar fila. Unicidades/FK impiden identidades,
pertenencias e invitaciones pendientes duplicadas o relaciones institucionales cruzadas.
Enviar/reenvío usa clave/versión y lease; un resultado posterior no pisa otra versión.
Confirmación CSV bloquea lote y destinatarios en orden estable; ante cambio de clasificación
falla todo y exige nueva preview. La red nunca ocupa la transacción del lote.

## Readiness y pruebas obligatorias

Readiness comprueba columnas, FORCE RLS, políticas, grants y dueño/atributos de funciones.
Cambiar tablas/políticas esperadas explícitamente; no sustituir checks por permisos amplios.
Servicios externos disabled no afectan readiness ni acceso a funciones académicas.

Pruebas con runtime real y owner no superusuario: SQL arbitrario de identidad bloqueado,
funciones rechazan actor/versión/timestamp incorrectos o nulos; UC/UTFSM cruzados fallan;
fallo de auditoría revierte escritura; conexión devuelta no conserva contexto previo.
Mantenimiento de PII corre con operación de operador separada de HTTP, conserva FK e
historia; limpiar datos temporales no borra User, Membership, Enrollment, notas ni intentos.
