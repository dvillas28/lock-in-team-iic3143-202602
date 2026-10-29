# 06-data-model: modelo y catálogo

Contenido histórico conservado íntegro en partes, con decisión vigente de cursos y roles.

- [Parte 1](06-data-model-part-1.md)
- [Parte 2](06-data-model-part-2.md)
- [Parte 3](06-data-model-part-3.md)
- [Parte 4](06-data-model-part-4.md)

## Decisión vigente (2026-10-16)

InstitutionMembership tiene is_admin e is_super_admin independientes, default false.
User es identidad global sin privilegios administrativos globales.
Course.created_by es dueño único e inmutable; administrar exige además is_admin.
Enrollment conserva roles teacher/student/assistant por sección, múltiples distintos.
El último teacher puede revocarse sin borrar curso, ownership o evidencia.
AuditEvent.course_id es nullable solo para privilegios institucionales.
Actor nulo se limita a onboarding/superadmin con evidencia operativa obligatoria.
Las descripciones históricas quedan subordinadas al modelo implementado y contratos:
[modelo vigente](../../../specs/20261014-234844_cursos-roles/data-model.md) y
[ADR](../../adr/institution-admin-and-course-ownership.md).

Revisión polish 2026-10-29: [reglas de cardinalidad](06-data-model-relations.md),
[cuentas/provisión](../../guides/demo-accounts.md) y [evidencia](../../backend/feedback-e2-validation.md).
