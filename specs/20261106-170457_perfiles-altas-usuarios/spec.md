# Feature Specification: Perfiles y altas institucionales

**Feature Branch**: `docs/perfiles-altas-usuarios` (conservada)
**Feature Directory**: `specs/20261106-170457_perfiles-altas-usuarios`
**Created**: 2026-11-06
**Status**: Implementación autorizada; diseño técnico y contratos registrados; evidencia por tarea.
**Input**: Implementar #233–237 en la rama actual; proveedores reales, modos disabled y guías para Daniel.
**Responsables**: Matías implementa; Daniel administra DNS y provisiona fotos. Objetivo: 2–8 noviembre de 2026, sin revalidar capacidad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar mi perfil global (Priority: P1)

Como usuario activo, edito mi nombre visible y descripción y veo mis datos vigentes.
**Why this priority**: Autoservicio de identidad. **Independent Test**: Cuenta existente, incluso sin instituciones; no necesita altas nuevas ni foto.
**Acceptance Scenarios**:

1. **Given** una cuenta activa, **When** guarda nombre/descripción válidos, **Then** actualiza su perfil global y la navegación sin perder trabajo académico abierto.
2. **Given** cambios obsoletos, datos inválidos o campos de privilegios, **When** guarda, **Then** se rechaza sin sobrescribir ni editar otra cuenta.

### User Story 2 - Cambiar mi contraseña (Priority: P1)

Como titular, cambio mi contraseña y retiro el acceso de sesiones anteriores.
**Why this priority**: Control de credenciales. **Independent Test**: Cuenta existente con sesiones en dos instituciones, sin editar perfil ni importar usuarios.
**Acceptance Scenarios**:

1. **Given** contraseña actual correcta y nueva válida, **When** confirma, **Then** la anterior y las sesiones previas dejan de autorizar solicitudes posteriores; debe ingresar nuevamente.
2. **Given** contraseña actual incorrecta o cambio concurrente, **When** intenta cambiar, **Then** recibe error y no se pisa una credencial posterior ni se cierra sesión por un simple error de campo.

### User Story 3 - Gestionar mi foto (Priority: P1)

Como titular, subo, reemplazo o elimino una foto propia que persiste entre accesos.
**Why this priority**: Completar el perfil solicitado. **Independent Test**: Cuenta existente y almacenamiento de prueba; no necesita invitaciones ni cambio de contraseña.
**Acceptance Scenarios**:

1. **Given** una imagen válida, **When** confirma su previsualización, **Then** se muestra como foto global propia; eliminarla devuelve la inicial del nombre.
2. **Given** archivo inválido, permiso ajeno o fallo al guardar, **When** opera, **Then** no cambia otra cuenta y conserva su foto anterior ante fallo de reemplazo.

### User Story 4 - Dar alta y activar acceso institucional (Priority: P1)

Como admin o superadmin activo, invito por nombre/correo a una persona de mi institución.
**Why this priority**: Habilitar altas administradas. **Independent Test**: Institución y administrador existentes; formulario y correo simulado, sin depender de perfil/foto o CSV.
**Acceptance Scenarios**:

1. **Given** permiso vigente, **When** registra un alta, **Then** queda invitación pendiente y estado de correo separado; la cuenta/pertenencia se crea al activar, sin matrícula ni privilegios implícitos.
2. **Given** identidad global existente, **When** su titular acepta autenticado con correo coincidente, **Then** conserva credenciales y otras instituciones y obtiene solo la nueva pertenencia autorizada.
3. **Given** enlace usado/vencido, pérdida de permisos, cuenta/pertenencia revocada o institución ajena, **When** intenta operar, **Then** no amplía acceso ni reactiva registros.
4. **Given** invitación elegible por política de 30 días, **When** ejecuta mantenimiento, **Then** depura datos temporales, conserva evidencia mínima y bloquea nuevos envíos sobre ese registro.

### User Story 5 - Dar altas mediante CSV efímero (Priority: P1)

Como administrador autorizado, valido una lista, reviso errores y confirmo altas con seguimiento.
**Why this priority**: Evitar ingreso repetitivo. **Independent Test**: Misma base de permisos/activación de US4; probar el lote sin usar el formulario individual ni historias de perfil.
**Acceptance Scenarios**:

