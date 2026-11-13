# Una matrícula académica activa por persona y sección

**Decisión aceptada en #302 (épica #297).** Sustituye la regla de roles
simultáneos de FR-004 de Cursos y roles y FR-009 de Participación frontend.
Una persona puede tener cero o una matrícula académica activa por institución
y sección. Puede tener roles distintos en otras secciones. Los permisos
institucionales y los cupos exclusivos de estudiantes conservan su alcance.

La asignación del mismo rol activo es idempotente. Una asignación distinta
o una reactivación con otra matrícula activa recibe `409 SECTION_ROLE_ALREADY_ACTIVE`.
«Gestionar» aplica el cambio dentro de una transacción. Archiva la matrícula
anterior, activa su sucesora y registra el cambio en auditoría. Las notas e
intentos conservan sus referencias históricas. Durante la transición, el
cambio hacia un rol ya activo puede consolidar matrículas previas.

El índice único parcial de PostgreSQL cubre institución, sección y usuario
cuando la matrícula está activa. La migración verifica duplicados y se
revierte por completo ante un conflicto. Las lecturas conservan su forma:
el listado administrativo sigue paginado y la vista de solo lectura conserva
el arreglo `roles`, normalmente con un elemento. El filtro opcional
`userId` permite gestionar la matrícula de una persona fuera de la página
actual y comparte los permisos de la lista administrativa.

## Resolver datos anteriores

El operador puede consultar los grupos afectados en una sesión de solo
lectura con visibilidad sobre todos los tenants:

```sql
SELECT institution_id, section_id, user_id, array_agg(role ORDER BY role)
FROM public.enrollments
WHERE active
GROUP BY institution_id, section_id, user_id
HAVING count(*) > 1;
```

El propietario revisa cada caso y confirma el rol que sigue activo. Antes de
revocar, verifica si el rol de estudiante tiene evaluaciones o notas y si
la sección necesita mantener otro docente activo. Revoca solo las matrículas
autorizadas desde «Gestionar» para dejar rastro en auditoría e Historial.
Repite la consulta y aplica la migración cuando no queden grupos duplicados.
