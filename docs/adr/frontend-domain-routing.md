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

## Validación requerida

Dos dominios locales y HTTPS, memberships cruzadas/revocadas, retornos adversariales,
sesiones independientes, respuestas tardías, CORS browser/servidor y accesibilidad.
Véanse [contrato](../../specs/20261021-141348_frontend-acceso-multitenant/contracts/access.md)
y [quickstart](../../specs/20261021-141348_frontend-acceso-multitenant/quickstart.md).
