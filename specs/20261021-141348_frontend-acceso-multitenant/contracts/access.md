# Contract: Acceso y navegación institucional

## Orígenes

Configuración pública `NEXT_PUBLIC_INSTITUTION_ORIGINS`, JSON objeto origin→slug,
validada según [modelo](../data-model.md). Default solo si variable ausente:

```json
{"https://uc.academix.dvillasc.me":"uc","https://utfsm.academix.dvillasc.me":"utfsm"}
```

Configuración local explícita, tanto dev como build Docker:

```json
{"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}
```

No regex de sufijo, wildcard, detección por puerto implícito ni tenant por defecto.
Origin desconocido, localhost, 127.0.0.1 y ::1 sin contexto muestran orientación a
los hosts locales configurados; no habilitan formulario ni fetch privado.
Origin completo se resuelve en cliente; SSR solo entrega estructura pública.

## Rutas visibles y navegación

| Ruta | Comportamiento |
| --- | --- |
| `/` | Página pública existente; acceso a login y estado público, sin datos privados |
| `/login` | Credenciales globales solo en origin válido; al éxito next seguro o `/courses` |
| `/courses` | Sin sesión → login?next=%2Fcourses; con sesión → /me del origin antes del shell |
| `/institutions` | Redirección a `/courses`, sin selector ni listado institucional |
| `/institutions/{slug}` | Mismo slug que origin → replace `/courses`; distinto → rechazo sin contexto |
| Otra ruta | 404; no autoriza ni se convierte en retorno implementado |

El login en dominio UTFSM no usa el primer tenant del directorio ni exige selector.
Retornos: aceptar solo valor exacto `/courses` o `/institutions`; ausente, repetido,
URL externa, protocol-relative, backslash, slug legacy, query/hash o encoding residual
usan `/courses`. URLSearchParams decodifica una vez; no ejecutar decodeURIComponent
adicional. `?next=%2Finstitutions` acepta `/institutions`;
`?next=%252Finstitutions` conserva `%2Finstitutions` y cae en `/courses`.
Parámetros `next` repetidos se rechazan aunque sus valores coincidan.
Ningún destino depende de parámetros role/admin ni concede acceso.
Navegación interna usa router/Link y conserva sesión. No hay selector ni enlace de
instituciones (corrección explícita de producto, 2026-10-21). Abrir el dominio de otra
institución crea documento independiente sin transportar token, contraseña ni identidad.
`next=/institutions` se admite por compatibilidad y redirige finalmente a `/courses`.
Homes académicos teacher/student y sus cursos/secciones pertenecen a la siguiente misión.

## API existente (sin cambios)

| Operación | Método y ruta | Uso |
| --- | --- | --- |
| login | POST `/api/v1/auth/login` | Credenciales validadas; sin Bearer |
| listAccessibleInstitutions | GET `/api/v1/institutions` | JWT global; lista propia activa |
| getCurrentUser | GET `/api/v1/institution/{institutionSlug}/me` | JWT + slug del dominio; contexto activo |

DTOs y estados exactos: [OpenAPI](../../../docs/reference/openapi/openapi.yaml).
No consultas académicas antes de `/me`; todo consumidor privado usa Session.request.
La firma, pertenencia y permisos los valida backend por cada operación, con RLS.
No compartir clientes autenticados servidor, ni añadir credentials include o cookies.

## Errores, vigencia y concurrencia

- 400/413/415: mensaje seguro de entrada; 401 de login no enumera cuentas.
- 401 autenticado/vencimiento: logout y login con retorno seguro; ningún dato anterior.
- 403/404: rechazo seguro, sin contexto autorizado ni información de existencia.
- 429: respetar Retry-After existente, bloquear simultáneos y permitir reintento tras espera.
- 503/red/timeout/respuesta inválida: feedback recuperable, sin Problem interno;
  ocultar contexto anterior. Ninguna mutación se reintenta automáticamente.
- Logout offline es local; no revoca una copia del JWT en backend.
- Token solo en memoria ≤900 s; abort/timeout y validación de generación al completar
  respuesta/cuerpo, incluso errores. Requests anteriores nunca toman token posterior.

## CORS y separación browser/servidor

CORS_ALLOWED_ORIGINS usa array JSON exacto. Producción mantiene ambos origins HTTPS;
local permite explícitamente los dos origins `http://*.localhost:3000` enumerados arriba,
sin usar el asterisco en configuración. No modificar lógica backend ni aceptar cookies.
Probar OPTIONS de POST login (Content-Type), GET /me (Authorization), y OPTIONS de
`/api/v1/institution/{slug}/sections/{sectionId}/quizzes/{quizId}/attempts`,
con Access-Control-Request-Method: POST y Access-Control-Request-Headers:
Authorization, Content-Type, Idempotency-Key. Usar UUIDs de fixture y enviar solo OPTIONS;
no crear intentos ni escrituras académicas. Probar también header no permitido.
Verificar Access-Control-Allow-Origin exacto, Vary: Origin y ausencia de credentials.
En API real comprobar Access-Control-Expose-Headers para Location/Retry-After.
Para demostrar lectura JS sin crear intentos, usar servidor HTTP efímero de prueba
local con respuesta controlada 200, Location y Retry-After conocidos: con exposición
explícita ambos son legibles; sin ella response.headers.get devuelve null.
Es evidencia del navegador, no del handler académico real; no añadir endpoints runtime.
El procedimiento y valores esperados se fijan en [quickstart](../quickstart.md).
Un origin denegado carece de autorización CORS; puede recibir respuesta HTTP que el
navegador no entrega a JS. Node fetch sin Origin no está sujeto a CORS y sigue requiriendo
JWT/pertenencia. API_URL servidor y NEXT_PUBLIC_API_URL browser conservan separación.

## UI verificable

Leer [DESIGN.md](../../../DESIGN.md), [mapa de mockups](../../../mockups/README.md) y
[guía integrada](../../../docs/guides/frontend-styles.md) antes de modificar vistas.
Fuentes canónicas: `mockups/assets/tokens.css` y `mockups/assets/app.css`;
consumir sus copias integradas en `frontend/src/styles/`, importadas una vez por layout.
Reusar clases de shell, formularios, botones y estados; sin duplicar CSS compartido.
Colores/radios/sombras/métricas usan tokens existentes; spacing conserva grilla 4/8
y clases compartidas (no existe escala completa --space-*). Sin colores hardcodeados.
Si cambia una base compartida, sincronizar ambas copias preservando fuentes Next/alias.
Mantener Inter/EB Garamond, Lucide y badge de institución validada.
Carga, vacío, error, reintento y rechazo no muestran identidad/contexto anterior.
Labels, toggle de contraseña anunciado, errores con aria-live y foco al mensaje;
loading/busy sin envíos dobles, recorrido por teclado y foco visible. Medir contraste
≥4.5:1 en ambos temas; probar 375 px y reduced motion. Sin rediseño de mockups ni
controles de cursos/admin antes de la misión siguiente.
