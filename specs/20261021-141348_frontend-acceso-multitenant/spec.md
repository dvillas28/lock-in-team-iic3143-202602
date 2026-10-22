# Feature Specification: Acceso frontend y multitenancy por dominio

**Feature Branch**: `feat/frontend-acceso-multitenant`
**Feature Directory**: `specs/20261021-141348_frontend-acceso-multitenant`
**Created**: 2026-10-21
**Status**: Verificado localmente; validación HTTPS pública pendiente
**Corrección de producto 2026-10-21**: sin selector de instituciones. `/institutions`
redirige a `/courses`; homes académicos teacher/student pertenecen a la próxima misión.
**Input**: Adaptar el acceso existente a dominios institucionales y rutas visibles limpias.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingresar al contexto del dominio (Priority: P1)

Como usuario de UC o UTFSM, quiero ingresar desde mi dominio y ver solo mi institución.
**Why this priority**: Establece identidad y contexto para todas las vistas privadas.
**Independent Test**: Login y validación de pertenencia con dos tenants, sin cursos implementados.
**Acceptance Scenarios**:
1. **Given** dominio UC, **When** ingreso con pertenencia activa, **Then** veo inicio UC en `/courses`, sin slug visible.
2. **Given** usuario de ambas instituciones, **When** ingreso desde UTFSM, **Then** se valida UTFSM sin selector obligatorio.
3. **Given** usuario exclusivo UC en UTFSM, **When** ingreso, **Then** no se muestra contenido UTFSM ni se elige UC silenciosamente.
4. **Given** dominio desconocido, **When** abro login o una ruta privada, **Then** veo contexto no disponible sin enviar credenciales.

### User Story 2 - Mantener una sesión acotada y recuperable (Priority: P1)

Como usuario, quiero conocer cuándo debo autenticarme y cerrar sesión sin dejar datos visibles.
**Why this priority**: Evita cruces entre usuarios y respuestas tardías de sesiones anteriores.
**Independent Test**: Sesión con reloj y red controlados, respuestas tardías y backend no disponible.
**Acceptance Scenarios**:
1. **Given** sesión activa, **When** navego internamente, **Then** la conservo; al recargar o abrir otra pestaña debo autenticarme.
2. **Given** sesión vencida o 401, **When** consulto, **Then** se limpian datos privados y se solicita login con retorno seguro.
3. **Given** solicitudes en vuelo, **When** cierro sesión o cambio de usuario, **Then** sus resultados no reaparecen ni usan credenciales posteriores.
4. **Given** contraseña incorrecta, 429 o red caída, **When** ingreso, **Then** recibo mensaje seguro y recuperación sin envíos simultáneos.

### User Story 3 - Navegar entre instituciones y entrar directamente (Priority: P2)

Como usuario multiinstitución, quiero abrir el dominio institucional y sus enlaces internos sin exponer contexto en el path.
**Why this priority**: Completa CU-01 y permite desarrollo equivalente a producción.
**Independent Test**: Dos hosts locales explícitos, enlaces directos y retornos manipulados con fixtures.
**Acceptance Scenarios**:
1. **Given** otro dominio configurado, **When** lo abro, **Then** inicio sesión independientemente; no existe selector ni token en URL.
2. **Given** enlace directo a una ruta protegida del dominio, **When** ingreso, **Then** vuelvo solo a un destino interno implementado y autorizado.
3. **Given** `uc.localhost:3000` y `utfsm.localhost:3000`, **When** repito el acceso, **Then** se solicitan respectivamente UC y UTFSM sin prefijo institucional.
4. **Given** localhost sin contexto o path legacy de otro tenant, **When** navego, **Then** no se infiere institución desde ese path ni se concede acceso.

### Edge Cases

