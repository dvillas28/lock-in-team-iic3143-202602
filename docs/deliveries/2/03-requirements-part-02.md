## Contexto funcional y alcance

AcademiX reúne el recorrido académico del MVP: elegir una institución, acceder a
cursos y secciones, organizar módulos y material, rendir quizzes de alternativas,
calcular y publicar notas, consultar el promedio y revisar cambios sensibles.
Los casos siguientes describen metas funcionales completas; varias operaciones
pueden contribuir a una misma meta. No representan una lista de endpoints ni
prometen funciones fuera del [alcance de Entrega 2](02-scope.md).

Los actores son el **usuario autenticado** (para elegir y entrar a una
institución), el **docente** (`teacher`), el **ayudante** (`assistant`) y el
**estudiante** (`student`). Una persona puede acumular roles, incluso dentro de
una misma sección; en cada operación se comprueba el permiso correspondiente.
La pertenencia institucional activa permite entrar al contexto, pero no confiere
por sí sola permisos académicos. El sistema ejecuta las validaciones y cálculos;
no se trata como actor externo. Operador provisiona instituciones; superadmin
institucional delega is_admin y admin crea/administra cursos propios. No hay
superadmin global, coordinador ni RBAC completo. Ver matriz de dominio.

Los casos se agrupan por acceso (CU-01 a CU-03), gestión de curso y contenido
(CU-04 a CU-07 y CU-14), evaluación y calificaciones (CU-08 a CU-12, CU-15 y
CU-16) y trazabilidad (CU-13). Se conservan los identificadores originales,
normalizados con dos dígitos. CU-14 a CU-16 completan metas explícitas del
modelo vigente.
