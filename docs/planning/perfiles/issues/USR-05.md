# Issue: USR-05 Importar usuarios por CSV con validación, confirmación y envíos

Estado: completada; código validado y aceptación manual reportada por Matías. [#236](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/236).
Registro: 2026-11-06; publicación: 2026-11-07. Responsable: Matías (matiaraos).
Objetivo: Semana 5 E4, 2–8 de noviembre de 2026, America/Santiago; estimación aún preliminar.

Entregar el recorrido CSV completo: plantilla, upload/validación, preview por fila,
confirmación DB atómica/idempotente, recibo, despacho con progreso y reanudación.
Reutilizar las invitaciones y operaciones Resend de USR-04, sin repetir infraestructura.

## Trazabilidad

- ID: USR-05; área principal: FE; tipo: feat; prioridad: P1.
- Estimación: 32 horas-persona; preliminar, sin compromiso de calendario.
- CU: CU-20; RF: RF35–44/47–56; RNF: RNF11–16/18–20.
- Dependencias: [USR-04](USR-04.md).
- Consolidación: USR-05 + USR-06 + coordinación CSV de USR-10 (4 h). El mapa histórico está en el [backlog](../backlog.md).

## Plantilla, validación y vista previa

- [x] UTF-8/BOM opcional, coma y comillas estándar, LF/CRLF; cabeceras exactas name,email, rechazar extras, passwords, roles e identificadores de tenant.
- [x] Propuesta <=100 filas y <=256 KiB, incluso sin Content-Length; parser probado, sin split(',').
- [x] Errores por fila para formato/nombre/email/duplicados normalizados; distinguir ya pertenece/ya pendiente sin revelar otras instituciones.
- [x] Staging normalizado con fingerprint/TTL propuesto de 24 h y RLS; archivo solo en memoria acotada, descartado al procesar/fallar/cancelar, sin temporales en disco/S3/DB ni copia codificada.
- [x] Tabla accesible, resumen y confirmación bloqueada si hay errores; cubrir límites, CSV malformado, UTF-8 inválido y tenant cruzado.

## Confirmación y recibo

- [x] Revalidar permiso administrativo y precondiciones de todas las filas; si cambió clasificación o hay conflicto, rollback completo y 409 para nueva preview.
- [x] Invitaciones + filas + estado/recibo + auditoría confirman en una transacción; ninguna aplicación parcial ni hashes de contraseñas en CSV.
- [x] Confirmación por importId idempotente: doble clic/replay/timeout no duplican invitaciones ni eventos; recuperar mismo recibo por GET autorizado.
- [x] Omitir miembros/invitaciones ya vigentes; no reactivar revocados, sobrescribir perfiles ajenos o asignar roles/flags.
- [x] Informe por fila sin contraseñas, hashes ni códigos; neutralizar fórmulas si se exporta. Probar concurrencia, fallo de fila/auditoría y límites contra timeout real.
- [x] Commit CSV crea invitaciones sin llamar a Resend dentro de transacción; receipt incluye estado de envío por fila para el despacho recuperable.
- [x] Confirmación repetida no reenvía correos; cuota o fallo de proveedor nunca revierte lote confirmado ni implica entrega total garantizada.
- [x] Limpiar PII/fingerprint a los 7 días de confirmación/expiración según [política](../retencion.md); preservar recibos/FK, mostrar datos depurados y rechazar replay mutante sin recrear altas.

## Despacho y reanudación del lote

- [x] CSV coordina solicitudes cortas secuenciales; cierre de pestaña/logout pausa;
  continuar solo pendientes no ambiguos tras revalidar, sin repetir accepted/unknown.

## Límites y validación

User es global; las acciones administrativas son institucionales. No editar
credenciales ajenas, reactivar revocados ni conceder roles/flags implícitos.
Sin cambio de correo, borrado de cuenta, recuperación de contraseña olvidada
ni importación de matrículas. Cada incremento incorpora sus pruebas; USR-08
verifica integración y no permite posponer aislamiento, concurrencia o integridad.

Confirmar DB no garantiza entregar todos los correos: cuota/fallo conservan pendientes.
Continuar exige sesión y permisos vigentes; un resultado unknown necesita reenvío
explícito con código nuevo, sin repetir accepted ni rotar códigos por replay del lote.

## Referencias

[Requisitos](../requisitos.md) · [Backlog](../backlog.md) · [Modelo](../modelo-datos.md)
· [CSV](../importacion-csv.md) · [Resend](../correo-resend.md).

La publicación no acredita implementación, despliegue ni validación externa.

## Validación manual aceptada — 2026-11-08

Matías reporta prueba manual de Resend e interfaz y solicita no ejecutar Playwright.
Se registra como reporte del usuario, no ejecución del agente ni validación de
variantes no desglosadas. [Evidencia y checks finales](../evidencia.md).
