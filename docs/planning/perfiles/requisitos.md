# Requisitos: perfiles y altas institucionales

Registro: 2026-11-06. Actualizado: 2026-11-07; implementación autorizada y verificación por tareas.
Extiende [CU-01–16, RF1–29 y RNF1–10](../../deliveries/2/03-use-cases-and-requirements.md).
Trazabilidad: [backlog y borradores de issues](backlog.md); diseño: [modelo](modelo-datos.md).
Invitación/activación y Resend son decisiones del usuario; [correo](correo-resend.md).
Límites CSV/imagen, vigencia y visibilidad adoptados en el spec; formulario/CSV y admin son pedidos explícitos.
S3 privado en producción confirmado, Daniel provisiona; Matías implementa en semana 2–8 noviembre.
Archivo CSV efímero y limpieza de derivados a 7/30 días aprobados: [política](retencion.md).
Remitente elegido: AcademiX <no-reply@mail.academix.dvillasc.me>; Daniel debe verificar DNS.
[Spec formal y FR/SC](../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
con [trazabilidad completa](../../../specs/20261106-170457_perfiles-altas-usuarios/traceability.md).

## Casos de uso nuevos

| ID | Actor | Resultado |
| --- | --- | --- |
| CU-17 | Usuario activo | Consultar y editar nombre visible/descripción propios, sin exigir institución |
| CU-18 | Usuario activo | Cambiar contraseña propia e invalidar sesiones anteriores |
| CU-19 | Admin o superadmin institucional | Dar alta por formulario en su institución y consultar pendientes |
| CU-20 | Admin o superadmin institucional | Validar CSV, revisar filas y confirmar altas múltiples |
| CU-21 | Usuario activo | Consultar, subir, reemplazar y eliminar su foto |

Crear usuarios significa registrar altas pendientes de activación por el titular;
se conserva la identidad global si ya existe. No implica matrícula en un curso.

## Requisitos funcionales nuevos

| ID | Regla verificable | CU |
| --- | --- | --- |
| RF30 | GET/PATCH de cuenta propia global; actor derivado de JWT, sin userId editable | 17 |
| RF31 | Nombre visible 1–200 caracteres y bio opcional ≤500; texto plano y control de edición obsoleta | 17 |
| RF32 | Perfil no acepta email, active, roles ni flags; conserva identidad/matrículas/historia | 17 |
| RF33 | Cambio propio exige contraseña actual; valida nueva sin almacenar valores en claro | 18 |
| RF34 | Cambio atómico de hash, versión de credencial y evento; JWT anteriores dejan de autorizar | 18 |
| RF35 | Alta por formulario con name/email exige membership activa e isAdmin OR isSuperAdmin vigente del tenant | 19 |
| RF36 | Nueva cuenta se activa por código de un uso; cuenta existente acepta con su propia sesión | 19,20 |
| RF37 | Email normalizado único global; nunca sobrescribir contraseña/nombre ajenos ni reactivar revocados | 19,20 |
| RF38 | Lista institucional distingue miembros activos y altas pendientes sin revelar otras instituciones | 19,20 |
| RF39 | CSV UTF-8 con columnas exactas name,email; no admite contraseñas, roles ni identificadores de tenant | 20 |
| RF40 | Validar cabeceras, formato, límites, filas vacías, correo/nombre y duplicados normalizados | 20 |
| RF41 | Vista previa por fila con estados/errores y resumen; no crea cuentas, memberships ni invitaciones | 20 |
| RF42 | Confirmación explícita de lote validado, vigente, sin errores; revalida permisos y duplicados en DB | 20 |
| RF43 | Confirmación atómica e idempotente; no aplica parcialmente; repetir lote no duplica altas/eventos | 20 |
| RF44 | Informe institucional por fila y totales, recuperable tras timeout sin repetir ni recuperar códigos secretos | 20 |
| RF45 | Foto propia: previsualizar, subir/reemplazar/eliminar y volver a inicial; sin URL arbitraria | 21 |
| RF46 | Validar/reprocesar imágenes; referencia global por titular y persistencia fuera del contenedor | 21 |
| RF47 | Cambios de perfil/contraseña/foto y altas se auditan con scope correcto y datos mínimos | 17–21 |
| RF48 | Altas crean memberships sin flags; roles por sección/delegación administrativa son acciones separadas | 19,20 |
| RF49 | Invitaciones expiran/revocan; aceptación revalida permiso admin OR superadmin del emisor activo | 19,20 |
| RF50 | Enviar invitaciones con Resend por HTTPS desde backend, después del commit de creación | 19,20 |
| RF51 | Correo HTML/texto identifica AcademiX/institución, enlace y vencimiento, sin contraseñas ni roles | 19,20 |
| RF52 | GET del enlace no activa; confirmar por POST con token de un uso, origen permitido y sin secretos en logs | 19,20 |
| RF53 | Persistir estado de envío separado de activación; API accepted no se presenta como entregado/activado | 19,20 |
| RF54 | CSV muestra progreso/cuota y permite continuar pendientes sin duplicar ni revertir el lote confirmado | 20 |
| RF55 | Reenvío administrativo explícito rota código/versión; controla cooldown, carreras e idempotencia | 19,20 |
| RF56 | Limpiar PII derivada del CSV a los 7 días e invitaciones a los 30 según política; conservar recibos mínimos/FK sin eliminar cuentas o historia académica | 19,20 |

## Requisitos no funcionales nuevos

| ID | Restricción verificable |
| --- | --- |
| RNF11 | Escrituras de identidad acotadas; runtime sin owner/BYPASSRLS ni credenciales de operador HTTP |
| RNF12 | Invitaciones, lotes y filas tienen institution_id, RLS y FK compuestas; perfil global solo propio |
| RNF13 | CSV: ≤100 filas/256 KiB y preview de 24 h; confirmación DB síncrona, correo posterior por solicitudes cortas; sin workers/colas |
| RNF14 | Secretos fuera de logs/reportes/auditoría; archivo CSV solo en memoria, sin disco/S3/DB/caché y descartado tras parsing, incluso ante error |
| RNF15 | Formularios y preview accesibles por teclado, foco/labels/aria-live, ambos temas y móvil 375 px |
| RNF16 | Pruebas de migración, aislamiento UC/UTFSM, revocación, concurrencia, rollback y reintentos |
| RNF17 | Propuesta foto JPEG/PNG/WebP ≤2 MiB; procesado ≤1024×1024; limitar píxeles de entrada y limpiar huérfanos |
| RNF18 | Resend Free: 100 correos/día UTC y 3.000/mes compartidos; distinguir cuota agotada de rate limit |
| RNF19 | Llamadas de correo fuera de transacciones; reintento de mismo cuerpo/clave y resultado incierto recuperable |
| RNF20 | Fake solo tests; Resend real opt-in con DNS/secretos/orígenes. Sin configuración externa: integración disabled/503 sin bloquear app ni /ready; producción nunca local/fake |

RNF13 debe validarse con el timeout transaccional actual; reducir lote si la
medición lo exige. Los tiempos no se resuelven agregando una cola por anticipación.
RNF12 explicita la excepción global de cuenta propia; RNF17 no habilita material binario académico.

## Matriz de permisos de la ampliación

| Acción | Usuario activo | isAdmin | isSuperAdmin |
| --- | --- | --- | --- |
| Editar perfil/contraseña/foto propia | Sí | Sí | Sí |
| Alta formulario/CSV y ver lotes propios del tenant autorizado | No | Sí | Sí |
| Delegar/revocar isAdmin | No | No | Sí, endpoint existente |
| Conceder isSuperAdmin por frontend | No | No | No; operativo |
| Cambiar credenciales/globales de otra persona | No | No | No |

Los flags son independientes. isSuperAdmin puede dar altas sin tener isAdmin;
ninguno concede automáticamente docencia, ownership de cursos ajenos ni acceso a notas.
RF35 amplía la propuesta inicial que reservaba altas solo a superadmin.
La consulta de memberships debe ampliar explícitamente su permiso para admin;
el endpoint course-admin conserva su requisito exclusivo de superadmin.

## Criterios de aceptación transversales

- Cuenta sin memberships edita lo propio; un administrador nunca edita la cuenta global de otro.
- Admin UC crea altas en UC; no puede usar un lote, fila o membership de UTFSM.
- Formulario y CSV generan la misma invitación/activación; sin passwords por defecto.
- CSV con un error no produce altas parciales; corregirlo requiere una nueva vista previa.
- Dos confirmaciones del mismo lote producen un resultado y una sola auditoría efectiva.
- Si una fila cambia entre preview/confirmación, se rechaza el lote completo y se pide revalidar.
- Código vencido/usado, pérdida de permisos o membresía revocada no amplían acceso.
- Cambiar contraseña invalida tokens previos en todos los tenants; conserva notas e intentos.
- Fallo/cuota del correo conserva invitación; reanudar CSV no reenvía accepted ni unknown automáticamente.
- Reenvío invalida enlace anterior; GET/scanners no consumen el nuevo. Fake no envía correos reales.

Cuotas verificadas: [Resend](https://resend.com/docs/knowledge-base/account-quotas-and-limits).
Diseño de entrega, expiración e idempotencia: [plan Resend](correo-resend.md).

## Exclusiones y dependencias

Sin cambio de correo, borrado de cuenta, recuperación de contraseña olvidada,
importación de matrículas, promociones por CSV, creación de instituciones ni directorio público.
Dependencias existentes: BE-01/03–08, FE-01/02 y DOC-05; no se reabren como trabajo nuevo.
La constitución 1.6.1 y [ADR de cuenta](../../adr/institutional-account-lifecycle.md)
registran la extensión. El [plan técnico](../../../specs/20261106-170457_perfiles-altas-usuarios/plan.md) guía implementación; pruebas reales pendientes se registran aparte.
