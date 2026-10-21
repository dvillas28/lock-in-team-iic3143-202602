# Research: Fundación del frontend

Fecha: 2026-10-21. Fuentes locales y metadata GitHub de #124; sin probar servicios de producto remotos.

## Partición en seis capacidades

**Decision**: Una US por spec hijo: acceso, cursos/participación, contenido,
autoría, rendición y notas/seguimiento con auditoría.
**Rationale**: Autoría y rendición tienen actores/riesgos distintos; auditoría
comparte contexto y actores con seguimiento docente.
**Alternatives considered**: Tres specs acumulan demasiados flujos; siete separan
auditoría sin necesitar entrega independiente para este MVP.

## Contexto institucional

**Decision**: Rutas visibles sin slug; dominio reconocido resuelve contexto
frontend y el consumidor construye el path institucional del backend.
**Rationale**: Cumple la aclaración del usuario sin cambiar autorización ni RLS.
**Alternatives considered**: Exponer `/institutions/{slug}` contradice lo acordado;
resolver tenant backend solo por Host/Origin contradice el contrato vigente.

No se exige middleware, rewrite, proxy ni mecanismo específico.
US1 debe definir desconocidos/local/alias y pertenencia antes de su propio plan.

## Sesión y comunicación entre orígenes

**Decision**: Reutilizar sesión en memoria de #124, integrada en dev `ee4a329`.
Recargar, abrir documento o cambiar de dominio requiere login; no cookies ni SSO.
Exigir expiración, logout, CORS y cambio de dominio sin fuga de credenciales.
**Rationale**: La ADR aceptada ya resuelve almacenamiento; solo adaptar navegación.
**Alternatives considered**: Asumir sesión compartida inventa comportamiento;
prescribir un intermediario agrega arquitectura sin evaluar el flujo.

## Precedencia de permisos

**Decision**: Contrato vigente y ADR admin/ownership prevalecen sobre coordinador,
perfiles del mockup y equiparación histórica de admin a teacher.
**Rationale**: Admin dueño administra curso/secciones sin Enrollment docente,
pero no adquiere pauta, contenido docente ni notas por ese privilegio aislado.
Superadmin no implica isAdmin ni acceso académico.
**Alternatives considered**: Copiar controles del prototipo ampliaría permisos.

## Orden y validación

**Decision**: Redacción independiente con fixtures; implementación futura ordenada
por acceso → cursos → contenido/autoría → rendición → seguimiento.
**Rationale**: No hay que implementar backend otra vez ni bloquear redacción por UI.
**Alternatives considered**: Dependencias de redacción por pantalla bloquean
revisión sin aportar garantías adicionales.

RLS/runtime siguen siendo responsabilidad backend; las specs frontend exigen
consumo correcto, ausencia de datos cruzados y recuperación ante revocación,
sin inventar migraciones frontend.

## Evidencia local y brechas

- [Backlog](../../docs/deliveries/2/08-work-plan-detail/08-work-plan-detail.md):
  FE-01–20 y responsables JC/MA; FE-02 requiere transición desde slug visible.
- [Mockups](../../mockups/README.md): 16 vistas; 09/PDF no representa binarios disponibles.
- [Admin/ownership](../../docs/adr/institution-admin-and-course-ownership.md):
  prevalece sobre la descripción histórica del README de mockups.
- [Contexto](../../docs/adr/institution-context-and-database-isolation.md): API central,
  slug explícito, pertenencia activa y CORS por orígenes exactos.
- [Cliente](../../docs/guides/frontend-api-client.md) y
  [login](../../docs/guides/login-session.md): piezas reutilizables; guard/sesión ya integrados.
- [ADR de memoria](../../docs/adr/browser-session-in-memory.md): no persistir credenciales;
  #124 adapta API singular, pero conserva rutas visibles por slug que esta misión sustituirá.

Sin incógnitas bloqueantes de alcance fundacional. US1 especifica rutas limpias,
destinos y hosts locales; su plan definirá mecanismos sin cambiar límites de sesión.
