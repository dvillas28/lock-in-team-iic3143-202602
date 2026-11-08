# Issue: USR-02 Gestionar perfil propio, contraseña y foto

Estado: issue publicada / implementación autorizada. [#234](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/234).
Registro: 2026-11-06; publicación: 2026-11-07. Responsable: Matías (matiaraos); apoyo: Daniel (dvillas28).
Objetivo: Semana 5 E4, 2–8 de noviembre de 2026, America/Santiago. Daniel provisiona S3.

Entregar Mi perfil, Seguridad y foto para cuenta propia global, incluso sin memberships.
Incluye API, migraciones aditivas, auditoría, sesión, UI y pruebas. Datos personales,
contraseña y foto siguen siendo incrementos verificables dentro de la misma issue.

## Trazabilidad

- ID: USR-02; área principal: FE; tipo: feat; prioridad: P1.
- Estimación: 34 horas-persona; preliminar, sin compromiso de calendario.
- CU: CU-17/18/21; RF: RF30–34/45–47; RNF: RNF11/12/14–17.
- Dependencias: [USR-01](USR-01.md).
- Consolidación: USR-02 + USR-03 + USR-07. El mapa histórico está en el [backlog](../backlog.md).

## Datos personales

- [ ] Nombre visible de 1–200 caracteres tras trim y bio de hasta 500, como texto plano; correo solo lectura.
- [ ] Rechazar userId, active, email, roles y flags; un admin nunca modifica la cuenta global de otra persona.
- [ ] Control de concurrencia: edición obsoleta devuelve 409; actualización y evento global mínimo son atómicos.
- [ ] Proteger ruta con sesión global sin exigir /me institucional; actualizar nombre/avatar del shell sin perder borradores académicos.
- [ ] Migración aditiva, OpenAPI/parsers, estados y accesibilidad; pruebas propias y aislamiento, sin modificar notas, intentos ni matrículas.

## Contraseña y revocación de sesiones

- [ ] Verificar contraseña actual y limitar intentos; propuesta nueva >=12 caracteres y <=128 bytes UTF-8 sin invalidar credenciales heredadas por su longitud.
- [ ] Hash nuevo, incremento de versión y evento sin secretos confirman en una transacción; controlar cambios concurrentes.
- [ ] JWT anteriores fallan en solicitudes de cuenta y académicas de UC/UTFSM; cerrar sesión local y solicitar login nuevamente.
- [ ] Contraseña actual incorrecta genera error de campo, reservando 401 para sesión inválida; claves fuera de snapshots/logs/auditoría.
- [ ] Cubrir carrera login/cambio y pruebas API/DB/frontend; no introducir Redis, refresh ni contraseñas en claro.

## Foto de perfil

Proveedor confirmado: [S3 privado en producción](../../../adr/s3-for-profile-photos.md),
local en desarrollo. Daniel prepara infraestructura/configuración y Matías integra.

- [ ] Propuesta JPEG/PNG/WebP <=2 MiB y procesado <=1024×1024; validar firma, decodificación y límite de píxeles de entrada, quitar metadatos.
- [ ] Rechazar SVG/animados/archivos suplantados y URL arbitraria; JSON conserva 4096 bytes, excepción binaria solo en ruta propia.
- [ ] Acceso inicial exclusivo del titular, clave global por userId; no base64 en PostgreSQL ni disco efímero de contenedor.
- [ ] Fallo de subida/DB conserva foto anterior; cambio auditado y limpieza operativa recuperable de objetos nuevos/anteriores.
- [ ] DTO no expone claves internas; permisos, UI accesible, pruebas de persistencia/redeploy y de lectura/escritura ajena.

## Límites y validación

User es global; las acciones administrativas son institucionales. No editar
credenciales ajenas, reactivar revocados ni conceder roles/flags implícitos.
Sin cambio de correo, borrado de cuenta, recuperación de contraseña olvidada
ni importación de matrículas. Cada incremento incorpora sus pruebas; USR-08
verifica integración y no permite posponer aislamiento, concurrencia o integridad.

## Referencias

[Requisitos](../requisitos.md) · [Backlog](../backlog.md) · [Modelo](../modelo-datos.md)
· [CSV](../importacion-csv.md) · [Resend](../correo-resend.md).

La publicación no acredita implementación, despliegue ni validación externa.