1. **Given** CSV recibido, **When** valida, **Then** muestra resultado por fila sin crear altas y descarta el archivo; errores impiden confirmar el lote completo.
2. **Given** preview válida/vigente, **When** confirma, **Then** registra invitaciones y recibo una vez; cambio concurrente causa rechazo completo, sin altas parciales.
3. **Given** lote confirmado y correo fallido/cuota agotada/cierre de pestaña, **When** vuelve, **Then** consulta resultados y continúa pendientes autorizados sin duplicar ni revertir el lote.
4. **Given** lote confirmado o expirado hace 7 días, **When** ejecuta mantenimiento, **Then** limpia PII/fingerprint y conserva recibo/FK sin recrear altas por replay ni borrar cuentas.

### Edge Cases

- Una persona pertenece a UC/UTFSM y acumula roles; editar perfil global no copia privilegios ni concede docencia.
- Dos altas por correo normalizado o confirmaciones paralelas no duplican cuenta/pertenencia/evento.
- Un lector automático del enlace no activa; un reenvío explícito invalida el código anterior.
- Aceptación del proveedor, recepción del correo y activación son resultados distintos; una respuesta perdida no prueba fallo ni éxito.
- Archivo vacío, malformado, demasiado grande o cancelado: sin persistencia del original; staging no equivale a activación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda cuenta activa puede consultar/editar únicamente su perfil global, incluso sin pertenencias; nombre visible 1–200 caracteres tras trim y descripción opcional de hasta 500, como texto plano.
- **FR-002**: Correo, estado global, identificadores, roles y flags no son editables desde perfil; detectar edición obsoleta y conservar cambios locales ante error sin pisar otra edición.
- **FR-003**: Cambio de contraseña exige verificar la actual y que nueva/confirmación coincidan; nueva de al menos 12 caracteres y como máximo 128 bytes UTF-8; limitar intentos y conservar login de credenciales heredadas válidas.
- **FR-004**: Cambio efectivo de credencial y evidencia se confirman juntos; invalidar todas las sesiones previas para solicitudes posteriores y resolver cambios/login concurrentes sin sobrescritura silenciosa.
- **FR-005**: Foto propia global permite previsualizar, subir, reemplazar y eliminar; aceptar imagen estática JPEG/PNG/WebP de hasta 2 MiB, normalizada hasta 1024×1024 sin metadatos personales, validando contenido real y límite de píxeles de entrada.
- **FR-006**: Mantener foto anterior ante fallo y recuperar limpieza de objetos huérfanos; foto privada al titular y sin URL arbitraria. Sin configuración, fotos no disponibles sin impedir arranque o funciones académicas.
- **FR-007**: Alta, listado y envío/reenvío requieren usuario/institución/pertenencia activos e isAdmin OR isSuperAdmin del tenant; delegar isAdmin sigue siendo exclusivo de superadmin y promover este último es operativo; no conceder acceso académico.
- **FR-008**: Formulario exige nombre de 1–200 caracteres y correo válido hasta 254; normalizar trim/lower para unicidad global sin revelar otras pertenencias ni modificar identidad existente; esta acepta con su sesión y correo coincidente.
- **FR-009**: Crear invitación no crea cuenta/pertenencia; activación nueva o aceptación existente crea pertenencia sin isAdmin/isSuperAdmin ni matrícula; no reactivar revocados/inactivos ni duplicar pertenencias activas.
- **FR-010**: Código de activación impredecible, de un uso y vigente 24 h desde emisión; verificar institución/emisor autorizados al aceptar, sin confundir estado de correo con permiso de activación.
- **FR-011**: Abrir/consultar enlace no consume ni activa; el titular confirma expresamente. Correo visual/texto identifica AcademiX, institución, enlace y vencimiento sin contraseñas/roles; destino de configuración permitida, nunca arbitrario del solicitante.
- **FR-012**: Emitir/reintentar correo después de registrar el alta; persistir pendiente/en curso/aceptado/fallido/cuota/resultado incierto separados de aceptada/revocada/expirada; no afirmar entrega al buzón sin evidencia. Sin mail configurado, conservar pendientes sin emitir/rotar códigos ni bloquear la aplicación.
- **FR-013**: Reenvío explícito autorizado, confirmado y separado al menos 60 s del último envío genera código nuevo e invalida el anterior; replay o respuestas tardías no rotan ni sobrescriben una operación posterior.
- **FR-014**: CSV UTF-8, BOM opcional, coma y comillas estándar, LF/CRLF, columnas exactas name,email; rechazar extras/duplicados, contraseñas, roles y contexto institucional en el archivo.
- **FR-015**: Limitar importación a 100 filas de datos y 256 KiB; validar filas/cabeceras/valores, ignorar líneas completamente vacías y rechazar archivo vacío, incompleto o malformado con errores por fila.
- **FR-016**: Preview no crea cuenta/pertenencia/invitación; expira en 24 h. Mostrar errores y ya-miembro/ya-pendiente del tenant sin revelar existencia/estado global; errores bloquean todo el lote.
- **FR-017**: Confirmación explícita revalida permisos/precondiciones y aplica el lote atómicamente; conflicto devuelve rechazo completo y nueva preview, sin sobrescribir perfiles ajenos ni reactivar revocados.
- **FR-018**: Conservar recibo autorizado por lote/fila; doble confirmación, timeout o reimportación no duplican altas/eventos ni reenvían; reutilizar identificador para otro contenido se rechaza; informes sin secretos ni fórmulas ejecutables al exportar.
- **FR-019**: Archivo CSV efímero: procesar en memoria acotada y descartar bytes tras parsing, error o cancelación; no conservar original en disco, object storage, DB, logs, caché ni representación codificada equivalente.
- **FR-020**: Despachar correo con progreso después de confirmar el lote; cuota/fallo conserva pendientes y recibo, sin revertir altas. Cerrar pestaña pausa; continuar revalida permisos y omite aceptados/resultados inciertos que requieren reenvío explícito.
- **FR-021**: Auditar cambios efectivos de cuenta, credencial, foto, invitación, pertenencia y lote, con actor/fecha/recurso/evidencia mínima en su frontera global propia o institucional; auditoría inmutable, sin contraseñas, códigos, hashes ni CSV crudo.
- **FR-022**: Autorizar contexto institucional explícito y pertenencia en cada operación, incluso ante identificadores conocidos, roles acumulados o ausencia de filtro interno; perfil global solo propio. Mantener barrera de aislamiento y runtime sin privilegios generales de operador.
- **FR-023**: Conservar cursos, matrículas, roles, intentos, notas, publicaciones e historia previa; esta misión no concede administración de cursos ajenos, docencia o acceso a notas.
- **FR-024**: Formularios, preview y estados accesibles por teclado, foco visible, labels/avisos, ambos temas, contraste 4.5:1 y ancho 375 px; no persistir contraseñas/códigos legibles en aplicación/navegador ni registrar cuerpos sensibles.
- **FR-025**: Limpiar datos personales derivados del CSV a los 7 días de confirmación/expiración y de invitaciones a los 30 de aceptación/revocación/vencimiento; conservar recibos/auditoría mínimos, sin borrar cuentas ni historia académica. Aplicar la política y el default para solicitudes sin primera emisión de [retención](../../docs/planning/perfiles/retencion.md).

