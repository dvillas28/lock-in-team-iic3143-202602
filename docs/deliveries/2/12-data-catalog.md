# 12-data-catalog: modelo y catálogo

Contenido histórico conservado íntegro en partes, con decisión vigente de cursos y roles.

- [Parte 1](12-data-catalog-part-1.md)
- [Parte 2](12-data-catalog-part-2.md)

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
