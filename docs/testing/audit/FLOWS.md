# Inventario de flujos funcionales

34 familias: cada ficha desarrolla variantes y transiciones, sin equiparar pantalla con flujo completo.
Estados: I = implementada y aparentemente operativa por integración estática; P = parcial UI/API;
D = documentada sin implementación; X = fuera de alcance vigente. No implica nueva ejecución runtime.
Las API están vinculadas a controladores/contrato en [API](API.md); rutas completas en [ROUTES](ROUTES.md).

| Flujo | Funcionalidad / evidencia detallada | Estado | Casos |
| --- | --- | --- | --- |
<a id="fl-public-01"></a>
| FL-PUBLIC-01 | [Directorio público y destinos institucionales](flows/PUBLIC.md) | I | [E2E-PUBLIC-001](../catalog/public-01.md#e2e-public-001)–[E2E-PUBLIC-003](../catalog/public-01.md#e2e-public-003) |
<a id="fl-public-02"></a>
| FL-PUBLIC-02 | [Rutas inexistentes, hosts y compatibilidad legacy](flows/PUBLIC.md) | I | [E2E-PUBLIC-004](../catalog/public-01.md#e2e-public-004)–[E2E-PUBLIC-007](../catalog/public-02.md#e2e-public-007) |
<a id="fl-auth-01"></a>
| FL-AUTH-01 | [Autenticación global y validación](flows/AUTH.md) | I | [E2E-AUTH-001](../catalog/auth-01.md#e2e-auth-001)–[E2E-AUTH-022](../catalog/auth-05.md#e2e-auth-022) |
<a id="fl-auth-02"></a>
| FL-AUTH-02 | [Sesión en memoria y navegación segura](flows/AUTH.md) | I | [E2E-AUTH-010](../catalog/auth-02.md#e2e-auth-010)–[E2E-AUTH-020](../catalog/auth-04.md#e2e-auth-020) |
<a id="fl-tenant-01"></a>
| FL-TENANT-01 | [Resolución e identidad multiinstitucional](flows/TENANT.md) | I | [E2E-TENANT-001](../catalog/tenant-01.md#e2e-tenant-001)–[E2E-TENANT-007](../catalog/tenant-02.md#e2e-tenant-007) |
<a id="fl-tenant-02"></a>
| FL-TENANT-02 | [Recursos y relaciones cruzadas](flows/TENANT.md) | I | [E2E-TENANT-008](../catalog/tenant-02.md#e2e-tenant-008)–[E2E-TENANT-015](../catalog/tenant-03.md#e2e-tenant-015) |
<a id="fl-rbac-01"></a>
| FL-RBAC-01 | [Flags institucionales y ownership frente a roles](flows/RBAC.md) | I | [E2E-RBAC-001](../catalog/rbac-01.md#e2e-rbac-001)–[E2E-RBAC-008](../catalog/rbac-02.md#e2e-rbac-008) |
<a id="fl-rbac-02"></a>
| FL-RBAC-02 | [Combinaciones multirol y revocación contextual](flows/RBAC.md) | I | [E2E-RBAC-009](../catalog/rbac-02.md#e2e-rbac-009)–[E2E-RBAC-013](../catalog/rbac-03.md#e2e-rbac-013) |
<a id="fl-course-01"></a>
| FL-COURSE-01 | [Dashboard académico y cursos visibles](flows/COURSE.md) | I | [E2E-COURSE-001](../catalog/course-01.md#e2e-course-001)–[E2E-COURSE-005](../catalog/course-01.md#e2e-course-005) |
<a id="fl-course-02"></a>
| FL-COURSE-02 | [Creación atómica y configuración del curso](flows/COURSE.md) | I | [E2E-COURSE-006](../catalog/course-02.md#e2e-course-006)–[E2E-COURSE-013](../catalog/course-03.md#e2e-course-013) |
<a id="fl-section-01"></a>
| FL-SECTION-01 | [Consulta y gestión de secciones](flows/SECTION.md) | I | [E2E-SECTION-001](../catalog/section-01.md#e2e-section-001)–[E2E-SECTION-006](../catalog/section-02.md#e2e-section-006) |
<a id="fl-enroll-01"></a>
| FL-ENROLL-01 | [Búsqueda institucional de participantes](flows/ENROLL.md) | I | [E2E-ENROLL-001](../catalog/enroll-01.md#e2e-enroll-001)–[E2E-ENROLL-006](../catalog/enroll-02.md#e2e-enroll-006) |
<a id="fl-enroll-02"></a>
| FL-ENROLL-02 | [Asignar cambiar revocar y reactivar roles](flows/ENROLL.md) | I | [E2E-ENROLL-007](../catalog/enroll-02.md#e2e-enroll-007)–[E2E-ENROLL-019](../catalog/enroll-04.md#e2e-enroll-019) |
<a id="fl-content-01"></a>
| FL-CONTENT-01 | [Módulos compartidos y orden completo](flows/CONTENT.md) | I | [E2E-CONTENT-001](../catalog/content-01.md#e2e-content-001)–[E2E-CONTENT-007](../catalog/content-02.md#e2e-content-007) |
<a id="fl-content-02"></a>
| FL-CONTENT-02 | [Material Markdown, visibilidad y lectura segura](flows/CONTENT.md) | I | [E2E-CONTENT-008](../catalog/content-02.md#e2e-content-008)–[E2E-CONTENT-016](../catalog/content-04.md#e2e-content-016) |
<a id="fl-quiz-01"></a>
| FL-QUIZ-01 | [Catálogo, detalle seguro y filtros de quizzes](flows/QUIZ.md) | I | [E2E-QUIZ-001](../catalog/quiz-01.md#e2e-quiz-001)–[E2E-QUIZ-004](../catalog/quiz-01.md#e2e-quiz-004) |
<a id="fl-quiz-02"></a>
| FL-QUIZ-02 | [Autoría de borrador y validación](flows/QUIZ.md) | I | [E2E-QUIZ-005](../catalog/quiz-01.md#e2e-quiz-005)–[E2E-QUIZ-013](../catalog/quiz-03.md#e2e-quiz-013) |
<a id="fl-quiz-03"></a>
| FL-QUIZ-03 | [Publicación irreversible y freeze de ítems](flows/QUIZ.md) | I | [E2E-QUIZ-014](../catalog/quiz-03.md#e2e-quiz-014)–[E2E-QUIZ-018](../catalog/quiz-04.md#e2e-quiz-018) |
<a id="fl-attempt-01"></a>
| FL-ATTEMPT-01 | [Inicio y reanudación desde identificador conocido](flows/ATTEMPT.md) | I | [E2E-ATTEMPT-001](../catalog/attempt-01.md#e2e-attempt-001)–[E2E-ATTEMPT-010](../catalog/attempt-02.md#e2e-attempt-010) |
<a id="fl-attempt-02"></a>
| FL-ATTEMPT-02 | [Guardar conjunto completo de respuestas](flows/ATTEMPT.md) | I | [E2E-ATTEMPT-011](../catalog/attempt-03.md#e2e-attempt-011)–[E2E-ATTEMPT-017](../catalog/attempt-04.md#e2e-attempt-017) |
<a id="fl-attempt-03"></a>
| FL-ATTEMPT-03 | [Envío atómico autocorrección y recibo](flows/ATTEMPT.md) | I | [E2E-ATTEMPT-018](../catalog/attempt-04.md#e2e-attempt-018)–[E2E-ATTEMPT-027](../catalog/attempt-06.md#e2e-attempt-027) |
<a id="fl-attempt-04"></a>
| FL-ATTEMPT-04 | [Cancelación explícita y revisión histórica](flows/ATTEMPT.md) | I | [E2E-ATTEMPT-028](../catalog/attempt-06.md#e2e-attempt-028)–[E2E-ATTEMPT-032](../catalog/attempt-07.md#e2e-attempt-032) |
<a id="fl-grade-01"></a>
| FL-GRADE-01 | [Cálculo decimal y notas propias publicadas](flows/GRADE.md) | I | [E2E-GRADE-001](../catalog/grade-01.md#e2e-grade-001)–[E2E-GRADE-007](../catalog/grade-02.md#e2e-grade-007) |
<a id="fl-grade-02"></a>
| FL-GRADE-02 | [Libro docente por alumno y sección](flows/GRADE.md) | I | [E2E-GRADE-008](../catalog/grade-02.md#e2e-grade-008)–[E2E-GRADE-013](../catalog/grade-03.md#e2e-grade-013) |
<a id="fl-grade-03"></a>
| FL-GRADE-03 | [Ponderaciones completas y congelación global](flows/GRADE.md) | I | [E2E-GRADE-014](../catalog/grade-03.md#e2e-grade-014)–[E2E-GRADE-020](../catalog/grade-04.md#e2e-grade-020) |
<a id="fl-grade-04"></a>
| FL-GRADE-04 | [Publicación explícita atómica e idempotente](flows/GRADE.md) | I | [E2E-GRADE-021](../catalog/grade-05.md#e2e-grade-021)–[E2E-GRADE-032](../catalog/grade-07.md#e2e-grade-032) |
<a id="fl-audit-01"></a>
| FL-AUDIT-01 | [Consulta histórica sanitizada y filtros](flows/AUDIT.md) | I | [E2E-AUDIT-001](../catalog/audit-01.md#e2e-audit-001)–[E2E-AUDIT-010](../catalog/audit-02.md#e2e-audit-010) |
<a id="fl-admin-01"></a>
| FL-ADMIN-01 | [Delegación institucional vía API y efecto UI](flows/ADMIN.md) | P | [E2E-ADMIN-001](../catalog/admin-01.md#e2e-admin-001)–[E2E-ADMIN-006](../catalog/admin-02.md#e2e-admin-006) |
<a id="fl-admin-02"></a>
| FL-ADMIN-02 | [Onboarding y recuperación de superadmin operativos](flows/ADMIN.md) | P | [E2E-ADMIN-007](../catalog/admin-02.md#e2e-admin-007)–[E2E-ADMIN-011](../catalog/admin-03.md#e2e-admin-011) |
<a id="fl-network-01"></a>
| FL-NETWORK-01 | [Errores de lectura y revalidación de acceso](flows/NETWORK.md) | I | [E2E-NETWORK-001](../catalog/network-01.md#e2e-network-001)–[E2E-NETWORK-013](../catalog/network-03.md#e2e-network-013) |
<a id="fl-network-02"></a>
| FL-NETWORK-02 | [Errores transversales y operaciones inciertas](flows/NETWORK.md) | I | [E2E-NETWORK-009](../catalog/network-02.md#e2e-network-009)–[E2E-NETWORK-012](../catalog/network-03.md#e2e-network-012) |
<a id="fl-a11y-01"></a>
| FL-A11Y-01 | [Accesibilidad funcional y compatibilidad razonable](flows/A11Y.md) | I | [E2E-A11Y-001](../catalog/a11y-01.md#e2e-a11y-001)–[E2E-A11Y-008](../catalog/a11y-02.md#e2e-a11y-008) |
<a id="fl-ops-01"></a>
| FL-OPS-01 | [Salud entorno y garantías de persistencia](flows/OPS.md) | I | [E2E-OPS-001](../catalog/ops-01.md#e2e-ops-001)–[E2E-OPS-009](../catalog/ops-02.md#e2e-ops-009) |
<a id="fl-catalog-01"></a>
| FL-CATALOG-01 | [Portal público Swagger UI generado desde OpenAPI](flows/CATALOG.md) | I | [E2E-CATALOG-001](../catalog/catalog-01.md#e2e-catalog-001)–[E2E-CATALOG-004](../catalog/catalog-01.md#e2e-catalog-004) |
