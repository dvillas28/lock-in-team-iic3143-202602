# DEP-FE-SEARCH-001: Búsqueda institucional de participantes

**Estado**: pendiente; bloquea aceptación real completa de US3 y FR-011.
**Entrega requerida**: backend separada; no forma parte de la implementación frontend.
**Responsable de ejecución**: por asignar por el equipo; sin issue remoto creado.
**Consumidores**: [spec](../spec.md), tareas T002/T028/T030/T033 de [tasks](../tasks.md).

**Reverificación local**: 2026-10-22; AppModule y backend/src siguen sin handler.
Pruebas frontend/browser usan fixtures; ningún criterio de cierre real se satisface.

## Brecha comprobada

searchInstitutionUsers está declarado en
[platform.yaml](../../../docs/reference/openapi/paths/platform.yaml), pero no tiene
handler registrado en backend. Fixtures permiten desarrollar y probar el consumidor;
no prueban disponibilidad ni autorización real. US1/US2 pueden entregarse por separado.

## Contrato a cumplir

- GET `/api/v1/institution/{institutionSlug}/users`, con Bearer, search y cursor/limit.
- Identidad, institución y membership activas; búsqueda reservada a teacher autorizado.
- Respuesta UserSummary + PageInfo y errores según OpenAPI existente.
- Sin usuarios ajenos, invitaciones ni ampliación a admin/superadmin sin teacher.

## Criterios de cierre

1. Vincular aquí el commit o PR backend que implemente el contrato existente.
2. Registrar pruebas de búsqueda/paginación con teacher y rechazo de perfiles sin permiso.
3. Registrar aislamiento UC/UTFSM y rechazo ante membership o usuario revocado/inactivo.
4. Ejecutar búsqueda desde frontend contra API real y adjuntar evidencia en
   [quickstart](../quickstart.md); un 404 de ruta ausente nunca cuenta como lista vacía.

T002 verifica estado y T033 exige estos criterios antes de declarar US3 completa.
No marcar cerrada por generar tipos, pasar mocks ni disponer únicamente de OpenAPI.
