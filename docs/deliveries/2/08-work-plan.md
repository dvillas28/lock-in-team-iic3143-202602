# Plan de trabajo actualizado

## Enfoque

El horizonte de desarrollo es de **7 semanas efectivas**. Se parte del walking
skeleton desplegado (frontend, backend, CI, Docker y Railway) y se avanza en
este orden:

1. preparar e instalar la persistencia, la autenticación y la base visual;
2. habilitar identidad global, contexto institucional y aislamiento probado;
3. construir el flujo académico mínimo del [alcance](02-scope.md):

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

Cada semana cierra casos de uso completos (backend, frontend y pruebas), de
modo que las historias sigan siendo entregables por separado. Ningún caso de uso
se considera terminado sin pruebas negativas entre UC y UTFSM.

## Áreas de trabajo

| Código | Área | Contenido |
| --- | --- | --- |
| PREP | Tareas de Preparación | Spec Kit, decisiones técnicas, datos demo y revisión de mockups previa a implementar. |
| INST | Tareas de Instalación | Incorporación y configuración de dependencias, librerías y design system. |
| INF | Infra | PostgreSQL, Docker Compose, variables, secretos y servicios Railway. |
| BE | Backend | Migraciones, módulos NestJS, autorización, reglas de dominio y tests. |
| FE | Frontend | Vistas Next.js por rol, integración con la API y accesibilidad. |
| CI | CI/CD | Workflows, tests obligatorios, migraciones en deploy, smoke tests y release. |
| DOC | Docs | ADR, OpenAPI, evidencia y estado de la entrega. |

## Priorización de casos de uso

### Escalas

**Prioridad**