### Key Entities *(include if feature involves data)*

- **User y perfil**: identidad global, nombre/descripción/foto propios y credencial; no contiene rol académico global ni tenant único.
- **InstitutionMembership y Enrollment**: pertenencia/flags institucionales y roles de sección existentes; alta no matricula.
- **Invitación y entrega**: institución, destinatario, emisor, vigencia/consumo y estado separado de notificación; datos mínimos para reintento, sin secreto recuperable en claro.
- **Lote y fila de importación**: preview de datos extraídos, validación, resultado, recibo y vínculo con invitación; nunca copia del archivo original.
- **Evento de cuenta o institucional**: evidencia mínima de cambios; identidad/alcance explícitos y sin borrado de historia académica.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cuentas activas de los cinco perfiles y sin pertenencias completan autoservicio propio; cero cambios ajenos o de privilegios en los casos negativos.
- **SC-002**: Cero lecturas/escrituras cruzadas UC/UTFSM y cero ampliaciones académicas por altas o perfil en toda la matriz de permisos/revocación.
- **SC-003**: Todas las sesiones anteriores dejan de autorizar tras cambio confirmado; la cuenta ingresa con la nueva contraseña y conserva registros académicos.
- **SC-004**: Alta nueva, aceptación existente, reintentos y concurrencia dejan una identidad global y como máximo una pertenencia por institución, sin restituir revocados.
- **SC-005**: Lote válido de hasta 100 filas produce el número esperado de invitaciones/omitidas una vez; un error o conflicto deja cero altas parciales.
- **SC-006**: Ningún archivo CSV de éxito/error/cancelación persiste; resultados y recibos se consultan sin secretos ni dependencia del original.
- **SC-007**: Cuota, fallo, reinicio o respuesta incierta conservan el lote y permiten recuperación explícita; cero duplicaciones por replay y ningún accepted se informa como entrega garantizada.
- **SC-008**: Reemplazo fallido conserva foto anterior; eliminación devuelve inicial; controles de formato/tamaño/actor y accesibilidad pasan en ambos temas y 375 px.
- **SC-009**: Todo cambio efectivo tiene evidencia atómica/sanitizada; cero modificaciones de historia académica previa, claves legibles en logs o acceso sin permiso vigente.
- **SC-010**: Mantenimiento depura todos los registros elegibles de una muestra a ambos lados de los cortes 7/30 días, conserva vigentes y recibos/FK, y repetirlo no cambia el resultado ni crea altas/envíos.

