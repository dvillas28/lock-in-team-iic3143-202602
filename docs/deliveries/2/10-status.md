# Estado Entrega 2

## Completo en documentación

- Decisión de PostgreSQL compartida registrada en un ADR.
- Institution definida como tenant lógico con `institution_id`.
- User global e InstitutionMembership modelados conceptualmente.
- Scope, requisitos y arquitectura alineados a paths institucionales.
- Modelo de dominio, UML y modelo lógico institution-aware.
- FK compuestas, unicidades e índices conceptuales documentados.
- Riesgos y planes alineados al aislamiento lógico.
- Railway definido como plataforma de despliegue vigente.
- Contrato OpenAPI institucional y política 401/403/404 documentados.

## Completo en el walking skeleton

- frontend Next.js;
- backend NestJS con `GET /health`;
- frontend conectado al health del backend;
- Dockerfiles de frontend y backend;
- Docker Compose para ejecución local;
- CI de aplicaciones e imágenes;
- configuración Railway versionada;
- workflow de release por tag.

## Falta para persistencia y multi-tenancy ejecutable

- Spec Kit que elija ORM o capa SQL y herramienta de migraciones;
- conexión backend a la PostgreSQL compartida;
- migración inicial de Institution, User e InstitutionMembership;
- bootstrap idempotente de UC y UTFSM;
- JWT global;
- resolución de `institutionSlug` y autorización por membership;
- repositorios/servicios institution-scoped;
- constraints y FK institution-aware ejecutables;
- tests de aislamiento entre Institutions.

## Falta para el MVP académico

- Courses y Sections;
- CourseMemberships y Enrollments;
- material markdown y, posteriormente, archivos;
- quizzes con pauta protegida e intentos;
- cálculo y publicación de Grades;
- libro de notas y promedio;
- AuditEvents inmutables.

## Fuera del MVP

- administrador institucional separado;
- jerarquía de facultades/departamentos;
- provisioning dinámico de Institutions;
- RLS;
- sharding;
- restore lógico por Institution;
- Redis, workers y microservicios;
- proveedor concreto de object storage;
- IA, chat, calendario, entregas manuales y recorrecciones.

## Documentación histórica

Entregas 0 y 1 conservan las decisiones presentadas en su momento, incluida la
arquitectura database-per-tenant y referencias cloud anteriores. No son la
fuente vigente. Entrega 2 y los ADR aceptados actuales guían la implementación.
