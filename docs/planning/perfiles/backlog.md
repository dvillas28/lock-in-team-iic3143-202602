# Backlog trazable: perfiles y altas institucionales

Registro y consolidación: 2026-11-06. **Cinco tareas activas, todas Todo**.
Por instrucción del usuario, **no crear issues remotas ahora**; solo borradores locales.
Requisitos: [CU-17–21, RF30–56 y RNF11–20](requisitos.md), con [Resend elegido](correo-resend.md).
Modelo: [usuarios y relaciones](modelo-datos.md); [contrato CSV](importacion-csv.md).
Formalización: [spec](../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md),
[FR/SC ↔ RF/RNF ↔ USR](../../../specs/20261106-170457_perfiles-altas-usuarios/traceability.md)
y [decisiones PEND-01/02 cerradas](../../../specs/20261106-170457_perfiles-altas-usuarios/pending-decisions.md).

## Convención

Una fila activa = un borrador publicable = un ID estable. USR identifica esta
ampliación; no reemplaza BE/FE/PREP/DOC. IDs absorbidos quedan como referencias
históricas, sin filas activas ni issues adicionales. No renumerar los IDs conservados.
Implementación: **Matías (matiaraos)**. Apoyo: **Daniel, DNS y levantamiento S3**.
Objetivo: **semana del 2 al 8 de noviembre de 2026**, America/Santiago (Semana 5 E3).
Asignación registrada; todas las tareas siguen Todo, sin inicio real acreditado.
El [TSV general](../../deliveries/2/08-work-plan-detail/lock-in-LMS%20-%20Backlog.tsv)
contiene las cinco filas activas y conserva íntegramente sus 131 filas históricas.

## Cinco entregables

| ID / borrador | Entregable | Área / tipo | Prioridad / h | Requisitos | Depende de |
| --- | --- | --- | --- | --- | --- |
| [USR-01](issues/USR-01.md) | Especificación, alcance/ADR, permisos y contratos | DOC / docs | P1 / 6 | CU-17–21; RF30–56; RNF11–20 | Base existente |
| [USR-02](issues/USR-02.md) | Perfil propio completo: datos, contraseña y foto | FE / feat | P1 / 34 | CU-17/18/21; RF30–34/45–47; RNF11/12/14–17 | USR-01 |
| [USR-04](issues/USR-04.md) | Alta individual, activación, Resend y reenvíos | BE / feat | P1 / 32 | CU-19 y base CU-20; RF35–38/47–53/55/56; RNF11/12/14–16/18–20 | USR-01 |
| [USR-05](issues/USR-05.md) | CSV completo: preview, confirmación y envío recuperable | FE / feat | P1 / 32 | CU-20; RF35–44/47–56; RNF11–16/18–20 | USR-04 |
| [USR-08](issues/USR-08.md) | Validación integrada, migraciones, aislamiento y evidencia | BE / test | P1 / 8 | CU-17–21; RF30–56; RNF11–20 | USR-02/04/05 |

Total conservado: **112 horas-persona preliminares**, por revisar contra el objetivo
semanal del usuario. La fecha objetivo no acredita capacidad ni horas reales invertidas.
Agrupar tarjetas no reduce alcance ni esfuerzo: los borradores contienen checklist
por sección. Cada incremento incluye backend, contrato, frontend y pruebas propias;
USR-08 verifica integración sin posponer controles de aislamiento/integridad.
Dentro de USR-02, datos personales, contraseña y foto siguen siendo incrementos
verificables; no hace falta crear una issue por formulario o capa técnica.
USR-02 y USR-04 pueden avanzar por separado tras USR-01: el alta reutiliza la
identidad/auditoría institucional existentes y no queda bloqueada por foto o perfil.

## Mapa de consolidación y esfuerzo

| ID anterior | Destino activo | Tratamiento |
| --- | --- | --- |
| USR-01 | USR-01 | Preparación, 6 h |
| USR-02 | USR-02 | Datos de perfil, 10 h |
| USR-03 | USR-02 | Contraseña, 10 h |
| USR-04 | USR-04 | Alta individual/activación, 16 h |
| USR-05 | USR-05 | CSV/preview, 12 h |
| USR-06 | USR-05 | Confirmación/recibo, 16 h |
| USR-07 | USR-02 | Foto, 14 h |
| USR-08 | USR-08 | Aceptación integrada, 8 h |
| USR-09 | USR-04 | Configuración/plantilla Resend, 8 h |
| USR-10 | USR-04 y USR-05 | Despacho común 8 h; coordinación CSV 4 h |

Los archivos USR-03/06/07/09/10 son referencias de consolidación y **no se
publican como issues independientes**. Sus criterios se trasladaron a las activas.
USR-10 se reparte entre servicio de envío y coordinación por lote, sin duplicar horas.

## Alcance y aceptación por entrega

- **USR-01:** spec por historia con CU/RF/RNF y backlog; reconciliar exclusiones
  de constitución/ADR, admin OR superadmin, activación, Resend elegido, retención,
  S3 elegido, límites CSV y grants/RLS. Archivo CSV efímero confirmado;
  limpieza de datos extraídos a 7/30 días aprobada y remitente Resend elegido;
  [explicación](retencion.md). No implementar durante preparación.
  Spec/constitución 1.6.0 formalizados y decisiones cerradas; falta diseño técnico detallado.
- **USR-02:** cuenta sin memberships edita name/bio/foto y cambia contraseña propia;
  correo/flags no editables, 409 ante edición obsoleta, auditoría atómica y JWT anteriores
  invalidados. Foto valida/procesa y conserva anterior ante fallo; no perder borradores.
- **USR-04:** formulario name/email y lista institucional; activar identidad nueva o
  aceptar con la existente, sin sobrescrituras, Enrollment o flags implícitos. Incluye
  SDK, dominio/remitente, secretos/mapa de orígenes, fake local/CI y plantilla Resend.
  Estado/versión de envío, cuota, reenvío y limpieza de invitaciones a 30 días se prueban sin depender del parser CSV.
- **USR-05:** plantilla UTF-8 name,email, límites/duplicados y preview por fila;
  confirmación DB atómica/idempotente y recibo recuperable. Reutiliza USR-04 para correo,
  con progreso, pausa por cuota y reanudación; limpieza de PII/fingerprint a 7 días. Sin códigos ni reenvío por replay.
- **USR-08:** evidencia API/DB/frontend/navegador por requisito, permisos cruzados,
  revocación, migración poblada, readiness, limpieza 7/30, fallos/carreras y regresión académica.
  Catálogo/guías se actualizan al existir migraciones, sin fingir funcionalidad entregada.

## Enlace con trabajo previo

BE-01/03–08, FE-01/02 y DOC-05 son dependencias de identidad/contexto/cliente.
Bootstrap demo #52 y material CSV #219 no son altas de usuarios ni se reabren.
CSV se procesa transitoriamente y no espera almacenamiento de material; avatar
usa [S3 privado en producción](../../adr/s3-for-profile-photos.md), con Daniel como apoyo,
sin activar todos los binarios académicos. Daniel administra DNS para Resend;
remitente elegido: AcademiX <no-reply@mail.academix.dvillasc.me>; falta verificar/configurar DNS.

## Registro de publicación

Cinco borradores activos, sin números/URLs remotas inventados ni tarjetas de Project.
Matías responsable, Daniel apoya DNS/S3; objetivo semanal registrado. Todo/open,
sin PR vinculada. Usuario autorizó commit/push de documentación y preparar texto de PR;
las issues siguen como borradores locales. No implementar código con esta consolidación.
