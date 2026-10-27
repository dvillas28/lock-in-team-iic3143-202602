# DEP-FE-SEARCH-001: Búsqueda institucional de participantes

**Estado**: cerrada en `fix/experiencia-academica` (2026-10-26).
**Implementación**: commit `3d665e6`, backend y consumidor frontend.
**Evidencia**: [QA con API real](../../../docs/qa/experiencia-academica/README.md).

## Contrato verificado

- GET `/api/v1/institution/{institutionSlug}/users`, con Bearer, search y cursor/limit.
- Identidad, institución y membership activas; teacher activo en la institución.
- UserSummary + PageInfo; sin coincidencias retorna 200 vacío, sin inventar éxito
  para errores de servicio o permisos.
- Solo usuarios y memberships activas del tenant; SQL parametrizado y coincidencia
  literal por nombre/correo. Admin/superadmin sin teacher no adquieren directorio.
- Cursor vinculado a institución, actor y texto; límites contractuales 1–100.

## Criterios de cierre

1. Handler registrado en InstitutionsController y ParticipantSearchService.
2. `backend/test/integration/participant-search.test.mjs` prueba HTTP real,
   PostgreSQL runtime, paginación, roles, Unicode, literales y errores.
3. La misma prueba verifica aislamiento UC/UTFSM y revocación/inactividad.
4. Navegador con frontend y API real devuelve una persona, permite seleccionar
   su rol existente y confirma asignación idempotente sin duplicar matrícula.
   Capturas desktop/móvil y matriz enlazadas en la evidencia.

Los informes de 2026-10-22 en la spec original describen el estado histórico
anterior a este cierre; sus mocks no se usan como prueba de disponibilidad runtime.
