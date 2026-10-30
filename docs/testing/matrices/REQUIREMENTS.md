# Requisitos → flujos → casos

Fuente normativa: [CU/RF/RNF E2](../../deliveries/2/03-use-cases-and-requirements.md).
P = cobertura planificada; no ejecutada. Una celda lista casos representativos más expansiones de matrices.
Todo RF implementado tiene referencia; RF15 excluido por alcance explícito. RNF no verificables con E2E se justifican.

| Requisito | Funcionalidad | Flujo(s) / casos | Prioridad | Estado |
| --- | --- | --- | --- | --- |
| RF1 | Identidad y sesión | FL-AUTH-01 [E2E-AUTH-001](../catalog/auth-01.md#e2e-auth-001), FL-AUTH-02 [E2E-AUTH-017](../catalog/auth-04.md#e2e-auth-017) | P0 | P |
| RF2 | Instituciones accesibles | FL-TENANT-01 [E2E-TENANT-001](../catalog/tenant-01.md#e2e-tenant-001), FL-AUTH-01 [E2E-AUTH-008](../catalog/auth-02.md#e2e-auth-008) | P0 | P |
| RF3 | Dos tenants bootstrap | FL-OPS-01 [E2E-OPS-004](../catalog/ops-01.md#e2e-ops-004), FL-TENANT-01 [E2E-TENANT-007](../catalog/tenant-02.md#e2e-tenant-007) | P0 | P |
| RF4 | Path institucional explícito | FL-TENANT-01 [E2E-TENANT-003](../catalog/tenant-01.md#e2e-tenant-003), FL-TENANT-01 [E2E-TENANT-004](../catalog/tenant-01.md#e2e-tenant-004) | P0 | P |
| RF5 | Slug/membership activa | FL-TENANT-01 [E2E-TENANT-004](../catalog/tenant-01.md#e2e-tenant-004), FL-TENANT-01 [E2E-TENANT-005](../catalog/tenant-01.md#e2e-tenant-005) | P0 | P |
| RF6 | Dominio no concede acceso | FL-PUBLIC-02 [E2E-PUBLIC-004](../catalog/public-01.md#e2e-public-004), FL-TENANT-01 [E2E-TENANT-003](../catalog/tenant-01.md#e2e-tenant-003) | P0 | P |
| RF7 | Identidad multiinstitución | FL-TENANT-01 [E2E-TENANT-002](../catalog/tenant-01.md#e2e-tenant-002), FL-TENANT-01 [E2E-TENANT-006](../catalog/tenant-02.md#e2e-tenant-006) | P0 | P |
| RF8 | institution_id persistido | FL-TENANT-02 [E2E-TENANT-008](../catalog/tenant-02.md#e2e-tenant-008), FL-OPS-01 [E2E-OPS-006](../catalog/ops-02.md#e2e-ops-006) | P0 | P |
| RF9 | Relaciones compuestas | FL-TENANT-02 [E2E-TENANT-010](../catalog/tenant-02.md#e2e-tenant-010), FL-OPS-01 [E2E-OPS-006](../catalog/ops-02.md#e2e-ops-006) | P0 | P |
| RF10 | Roles cerrados | FL-ENROLL-02 [E2E-ENROLL-015](../catalog/enroll-03.md#e2e-enroll-015), FL-RBAC-02 [E2E-RBAC-013](../catalog/rbac-03.md#e2e-rbac-013) | P0 | P |
| RF11 | Roles acumulados/sucesores | FL-ENROLL-02 [E2E-ENROLL-009](../catalog/enroll-02.md#e2e-enroll-009), FL-ENROLL-02 [E2E-ENROLL-011](../catalog/enroll-03.md#e2e-enroll-011) | P0 | P |
| RF12 | Admin/owner y delegación | FL-RBAC-01 [E2E-RBAC-001](../catalog/rbac-01.md#e2e-rbac-001), FL-ADMIN-01 [E2E-ADMIN-002](../catalog/admin-01.md#e2e-admin-002), FL-COURSE-02 [E2E-COURSE-006](../catalog/course-02.md#e2e-course-006) | P0 | P |
| RF13 | Módulos compartidos | FL-CONTENT-01 [E2E-CONTENT-001](../catalog/content-01.md#e2e-content-001), FL-CONTENT-01 [E2E-CONTENT-004](../catalog/content-01.md#e2e-content-004) | P1 | P |
| RF14 | Material Markdown | FL-CONTENT-02 [E2E-CONTENT-008](../catalog/content-02.md#e2e-content-008), FL-CONTENT-02 [E2E-CONTENT-011](../catalog/content-03.md#e2e-content-011) | P1 | P |
| RF15 | Binarios diferidos | [Alcance](../../deliveries/2/02-scope.md); FE-21 fuera MVP | N/A | Excluido, sin adaptador ni endpoints |
| RF16 | Material publicado visible | FL-CONTENT-02 [E2E-CONTENT-009](../catalog/content-02.md#e2e-content-009), FL-CONTENT-02 [E2E-CONTENT-010](../catalog/content-02.md#e2e-content-010) | P0 | P |
| RF17 | Autoría quiz contextual | FL-QUIZ-02 [E2E-QUIZ-005](../catalog/quiz-01.md#e2e-quiz-005), FL-RBAC-01 [E2E-RBAC-004](../catalog/rbac-01.md#e2e-rbac-004) | P0 | P |
| RF18 | Pauta válida por pregunta | FL-QUIZ-02 [E2E-QUIZ-008](../catalog/quiz-02.md#e2e-quiz-008), FL-QUIZ-03 [E2E-QUIZ-014](../catalog/quiz-03.md#e2e-quiz-014) | P0 | P |
| RF19 | Límite y único activo | FL-ATTEMPT-01 [E2E-ATTEMPT-005](../catalog/attempt-01.md#e2e-attempt-005), FL-ATTEMPT-01 [E2E-ATTEMPT-010](../catalog/attempt-02.md#e2e-attempt-010) | P0 | P |
| RF20 | Autocorrección y último graded | FL-ATTEMPT-03 [E2E-ATTEMPT-018](../catalog/attempt-04.md#e2e-attempt-018), FL-ATTEMPT-03 [E2E-ATTEMPT-020](../catalog/attempt-04.md#e2e-attempt-020), FL-GRADE-01 [E2E-GRADE-001](../catalog/grade-01.md#e2e-grade-001) | P0 | P |
| RF21 | Pesos completos/freeze | FL-GRADE-03 [E2E-GRADE-014](../catalog/grade-03.md#e2e-grade-014), FL-GRADE-03 [E2E-GRADE-018](../catalog/grade-04.md#e2e-grade-018), FL-GRADE-03 [E2E-GRADE-019](../catalog/grade-04.md#e2e-grade-019) | P0 | P |
| RF22 | Publicación explícita scoped | FL-GRADE-04 [E2E-GRADE-021](../catalog/grade-05.md#e2e-grade-021), FL-GRADE-04 [E2E-GRADE-022](../catalog/grade-05.md#e2e-grade-022), FL-GRADE-04 [E2E-GRADE-028](../catalog/grade-06.md#e2e-grade-028) | P0 | P |
| RF23 | Propias publicadas | FL-GRADE-01 [E2E-GRADE-003](../catalog/grade-01.md#e2e-grade-003), FL-GRADE-01 [E2E-GRADE-006](../catalog/grade-02.md#e2e-grade-006) | P0 | P |
| RF24 | Promedio normalizado | FL-GRADE-01 [E2E-GRADE-004](../catalog/grade-01.md#e2e-grade-004), FL-GRADE-01 [E2E-GRADE-005](../catalog/grade-01.md#e2e-grade-005) | P0 | P |
| RF25 | Autorización vigente por recurso | FL-TENANT-02 [E2E-TENANT-009](../catalog/tenant-02.md#e2e-tenant-009), FL-RBAC-02 [E2E-RBAC-012](../catalog/rbac-03.md#e2e-rbac-012), FL-GRADE-04 [E2E-GRADE-032](../catalog/grade-07.md#e2e-grade-032) | P0 | P |
| RF26 | Auditoría inmutable sanitizada | FL-AUDIT-01 [E2E-AUDIT-001](../catalog/audit-01.md#e2e-audit-001), FL-AUDIT-01 [E2E-AUDIT-008](../catalog/audit-02.md#e2e-audit-008), FL-OPS-01 [E2E-OPS-006](../catalog/ops-02.md#e2e-ops-006) | P0 | P |
| RF27 | Pauta vs rendición | FL-QUIZ-01 [E2E-QUIZ-004](../catalog/quiz-01.md#e2e-quiz-004), FL-RBAC-02 [E2E-RBAC-009](../catalog/rbac-02.md#e2e-rbac-009), FL-RBAC-02 [E2E-RBAC-010](../catalog/rbac-02.md#e2e-rbac-010) | P0 | P |
| RF28 | Cancelar consume sin Grade | FL-ATTEMPT-04 [E2E-ATTEMPT-028](../catalog/attempt-06.md#e2e-attempt-028), FL-ATTEMPT-04 [E2E-ATTEMPT-029](../catalog/attempt-06.md#e2e-attempt-029), FL-ATTEMPT-04 [E2E-ATTEMPT-030](../catalog/attempt-06.md#e2e-attempt-030) | P0 | P |
| RF29 | Seguimiento assistant/docente | FL-RBAC-01 [E2E-RBAC-005](../catalog/rbac-01.md#e2e-rbac-005), FL-GRADE-02 [E2E-GRADE-008](../catalog/grade-02.md#e2e-grade-008), FL-ATTEMPT-04 [E2E-ATTEMPT-031](../catalog/attempt-07.md#e2e-attempt-031) | P0 | P |
| CU-01 | Resolución e identidad multiinstitucional | FL-TENANT-01: [E2E-TENANT-001](../catalog/tenant-01.md#e2e-tenant-001) | P0 | P |
| CU-02 | Autenticación global y validación | FL-AUTH-01: [E2E-AUTH-001](../catalog/auth-01.md#e2e-auth-001) | P0 | P |
| CU-03 | Dashboard académico y cursos visibles | FL-COURSE-01: [E2E-COURSE-001](../catalog/course-01.md#e2e-course-001) | P1 | P |
| CU-04 | Asignar cambiar revocar y reactivar roles | FL-ENROLL-02: [E2E-ENROLL-007](../catalog/enroll-02.md#e2e-enroll-007) | P1 | P |
| CU-05 | Material Markdown, visibilidad y lectura segura | FL-CONTENT-02: [E2E-CONTENT-008](../catalog/content-02.md#e2e-content-008) | P1 | P |
| CU-06 | Material Markdown, visibilidad y lectura segura | FL-CONTENT-02: [E2E-CONTENT-009](../catalog/content-02.md#e2e-content-009) | P0 | P |
| CU-07 | Publicación irreversible y freeze de ítems | FL-QUIZ-03: [E2E-QUIZ-014](../catalog/quiz-03.md#e2e-quiz-014) | P0 | P |
| CU-08 | Guardar conjunto completo de respuestas | FL-ATTEMPT-02: [E2E-ATTEMPT-011](../catalog/attempt-03.md#e2e-attempt-011) | P0 | P |
| CU-09 | Envío atómico autocorrección y recibo | FL-ATTEMPT-03: [E2E-ATTEMPT-018](../catalog/attempt-04.md#e2e-attempt-018) | P0 | P |
| CU-10 | Ponderaciones completas y congelación global | FL-GRADE-03: [E2E-GRADE-014](../catalog/grade-03.md#e2e-grade-014) | P0 | P |
| CU-11 | Publicación explícita atómica e idempotente | FL-GRADE-04: [E2E-GRADE-021](../catalog/grade-05.md#e2e-grade-021) | P0 | P |
| CU-12 | Cálculo decimal y notas propias publicadas | FL-GRADE-01: [E2E-GRADE-004](../catalog/grade-01.md#e2e-grade-004) | P0 | P |
| CU-13 | Consulta histórica sanitizada y filtros | FL-AUDIT-01: [E2E-AUDIT-003](../catalog/audit-01.md#e2e-audit-003) | P0 | P |
| CU-14 | Módulos compartidos y orden completo | FL-CONTENT-01: [E2E-CONTENT-001](../catalog/content-01.md#e2e-content-001) | P1 | P |
| CU-15 | Cancelación explícita y revisión histórica | FL-ATTEMPT-04: [E2E-ATTEMPT-028](../catalog/attempt-06.md#e2e-attempt-028) | P0 | P |
| CU-16 | Libro docente por alumno y sección | FL-GRADE-02: [E2E-GRADE-008](../catalog/grade-02.md#e2e-grade-008) | P0 | P |
| RNF1 | Aislamiento exhaustivo | FL-TENANT-02 [E2E-TENANT-008](../catalog/tenant-02.md#e2e-tenant-008) | P0 | P |
| RNF2 | JWT y autoridad contextual | FL-RBAC-02 [E2E-RBAC-012](../catalog/rbac-03.md#e2e-rbac-012) | P0 | P |
| RNF3 | Atomicidad | FL-ATTEMPT-03 [E2E-ATTEMPT-024](../catalog/attempt-05.md#e2e-attempt-024) | P0 | P |
| RNF4 | FK compuestas/runtime | FL-OPS-01 [E2E-OPS-006](../catalog/ops-02.md#e2e-ops-006) | P0 | P |
| RNF5 | Backup/restore completo | Excluido E2E: requiere ejercicio operativo con evidencia; no acreditado por Render free | N/A | Nivel alternativo / excluido justificado |
| RNF6 | Monolito modular | Revisión estática ARCHITECTURE; no test browser que garantice arquitectura | N/A | Nivel alternativo / excluido justificado |
| RNF7 | Render y dominio | FL-OPS-01 [E2E-OPS-001](../catalog/ops-01.md#e2e-ops-001) | P1 | P |
| RNF8 | Namespace binarios | Excluido: no storage adaptador en MVP; volver al ampliar alcance | N/A | Nivel alternativo / excluido justificado |
| RNF9 | Salud/errores sin secretos | FL-NETWORK-02 [E2E-NETWORK-012](../catalog/network-03.md#e2e-network-012) | P0 | P |
| RNF10 | Migraciones/seed repetibles | FL-OPS-01 [E2E-OPS-004](../catalog/ops-01.md#e2e-ops-004) | P0 | P |

## Backlog y discrepancias de alcance

FE-01–07/BE-01–14: AUTH/TENANT/RBAC/COURSE/SECTION/ENROLL/ADMIN; FE-08–10/BE-21–23: CONTENT.
FE-11–14/BE-15–20: QUIZ/ATTEMPT; FE-15–19/BE-25–31: GRADE/AUDIT; FE-20: A11Y; FE-21 excluido.
Mapeo oficial agrupado: [backlog](../../deliveries/2/08-work-plan-detail/08-work-plan-detail.md),
[frontend coverage](../../frontend/coverage.md) y [issues](../audit/BASELINE.md). Verificar tarjeta vigente al crear rama.
D04: texto primer intento no prevalece sobre publicación irreversible del ADR; QUIZ-016 exige409 ya publicado.
D15/16/17: API disponible sin pantalla no se cuenta como flujo de UI completo; H/M cubren sus efectos actuales.
Q02: COURSE-013 requiere aclarar status normativo para NUL; no marcar requisito100% por ese caso pendiente.

## Requisitos adicionales del catálogo estático

[Spec catálogo](../../../specs/20261019-121536_catalogo-endpoints/spec.md), FR-001–013: CATALOG-001
cubreconsulta/filtro/deeplink/permisos sinbackend; CATALOG-002 descarga/revisión/ejemplos sintéticos;
CATALOG-003 errores/reflow/teclado; CATALOG-004 publicaciónatómica y rechazo con versión previa.
PrioridadP1/P2 segúnficha, estadoPlanificado. SC de cincolectores requiere evaluaciónhumana complementaria,
no automatizable como garantíaE2E. Hostingexterno queda pendiente y excluido de ejecuciónproductiva.
