# Feature Specification: Catálogo de endpoints de AcademiX

**Feature Branch**: Propuesta `docs/catalogo-endpoints`; actual `docs/catalogo-endpoints-plan`.
**Feature Directory**: `specs/20261019-121536_catalogo-endpoints`
**Created**: 2026-10-19
**Status**: Planificada; implementación y validación en el siguiente PR.
**Input**: Consultar endpoints con Swagger UI y su formato/estilos estándar, según revisión del usuario del 2026-10-19.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar operaciones disponibles (Priority: P1)

Como integrante de desarrollo, QA o evaluación, quiero abrir un catálogo desde
una dirección estable para conocer las operaciones sin depender del equipo backend.

**Why this priority**: Resuelve el objetivo principal de descubrir qué existe y cómo se usa.
**Independent Test**: Abrir el catálogo sin sesión académica y consultar una operación de cursos, sin ejecutarla.

**Acceptance Scenarios**:

1. **Given** el catálogo publicado, **When** se abre desde otro equipo, **Then** se consulta sin instalar herramientas ni iniciar sesión académica.
2. **Given** distintos dominios, **When** se navega por identidad, instituciones y cursos, **Then** cada ficha muestra método, ruta, propósito, entradas obligatorias y opcionales, respuestas, errores y permisos.
3. **Given** una operación futura, **When** se consulta, **Then** aparece como planificada y no se presenta como disponible.
4. **Given** una ficha, **When** se navega solo con teclado y se amplía texto al 200 %, **Then** conserva contenido, etiquetas comprensibles y foco visible.
5. **Given** el catálogo abierto, **When** se filtran dominios o expanden operaciones, **Then** usa Swagger UI con su presentación estándar; no muestra controles para ejecutar solicitudes.

### User Story 2 - Reproducir ejemplos de uso (Priority: P1)

Como desarrollador o tester, quiero ejemplos de autenticación y consultas para
integrar AcademiX y entender rechazos sin adivinar parámetros ni permisos.

**Why this priority**: Una lista de rutas no basta para aprender a utilizarlas.
**Independent Test**: Seguir ejemplos desde un cliente externo con un entorno y cuentas de prueba preparados; no requiere el portal de US1.

**Acceptance Scenarios**:

1. **Given** credenciales propias de prueba, **When** se sigue la guía, **Then** se completa login, listado de instituciones accesibles y consulta de identidad contextual.
2. **Given** una operación protegida, **When** se consulta su ejemplo, **Then** se identifica credencial, entorno, contexto institucional y permisos; sus valores son ficticios y reemplazables.
3. **Given** token inválido, permisos insuficientes o contexto ajeno, **When** se reproducen esos casos, **Then** se interpretan 401, 403 y 404 según la política vigente, sin acceder a datos ajenos.
4. **Given** student, teacher, assistant, admin y superadmin, **When** se leen sus reglas, **Then** se distinguen roles de sección, administración institucional y propiedad del curso, sin conceder privilegios implícitos.

### User Story 3 - Mantener y publicar un catálogo confiable (Priority: P2)

Como mantenedor, quiero publicar desde el contrato existente para que el catálogo
y los consumidores compartan una descripción coherente entre entregas.

**Why this priority**: Evita un segundo inventario manual y errores de integración.
**Independent Test**: Publicar un contrato de prueba válido y después intentar publicar otro con referencias inválidas, sin datos académicos.

**Acceptance Scenarios**:

1. **Given** un cambio válido, **When** se publica, **Then** la ficha y la descripción descargable reflejan el cambio e identifican su revisión de origen.
2. **Given** una descripción inválida o referencias sin resolver, **When** se publica, **Then** se rechaza con diagnóstico y permanece disponible la versión anterior.
3. **Given** el backend detenido, **When** se abre el catálogo publicado, **Then** se consultan fichas y ejemplos sin leer registros académicos.

### Edge Cases

