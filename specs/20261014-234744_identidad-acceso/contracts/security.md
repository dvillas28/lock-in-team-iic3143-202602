# Contract: Seguridad verificable

## Firma y verificación

- HS256 mediante @nestjs/jwt; algoritmo permitido explícitamente [HS256].
- AUTH_JWT_SECRET base64 canónico de ≥32 bytes aleatorios decodificados; mismo
  material para sign/verify. Ausente, vacío, inválido o corto impide arranque.
- iss exacto academix-api, aud exacto academix-clients.
- sub obligatorio, string UUID existente; iat/exp obligatorios, enteros NumericDate.
- Emitir exp=iat+900. Verificar exp>ahora, iat≤ahora y exp-iat=900; sin tolerancia.
- No aceptar none, otra firma, otro algoritmo, issuer/audience incorrectos,
  claims ausentes, token expirado ni JWT decodificado sin verificar.
- Authorization único Bearer; tamaño máximo de token 4096 bytes. Sin query/cookies.
- Ningún permiso sale del JWT; comprobar usuario activo en DB cada operación.
- No refresh, lista de sesiones ni logout remoto. Rotar secreto invalida todos
  los tokens; inactivar usuario bloquea acceso en la siguiente operación.

Las pruebas controlan reloj o firman fixtures; no esperan 15 minutos. Manipular
claims solo en tests, sin añadir un emisor público de identidades arbitrarias.
No congelar caché de membresías ni roles durante los 900 segundos.

## Contraseñas y límite de intentos

Argon2id existente: verificar el PHC persistido; nunca comparar texto plano.
Para usuario desconocido usar un hash dummy generado una vez al arrancar con los
parámetros del seed (m=19456 KiB, t=2, p=1); usuario inactivo también realiza
verificación antes del mismo 401. No generar un hash en cada petición ni devolver
causa de fallo. La equivalencia de trabajo reduce señales, no promete tiempo constante HTTP.

@nestjs/throttler: limitar solo POST login a cinco solicitudes admitidas por IP
en 60000 ms; sexta y siguientes 429; bloqueo de 60000 ms desde el primer exceso y Retry-After.
Contar éxitos y errores; aplicar antes de consultar usuario o ejecutar Argon2.
Sin bloqueo persistente de cuentas y sin reset por éxito. Concurrencia de seis
peticiones desde misma IP debe admitir como máximo cinco verificaciones.
Configurar ttl=60000 y blockDuration=60000 explícitos. Probar expiración de
ventana y desbloqueo con reloj/almacenamiento controlado, no con sleeps.
El proceso observa req.ip; trust proxy deshabilitado, ignorar X-Forwarded-For.

Límite demo: memoria local y una instancia, reinicio restablece cuotas; proxy/NAT
puede agrupar clientes. Antes de escalar o abrir el servicio al público, validar
proxies confiables y coordinar cuotas entre instancias; no añadir Redis ahora.

## Errores, secretos y fallos

Todas las rutas protegidas fallan cerrado ante DB no disponible (503), token
inválido (401) o contexto no visible (404). No convertir errores en datos vacíos.
Errores de dominio HTTP se serializan a Problem; excepciones inesperadas → 500
sanitizado. Preservar 503 de sondas y no exponer causas del driver/Argon2/JWT.
Logs y assertions no imprimen body, Authorization, tokens, hashes, secretos ni
contraseñas, incluso al fallar. Verificar ausencia capturando stdout/stderr y
respuestas con valores señuelo; no imprimir el contenido sensible al comparar.

## Autorización institucional

Antes de cada lectura unir usuario activo, membership activa e institución
activa por sub y slug. Una consulta iniciada después del COMMIT de revocación
no puede reutilizar la autorización anterior. UC y UTFSM se prueban en ambas
direcciones; misma identidad multiinstitución conserva pertenencias separadas.
Sin cursos, sectionMemberships=[] siempre. Privilegio admin del curso pendiente
en su misión; parámetros role/experience y nombres demo nunca otorgan acceso.
No hay operaciones de escritura sensibles ni auditoría académica nueva aquí.
