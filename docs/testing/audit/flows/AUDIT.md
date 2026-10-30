# Funcionalidades AUDIT

Evidencia: [audit.service.ts](../../../../backend/src/audit/audit.service.ts); [course-audit.tsx](../../../../frontend/src/components/audit/course-audit.tsx); [grade-audit-visibility.md](../../../../docs/adr/grade-audit-visibility.md).
Permisos comunes: Teacher secciones históricas; owner administrativos; owner+teacher curso completo con grade; sin permiso para student/assistant/SA solo.
Estados: Evento append-only; visibilidad revalidada al leer según rol vigente y sección histórica; cursor scoped.

## FL-AUDIT-01 — Consulta histórica sanitizada y filtros
- Requisito: CU-13; RF26; RNF1/3/9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses/{C1}/audit`.
- Endpoints/operaciones: listCourseAuditEvents; resolver path/método en [API](../API.md).
- Roles: Teacher secciones históricas; owner administrativos; owner+teacher curso completo con grade; sin permiso para student/assistant/SA solo.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, HISTORY, HISTORY+PUBLISHED, MARKDOWN, PAGES, PAGES+FAULT, REVOKE+PAGES, WRITE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Evento append-only; visibilidad revalidada al leer según rol vigente y sección histórica; cursor scoped.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [AUDIT](../../catalog/AUDIT.md); cada ficha precisa pasos y persistencia.