- El contrato anticipa operaciones futuras: deben distinguirse de las implementadas en la revisión publicada.
- Un slug conocido no acredita pertenencia; cambiar slug o usar identificadores ajenos conserva los rechazos existentes.
- Token expirado o membership revocada: explicar el rechazo sin recomendar eludir autorización.
- Notas no publicadas y pauta restringida: explicar visibilidad por rol sin incluir datos reales.
- Distinguir campos opcionales, anulables, enumeraciones, paginación y límites cuando correspondan.
- Fallo de carga de la descripción: mostrar un error explícito; no presentar una vista parcial como catálogo válido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer una dirección estable de consulta por navegador, sin instalación ni sesión académica, limitada a información pública de integración (US1.1).
- **FR-002**: Cada ficha MUST mostrar dominio, método, ruta, propósito, parámetros y cuerpo con tipos, restricciones y obligatoriedad; respuestas y errores aplicables con formatos y ejemplos (US1.2, US2.3).
- **FR-003**: El catálogo MUST distinguir operaciones implementadas y planificadas e identificar la revisión correspondiente; la clasificación se cotejará con las rutas expuestas realmente en esa revisión (US1.3, US3.1).
- **FR-004**: La guía MUST incluir ejemplos copiables de solicitud y respuesta para login, instituciones accesibles e identidad contextual, con entorno y prerrequisitos explícitos (US2.1–2).
- **FR-005**: Cada operación MUST declarar acceso público o autenticado y condiciones de membership, rol y propiedad; admin y superadmin no conferirán acceso académico implícito (US2.2, US2.4).
- **FR-006**: La guía MUST explicar contexto institucional y política 401/403/404; reproducir ejemplos no permitirá eludir permisos ni aislamiento existentes (US2.3).
- **FR-007**: Los ejemplos MUST ser sintéticos, sin tokens válidos, contraseñas reales, identificadores personales reales, notas reales ni secretos; consultar el catálogo no leerá registros institucionales (US2.2, US3.3).
- **FR-008**: El mantenedor MUST publicar catálogo y descripción descargable procesable por herramientas desde el contrato vigente, sin editar un segundo inventario de operaciones (US3.1).
- **FR-009**: La publicación MUST rechazar descripciones inválidas y referencias no resueltas con diagnóstico, conservando la versión anterior ante fallos (US3.2).
- **FR-010**: La navegación MUST agrupar por dominio, permitir enlaces directos a fichas, acceso por teclado, foco visible, etiquetas comprensibles, ampliación al 200 % y contraste mínimo 4.5:1 (US1.2, US1.4).
- **FR-011**: Consultar el catálogo MUST ser una acción de lectura sin ejecutar solicitudes académicas ni modificar registros; solicitudes reproducidas externamente conservarán auditoría y restricciones originales (US1, US2).
- **FR-012**: El catálogo publicado MUST ser consultable con el backend detenido y mostrar un error explícito si falla la carga de su descripción (US3.3, Edge Cases).

- **FR-013**: El catálogo MUST usar Swagger UI con su formato y estilos oficiales, filtro y expansión de operaciones; sin reemplazar las fichas por HTML propio. Sus assets serán locales y mantendrá deshabilitada la ejecución HTTP y la validación remota. La portada tendrá solo una descripción breve e instrucciones básicas; la guía extensa quedará en documentación operativa (US1.5).

### Key Entities

- **Operación documentada**: Método, ruta, dominio, estado, permisos, entradas, respuestas y ejemplos.
- **Versión del catálogo**: Revisión de origen, disponibilidad declarada y descripción descargable coherente.
- **Ejemplo de uso**: Solicitud y respuesta sintéticas, entorno y prerrequisitos; no es un registro académico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de operaciones implementadas de la revisión publicada tiene ficha completa según FR-002/005; ninguna futura se presenta como disponible.
- **SC-002**: Al menos 4 de 5 lectores de desarrollo o QA localizan una operación asignada y explican sus requisitos de acceso en menos de 2 minutos, sin asistencia.
- **SC-003**: Al menos 4 de 5 lectores completan login y consulta contextual siguiendo solo la guía en menos de 10 minutos, con entorno y cuentas de prueba preparados.
- **SC-004**: El 100 % de ejemplos publicados usa datos sintéticos; los casos de token inválido, permiso insuficiente y contexto ajeno mantienen los rechazos esperados.
- **SC-005**: La publicación de prueba válida refleja el cambio en ficha y descarga; la inválida se rechaza conservando la anterior, en ambos casos de aceptación.
- **SC-006**: Las fichas de identidad y cursos se consultan con backend detenido y pueden recorrerse por teclado y texto al 200 %, sin pérdida de contenido.

## Assumptions

- Audiencia inicial: desarrollo, QA y evaluadores; sin crear cuentas ni roles propios del portal.
- La consulta de contrato y ejemplos sintéticos puede ser pública; las operaciones protegidas mantienen su autenticación.
- Se reutiliza el contrato versionado existente. El usuario exige Swagger UI estándar; versión y publicación se definen en el plan, sin servicios adicionales.
- Alcance inicial: lectura y ejemplos copiables; consola interactiva para ejecutar solicitudes desde el navegador queda excluida.
- Sin cambios a persistencia o historia académica. Solicitudes externas usan la auditoría y reglas de la operación original.
- Admin/non-admin se rige por el ADR vigente; esta misión documenta sus capacidades sin rediseñar pantallas.

## Sources & Traceability

- Origen: solicitud del usuario del 2026-10-19; [contrato vigente](../../docs/reference/openapi/README.md) y [descripción](../../docs/reference/openapi/openapi.yaml).
- CU / RF / RNF: soporte transversal sin CU de negocio nuevo; CU-01–16 según disponibilidad; RF1–6, RF10–12 y RF25–27 para acceso y visibilidad; RNF1/2/6/9. [Fuente](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- Backlog: DOC-01 (SP, JC, MA), DOC-05/07/13/15 (SP), coordinación con FE-01 (JC); conservar responsables. Publicar el portal amplía ese trabajo, sin afirmar que ya exista tarjeta asignada. [Plan](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencias: contrato vigente; [identidad](../20261014-234744_identidad-acceso/spec.md) para ejemplos ejecutables; [cursos y roles](../20261014-234844_cursos-roles/spec.md) para permisos. Otras misiones aportan fichas futuras sin bloquear la consulta inicial.
- Permisos: [ADR de administración y propiedad](../../docs/adr/institution-admin-and-course-ownership.md); tenant y roles explícitos, sin cambios a historia académica.
- Exclusiones: implementar endpoints faltantes, cambiar autenticación o permisos, aprovisionar usuarios, SDK nuevo, consola interactiva, datos reales, rediseño del LMS, nuevos proveedores y despliegue efectivo durante esta especificación.