- **P0 — Núcleo:** imprescindible para el [criterio de éxito](02-scope.md#criterio-de-éxito) de la demo.
- **P1 — Necesario:** completa el flujo o una regla del dominio; se puede
  simplificar si el calendario se aprieta.
- **P2 — Opcional:** se implementa solo si queda holgura en la semana 7.

**Esfuerzo** en horas-persona sugeridas, sumando backend y frontend del caso.
Incluye codificación, testing (unitario, integración y aislamiento) y
correcciones. Los puntos se asignan por tramo: ≤ 8 h = 3, 9–14 h = 5,
15–20 h = 8, > 20 h = 13.

### Matriz

| Orden | Caso de uso | Prioridad | Esfuerzo (h) | Puntos | Semana | Justificación |
| ---: | --- | :---: | ---: | ---: | :---: | --- |
| 1 | [CU-01](03-use-cases-and-requirements.md#cu-01--elegir-institución) Elegir institución | P0 | 7 | 3 | S2 | Puerta de entrada a todo contexto; esfuerzo bajo. |
| 2 | [CU-02](03-use-cases-and-requirements.md#cu-02--acceder-al-contexto-institucional) Acceder al contexto institucional | P0 | 11 | 5 | S2 | Implementa el guard de membership del que dependen todos los demás casos. |
| 3 | [CU-03](03-use-cases-and-requirements.md#cu-03--ver-cursos-y-secciones) Ver cursos y secciones | P0 | 18 | 8 | S3 | Incluye la migración de cursos, secciones y pertenencias. |
| 4 | [CU-04](03-use-cases-and-requirements.md#cu-04--gestionar-secciones-y-roles) Gestionar secciones y roles | P1 | 22 | 13 | S3 | Alto esfuerzo; el bootstrap demo puede cubrir los roles si se atrasa. |
| 5 | [CU-14](03-use-cases-and-requirements.md#cu-14--organizar-módulos-del-curso) Organizar módulos | P0 | 18 | 8 | S4 | Contenedor obligatorio de material. |
| 6 | [CU-05](03-use-cases-and-requirements.md#cu-05--publicar-material) Publicar material (markdown) | P0 | 14 | 5 | S4 | Markdown no depende de un proveedor de storage. |
| 7 | [CU-06](03-use-cases-and-requirements.md#cu-06--consultar-material) Consultar material | P0 | 10 | 5 | S4 | Cierra el primer flujo estudiantil visible. |
| 8 | [CU-07](03-use-cases-and-requirements.md#cu-07--crear-y-publicar-quiz) Crear y publicar quiz | P0 | 24 | 13 | S5 | El caso más complejo: pauta protegida, validaciones y elemento de nota. |
| 9 | [CU-08](03-use-cases-and-requirements.md#cu-08--responder-quiz) Responder quiz | P0 | 16 | 8 | S5 | Límite de intentos y unicidad del intento en progreso. |
| 10 | [CU-09](03-use-cases-and-requirements.md#cu-09--enviar-intento-y-obtener-calificación-automática) Enviar intento y calificar | P0 | 11 | 5 | S5 | Genera la nota vigente desde el último intento. |
| 11 | [CU-10](03-use-cases-and-requirements.md#cu-10--configurar-libro-de-notas) Configurar libro de notas | P0 | 9 | 5 | S6 | Precondición de la primera publicación (suma 100 %). |
| 12 | [CU-11](03-use-cases-and-requirements.md#cu-11--publicar-notas) Publicar notas | P0 | 13 | 5 | S6 | Publicación atómica con auditoría. |
| 13 | [CU-12](03-use-cases-and-requirements.md#cu-12--ver-notas-y-promedio) Ver notas y promedio | P0 | 8 | 3 | S6 | Cierra el flujo del MVP; esfuerzo bajo. |
| 14 | [CU-15](03-use-cases-and-requirements.md#cu-15--cancelar-un-intento-en-progreso) Cancelar intento | P1 | 7 | 3 | S6 | Evita que un intento abandonado bloquee la publicación. |
| 15 | [CU-16](03-use-cases-and-requirements.md#cu-16--revisar-el-libro-de-notas-docente) Libro de notas docente | P1 | 14 | 5 | S7 | Seguimiento docente; no bloquea la demo estudiantil. |
| 16 | [CU-13](03-use-cases-and-requirements.md#cu-13--consultar-auditoría) Consultar auditoría | P1 | 8 | 3 | S7 | El registro de eventos es P0 (BE-05); su consulta puede ir al final. |
| 17 | [CU-05](03-use-cases-and-requirements.md#cu-05--publicar-material) Publicar material (archivos) | P2 | 14 + 7 prep/infra | 8* | S7 | Requiere decidir storage; se pospone conforme al [riesgo](07-risks.md) asociado. |

\* Se sube un tramo por la incertidumbre del proveedor de storage.

El trabajo transversal (persistencia base, JWT, auditoría, harness de
aislamiento y hardening) es P0 y no se imputa a un caso en particular. Ver la
columna `T` en el detalle por semana.

### Totales sugeridos

| Bloque | Horas |
| --- | ---: |
| Casos de uso P0 (BE + FE) | 159 |
| Casos de uso P1 (BE + FE) | 51 |
| Preparación, instalación, infra, CI/CD, docs y tareas BE/FE no imputadas a un caso | 153 |
| **Total comprometido** | **363** |
| Opcional P2 (archivos) | 21 |

La carga promedio es de unas 52 h-persona por semana. Si la capacidad real del
equipo es menor, se recortan primero los P2 y luego se simplifican los P1
(por ejemplo, roles de CU-04 vía bootstrap o CU-13 solo con lectura sin
filtros).

## Plan por semana

`T` indica una tarea transversal. Las horas son sugeridas e incluyen pruebas y
correcciones.

La columna **Tipo** usa los mismos prefijos que las ramas del repositorio
(`<type>/<short-name>`), de modo que cada tarea se traduce directamente en una
rama y un PR:

| Tipo | Uso en este plan |
| --- | --- |
| `feat` | Funcionalidad de backend o frontend asociada a un caso de uso. |
| `fix` | Correcciones de hardening, aislamiento o accesibilidad. |
| `test` | Infraestructura de pruebas sin funcionalidad nueva. |
| `docs` | Spec Kit, ADR, OpenAPI, evidencia y material de entrega. |
| `ci` | Workflows de CI/CD, análisis de seguridad, versionado y rollback. |
| `build` | Dependencias, ORM, migraciones y Docker Compose. |
| `chore` | Configuración de servicios, secretos, design system y ensayos. |

### Semana 1 — Preparación, instalación y persistencia base

**Objetivo:** el backend se conecta a una PostgreSQL compartida, local y en
Railway, con UC y UTFSM creadas por bootstrap.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| PREP-01 | Preparación | docs | Spec Kit de persistencia: elegir ORM o capa SQL y herramienta de migraciones. | T | P0 | 4 |
| PREP-02 | Preparación | docs | Spec Kit de autenticación: emisión y validación de JWT, cuentas demo. | CU-01, CU-02 | P0 | 3 |
| PREP-03 | Preparación | docs | Definir el dataset demo UC/UTFSM (usuarios, memberships, cursos y roles) para bootstrap y tests. | T | P0 | 3 |
| PREP-04 | Preparación | docs | Revisar mockups por rol y mapear vistas a casos de uso (`lms-ui-ux`). | T | P0 | 3 |
| INST-01 | Instalación | build | Instalar y configurar ORM y migraciones; conexión backend mediante `DATABASE_URL`. | T | P0 | 4 |
| INST-02 | Instalación | build | Instalar librerías de JWT, hashing y validación de entrada en el backend. | CU-01, CU-02 | P0 | 2 |
| INST-03 | Instalación | chore | Integrar `tokens.css`, `app.css`, fuentes y Lucide en el frontend. | T | P0 | 3 |
| INF-01 | Infra | chore | Provisionar PostgreSQL en Railway y exponer `DATABASE_URL` al backend. | T | P0 | 2 |
| INF-02 | Infra | build | Compose: healthcheck de postgres, migraciones y bootstrap al arrancar. | T | P0 | 3 |
| BE-01 | Backend | feat | Migración inicial de Institution, User e InstitutionMembership; bootstrap idempotente de UC y UTFSM. | T (base de CU-01, CU-02) | P0 | 6 |
| CI-01 | CI/CD | ci | Servicio PostgreSQL en CI y ejecución de migraciones antes de los tests. | T | P0 | 3 |
| CI-02 | CI/CD | ci | Bot reviewer de PR: workflow que comenta cada PR con los criterios de `lms-reviewer` (aislamiento por Institution, permisos por rol, auditoría y tests faltantes); credenciales como secreto del repositorio. | T | P1 | 4 |
| CI-03 | CI/CD | ci | E3: versionado automático: cada push a `dev` crea un tag y cada push a `main` crea una release. | T | P0 | 3 |
| CI-04 | CI/CD | ci | E3: análisis de vulnerabilidades de dependencias e imágenes con Trivy. | T | P0 | 2 |
| CI-05 | CI/CD | ci | E3: análisis estático de código como check del PR. | T | P0 | 3 |
| DOC-01 | Docs | docs | ADR de la capa de persistencia y migraciones elegida. | T | P0 | 2 |
| | | | | | **Total** | **50** |

### Semana 2 — Identidad y contexto institucional

**Objetivo:** un User autenticado elige una Institution visible y entra solo a
contextos con membership activa.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| INF-03 | Infra | chore | Secreto JWT y variables en Railway y Compose, sin valores versionados. | CU-01, CU-02 | P0 | 1 |
| BE-02 | Backend | feat | Autenticación JWT: login de cuentas demo, guard global y respuestas `401`. | T | P0 | 8 |
| BE-03 | Backend | feat | `GET /api/v1/institutions` con solo memberships activas. | CU-01 | P0 | 3 |
| BE-04 | Backend | feat | Resolución de `institutionSlug`, guard de membership, scope de request y `404`. | CU-02 | P0 | 6 |
| BE-05 | Backend | feat | Infraestructura de AuditEvent: tabla append-only y registro en la misma transacción. | T | P0 | 5 |
| BE-06 | Backend | test | Harness de tests de aislamiento UC/UTFSM con helpers para `401`, `403` y `404`. | T | P0 | 5 |
| FE-01 | Frontend | feat | Login y manejo de sesión. | T | P0 | 6 |
| FE-02 | Frontend | feat | Selector de instituciones con estado vacío. | CU-01 | P0 | 4 |
| FE-03 | Frontend | feat | Shell institucional (sidebar, header y roles contextuales). | CU-02 | P0 | 5 |
| CI-06 | CI/CD | ci | Tests de integración y aislamiento como check obligatorio del PR. | T | P0 | 2 |
| CI-07 | CI/CD | ci | Reporte de seguridad con Semgrep publicado como artefacto del workflow. | T | P1 | 2 |
| CI-08 | CI/CD | ci | E3: action de rollback a la release anterior en Railway, probada en la demo. | T | P0 | 4 |
| DOC-02 | Docs | docs | Documentar el flujo de autenticación y actualizar OpenAPI. | CU-01, CU-02 | P0 | 1 |
| | | | | | **Total** | **52** |

### Semana 3 — Cursos, secciones y roles

**Objetivo:** cada participante ve solo sus cursos y secciones; el coordinador
administra su curso.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| PREP-05 | Preparación | docs | Spec Kit de cursos, secciones, módulos y material. | CU-03, CU-04, CU-05, CU-06, CU-14 | P0 | 3 |
| BE-07 | Backend | feat | Migración de Course, Section, CourseMembership y SectionMembership con FK institution-aware. | CU-03, CU-04 | P0 | 6 |
| BE-08 | Backend | feat | Listado de cursos y secciones según rol. | CU-03 | P0 | 6 |
| BE-09 | Backend | feat | Gestión de secciones, pertenencias y configuración del curso con auditoría. | CU-04 | P1 | 12 |
| FE-04 | Frontend | feat | Vista "Mis cursos" y detalle de curso con secciones. | CU-03 | P0 | 6 |
| FE-05 | Frontend | feat | Vista del coordinador para secciones y participantes. | CU-04 | P1 | 10 |
| CI-09 | CI/CD | ci | Ejecutar migraciones como paso previo al deploy en Railway. | T | P0 | 2 |
| | | | | | **Total** | **45** |

### Semana 4 — Módulos, material y Entrega 3

**Objetivo:** el coordinador publica módulos y material markdown; el estudiante
los consulta. Al cierre de la semana se presenta la
[Entrega 3 — Development](../guia-entregas-proyecto-iic3143.md#e3--development):
estado real, proceso, métricas, calidad, plan hacia el MVP y demo breve.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| PREP-06 | Preparación | docs | Spec Kit de quizzes, intentos y calificaciones. | CU-07 a CU-12, CU-15, CU-16 | P0 | 3 |
| BE-10 | Backend | feat | Módulos: migración, creación, orden, publicación y ocultamiento. | CU-14 | P0 | 10 |
| BE-11 | Backend | feat | Material markdown: crear, editar, publicar y ocultar. | CU-05 | P0 | 8 |
| BE-12 | Backend | feat | Consulta estudiantil de módulos y material publicados. | CU-06 | P0 | 5 |
| FE-06 | Frontend | feat | Organizador de módulos (orden y publicación). | CU-14 | P0 | 8 |
| FE-07 | Frontend | feat | Editor de material markdown. | CU-05 | P0 | 6 |
| FE-08 | Frontend | feat | Vista estudiantil de módulos y material. | CU-06 | P0 | 5 |
| DOC-03 | Docs | docs | OpenAPI de cursos, secciones, módulos y material. | CU-03 a CU-06, CU-14 | P0 | 2 |
| DOC-04 | Docs | docs | E3: proceso de desarrollo (ciclo, prácticas adoptadas y abandonadas, definición de terminado, manejo de deuda y bugs) con evidencia de tablero, PRs, revisiones y ADR. | T | P0 | 3 |
| DOC-05 | Docs | docs | E3: estrategia de testing, cobertura actual y meta; estado del código, defectos conocidos y capturas del pipeline CI/CD. | T | P0 | 3 |
| DOC-06 | Docs | docs | E3: métricas de avance (burnup/burndown, lead time, tarjetas terminadas vs. backlog) con interpretación y proyección al MVP. | T | P0 | 3 |
| DOC-07 | Docs | docs | E3: plan actualizado (completo vs. pendiente, cambios y repriorización) y planilla de estimaciones. | T | P0 | 2 |
| PREP-07 | Preparación | docs | E3: presentación (~20 min) y guion de demo con datos demo UC/UTFSM. | T | P0 | 4 |
| PREP-08 | Preparación | chore | E3: ensayo de presentación y demo, local y en Railway, con plan de respaldo. | T | P0 | 2 |
| | | | | | **Total** | **64** |

La semana 4 es la de mayor carga por la Entrega 3. Si la capacidad no alcanza,
se adelanta DOC-03 a la semana 3 o se traslada PREP-06 al inicio de la semana 5,
sin mover los casos de uso P0 de la semana.

### Semana 5 — Quizzes e intentos

**Objetivo:** un quiz publicado se rinde, se envía y produce una nota vigente
no publicada. Es la semana de mayor carga de implementación.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| BE-13 | Backend | feat | Migración de Quiz, Question, Option y GradeItem; autoría, validación y publicación. | CU-07 | P0 | 14 |
| BE-14 | Backend | feat | Intentos: iniciar, guardar respuestas, límite e intento único en progreso. | CU-08 | P0 | 10 |
| BE-15 | Backend | feat | Envío, calificación automática y nota vigente desde el último intento. | CU-09 | P0 | 8 |
| FE-09 | Frontend | feat | Editor de quiz para coordinador y docente. | CU-07 | P0 | 10 |
| FE-10 | Frontend | feat | Rendir quiz sin exponer la pauta. | CU-08 | P0 | 6 |
| FE-11 | Frontend | feat | Envío del intento y confirmación de recepción. | CU-09 | P0 | 3 |
| | | | | | **Total** | **51** |

### Semana 6 — Libro de notas y publicación

**Objetivo:** el coordinador configura ponderaciones, publica notas y el
estudiante ve su promedio.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| BE-16 | Backend | feat | Cancelación de intento con auditoría. | CU-15 | P1 | 4 |
| BE-17 | Backend | feat | Ponderaciones del libro de notas (suma 100 % y bloqueo). | CU-10 | P0 | 5 |
| BE-18 | Backend | feat | Publicación atómica de notas con auditoría. | CU-11 | P0 | 8 |
| BE-19 | Backend | feat | Notas propias publicadas y promedio parcial. | CU-12 | P0 | 4 |
| FE-12 | Frontend | feat | Cancelar intento (estudiante y personal). | CU-15 | P1 | 3 |
| FE-13 | Frontend | feat | Configuración de ponderaciones. | CU-10 | P0 | 4 |
| FE-14 | Frontend | feat | Publicación de notas por elemento y sección. | CU-11 | P0 | 5 |
| FE-15 | Frontend | feat | Vista de notas y promedio del estudiante. | CU-12 | P0 | 4 |
| INF-04 | Infra | chore | Verificar backup y PITR de la PostgreSQL en Railway (RNF5). | T | P1 | 2 |
| CI-10 | CI/CD | ci | Smoke test post-deploy (health y login demo). | T | P1 | 3 |
| DOC-08 | Docs | docs | OpenAPI de quizzes, intentos y notas. | CU-07 a CU-12, CU-15, CU-16 | P0 | 2 |
| | | | | | **Total** | **44** |

### Semana 7 — Seguimiento docente, auditoría y Entrega 4

**Objetivo:** completar las vistas docentes, endurecer el aislamiento,
publicar la release final y presentar la
[Entrega 4 — MVP final](../guia-entregas-proyecto-iic3143.md#e4--mvp-final):
demo en vivo de todos los casos comprometidos, revisión técnica y
retrospectiva del proceso.

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| BE-20 | Backend | feat | Libro de notas docente y revisión de intentos por alcance. | CU-16 | P1 | 8 |
| BE-21 | Backend | feat | Consulta de auditoría con filtros. | CU-13 | P1 | 4 |
| BE-22 | Backend | fix | Hardening: revisión de aislamiento (`lms-reviewer`) y correcciones. | T | P0 | 6 |
| FE-16 | Frontend | feat | Vista del libro de notas docente. | CU-16 | P1 | 6 |
| FE-17 | Frontend | feat | Vista de auditoría del curso. | CU-13 | P1 | 4 |
| FE-18 | Frontend | fix | Pasada de accesibilidad, tema oscuro y responsive. | T | P0 | 4 |
| CI-11 | CI/CD | ci | Release final mediante merge a `main`. | T | P0 | 1 |
| DOC-09 | Docs | docs | Evidencia final, [estado](10-status.md) y README. | T | P0 | 4 |
| DOC-10 | Docs | docs | E4: arquitectura final y modelo de datos (1–2 diapositivas), con diagramas de proceso corregidos en anexos. | T | P0 | 3 |
| DOC-11 | Docs | docs | E4: prácticas, tests, cobertura final, calidad y estado del código, con reportes de seguridad y CI/CD. | T | P0 | 2 |
| DOC-12 | Docs | docs | E4: plan final (completo vs. pendiente, decisiones tomadas) y estimado vs. real de la planilla. | T | P0 | 2 |
| DOC-13 | Docs | docs | E4: incorporar el feedback de E1 a E3 y consolidar el material del curso. | T | P0 | 3 |
| PREP-10 | Preparación | docs | E4: reunión de retrospectiva final y análisis (aciertos, errores, decisiones que no se repetirían y aprendizajes con su efecto en el proyecto). | T | P0 | 3 |
| PREP-11 | Preparación | docs | E4: presentación (~30 min) y guion de demo en vivo que cubre todos los casos comprometidos en UC y UTFSM. | T | P0 | 4 |
| PREP-12 | Preparación | chore | E4: ensayo de presentación y demo en vivo, local y en Railway, con plan de respaldo. | T | P0 | 3 |
| | | | | | **Total** | **57** |

La pauta de la Entrega 4 pondera sobre todo la demo y revisión del repositorio
y la conclusión del proceso, por lo que las tareas E4 son P0. Se recomienda
congelar funcionalidades a mitad de semana: si BE-20, BE-21, FE-16 o FE-17 (P1)
no están listos, se simplifican antes que recortar la preparación de la
entrega. Las tareas opcionales P2 solo se abordan si la semana 6 termina con
holgura.

Opcional P2, solo si hay holgura:

| ID | Área | Tipo | Tarea | CU | Prioridad | h |
| --- | --- | --- | --- | --- | :---: | ---: |
| PREP-09 | Preparación | docs | Decidir el proveedor de object storage (ADR). | CU-05 | P2 | 2 |
| INST-04 | Instalación | build | Instalar el cliente del proveedor de storage. | CU-05 | P2 | 2 |
| INF-05 | Infra | chore | Provisionar el bucket con namespace por Institution. | CU-05 | P2 | 3 |
| BE-23 | Backend | feat | Material basado en archivo (PDF, CSV, XLSX, TXT, JPEG, PNG). | CU-05 | P2 | 10 |
| FE-19 | Frontend | feat | Subida y descarga de archivos. | CU-05 | P2 | 4 |
| | | | | | **Total** | **21** |

## Resumen por área

| Área | S1 | S2 | S3 | S4 | S5 | S6 | S7 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Preparación | 13 | — | 3 | 9 | — | — | 10 | 35 |
| Instalación | 9 | — | — | — | — | — | — | 9 |
| Infra | 5 | 1 | — | — | — | 2 | — | 8 |
| Backend | 6 | 27 | 24 | 23 | 32 | 21 | 18 | 151 |
| Frontend | — | 15 | 16 | 19 | 19 | 16 | 14 | 99 |
| CI/CD | 15 | 8 | 2 | — | — | 3 | 1 | 29 |
| Docs | 2 | 1 | — | 13 | — | 2 | 14 | 32 |
| **Total** | **50** | **52** | **45** | **64** | **51** | **44** | **57** | **363** |

## Dependencias críticas

- BE-01 → BE-02 → BE-04: no hay endpoints académicos sin JWT y guard de
  membership (riesgo "auth mock demasiado largo").
- BE-05 y BE-06 antes de S3: toda escritura sensible se audita y cada caso se
  prueba con IDs cruzados desde su primera versión.
- CU-14 → CU-05 → CU-06: el material vive en módulos publicados.
- CU-07 → CU-08 → CU-09 → CU-10 → CU-11 → CU-12: la cadena de la nota.
- CU-15 antes de cerrar CU-11: un intento `in_progress` bloquea la publicación.
- Cada Spec Kit (PREP) precede a la semana que implementa su alcance.
- Entrega 3 al cierre de S4: la demo usa CU-01 a CU-06 y CU-14 ya integrados
  en Railway; DOC-06 requiere métricas del tablero desde S1 y DOC-04 usa las revisiones
  del bot (CI-02) como evidencia del proceso.
- Entrega 4 al cierre de S7: PREP-10 requiere las métricas acumuladas (DOC-06)
  y el estimado vs. real; la demo en vivo usa la release final (CI-11).
- CI-03 → CI-08: el rollback necesita releases versionadas. DOC-05 incluye los
  reportes de Trivy, análisis estático y Semgrep (CI-04, CI-05 y CI-07), y la
  demo de la Entrega 3 ejecuta el rollback.

## Fuera del plan

Se mantienen fuera del MVP, según el [alcance](02-scope.md):

- RLS, sharding, particionamiento y restore lógico por Institution;
- provisioning dinámico de Institutions o UI administrativa;
- facultades, departamentos o campus;
- Redis, workers, réplicas y microservicios;
- entregas manuales, recorrecciones, IA, chat, calendario y anuncios.

## Criterio de avance

Cada semana deja evidencia ejecutable: CI verde, deploy en Railway y casos de
uso demostrables en ambas Institutions. Ningún caso se considera listo sin
pruebas negativas entre UC y UTFSM (`401`, `403` y `404` según corresponda). Si
una semana excede su carga, se replanifica moviendo primero tareas P2 y P1, sin
partir un caso P0 entre semanas.
