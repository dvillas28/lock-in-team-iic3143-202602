# Rutas frontend: inventario completo

Fuente: todos los `page.tsx` bajo frontend/src/app del commit base. 18 páginas; sin rutas API Next.
I: integración estática con API real a través de Session/client; no acredita ejecución nueva.
P: compatibilidad/redirect, sin flujo privado completo propio. Los UUID se validan y relaciones padre/hijo se contrastan en parsers.

| Ruta | Componente/verificación | Caso de referencia | Estado |
| --- | --- | --- | --- |
| `/attempts/[attemptId]` | [ProtectedInstitution, AttemptDetail](../../../frontend/src/app/attempts/[attemptId]/page.tsx) | [E2E-ATTEMPT-001](../catalog/attempt-01.md#e2e-attempt-001) | I |
| `/courses/[courseId]/audit` | [CourseAudit](../../../frontend/src/app/courses/[courseId]/audit/page.tsx) | [E2E-AUDIT-001](../catalog/audit-01.md#e2e-audit-001) | I |
| `/courses/[courseId]/gradebook` | [CourseGradebook](../../../frontend/src/app/courses/[courseId]/gradebook/page.tsx) | [E2E-GRADE-008](../catalog/grade-02.md#e2e-grade-008) | I |
| `/courses/[courseId]/grades` | [StudentGrades](../../../frontend/src/app/courses/[courseId]/grades/page.tsx) | [E2E-GRADE-004](../catalog/grade-01.md#e2e-grade-004) | I |
| `/courses/[courseId]/modules/[moduleId]/materials/[materialId]` | [MaterialReader](../../../frontend/src/app/courses/[courseId]/modules/[moduleId]/materials/[materialId]/page.tsx) | [E2E-CONTENT-008](../catalog/content-02.md#e2e-content-008) | I |
| `/courses/[courseId]/modules` | [ModulesPanel](../../../frontend/src/app/courses/[courseId]/modules/page.tsx) | [E2E-CONTENT-001](../catalog/content-01.md#e2e-content-001) | I |
| `/courses/[courseId]` | [CourseDetail](../../../frontend/src/app/courses/[courseId]/page.tsx) | [E2E-COURSE-001](../catalog/course-01.md#e2e-course-001) | I |
| `/courses/[courseId]/quizzes/[quizId]/attempts/[attemptId]` | [AttemptReview](../../../frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/[attemptId]/page.tsx) | [E2E-ATTEMPT-031](../catalog/attempt-07.md#e2e-attempt-031) | I |
| `/courses/[courseId]/quizzes/[quizId]/attempts` | [AttemptList](../../../frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/page.tsx) | [E2E-ATTEMPT-031](../catalog/attempt-07.md#e2e-attempt-031) | I |
| `/courses/[courseId]/quizzes/[quizId]/authoring` | [QuizEditor](../../../frontend/src/app/courses/[courseId]/quizzes/[quizId]/authoring/page.tsx) | [E2E-QUIZ-005](../catalog/quiz-01.md#e2e-quiz-005) | I |
| `/courses/[courseId]/quizzes/[quizId]` | [QuizDetail](../../../frontend/src/app/courses/[courseId]/quizzes/[quizId]/page.tsx) | [E2E-QUIZ-001](../catalog/quiz-01.md#e2e-quiz-001) | I |
| `/courses/[courseId]/quizzes` | [QuizList](../../../frontend/src/app/courses/[courseId]/quizzes/page.tsx) | [E2E-QUIZ-001](../catalog/quiz-01.md#e2e-quiz-001) | I |
| `/courses/[courseId]/sections` | [CourseDetail](../../../frontend/src/app/courses/[courseId]/sections/page.tsx) | [E2E-SECTION-001](../catalog/section-01.md#e2e-section-001) | I |
| `/courses` | [CourseDirectory](../../../frontend/src/app/courses/page.tsx) | [E2E-COURSE-001](../catalog/course-01.md#e2e-course-001) | I |
| `/institutions/[institutionSlug]` | [redirect legacy](../../../frontend/src/app/institutions/[institutionSlug]/page.tsx) | [E2E-PUBLIC-006](../catalog/public-02.md#e2e-public-006) | P |
| `/institutions` | [redirect](../../../frontend/src/app/institutions/page.tsx) | [E2E-PUBLIC-007](../catalog/public-02.md#e2e-public-007) | P |
| `/login` | [LoginForm](../../../frontend/src/app/login/page.tsx) | [E2E-AUTH-001](../catalog/auth-01.md#e2e-auth-001) | I |
| `/` | [DomainEntry](../../../frontend/src/app/page.tsx) | [E2E-PUBLIC-001](../catalog/public-01.md#e2e-public-001) | I |

## Fronteras comunes

`courses/layout.tsx` monta ProtectedInstitution; `/attempts/[attemptId]` lo monta explícitamente.
`institutions/[slug]/layout` exige host coincidente y redirige. `/institutions` solo redirect.
Root layout instala SessionProvider por documento; login no preserva sesión en reload.
not-found global y de courses/institutions; loading/error boundaries y route-states tienen cobertura
PUBLIC-005, COURSE-005, NETWORK-001–008. No cuentan como funcionalidades adicionales.
No dashboard separado: `/courses` es Mis cursos. No panel superadmin ni gestión general de usuarios.
Los componentes CourseWorkspace/QuizWorkspace y validadores comprueban padres; TENANT-012 prueba rutas incoherentes.
Todas las rutas privadas reciben pruebas de URL directa anónima vía AUTH-012/014 y expansión de matriz de rutas.
Cada ruta debe incluir variante anónima, permitida, invisible o prohibida según recursos, más reload explícito.
La prueba frontend puede mostrar error en shell HTTP200; no exigir que todas las denegaciones UI cambien el status del documento.