## Assumptions

- Reusar identidad/contexto existentes; US1/2/3/4 son verificables sobre cuentas preparadas; US5 reutiliza activación US4 sin exigir su UI individual.
- Adoptar límites de nombre, descripción, CSV, contraseña, foto y vigencia ya propuestos como defaults de esta spec; no confundir vencimiento con limpieza de datos.
- Código y pruebas autorizados; provisión externa y prueba real opt-in dependen de Daniel, sin secretos en Git. Correo fake exclusivamente en tests; desarrollo sin Resend conserva envíos pendientes.
- Matías implementa; Daniel prepara DNS/S3. El objetivo semanal no revalida las 112 h preliminares ni acredita trabajo ejecutado.
- **PEND-01 cerrado**: El usuario delegó elegir un ejemplo; se adopta `AcademiX <no-reply@mail.academix.dvillasc.me>`. Daniel debe verificar control del dominio/DNS antes de enviar; elegir dirección no acredita esa verificación.
- **PEND-02 cerrado**: El usuario aprobó limpieza a 7/30 días. Campos, recibos, operación prevista y default de 30 días desde creación sin primera emisión constan en [retención](../../docs/planning/perfiles/retencion.md); falta implementarlos/probarlos.

## Sources & Traceability

- [Requisitos base y ampliación](../../docs/planning/perfiles/requisitos.md): CU-17–21, RF30–56, RNF11–20; dependencias CU-01/02/04, RF1–12/25/26 y RNF1–4/6/9/10.
- [Matriz completa](traceability.md): FR/SC/historias ↔ CU/RF/RNF ↔ USR-01/02/04/05/08; [backlog](../../docs/planning/perfiles/backlog.md): #233/#234/#235/#236/#237 publicados en Project, Semana 5 E4.
- [Plan técnico](plan.md), [tareas](tasks.md), [modelo técnico](data-model.md), [contratos](contracts/accounts.md) y [validación](quickstart.md).
- [Decisiones y tareas operativas](pending-decisions.md), [checklist](checklists/requirements.md), [modelo](../../docs/planning/perfiles/modelo-datos.md), [CSV](../../docs/planning/perfiles/importacion-csv.md) y [retención](../../docs/planning/perfiles/retencion.md).
- [Identidad](../20261014-234744_identidad-acceso/spec.md), [cursos/roles](../20261014-234844_cursos-roles/spec.md), [Resend](../../docs/adr/resend-for-account-invitations.md), [S3](../../docs/adr/s3-for-profile-photos.md) y [fronteras de cuenta](../../docs/adr/institutional-account-lifecycle.md).
- Excluye: provisión externa automática, cambio de correo, recuperación de contraseña olvidada, borrado de cuenta, perfiles públicos, matrículas/privilegios por CSV, superadmin global, nuevos tenants, material académico binario, workers y entrega garantizada en background.

## Ajuste de validación — 2026-11-08

Matías confirma pruebas manuales de Resend e interfaz y solicita expresamente
no ejecutar Playwright. Se acepta validación manual para los recorridos; no se
acreditan ejecuciones automáticas ni detalles de dispositivos/temas no reportados.
S3 real continúa pendiente. Evidencia y limitaciones en docs/planning/perfiles/evidencia.md.
