# Perfiles: modelo de datos, API y seguridad propuestos

Complementa [plan técnico](../../../specs/20261106-170457_perfiles-altas-usuarios/plan.md) y [modelo](modelo-datos.md).

## Evolución de User

Conservar `users`; no hace falta una segunda tabla de perfil para tres atributos.

| Campo | Propuesta | Regla |
| --- | --- | --- |
| name | Campo existente | Nombre visible editable; 1–200 caracteres tras trim |
| bio | varchar(500), nullable | Texto plano; vacío se normaliza a null |
| avatar_key | varchar(512), nullable | Clave interna generada; nunca URL ingresada por usuario |
| credential_version | integer, NOT NULL DEFAULT 0 | No negativo; incrementa al cambiar contraseña |
| updated_at | Campo existente | Se actualiza con cada cambio efectivo |

No agregar contraseña en claro, un segundo hash, role ni institution_id a User.
Una edición global se refleja en UC y UTFSM; sus matrículas siguen separadas.
Usar expectedUpdatedAt exacto al guardar; conservar seis microsegundos desde SQL;
conflicto devuelve 409 y solicita recargar, sin pisar otra edición silenciosamente.
Migración aditiva con null/default preserva cuentas, hashes, matrículas e historia.

## Alta y activación

Agregar `account_invitations`: id, institution_id, normalized_email, invited_name,
created_by, token_hash único, expires_at, accepted_at, revoked_at, accepted_user_id,
created_at y clave/fingerprint de operación para reintentos de creación.
FK compuesta (institution_id, created_by) a memberships; accepted_user_id a users.
CHECK de estados; hash/expiración null antes del primer envío, luego código aleatorio de 24 h.
Consulta/indexación por institución+estado+fecha/id y por token_hash único.
Serializar emisiones por institución/correo; una pendiente vigente por par.
La expiración se comprueba por fecha, no mediante un índice parcial con now().
RLS por institución; emisión/lectura administrativa por admin OR superadmin vigente.
La aceptación por token requiere una excepción acotada de identidad, no acceso
global a la tabla ni una membership previa que el invitado aún no posee.

Secuencia de aceptación, dentro de una transacción:

1. Bloquear invitación; verificar hash, vigencia, no consumo/revocación,
   institución activa y que el emisor siga siendo admin OR superadmin activo.
2. Buscar correo normalizado de forma interna, sin revelar otras pertenencias.
3. Si no existe User, validar contraseña, generar Argon2id y crear identidad.
   Si existe, exigir sesión de ese User activo y correo coincidente; jamás cambiar
   su contraseña, nombre ni estado global desde el alta institucional.
4. Insertar membership activa con ambos flags false; registrar aceptación y
   auditoría en la misma transacción. La unicidad global resuelve altas concurrentes.
5. Una membership ya activa no se duplica; una revocada no se reactiva mediante
   este flujo. User inactivo tampoco se reactiva. Resolver sin revelar el motivo global.
6. Reintentos/aceptaciones paralelas no duplican User, membership ni evento;
   un código consumido no concede acceso nuevamente. Login posterior es explícito.

La respuesta a crear una invitación no confirma si el correo existe globalmente.
El código solo viaja en el correo Resend; DB conserva hash, no se devuelve al admin.
Si se pierde, reenvío explícito rota código. Estado/versión de entrega según
[plan Resend](correo-resend.md); red fuera de transacciones y sin códigos en logs o URLs API.

## Escrituras de identidad: barrera que debe cambiarse con precisión

Hoy `runtime_users_readonly` impide cambios incluso concediendo UPDATE;
`checkRuntime` rechaza INSERT de users/memberships y UPDATE de password_hash.
No basta con modificar controller, SQL de servicio o columnas.
Propuesta: mantener prohibidas las escrituras directas del rol HTTP y crear
funciones SQL específicas para editar perfil, cambiar credenciales y aceptar alta.
Si usan SECURITY DEFINER: dueño NOLOGIN de privilegios mínimos, search_path fijo,
objetos calificados, EXECUTE revocado a PUBLIC y concedido solo donde corresponde.
Cada función valida actor/contexto, campos permitidos, estado y precondiciones;
la aceptación nueva valida el token dentro de la operación privilegiada.
No aceptar un actor arbitrario del body ni usar funciones con SQL dinámico genérico.
Diseñar grants/policies del dueño de funciones sin volver al runtime owner/BYPASSRLS.
Registrar y probar estas excepciones; mantener credenciales de operador fuera del HTTP.
Actualizar readiness/checkRuntime para verificar funciones/grants y nuevas tablas/RLS;
sus conteos y expresiones actuales están fijados y no deben relajarse indiscriminadamente.

