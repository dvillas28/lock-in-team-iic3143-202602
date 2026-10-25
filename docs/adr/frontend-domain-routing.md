# ADR: Rutas frontend limpias y dominio institucional exacto

Fecha: 2026-10-21. Estado: implementado y probado localmente; validación HTTPS pública pendiente.
Misión: [acceso frontend](../../specs/20261021-141348_frontend-acceso-multitenant/plan.md).

## Contexto

#124 implementa sesión en memoria y URLs `/institutions/{slug}`. El nuevo flujo
requiere dominio institucional con rutas visibles limpias, también en desarrollo.
La [decisión de API/RLS](institution-context-and-database-isolation.md) se conserva:
backend autoriza por slug de ruta y membership; Host/Origin nunca conceden acceso.

## Decisión

- Resolver origin completo del navegador contra una tabla exacta pública origin→slug.
- NEXT_PUBLIC_INSTITUTION_ORIGINS configura esa tabla al construir; si falta, defaults
  explícitos UC/UTFSM HTTPS. Si está presente e inválida, bloquear sin fallback.
- Desarrollo configura `http://uc.localhost:3000` y `http://utfsm.localhost:3000`.
  Localhost/loopback desnudo no obtiene contexto desde URL ni tenant predeterminado.
- Rutas visibles: `/login`, `/institutions` (compatibilidad sin contenido) y `/courses` (inicio protegido).
- Origin propone slug; `/api/v1/institution/{slug}/me` valida antes de contenido privado.
  Login y directorio propio permanecen globales; roles y RLS no cambian.
- Corrección de producto del usuario (2026-10-21): sin selector ni enlace de instituciones.
  `/institutions` solo redirige a `/courses`; cada dominio requiere login independiente.
- Evolución solicitada el 2026-10-25: se permite únicamente un directorio público en
  la raíz del portal Render. Esta excepción no es un selector de pertenencias ni
  modifica `/institutions`, el login, las rutas privadas o la autorización.
- Navegación interna conserva Session; cambio de origin abandona documento y pide login.
  Nunca transportar JWT, contraseña ni identidad por URL, cookies o almacenamiento.
- Retorno limitado a rutas internas implementadas; legacy mismo dominio redirige a
  `/courses`, otro slug rechaza. Nuevos enlaces no incluyen prefijo institucional.
- CORS mantiene origins exactos y API central; sin proxy, middleware ni SSR autenticado.

## Consecuencias

Adaptar helpers, provider, guard, compatibilidad de rutas, shell, layouts, pruebas, build args y guías.
Conservar la [ADR de memoria](browser-session-in-memory.md), incluyendo generación,
abort, expiración ≤900 s y cargas privadas solo mediante Session.request en cliente.
Los Server Components entregan estructura pública; un guard visual no protege su fetch.
La configuración pública no es un secreto ni prueba de pertenencia. Cambiarla exige rebuild.
No hay SSO, refresh ni logout remoto. Revocación se detecta por próxima operación/revalidación.
La compatibilidad antigua se limita a redirigir/rechazar sin seleccionar tenant desde path.
No se modifica DNS, despliegue, backend runtime ni historial académico.

## Alternativas descartadas

Wildcard/sufijo libre y default tenant permiten contexto no configurado. Path legacy
como selector contradice URLs limpias. Cookies/proxy/SSO agregan arquitectura sin requisito.
Mantener una tabla pública pequeña usada por el resolver satisface el alcance.

## Entrada pública por dominio — 2026-10-25

- `NEXT_PUBLIC_PORTAL_ORIGIN` configura un único origin público exacto al construir;
  ausente usa `https://academix-frontend-2ixy.onrender.com`, presente e inválido bloquea
  el portal sin fallback. Se propaga por Dockerfile, Blueprint y Compose.
- La raíz resuelve en cliente desde el origin del SessionProvider: portal muestra
  landing; UC/UTFSM hacen `router.replace('/login')`; desconocidos rechazan.
  Servidor y primera hidratación muestran solo un estado neutro, también en login.
- La landing enlaza nombres públicos UC/UTFSM a `/login` en los origins obtenidos
  de la tabla institucional validada. Sin ambos destinos, rechaza sin enlaces.
  No acepta destinos desde query/input ni consulta health, institutions, me o datos privados.
- Los origins del portal y de instituciones son disjuntos: una colisión invalida
  la tabla institucional completa. Render y localhost/loopback desnudo nunca se
  admiten como tenant, incluso si se incluyen por error en la configuración.
- Portal `/login` no muestra credenciales ni envía login; sus rutas privadas
  rechazan sin `/me`. CORS institucional permanece igual, sin añadir el portal.
- `/` responde HTTP 200 con estructura neutra sin backend, compatible con el
  healthcheck de Render. La redirección institucional ocurre tras hidratar.
- Local requiere portal `http://localhost:3000` explícito y los dos origins
  `http://uc.localhost:3000` / `http://utfsm.localhost:3000` institucionales.
  La selección pública no concede permisos ni transporta credenciales o sesión.
- Sin backend, DNS, SSO, cookies, persistencia o cambios de auditoría académica.
  Guía, pruebas y límites: [landing pública](../guides/public-landing.md).

## Validación requerida

Dos dominios locales y HTTPS, memberships cruzadas/revocadas, retornos adversariales,
sesiones independientes, respuestas tardías, CORS browser/servidor y accesibilidad.
Véanse [contrato](../../specs/20261021-141348_frontend-acceso-multitenant/contracts/access.md)
y [quickstart](../../specs/20261021-141348_frontend-acceso-multitenant/quickstart.md).
