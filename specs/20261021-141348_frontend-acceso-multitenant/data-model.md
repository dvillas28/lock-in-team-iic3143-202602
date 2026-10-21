# Data Model: Acceso frontend por dominio

Modelo de cliente efímero; no tablas, migraciones ni copias de datos académicos.
Tipos de API siguen en `frontend/src/lib/api/schema.d.ts` y validadores existentes.

## Configuración de orígenes

`InstitutionOrigins`: mapa público de origin canónico a InstitutionSlug.

| Campo derivado | Fuente | Validación |
| --- | --- | --- |
| origin | window.location.origin | Coincidencia exacta en tabla; esquema, host y puerto incluidos |
| requestedSlug | Tabla de configuración | isInstitutionSlug; no sale de path/headers/correo |

Configuración presente: JSON objeto no vacío; keys deben ser origins canónicos sin
userinfo, path, query ni hash. HTTPS para hosts remotos, HTTP solo para hosts locales
explícitos. Cada slug tiene un solo origin en el build; destinos ambiguos invalidan la tabla.
El contrato de configuración es un objeto con claves de origin únicas; no se necesita
un parser JSON nuevo ni tolerancia a configuraciones ambiguas.
Ausencia usa tabla HTTPS productiva explícita; error de configuración bloquea acceso.
No persistir el origin como prueba de pertenencia ni aceptar aliases implícitos.

## Sesión (existente)

- Propiedades privadas: JWT, subject, expiresAt, timer y AbortControllers.
- Snapshot: status anonymous/authenticating/authenticated, generation, retryAt,
  message, institutions, directoryError y context opcional.
- Contraseña solo vive en input/body transitorio; limpiar input después de submit.
- authenticated confirma identidad global; no implica contexto autorizado.
- expiresAt = mínimo entre exp real y comienzo de login +900 segundos.
- Cada request captura token/generation; toda finalización verifica vigencia/generación.

## Contexto institucional (existente, fuente adaptada)

- `slug`: requestedSlug resuelto desde origin configurado.
- `user`: CurrentUser validado contra subject y slug, membership activa e institución activa.
- `error`: feedback seguro, nunca Problem interno ni identidad previa.
- `/me` aporta institutionMembership (isAdmin/isSuperAdmin) y sectionMemberships;
  no se convierte el rol en permiso adicional. Directorio no sustituye esta consulta.
- Guard monta children solo con contexto de esa generación y slug autorizado.

## Destino

- Interno: `/courses`; `/institutions` solo redirige por compatibilidad, sin selector.
- Otro dominio: acceso directo crea documento independiente y exige login, sin selector.
- `next`: un único valor exacto de allowlist; inválido/ausente cae en `/courses`.
- Legacy: slug solo se compara con requestedSlug; igualdad permite redirect `/courses`.

## Transiciones

| Evento | Resultado |
| --- | --- |
| Origin desconocido o configuración inválida | Sin formulario habilitado ni requests autenticadas |
| Login válido + directorio válido | authenticated, aún sin datos institucionales |
| /me válido | Contexto autorizado; monta shell e inicio |
| /me 403/404 o membership inválida | Retira contenido/contexto autorizado; muestra rechazo seguro |
| /me red/503/respuesta inválida | Oculta contenido anterior; reintento explícito |
| Logout, 401, vencimiento, pagehide | Borra credenciales/datos, aborta, incrementa generation |
| Nueva identidad | Nueva generation; ninguna respuesta anterior puede modificarla |
| Cambio de dominio / recarga / nueva pestaña | Nueva Session anonymous; requiere login |
| Foco / pageshow / visible | Comprobar vencimiento y revalidar /me antes de reutilizar contenido |

## Integridad y límites

No se modifica historial académico, permisos, membresías ni registros de auditoría.
403/404 no revelan existencia; el directorio verifica identidad y no se presenta como
selector. Revocación se detecta en próxima revalidación/operación;
no hay push ni promesa de borrado inmediato en una pestaña suspendida.
