# Sesión del navegador en memoria — Issue #80

Fecha: 2026-10-20. Estado: aceptado e implementado para el MVP.

## Contexto

La identidad global usa JWT Bearer por 900 segundos, sin renovación ni revocación
individual en el backend. Los permisos institucionales se consultan en cada solicitud.
El frontend App Router necesita un ciclo de sesión sin introducir cookies ni compartir
credenciales entre peticiones del servidor, pestañas o subdominios.

## Decisión

Una instancia `Session` por `SessionProvider` conserva el JWT únicamente en memoria.
No se escribe en localStorage, sessionStorage, cookies, URLs o logs. Los snapshots React
contienen estado y datos autorizados, nunca el token ni la contraseña.
El formulario limpia el campo de contraseña después del envío.
Recargar, cerrar o abandonar el documento exige autenticarse nuevamente; cambiar entre
rutas internas conserva la sesión. Cada subdominio y pestaña tiene su propia sesión.

Decodificar claims permite fijar el vencimiento local conservador; no verifica firma
ni autoriza. `/institutions` confirma la aceptación del JWT y `/me` autoriza el contexto.
El plazo máximo se cuenta desde el inicio del login y se limita por `exp`.
Una generación identifica cada intento/identidad. Logout cancela solicitudes y aumenta
la generación; respuestas, errores y cuerpos tardíos de otra generación se descartan.
Cada operación captura sus credenciales; nunca lee el token de una identidad posterior.

Los datos privados se consumen en cliente mediante `session.request`. Los componentes
servidor contienen estructura pública solamente: el guard visual no protege cargas
privadas ejecutadas en un Server Component. No añadir cargas privadas allí sin una
arquitectura de autenticación de servidor expresamente diseñada.

## Consecuencias y límites

Memoria reduce la persistencia accidental y evita compartir el token entre orígenes.
No impide que JavaScript malicioso/XSS lea memoria o actúe con la sesión abierta.
La interfaz no renderiza HTML del backend ni interpreta nombres/errores como markup.
Se descarta sessionStorage porque prolonga la exposición tras recarga sin necesidad
actual; localStorage y cookies requieren decisiones distintas que este MVP no necesita.
No hay SSO entre UC/UTFSM ni sincronización de logout entre pestañas independientes.
Logout local no revoca el JWT: una copia conserva validez hasta expirar o rotar el secreto.
El navegador limita presentación y navegación; el backend verifica firma, usuario,
institución, membresía y permisos en cada operación. No se cachea autorización.
El backend integrado desde dev aplica RLS y el prefijo API institucional singular;
esta decisión de almacenamiento del navegador no altera esos controles.

Operación, pruebas y configuración: [guía](../guides/login-session.md).
