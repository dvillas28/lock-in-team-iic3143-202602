# Plan de trabajo actualizado

## Enfoque

Primero se mantiene el walking skeleton desplegable. Después se incorpora una
sola PostgreSQL y se demuestra aislamiento entre Institutions antes de ampliar
el flujo académico.

Iteraciones sugeridas: una semana.

## Orden de implementación

1. Mantener frontend/backend, CI, Docker y deployment Railway.
2. Incorporar una PostgreSQL compartida y elegir persistencia mediante Spec Kit.
3. Modelar Institution, User global e InstitutionMembership.
4. Resolver Institution desde path y construir el scope de aplicación.
5. Crear tests de aislamiento con UC y UTFSM.
6. Implementar Courses, Sections, CourseMemberships y Enrollments.
7. Incorporar JWT real y auditoría mínima.
8. Implementar material, quizzes, notas y publicación.
9. Hardening, evidencia y release.

## Plan por iteración

| Iteración | Foco | Casos de uso relacionados | Resultado |
| --- | --- | --- | --- |
| 1 | Walking skeleton existente | — | Frontend consume health del backend; CI y Docker permanecen verdes. |
| 2 | PostgreSQL compartida | — | Un servicio local y una conexión backend planificada sin múltiples DB. |
| 3 | Identidad institucional | [CU-01](03-use-cases-and-requirements.md#cu-01--elegir-institución) | Institution, User e InstitutionMembership modelados e implementados. |
| 4 | Contexto de request | [CU-02](03-use-cases-and-requirements.md#cu-02--acceder-al-contexto-institucional) | Paths institucionales validan membership sin un header tenant adicional. |
| 5 | Aislamiento | CU-01 a CU-16, transversal | UC y UTFSM coexisten; tests bloquean IDs y relaciones cruzadas. |
| 6 | Cursos y roles | CU-03, CU-04 | CourseMembership y Enrollment respetan Institution. |
| 7 | Módulos y material | CU-14, CU-05, CU-06 | Markdown primero; storage solo si se elige en un plan específico. |
| 8 | Quizzes | CU-07, CU-08, CU-09, CU-15 | Pauta protegida e intentos institution-scoped. |
| 9 | Notas y trazabilidad | CU-10, CU-11, CU-12, CU-13, CU-16 | Cálculo, ponderaciones, publicación y auditoría atómicos. |
| 10 | Cierre | CU-01 a CU-16, verificación | Tests críticos, release, evidencia y documentación final. |

Los identificadores remiten a las [fichas de casos de uso](03-use-cases-and-requirements.md).
Cada ficha puede descomponerse en tareas propias de implementación, pruebas y
corrección dentro de su iteración; las filas transversales no sustituyen esa
planificación detallada.

## Entregables mínimos por fase

### Walking skeleton

- frontend y backend distinguibles;
- endpoint de salud;
- frontend conectado al backend;
- CI y build Docker;
- deployment Railway mediante configuración versionada;
- release por tag.

### Multi-tenancy compartida

- una PostgreSQL;
- Institutions `uc` y `utfsm` creadas por bootstrap futuro, no por migración;
- User global e InstitutionMembership;
- contexto `/api/v1/institutions/{institutionSlug}`;
- rechazo de Institution inexistente o no visible con `404`;
- entidades tenant-owned con `institution_id`;
- constraints y FK institution-aware;
- tests de lectura, escritura y relación cruzada.

### Flujo académico

- Course con Sections;
- CourseMemberships y Enrollments con roles acumulables;
- JWT para operaciones académicas;
- material publicado;
- Quiz con pauta protegida e intentos configurables;
- Grade desde el último intento;
- publicación y promedio;
- AuditEvents inmutables y tenant-owned.

## No hacer antes del Spec Kit correspondiente

- No elegir ORM ni herramienta de migraciones.
- No implementar RLS.
- No agregar Redis, workers, Cassandra, MinIO ni emuladores cloud.
- No implementar provisioning dinámico o UI administrativa.
- No modelar facultades, departamentos ni campus.
- No diseñar sharding futuro.
- No agregar integración de archivos sin un consumidor real.

## Criterio de avance

Cada iteración deja evidencia ejecutable o documental. Ningún flujo académico se
considera listo sin pruebas negativas entre al menos dos Institutions.
