# Research: Cursos y participación frontend

Fuentes: checkout local del 2026-10-21; investigación del flujo y contratos existentes.
No se cambia stack ni se requieren fuentes externas para fijar estas decisiones.

## 1. Reutilizar acceso y cliente existentes

- Decision: Next/React, openapi-fetch y `Session.request`; UI cliente bajo ProtectedInstitution.
- Rationale: ya resuelven token capturado, timeout, 401, generación y contexto institucional.
  El directorio actual es un placeholder; no hay flujo de cursos que duplicar.
- Alternatives considered: fetch directo, BFF, store global o nueva librería; innecesarios.
- Evidence: `frontend/src/lib/auth/session.ts`, `frontend/src/lib/api/client.ts`,
  `frontend/src/components/auth/protected-institution.tsx`, `frontend/package.json`.

## 2. Roles contextuales y ownership

- Decision: capacidades visuales desde `/me` y Course.createdBy; backend decide cada operación.
  No inferir dueño desde CourseSummary, que no contiene createdBy.
  isSuperAdmin no implica isAdmin ni teacher; múltiples roles se conservan.
- Rationale: la ADR implementada resuelve la discrepancia de los mockups históricos.
- Alternatives considered: perfil admin/no-admin por URL o teacher implica admin; rechazados.
- Evidence: `docs/adr/institution-admin-and-course-ownership.md`,
  `backend/src/courses/course-access.ts`, `docs/reference/openapi/paths/courses.yaml`.

## 3. Alta atómica y respuesta perdida

- Decision: POST de curso recibe initialSection y devuelve solo Course; consultar
  listSections y `/me` después. No enviar owner ni Enrollment inicial desde cliente.
  Tras error de transporte, marcar resultado incierto y consultar antes de repetir.
- Rationale: backend crea curso/sección/teacher en transacción; repetición puede dar 409.
- Alternatives considered: respuesta compuesta ficticia, rollback local, retry automático;
  ninguno está respaldado por el contrato.
- Evidence: `backend/src/courses/courses.service.ts`, esquemas `courses.yaml`.

## 4. Gestión y búsqueda autorizadas

- Decision: gestión solo para admin dueño o teacher de sección. Assistant no abre esta
  superficie ni dispara listado, aunque la API permite su consulta de participantes.
  Búsqueda exige teacher activo institucional; dueño sin teacher usa UUID conocido.
- Rationale: FR-007/011 restringen la experiencia sin pedir modificar API.
- Alternatives considered: ampliar búsqueda a admin, usar directorio superadmin o
  búsqueda automática como fallback; violan alcance o permisos existentes.
- Evidence: `docs/reference/openapi/paths/{platform,sections}.yaml`,
  `backend/src/enrollments/enrollments.service.ts`.
- Hallazgo: `/users` solo está declarado en OpenAPI; no hay handler registrado en
  `backend/src/app.module.ts` ni implementación en backend/src. Es dependencia externa
  pendiente, no aclaración de producto. US3 usa fixtures para desarrollar, pero no
  satisface búsqueda real hasta resolver [DEP-FE-SEARCH-001](dependencies/participant-search.md)
  en una entrega backend separada. No usar 404 como lista vacía.

## 5. Historia, multirol y paginación

- Decision: claves por Enrollment.id; POST admite 200 de rol ya activo y 201 de alta.
  PATCH envía exactamente role o active. Un cambio puede devolver sucesor con otro ID;
  recargar historial sin eliminar origen. Revocar último teacher está permitido.
  Usar cursor opaco, limit 1–100 y hasMore/nextCursor para listas paginadas.
- Rationale: no hay DELETE ni unicidad por persona; varios roles distintos coexisten.
- Alternatives considered: editar por userId, asumir ID estable o ocultar historia; incorrectos.
- Evidence: esquemas `sections.yaml`, `common.yaml` y operación updateSectionEnrollment.

## 6. Ciclo de vida y validación

- Decision: sin caché privada ni persistencia browser. Invalidar al perder contexto;
  usar secuencia y cleanup por recurso además de generación de sesión.
  Usar node:test/tsx y jsdom ya instalados, con navegador para foco y diseño reales.
- Rationale: Session cubre cambio de identidad, pero dos solicitudes de recursos de
  la misma sesión pueden finalizar fuera de orden; fixtures permiten entrega independiente.
- Alternatives considered: confiar solo en desmontaje, optimistic updates o instalar runner;
  no garantizan integridad o agregan infraestructura innecesaria.
- Evidence: `frontend/src/lib/auth/session.ts`, `frontend/test/auth-ui.test.ts`.

## Resultado

Sin NEEDS CLARIFICATION pendientes; búsqueda runtime pendiente de backend externo.
Contratos y límites se consolidan en
[contracts/courses-participation.md](contracts/courses-participation.md).
