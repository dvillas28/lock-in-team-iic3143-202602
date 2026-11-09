# Issue: USR-04 Dar alta y activar usuarios con Resend y reenvíos

Estado: completada; código validado y aceptación manual reportada por Matías. [#235](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/235).
Registro: 2026-11-06; publicación: 2026-11-07. Responsable: Matías (matiaraos); apoyo: Daniel (dvillas28).
Objetivo: Semana 5 E4, 2–8 de noviembre de 2026, America/Santiago. Daniel administra DNS.

Entregar alta individual por admin/superadmin, lista institucional, invitación y
activación, con Resend, configuración por entorno, plantilla y reenvíos recuperables.
La entrega común de correo queda lista para que la importación CSV la reutilice.

## Trazabilidad

- ID: USR-04; área principal: BE; tipo: feat; prioridad: P1.
- Estimación: 32 horas-persona; preliminar, sin compromiso de calendario.
- CU: CU-19 y base de correo para CU-20; RF: RF35–38/47–53/55/56; RNF: RNF11/12/14–16/18–20.
- Dependencias: [USR-01](USR-01.md); reutiliza identidad y auditoría institucional existentes.
- Consolidación: USR-04 + USR-09 + despacho común de USR-10 (8 h). El mapa histórico está en el [backlog](../backlog.md).

## Formulario, pertenencia y activación

- [x] Autorizar membership activa e isAdmin OR isSuperAdmin del tenant en cada operación; ampliar lectura de memberships a admin, manteniendo course-admin exclusivo de superadmin.
- [x] Código aleatorio de un uso, hash almacenado, expiración/revocación; revalidar al aceptar que emisor conserva alguno de los permisos de alta.
- [x] Nuevo titular define contraseña; cuenta global existente exige su login/correo coincidente y conserva nombre, credenciales y otras pertenencias.
- [x] Unicidad normalizada, concurrencia/reintentos y auditoría atómica; no reactivar cuentas/memberships revocadas ni revelar existencia global.
- [x] Crear membership sin flags ni Enrollment; enviar enlace por Resend después del commit, sin código en UI admin, informes o logs. Incluir UI/API/contrato/tests.
- [x] Estado de correo separado de activación; GET no consume; primer despacho sin tokens persistidos en claro; reenvíos incluidos en esta issue.
- [x] Limpieza de PII/hash/fingerprint a 30 días según [política](../retencion.md), incluido default sin emisión; preservar recibos/FK, probar carreras y rechazar envío/replay tras depurar.

## Integración Resend y configuración

- [x] SDK `resend` instalado con pnpm al implementar, detrás de un servicio simple;
  fake verificable sin internet, claves ni logs de enlaces sensibles.
- [x] Variables backend para modo, API key, remitente y mapa de orígenes por slug;
  no NEXT_PUBLIC ni secretos en código; producción exige resend y configuración válida.
- [x] Dominio/remitente verificables con DNS; clave de solo envío; guía de operación
  local/Render. Remitente elegido: AcademiX <no-reply@mail.academix.dvillasc.me>; Daniel verifica DNS.
- [x] Plantilla HTML/texto con nombre escapado, institución, enlace y vencimiento;
  sin contraseñas, notas, roles, tracking ni recursos externos.
- [x] Enlace a origen permitido: HTTP local explícito, HTTPS productivo; sin Host,
  Origin o body como autoridad; fragmento a memoria/POST y GET sin efecto.
- [x] Cliente con timeout, clasificación de cuota/rate y resultado provider ID;
  aceptado por Resend no se muestra como entregado ni activado.
- [x] Pruebas de configuración/plantilla/cliente fake; prueba manual real opt-in
  consume cuota. Nunca enviar desde CI ni provisionar recursos en esta preparación.

## Envío, cuota y recuperación

- [x] Persistir delivery_status/version/key, ID proveedor, intentos y fechas/error
  permitido en account_invitations; hash/expiración null hasta primer despacho.
- [x] send/resend exigen admin OR superadmin vigente del tenant; reclamar operación
  bajo lock, llamar red después del commit y aplicar resultado solo a su versión.
- [x] Sin código en DB, DTO administrativo, log o informe; token solo en memoria
  durante composición y en correo al titular. Historial sanitizado institucional.
- [x] Reintentar mismo cuerpo/clave dentro de ejecución acotada usa idempotencia
  Resend; persistir resultado. Tras perder código o resultado, marcar unknown,
  sin reconstrucción ni reenvío automático con el mismo identificador.
- [x] Reenviar requiere confirmación, otra clave y código/versión nuevos; invalida
  anterior, cooldown propuesto 60 s y lease de sending antes de permitir otra operación.
- [x] Diferenciar cuota global diaria/mensual y rate limit; conservar pendientes;
  un CSV de 100 no promete margen de cuota. No revertir confirmación por fallo de email.
- [x] Cubrir carreras, respuesta tardía tras revocación/reenvío, error DB al guardar
  resultado, reinicio, expiración de 24 h y errores de Resend; sin workers/cola externa.

## Límites y validación

User es global; las acciones administrativas son institucionales. No editar
credenciales ajenas, reactivar revocados ni conceder roles/flags implícitos.
Sin cambio de correo, borrado de cuenta, recuperación de contraseña olvidada
ni importación de matrículas. Cada incremento incorpora sus pruebas; USR-08
verifica integración y no permite posponer aislamiento, concurrencia o integridad.

Se verifica con formulario e invitaciones preparadas, sin depender del parser CSV.
La coordinación del progreso por lote y su reanudación desde UI pertenecen a USR-05.
Sin workers/cola externa ni confirmación de entrega al buzón sin webhook.

## Referencias

[Requisitos](../requisitos.md) · [Backlog](../backlog.md) · [Modelo](../modelo-datos.md)
· [CSV](../importacion-csv.md) · [Resend](../correo-resend.md).

La publicación no acredita implementación, despliegue ni validación externa.

## Validación manual aceptada — 2026-11-08

Matías reporta prueba manual de Resend e interfaz y solicita no ejecutar Playwright.
Se registra como reporte del usuario, no ejecución del agente ni validación de
variantes no desglosadas. [Evidencia y checks finales](../evidencia.md).
