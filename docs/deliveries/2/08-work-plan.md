# Plan de trabajo actualizado

## Enfoque

Primero se mantiene el walking skeleton desplegable. Después se incorpora una
sola PostgreSQL y se demuestra aislamiento entre Institutions antes de ampliar
el flujo académico.

El equipo acuerda siete semanas de trabajo desde el lunes 5 de octubre de 2026.
Cada iteración dura una semana calendario y sus fechas se tratan como
inamovibles para efectos de planificación.

## Responsables por área

| Área | Responsable principal | Alcance |
| --- | --- | --- |
| Bot GitHub PR reviewer | Daniel Fierro | Integración del bot, revisión automática y evidencias asociadas. |
| Backend e infraestructura | Sebastián Palma | API, persistencia, aislamiento multi-tenant, Docker y soporte Railway. |
| Frontend | Julián Contreras y Matías | Experiencia Next.js, consumo de API, vistas de curso, quizzes y notas. |
| CI/CD y gestión | Daniel Villaseñor | Pipelines, releases, coordinación Scrum, seguimiento, planillas y presentación de gestión. |

Cada riesgo o tarea debe ser validado por la persona responsable del área
afectada antes de marcarse como cerrado.

## Orden de implementación

1. Mantener frontend/backend, CI, Docker y deployment Railway.
2. Incorporar una PostgreSQL compartida y elegir persistencia mediante Spec Kit.
3. Modelar Institution, User global e InstitutionMembership.
4. Resolver Institution desde path y construir el scope de aplicación.
5. Crear tests de aislamiento con UC y UTFSM.
6. Implementar Courses, Sections y Enrollments.
7. Incorporar JWT real y auditoría mínima.
8. Implementar material, quizzes, notas y publicación.
9. Hardening, evidencia y release.

## Plan por iteración

| Iteración | Fechas | Foco | Casos de uso relacionados | Resultado | Responsables |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-10-05 a 2026-10-11 | Planificación ejecutable y base técnica | — | Backlog priorizado, riesgos validados, CI/CD verde, contrato OpenAPI revisado y plan de presentación definido. | Daniel Villaseñor, Sebastián Palma |
| 2 | 2026-10-12 a 2026-10-18 | PostgreSQL compartida e identidad institucional | CU-01, CU-02 | Institution, User e InstitutionMembership modelados; bootstrap `uc`/`utfsm`; backend conectado a DB local. | Sebastián Palma |
| 3 | 2026-10-19 a 2026-10-25 | Contexto institucional y aislamiento | CU-01 a CU-16 transversal | Paths institucionales validan membership; tests bloquean lecturas, escrituras y relaciones cruzadas. | Sebastián Palma, Daniel Fierro |
| 4 | 2026-10-26 a 2026-11-01 | Cursos, secciones, roles y shell frontend | CU-03, CU-04 | Course, Section, Enrollment y navegación frontend por institución/curso/sección. | Sebastián Palma, Julián Contreras, Matías |
| 5 | 2026-11-02 a 2026-11-08 | Módulos, material y quizzes | CU-05, CU-06, CU-07, CU-08, CU-15 | Material markdown, creación/publicación de quiz, intento estudiantil y cancelación controlada. | Julián Contreras, Matías, Sebastián Palma |
| 6 | 2026-11-09 a 2026-11-15 | Notas, publicación, auditoría y PR reviewer | CU-09, CU-10, CU-11, CU-12, CU-13, CU-16 | Corrección automática, gradebook, publicación explícita, auditoría y bot PR reviewer operando sobre PRs del equipo. | Sebastián Palma, Daniel Fierro, Julián Contreras, Matías |
| 7 | 2026-11-16 a 2026-11-22 | Hardening y entrega | CU-01 a CU-16 | Evidencia final, release, revisión de riesgos, documentación pulida, informe/presentación en PDF y ensayo de exposición. | Daniel Villaseñor, todo el equipo |

Los identificadores remiten a las [fichas de casos de uso](03-use-cases-and-requirements.md).
Cada ficha puede descomponerse en tareas propias de implementación, pruebas y
corrección dentro de su iteración; las filas transversales no sustituyen esa
planificación detallada.

## Priorización y esfuerzo grueso

Escala de esfuerzo: 1 bajo, 2 medio, 3 alto. El esfuerzo incluye codificación,
testing y correcciones.

| Actividad | Prioridad | Esfuerzo | Iteraciones | Responsable |
| --- | --- | ---: | --- | --- |
| Mantener CI/CD, Docker, Railway y release | Alta | 2 | 1-7 | Daniel Villaseñor |
| Catálogo OpenAPI y contrato frontend-backend | Alta | 2 | 1-3 | Sebastián Palma, Julián Contreras, Matías |
| PostgreSQL compartida y migración inicial | Alta | 3 | 2 | Sebastián Palma |
| Institution, User e InstitutionMembership | Alta | 3 | 2-3 | Sebastián Palma |
| Autorización contextual y tests cruzados | Alta | 3 | 3 | Sebastián Palma |
| Courses, Sections y Enrollments | Alta | 2 | 4 | Sebastián Palma |
| Shell frontend institucional | Alta | 2 | 4 | Julián Contreras, Matías |
| Módulos y material markdown | Media | 2 | 5 | Julián Contreras, Matías |
| Quizzes e intentos | Alta | 3 | 5 | Sebastián Palma, Julián Contreras, Matías |
| Notas, publicación y promedio | Alta | 3 | 6 | Sebastián Palma, Julián Contreras, Matías |
| AuditEvents inmutables | Alta | 2 | 6 | Sebastián Palma |
| Bot GitHub PR reviewer | Media | 2 | 3-6 | Daniel Fierro |
| Gestión Scrum, planillas y riesgos | Alta | 2 | 1-7 | Daniel Villaseñor |
| Preparación de informe/presentación PDF | Alta | 2 | 6-7 | Daniel Villaseñor, todo el equipo |

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
- Enrollments con roles acumulables;
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