## Contraseña y sesiones

Reutilizar Argon2id. Propuesta de contraseña nueva: mínimo 12 caracteres y máximo
128 bytes UTF-8; mantener login compatible con credenciales anteriores válidas.
Verificar contraseña actual; limitar intentos por actor/IP y no guardar confirmación.
Contraseña actual incorrecta devuelve error de campo 400; reservar 401 para sesión
inválida, porque Session cierra sesión automáticamente ante esa respuesta.
Emitir JWT con credentialVersion; AuthGuard compara con DB en cada solicitud.
Hash nuevo + incremento de versión + evento de seguridad confirman atómicamente.
Comprobar versión esperada para rechazar cambios concurrentes tras verificar el hash.
Un JWT emitido durante una carrera tampoco funciona si contiene versión anterior.
El despliegue que exige el claim invalida tokens anteriores: comunicar nuevo login.
Éxito cierra sesión local; tokens de otras pestañas/subdominios reciben 401 en su
siguiente solicitud. No se necesita Redis, refresh tokens ni sesiones persistidas.

## Auditoría e integridad

`audit_events` exige institution_id y restringe eventos sin curso a acciones
específicas de membership; no sirve directamente para un perfil global sin tenant.
Agregar `account_security_events` global: id, user_id, actor_user_id, action,
occurred_at y metadatos permitidos mínimos, inmutable y con acceso restringido al titular.
Perfil/avatar registran campos cambiados o referencia interna; contraseña solo acción,
sin valores, hash ni token. No copiar biografías completas a historia por defecto.
Invitaciones, lotes y membership creada usan eventos institucionales: extender CHECK,
policies y snapshots de AuditService; no reutilizar membership.onboarded,
que representa el bootstrap y tiene unicidad por institución.
Preservar grades, attempts, enrollments y sus eventos: sin cascadas ni borrado.
Invitaciones/auditoría global y lotes/filas CSV suman cuatro tablas nuevas;
su integridad, staging e idempotencia se describen en el modelo completo.

## Contratos HTTP orientativos

| Método/ruta, bajo /api/v1 | Permiso / propósito |
| --- | --- |
| GET /me | Usuario activo; cuenta global propia |
| PATCH /me | Propio; name/bio y versión esperada únicamente |
| POST /me/password | Propio; contraseña actual/nueva y revocación global |
| GET, PUT, DELETE /me/avatar | Propio; consultar binario, reemplazar, eliminar |
| GET /institution/{slug}/memberships | Existente; ampliar lectura a admin OR superadmin |
| PUT /institution/{slug}/memberships/{id}/course-admin | Existente; delegar isAdmin |
| GET, POST /institution/{slug}/invitations | Admin OR superadmin; pendientes/crear |
| POST /institution/{slug}/invitations/{id}/revoke | Admin OR superadmin; revocar pendiente |
| POST /institution/{slug}/invitations/{id}/send, /resend | Admin OR superadmin; envío/rotación controlados |
| POST /auth/invitations/activate | Código válido; crear User y membership si no existe |
| POST /me/invitations/accept | Cuenta autenticada coincidente; añadir membership |

Contratos fijados en OpenAPI. Activación pública no reemplaza login ni resetea cuentas.
Rechazar campos extra; respuestas DTO nunca incluyen hashes/claves de almacenamiento.
Mantener no-store y Problem Details; ampliar errores de campo/códigos permitidos.
Actualizar OpenAPI modular, catálogo, schema.d.ts generado y parsers frontend.
Actualizar la lista de operaciones públicas del cliente para no adjuntar JWT a activación.
CSV reutiliza el alta; [contrato preview/confirmación](importacion-csv.md), sin permisos en filas.

## Foto de perfil

[S3 privado elegido para producción](../../adr/s3-for-profile-photos.md), local en desarrollo;
Daniel provisiona, Matías integra. Claves globales por userId, autorizadas al titular.
Propuesta: multipart acotado en backend, JPEG/PNG/WebP, máximo 2 MiB y 1024×1024
tras procesar; validar firma, dimensiones/16 MP de entrada y decodificación real,
reprocesar para eliminar metadatos; rechazar SVG, animados y tipos suplantados.
Mantener JSON en 4096 bytes; configurar límite binario solo para esa ruta.
Subir/procesar antes de cambiar avatar_key; si falla DB, eliminar objeto nuevo;
al confirmar, eliminar anterior con reintento/limpieza operativa documentada.
DELETE elimina referencia auditada y deja limpieza operativa recuperable; no afirmar
atomicidad entre PostgreSQL y archivos. Sin cola nueva; bucket/configuración pendientes.