- Tenant inactivo, pertenencia revocada, directorio vacío y pertenencia revocada durante una solicitud.
- Host con sufijo engañoso, puerto/alias no configurado, dominio desconocido y retorno externo/codificado.
- JWT vencido mientras pestaña está suspendida; logout offline; respuestas tardías de login/directorio/me.
- 400/401/403/404/413/415/429/503, Retry-After, respuesta inválida y CORS sin cabecera permitida.
- Navegación atrás, recarga profunda y dominios simultáneos con sesiones independientes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Resolver contexto solo desde dominio reconocido/configurado del frontend; desconocidos no envían credenciales ni usan tenant por defecto.
- **FR-002**: Mantener `/login` y `/courses` limpios; `/institutions` solo redirige a `/courses`, sin selector.
- **FR-003**: Traducir el contexto a `/api/v1/institution/{institutionSlug}/...` en API central; login y directorio propio siguen globales.
- **FR-004**: Exigir identidad y pertenencia activa mediante `/me` antes de datos privados; el backend autoriza cada operación y mantiene RLS.
- **FR-005**: Reutilizar validación de credenciales y sesión vigentes; no agregar registro público, refresh, logout remoto ni credenciales persistentes.
- **FR-006**: JWT solo en memoria, máximo 900 segundos según vigencia real; recarga/nuevo documento requiere login, navegación interna conserva sesión.
- **FR-007**: Logout/401/expiración limpian identidad, contexto y datos; cancelar/descartar respuestas antiguas y nunca compartir sesión entre usuarios, pestañas o dominios.
- **FR-008**: No escribir JWT/contraseña en URLs, cookies, almacenamiento persistente o logs; logout local no implica revocación individual backend.
- **FR-009**: No mostrar selector ni enlace para elegir institución. Abrir otro dominio exige nuevo login, sin transportar tokens ni asumir SSO.
- **FR-010**: Retornos aceptan solo rutas internas implementadas del dominio actual; recurso no autorizado conserva rechazo backend y no revela existencia.
- **FR-011**: Desarrollo debe reproducir ambos tenants con `uc.localhost:3000` y `utfsm.localhost:3000`; configurar resolución y orígenes explícitos sin afectar producción.
- **FR-012**: Localhost/loopback sin contexto muestra orientación hacia hosts locales configurados, sin usar slug de path ni institución predeterminada.
- **FR-013**: Conservar CORS por orígenes exactos, sin cookies de API; probar preflight con Authorization/Content-Type/Idempotency-Key y exposición Location/Retry-After según operación.
- **FR-014**: Probar UC/UTFSM HTTPS y local, origen denegado sin autorización CORS, consumo browser/servidor diferenciado; CORS no reemplaza autenticación.
- **FR-015**: Mantener carga/vacío/error, 401 limpia sesión, 403/404 retiran contexto y 429 respeta espera; no exponer Problem interno ni reintentar mutaciones automáticamente.
- **FR-016**: Eliminar links/retornos nuevos con `/institutions/{slug}`; accesos legacy del mismo dominio pueden redirigir a `/courses`, otro slug se rechaza sin elegir tenant.
- **FR-017**: Inventariar adaptación de `institutionHomePath`, navegación/host resolver, compatibilidad `/institutions`, guard/shell, layouts, tests de sesión/UI y guías de login; conservar sus garantías de concurrencia.
- **FR-018**: Datos privados usan la sesión vigente; no cargarlos en servidor mediante un guard únicamente visual ni compartir clientes autenticados entre solicitudes.
- **FR-019**: Teclado, foco al error, labels, mensajes anunciados, contraste ≥4.5:1, móvil 375 px, ambos temas y movimiento reducido. Reutilizar el sistema visual vigente: paleta, tipografía, espaciado y componentes compartidos, sin rediseño ni estilos duplicados.
- **FR-020**: Pruebas cubren dos tenants, usuario multiinstitución, revocación, host/path adversarial y separación por generación; sin modificar historial académico.

### Key Entities

- **Contexto institucional**: Dominio reconocido, slug solicitado y pertenencia activa autorizada.
- **Sesión**: Identidad global, vigencia y generación; credenciales efímeras por documento.
- **Destino**: Ruta interna implementada o dominio configurado de institución accesible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: UC y UTFSM completan ingreso y apertura directa con cero slugs en rutas visibles, enlaces y retornos nuevos.
- **SC-002**: El 100 % de casos desconocido/sin pertenencia/revocado carece de datos institucionales privados.
- **SC-003**: Logout, expiración y cambio de usuario dejan cero datos de la sesión anterior tras procesar respuestas tardías.
- **SC-004**: Los tres recorridos —ingreso, retorno directo y apertura de otro dominio— son operables por teclado en móvil/escritorio y ambos temas.

## Assumptions

- Se reutiliza #124 y la ADR de memoria: no se solicita persistencia entre recargas ni SSO.
- `/courses` puede mostrar estado de integración pendiente hasta misión 2; no inventar cursos.
- Los hosts locales son contrato de pruebas; el plan define configuración/resolución efectiva.

## Sources & Traceability

- CU-01/02, RF1–9/25 y RNF1–4/7/9: [Entrega 2](../../docs/deliveries/2/03-use-cases-and-requirements.md).
- FE-01–04, FE-20 (JC/MA), #80/#124 como base reutilizable: [backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
- Dependencias: [fundación](../20261021-135729_fundacion-frontend/spec.md), [login vigente](../../docs/guides/login-session.md),
  [sesión](../../docs/adr/browser-session-in-memory.md), [OpenAPI](../../docs/reference/openapi/openapi.yaml).
- Operaciones existentes: `login`, `listAccessibleInstitutions`, `getCurrentUser`; mockups 01 parcial/02/10.
- Sistema visual: [DESIGN](../../DESIGN.md), [mapa de mockups](../../mockups/README.md),
  [integración frontend](../../docs/guides/frontend-styles.md); fuentes canónicas en `mockups/assets/`.
- Exclusiones: DB directa, cambios backend, registro/invitaciones, SSO, refresh, cookies compartidas, gestión institucional general y vistas académicas.
