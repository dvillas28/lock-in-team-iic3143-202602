# Data Model: Identidad y acceso institucional

## Entidades persistidas existentes

| Entidad | Campos usados | Alcance y relaciones |
| --- | --- | --- |
| User | id UUID, email varchar(254), password_hash, name, active, timestamps | Global; muchas memberships |
| Institution | id UUID, slug varchar(63), name, active, timestamps | Límite institucional |
| InstitutionMembership | id UUID, user_id, institution_id, active, timestamps | Pertenece a una institución y un usuario |

Reusar constraints y FK de base-persistente. No agregar tablas de sesión,
roles, cursos ni auditoría. El hash solo se selecciona para verificar login.
El slug HTTP conserva el CHECK histórico: 1–63 caracteres alfanuméricos ASCII
minúsculos o guiones, extremos alfanuméricos; admite guiones consecutivos sin renombrar datos.

## Identificador de login (US1)

Agregar migración SQL nueva: índice único sobre public.users(lower(btrim(email))).
Consulta parametrizada usa exactamente la misma expresión. Conservar email
original, UUID, hash y timestamps; no hacer backfill destructivo.
Una colisión por espacios/mayúsculas aborta toda la migración y requiere resolver
los datos fuera de esta misión; no fusionar ni borrar usuarios automáticamente.
Probar base vacía, poblada, colisión, repetición y dos inserciones concurrentes.
Aplicar bloqueo transaccional estándar del migrador existente; no editar la
migración inicial ni crear un segundo runner. El seed conserva su idempotencia.

Validación HTTP de email: string, trim, 3–254 caracteres ASCII, un @ y partes
local/dominio no vacías, sin espacios ni controles; dominio con punto.
No imponer una validación RFC exhaustiva al dataset demo. Normalizar lowercase
tras validar; email inválido no consulta DB. Nunca normalizar password.
Password: string no vacía, máximo 128 bytes UTF-8, sin truncar; permite las
contraseñas Unicode del seed. Credenciales válidas requieren users.active=true.

## Consultas autorizadas

- Guard: JWT verificado, sub UUID y User persistido activo; no confiar payload extra.
- Listado (US1): User activo JOIN memberships activas JOIN institutions activas,
  filtrado por user_id=sub. Orden estable por slug; sin filas retorna {items:[]}.
- Contexto (US2): una consulta JOIN de esas tres entidades con user_id=sub y
  institution.slug=$slug. Cero filas produce 404, sin distinguir causa.
- /me proyecta User(id,email,name), membership(id,active), institución visible y
  sectionMemberships:[] conforme al contrato canónico. Sin SELECT * ni hashes.
- Una nueva operación posterior al COMMIT de revocación usa un snapshot nuevo.
  No se promete cancelar respuestas de consultas iniciadas antes del COMMIT.
- Error de DB produce 503; jamás sustituirlo por lista vacía o autorización previa.

La validación de usuario en guard precede a validación de parámetros protegidos.
El JOIN vuelve a comprobar active para evitar depender solo del guard. Las
operaciones de esta misión son lecturas; no necesitan una transacción de escritura.
No aceptar userId, institutionId, role ni experience como fuente de autorización.

## Estados y transiciones observables

| Cambio persistido externo | Login | Listado siguiente | /me siguiente |
| --- | --- | --- | --- |
| User activo → inactivo | 401 genérico | 401 | 401 |
| Membership activa → inactiva | Sin cambio en identidad | Omite institución | 404 en ese slug |
| Institution activa → inactiva | Sin cambio en identidad | Omite institución | 404 en ese slug |
| Sin memberships activas | Puede autenticar | items=[] | 404 |
| JWT llega a exp | Requiere nuevo login | 401 | 401 |

No se implementa edición de estos estados. Fixtures restauran cambios durante
pruebas en TEST_DATABASE_URL exclusiva. No inferir roles de los nombres demo.

## Datos transitorios

JWT: sub, iat, exp, iss, aud; no contiene email, password, hash ni memberships.
Contadores del limitador: IP observada, ventana y cantidad; sin credenciales,
email ni token. Se borran al reiniciar, no son auditoría ni política multiinstancia.
Los errores operativos registrados contienen categoría sin valores sensibles.
El traceId se genera en la respuesta Problem; no se registra ni correlaciona en logs HTTP.
