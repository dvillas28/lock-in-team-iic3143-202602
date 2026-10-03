# Plan de trabajo actualizado

## Enfoque

Primero se mantiene el walking skeleton desplegable. Después se incorpora una
sola PostgreSQL y se demuestra aislamiento entre Institutions antes de ampliar
el flujo académico:

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

El equipo acuerda siete semanas de trabajo desde el lunes 5 de octubre de 2026.
Cada iteración dura una semana calendario y sus fechas se tratan como
inamovibles para efectos de planificación. Cada semana cierra casos de uso
completos (backend, frontend y pruebas), de modo que las historias sigan siendo
entregables por separado.

## Responsables por área

| Sigla | Responsable       | Área                      | Alcance                                                                                                                               |
| ----- | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| DF    | Daniel Fierro     | Bot GitHub PR reviewer    | Integración del bot, revisión automática, tests de aislamiento y evidencias asociadas.                                                |
| SP    | Sebastián Palma   | Backend e infraestructura | API, persistencia, aislamiento multi-tenant, Docker y soporte Railway.                                                                |
| JC    | Julián Contreras  | Frontend                  | Experiencia Next.js, consumo de API, vistas de curso, quizzes y notas; secciones, módulos, material y libro docente de punta a punta. |
| MA    | Matías            | Frontend                  | Experiencia Next.js, consumo de API, vistas de curso, quizzes y notas; secciones, módulos, material y libro docente de punta a punta. |
| DV    | Daniel Villaseñor | CI/CD y gestión           | Pipelines, releases, coordinación Scrum, seguimiento, planillas y presentaciones.                                                     |

"Equipo" indica una tarea compartida por las cinco personas. Cada riesgo o tarea
debe ser validado por la persona responsable del área afectada antes de
marcarse como cerrado.

## Áreas de trabajo

| Código | Área                  | Contenido                                                                                    |
| ------ | --------------------- | -------------------------------------------------------------------------------------------- |
| PREP   | Tareas de Preparación | Spec Kit, decisiones técnicas, backlog, riesgos, datos demo y preparación de presentaciones. |
| INST   | Tareas de Instalación | Incorporación y configuración de dependencias, librerías y design system.                    |
| INF    | Infra                 | PostgreSQL, Docker Compose, variables, secretos y servicios Railway.                         |
| BE     | Backend               | Migraciones, módulos NestJS, autorización, reglas de dominio y tests.                        |
| FE     | Frontend              | Vistas Next.js por rol, integración con la API y accesibilidad.                              |
| CI     | CI/CD                 | Workflows, análisis de seguridad, versionado, rollback, bot reviewer y release.              |
| DOC    | Docs                  | ADR, OpenAPI, gestión semanal, evidencia y material de entrega.                              |

## Orden de implementación

1. Mantener frontend/backend, CI, Docker y deployment Railway; agregar
   versionado automático, análisis de seguridad y rollback.
2. Incorporar una PostgreSQL compartida y elegir persistencia mediante Spec Kit.
3. Modelar Institution, User global e InstitutionMembership.
4. Incorporar JWT real, resolver Institution desde path y construir el scope de
   aplicación.
5. Crear tests de aislamiento con UC y UTFSM.
6. Implementar Courses, Sections y Enrollments con auditoría mínima.
7. Implementar módulos, material, quizzes, notas y publicación.
8. Hardening, evidencia y release.

## Plan por iteración

| Iteración | Fechas                  | Foco                                                 | Casos de uso relacionados                | Resultado                                                                                                                                             | Responsables       |   h |
| --------: | ----------------------- | ---------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --: |
|         1 | 2026-10-05 a 2026-10-11 | Planificación ejecutable y base técnica              | —                                        | Backlog priorizado, riesgos validados, CI/CD verde con versionado y análisis de seguridad, contrato OpenAPI revisado y plan de presentación definido. | DV, SP             |  38 |
|         2 | 2026-10-12 a 2026-10-18 | PostgreSQL compartida e identidad institucional      | CU-01, CU-02                             | Institution, User e InstitutionMembership modelados; bootstrap `uc`/`utfsm`; backend conectado a DB local y Railway; rollback disponible.             | SP                 |  45 |
|         3 | 2026-10-19 a 2026-10-25 | Contexto institucional y aislamiento                 | CU-01 a CU-16 transversal                | JWT real; paths institucionales validan membership; tests bloquean lecturas, escrituras y relaciones cruzadas.                                        | SP, DF             |  53 |
|         4 | 2026-10-26 a 2026-11-01 | Cursos, secciones, roles, shell frontend y Entrega 3 | CU-03, CU-04                             | Course, Section, Enrollment y auditoría mínima; navegación frontend por institución/curso/sección; presentación E3.                                   | SP, JC, MA, DV     |  85 |
|         5 | 2026-11-02 a 2026-11-08 | Módulos, material y quizzes                          | CU-14, CU-05, CU-06, CU-07, CU-08, CU-15 | Material markdown, creación/publicación de quiz, intento estudiantil y cancelación controlada.                                                        | JC, MA, SP         | 102 |
|         6 | 2026-11-09 a 2026-11-15 | Notas, publicación, auditoría y PR reviewer          | CU-09, CU-10, CU-11, CU-12, CU-13, CU-16 | Corrección automática, gradebook, publicación explícita, auditoría consultable y bot PR reviewer operando sobre PRs del equipo.                       | SP, DF, JC, MA     |  79 |
|         7 | 2026-11-16 a 2026-11-22 | Hardening y Entrega 4                                | CU-01 a CU-16                            | Evidencia final, release, revisión de riesgos, documentación pulida, informe/presentación en PDF y ensayo de exposición.                              | DV, todo el equipo |  35 |

Los identificadores remiten a las [fichas de casos de uso](03-use-cases-and-requirements.md).
El detalle por semana descompone cada iteración en tareas atómicas de
implementación, pruebas y corrección, listas para cargarse como tarjetas del
backlog.

## Priorización y esfuerzo

### Escalas

**Prioridad**

- **P0 — Núcleo:** imprescindible para el [criterio de éxito](02-scope.md#criterio-de-éxito) de la demo.
- **P1 — Necesario:** completa el flujo o una regla del dominio; se puede
  simplificar si el calendario se aprieta.
- **P2 — Opcional:** se implementa solo si queda holgura en la semana 7.

**Esfuerzo grueso** por actividad: 1 bajo, 2 medio, 3 alto.

**Esfuerzo detallado** en horas-persona sugeridas por tarea. Incluye
codificación, testing (unitario, integración y aislamiento) y correcciones. En
los casos de uso, los puntos se asignan por tramo: ≤ 8 h = 3, 9–14 h = 5,
15–20 h = 8, > 20 h = 13.

### Actividades

| Actividad                                        | Prioridad | Esfuerzo | Iteraciones | Responsable    |   h | Tareas                                                                            |
| ------------------------------------------------ | :-------: | -------: | ----------- | -------------- | --: | --------------------------------------------------------------------------------- |
| Mantener CI/CD, Docker, Railway y release        |    P0     |        2 | 1–7         | DV             |  13 | CI-01, CI-05, CI-08, CI-10, CI-12, CI-15                                          |
| Versionado automático, seguridad y rollback (E3) |    P0     |        2 | 1–2         | DV             |  14 | CI-02, CI-03, CI-04, CI-06, CI-07                                                 |
| Catálogo OpenAPI y contrato frontend-backend     |    P0     |        2 | 1–6         | SP, JC, MA     |  14 | DOC-01, FE-01, DOC-05, DOC-07, DOC-13, DOC-15                                     |
| PostgreSQL compartida y migración inicial        |    P0     |        3 | 1–2         | SP             |  15 | PREP-04, INST-02, INF-01, INF-02, DOC-03                                          |
| Institution, User, InstitutionMembership y JWT   |    P0     |        3 | 1–3         | SP             |  28 | PREP-05, PREP-08, BE-01, BE-02, INST-03, INF-03, BE-03, BE-04                     |
| Autorización contextual y tests cruzados         |    P0     |        3 | 2–6         | SP, DF         |  31 | PREP-09, BE-05, BE-06, BE-07, BE-08, BE-14, BE-24, BE-31                          |
| Courses, Sections y Enrollments                  |    P0     |        2 | 3–4         | SP, JC, MA     |  27 | PREP-10, BE-09, BE-11, BE-12, BE-13                                               |
| Shell frontend institucional                     |    P0     |        2 | 1–4         | JC, MA         |  42 | PREP-06, INST-01, FE-02, FE-03, FE-04, FE-05, FE-06, FE-07                        |
| Módulos y material markdown                      |    P1     |        2 | 4–5         | JC, MA         |  45 | PREP-11, BE-21, BE-22, BE-23, FE-08, FE-09, FE-10                                 |
| Quizzes e intentos                               |    P0     |        3 | 4–5         | SP, JC, MA     |  50 | PREP-12, BE-15, BE-16, BE-17, BE-18, BE-19, BE-20, FE-11, FE-12, FE-13            |
| Notas, publicación y promedio                    |    P0     |        3 | 6           | SP, JC, MA     |  55 | BE-25, BE-26, BE-27, BE-28, BE-29, FE-14, FE-15, FE-16, FE-17, FE-18              |
| AuditEvents inmutables                           |    P0     |        2 | 4, 6        | SP, DF         |  13 | BE-10, BE-30, FE-19                                                               |
| Bot GitHub PR reviewer                           |    P1     |        2 | 1, 3–6      | DF             |  14 | PREP-07, CI-09, CI-11, CI-13, CI-14                                               |
| Gestión Scrum, planillas y riesgos               |    P0     |        2 | 1–7         | DV             |  21 | PREP-01, PREP-02, DOC-02, DOC-04, DOC-06, DOC-12, DOC-14, DOC-18, DOC-22, PREP-15 |
| Presentación de Entrega 3                        |    P0     |        2 | 1, 4        | DV, equipo     |  19 | PREP-03, DOC-08, DOC-09, DOC-10, DOC-11, PREP-13, PREP-14                         |
| Preparación de informe/presentación PDF (E4)     |    P0     |        2 | 6–7         | DV, equipo     |  24 | DOC-16, DOC-17, DOC-19, DOC-20, DOC-21, PREP-16, PREP-17, PREP-18                 |
| Hardening y cierre técnico                       |    P0     |        2 | 7           | SP, DF, JC, MA |  12 | BE-32, FE-20, INF-04                                                              |
| Material con archivos (opcional)                 |    P2     |        2 | 7           | SP, JC, MA     |  21 | PREP-19, INST-04, INF-05, BE-33, FE-21                                            |

### Casos de uso

| Orden | Caso de uso                                                                                                                  | Prioridad |      Esfuerzo (h) | Puntos | Semana | Justificación                                                                    |
| ----: | ---------------------------------------------------------------------------------------------------------------------------- | :-------: | ----------------: | -----: | :----: | -------------------------------------------------------------------------------- |
|     1 | [CU-01](03-use-cases-and-requirements.md#cu-01--elegir-institución) Elegir institución                                       |    P0     |                 8 |      3 | S2–S3  | Puerta de entrada a todo contexto; esfuerzo bajo.                                |
|     2 | [CU-02](03-use-cases-and-requirements.md#cu-02--acceder-al-contexto-institucional) Acceder al contexto institucional         |    P0     |                16 |      8 | S2–S4  | Guard de membership del que dependen todos los demás casos.                      |
|     3 | [CU-03](03-use-cases-and-requirements.md#cu-03--ver-cursos-y-secciones) Ver cursos y secciones                               |    P0     |                16 |      8 |   S4   | Incluye la migración de cursos, secciones y pertenencias.                        |
|     4 | [CU-04](03-use-cases-and-requirements.md#cu-04--gestionar-secciones-y-roles) Gestionar secciones y roles                     |    P1     |                26 |     13 |   S4   | Alto esfuerzo; el bootstrap demo puede cubrir los roles si se atrasa.            |
|     5 | [CU-14](03-use-cases-and-requirements.md#cu-14--organizar-módulos-del-curso) Organizar módulos                               |    P1     |                18 |      8 |   S5   | Prioridad media en el plan base; contenedor obligatorio del material.            |
|     6 | [CU-05](03-use-cases-and-requirements.md#cu-05--publicar-material) Publicar material (markdown)                              |    P1     |                14 |      5 |   S5   | Markdown no depende de un proveedor de storage.                                  |
|     7 | [CU-06](03-use-cases-and-requirements.md#cu-06--consultar-material) Consultar material                                       |    P1     |                11 |      5 |   S5   | Primer flujo estudiantil de contenido.                                           |
|     8 | [CU-07](03-use-cases-and-requirements.md#cu-07--crear-y-publicar-quiz) Crear y publicar quiz                                 |    P0     |                25 |     13 |   S5   | El caso más complejo: pauta protegida, validaciones y elemento de nota.          |
|     9 | [CU-08](03-use-cases-and-requirements.md#cu-08--responder-quiz) Responder quiz                                               |    P0     |                17 |      8 |   S5   | Límite de intentos y unicidad del intento en progreso.                           |
|    10 | [CU-15](03-use-cases-and-requirements.md#cu-15--cancelar-un-intento-en-progreso) Cancelar intento                            |    P1     |                 7 |      3 |   S5   | Evita que un intento abandonado bloquee la publicación.                          |
|    11 | [CU-09](03-use-cases-and-requirements.md#cu-09--enviar-intento-y-obtener-calificación-automática) Enviar intento y calificar |    P0     |                11 |      5 |   S6   | Genera la nota vigente desde el último intento.                                  |
|    12 | [CU-10](03-use-cases-and-requirements.md#cu-10--configurar-libro-de-notas) Configurar libro de notas                         |    P0     |                 9 |      5 |   S6   | Precondición de la primera publicación (suma 100 %).                             |
|    13 | [CU-11](03-use-cases-and-requirements.md#cu-11--publicar-notas) Publicar notas                                               |    P0     |                14 |      5 |   S6   | Publicación atómica con auditoría.                                               |
|    14 | [CU-12](03-use-cases-and-requirements.md#cu-12--ver-notas-y-promedio) Ver notas y promedio                                   |    P0     |                 9 |      5 |   S6   | Cierra el flujo del MVP; esfuerzo bajo.                                          |
|    15 | [CU-16](03-use-cases-and-requirements.md#cu-16--revisar-el-libro-de-notas-docente) Libro de notas docente                    |    P1     |                15 |      8 |   S6   | Seguimiento docente; no bloquea la demo estudiantil.                             |
|    16 | [CU-13](03-use-cases-and-requirements.md#cu-13--consultar-auditoría) Consultar auditoría                                     |    P1     |                 8 |      3 |   S6   | El registro de eventos es P0 (BE-10); su consulta es P1.                         |
|    17 | [CU-05](03-use-cases-and-requirements.md#cu-05--publicar-material) Publicar material (archivos)                              |    P2     | 14 + 7 prep/infra |     8* |   S7   | Requiere decidir storage; se pospone conforme al [riesgo](07-risks.md) asociado. |

El esfuerzo de cada caso suma sus tareas de backend, frontend y tests; una tarea
asociada a varios casos se reparte en partes iguales y el resultado se redondea a
horas enteras.

\* Se sube un tramo por la incertidumbre del proveedor de storage.

### Totales sugeridos

| Bloque                                                                             |   Horas |
| ---------------------------------------------------------------------------------- | ------: |
| Casos de uso P0 (BE + FE + tests)                                                  |     125 |
| Casos de uso P1 (BE + FE + tests)                                                  |      99 |
| Preparación, instalación, infra, CI/CD, docs y tareas BE/FE no imputadas a un caso |     213 |
| **Total comprometido**                                                             | **437** |
| Opcional P2 (archivos)                                                             |      21 |

Si la capacidad real del equipo es menor, se recortan primero los P2 y luego se
simplifican los P1 (por ejemplo, roles de CU-04 vía bootstrap o CU-13 solo con
lectura sin filtros).

## Plan por semana

`T` indica una tarea transversal. Las horas son sugeridas e incluyen pruebas y
correcciones. Los IDs son correlativos por área.

La columna **Tipo** usa los mismos prefijos que las ramas del repositorio
(`<type>/<short-name>`), de modo que cada tarea se traduce directamente en una
rama y un PR:

| Tipo    | Uso en este plan                                                                |
| ------- | ------------------------------------------------------------------------------- |
| `feat`  | Funcionalidad de backend o frontend asociada a un caso de uso.                  |
| `fix`   | Correcciones de hardening, aislamiento o accesibilidad.                         |
| `test`  | Tests de aislamiento y permisos sin funcionalidad nueva.                        |
| `docs`  | Spec Kit, ADR, OpenAPI, backlog, evidencia y material de entrega.               |
| `ci`    | Workflows de CI/CD, análisis de seguridad, versionado, rollback y bot reviewer. |
| `build` | Dependencias, ORM, migraciones y Docker Compose.                                |
| `chore` | Configuración de servicios, secretos, design system, gestión y ensayos.         |

### Semana 1 — Planificación ejecutable y base técnica

**Fechas:** 2026-10-05 a 2026-10-11.

**Objetivo:** backlog listo en el tablero, riesgos validados, CI/CD verde con versionado automático y análisis de seguridad, contrato OpenAPI revisado y plan de presentaciones definido.

| ID      | Área        | Tipo  | Tarea                                                                                                                                        | CU  | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | --- | :-------: | ----------- | -----: |
| PREP-01 | Preparación | docs  | Construir el backlog en el tablero a partir de este plan: una tarjeta por tarea con área, tipo, prioridad, responsable y estimación.         | T   |    P0     | DV          |      3 |
| PREP-02 | Preparación | docs  | Validar los riesgos con cada responsable de área y actualizar la [lista de riesgos](07-risks.md).                                            | T   |    P0     | Equipo      |      2 |
| PREP-03 | Preparación | docs  | Plan de presentaciones E3 y E4: estructura, responsables por sección y métricas a registrar desde S1 (lead time, burnup, estimado vs. real). | T   |    P0     | DV          |      2 |
| PREP-04 | Preparación | docs  | Spec Kit de persistencia: elegir ORM o capa SQL y herramienta de migraciones.                                                                | T   |    P0     | SP          |      4 |
| PREP-05 | Preparación | docs  | Definir el dataset demo UC/UTFSM (usuarios, memberships, cursos y roles) para bootstrap y tests.                                             | T   |    P0     | SP          |      3 |
| PREP-06 | Preparación | docs  | Revisar mockups por rol y mapear vistas a casos de uso (`lms-ui-ux`).                                                                        | T   |    P0     | JC, MA      |      3 |
| PREP-07 | Preparación | docs  | Bot PR reviewer: definir proveedor, permisos del token y criterios a partir de `lms-reviewer`.                                               | T   |    P1     | DF          |      3 |
| INST-01 | Instalación | chore | Integrar `tokens.css`, `app.css`, fuentes y Lucide en el frontend.                                                                           | T   |    P0     | JC, MA      |      3 |
| CI-01   | CI/CD       | ci    | Verificar que CI, build Docker y deploy Railway estén verdes y corregir fallas.                                                              | T   |    P0     | DV          |      2 |
| CI-02   | CI/CD       | ci    | E3: versionado automático: cada push a `dev` crea un tag y cada push a `main` crea una release.                                              | T   |    P0     | DV          |      3 |
| CI-03   | CI/CD       | ci    | E3: análisis de vulnerabilidades de dependencias e imágenes con Trivy.                                                                       | T   |    P0     | DV          |      2 |
| CI-04   | CI/CD       | ci    | E3: análisis estático de código como check del PR.                                                                                           | T   |    P0     | DV          |      3 |
| DOC-01  | Docs        | docs  | Revisar el contrato OpenAPI vigente entre frontend y backend (rutas institucionales y política `401`/`403`/`404`).                           | T   |    P0     | SP, JC, MA  |      3 |
| DOC-02  | Docs        | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                                                            | T   |    P0     | DV          |      2 |
|         |             |       |                                                                                                                                              |     |           | **Total**   | **38** |

### Semana 2 — PostgreSQL compartida e identidad institucional

**Fechas:** 2026-10-12 a 2026-10-18.

**Objetivo:** el backend se conecta a una PostgreSQL compartida, local y en Railway, con Institution, User e InstitutionMembership y UC/UTFSM creadas por bootstrap.

| ID      | Área        | Tipo  | Tarea                                                                                                     | CU                       | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | --------------------------------------------------------------------------------------------------------- | ------------------------ | :-------: | ----------- | -----: |
| PREP-08 | Preparación | docs  | Spec Kit de autenticación: emisión y validación de JWT, cuentas demo.                                     | CU-01, CU-02             |    P0     | SP          |      3 |
| PREP-09 | Preparación | docs  | Diseñar la matriz de escenarios de aislamiento UC/UTFSM (`401`, `403`, `404`, IDs y relaciones cruzadas). | T                        |    P0     | DF          |      3 |
| INST-02 | Instalación | build | Instalar y configurar ORM y migraciones; conexión del backend mediante `DATABASE_URL`.                    | T                        |    P0     | SP          |      4 |
| INF-01  | Infra       | chore | Provisionar PostgreSQL en Railway y exponer `DATABASE_URL` al backend.                                    | T                        |    P0     | SP          |      2 |
| INF-02  | Infra       | build | Compose: healthcheck de postgres, migraciones y bootstrap al arrancar.                                    | T                        |    P0     | SP          |      3 |
| BE-01   | Backend     | feat  | Migración inicial de Institution, User e InstitutionMembership con unicidades.                            | T (base de CU-01, CU-02) |    P0     | SP          |      5 |
| BE-02   | Backend     | feat  | Bootstrap idempotente de UC, UTFSM y usuarios demo.                                                       | T (base de CU-01, CU-02) |    P0     | SP          |      3 |
| FE-01   | Frontend    | feat  | Cliente API tipado desde OpenAPI con manejo uniforme de `401`, `403` y `404`.                             | T                        |    P0     | JC, MA      |      4 |
| FE-02   | Frontend    | feat  | Layout base y rutas por `institutionSlug` con estados de carga, vacío y error.                            | T                        |    P0     | JC, MA      |      5 |
| CI-05   | CI/CD       | ci    | Servicio PostgreSQL en CI y ejecución de migraciones antes de los tests.                                  | T                        |    P0     | DV          |      3 |
| CI-06   | CI/CD       | ci    | Reporte de seguridad con Semgrep publicado como artefacto del workflow.                                   | T                        |    P1     | DV          |      2 |
| CI-07   | CI/CD       | ci    | E3: action de rollback a la release anterior en Railway, probada en la demo.                              | T                        |    P0     | DV          |      4 |
| DOC-03  | Docs        | docs  | ADR de la capa de persistencia y migraciones elegida.                                                     | T                        |    P0     | SP          |      2 |
| DOC-04  | Docs        | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                         | T                        |    P0     | DV          |      2 |
|         |             |       |                                                                                                           |                          |           | **Total**   | **45** |

### Semana 3 — Contexto institucional y aislamiento

**Fechas:** 2026-10-19 a 2026-10-25.

**Objetivo:** un User autenticado con JWT elige una Institution visible y entra solo a contextos con membership activa; los tests cruzados UC/UTFSM son check obligatorio.

| ID      | Área        | Tipo  | Tarea                                                                                          | CU           | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | ---------------------------------------------------------------------------------------------- | ------------ | :-------: | ----------- | -----: |
| PREP-10 | Preparación | docs  | Spec Kit de cursos, secciones, roles y auditoría mínima.                                       | CU-03, CU-04 |    P0     | SP          |      3 |
| INST-03 | Instalación | build | Instalar librerías de JWT, hashing y validación de entrada en el backend.                      | T            |    P0     | SP          |      2 |
| INF-03  | Infra       | chore | Secreto JWT y variables en Railway y Compose, sin valores versionados.                         | T            |    P0     | SP          |      1 |
| BE-03   | Backend     | feat  | Autenticación JWT: login de cuentas demo, guard global y respuestas `401`.                     | T            |    P0     | SP          |      8 |
| BE-04   | Backend     | feat  | `GET /api/v1/institutions` con solo memberships activas.                                       | CU-01        |    P0     | SP          |      3 |
| BE-05   | Backend     | feat  | Resolución de `institutionSlug`, guard de membership, scope de request y `404`.                | CU-02        |    P0     | SP          |      6 |
| BE-06   | Backend     | feat  | Identidad contextual: roles de curso y sección del User en la Institution.                     | CU-02        |    P0     | SP          |      3 |
| BE-07   | Backend     | test  | Harness de tests de aislamiento UC/UTFSM con helpers para `401`, `403` y `404`.                | T            |    P0     | DF          |      5 |
| BE-08   | Backend     | test  | Tests de aislamiento de CU-01 y CU-02: slug no visible, membership inactiva y JWT inválido.    | CU-01, CU-02 |    P0     | DF          |      3 |
| FE-03   | Frontend    | feat  | Login y manejo de sesión.                                                                      | T            |    P0     | JC, MA      |      6 |
| FE-04   | Frontend    | feat  | Selector de instituciones con estado vacío y pertenencia inactiva.                             | CU-01        |    P0     | JC, MA      |      4 |
| CI-08   | CI/CD       | ci    | Tests de integración y aislamiento como check obligatorio del PR.                              | T            |    P0     | DV          |      2 |
| CI-09   | CI/CD       | ci    | Bot PR reviewer: workflow base que comenta cada PR; credenciales como secreto del repositorio. | T            |    P1     | DF          |      4 |
| DOC-05  | Docs        | docs  | OpenAPI de autenticación, instituciones y contexto.                                            | CU-01, CU-02 |    P0     | SP          |      1 |
| DOC-06  | Docs        | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.              | T            |    P0     | DV          |      2 |
|         |             |       |                                                                                                |              |           | **Total**   | **53** |

### Semana 4 — Cursos, secciones, roles, shell frontend y Entrega 3

**Fechas:** 2026-10-26 a 2026-11-01.

**Objetivo:** cada participante ve solo sus cursos y secciones, el coordinador administra su curso y los cambios sensibles quedan auditados. Al cierre se presenta la [Entrega 3 — Development](../guia-entregas-proyecto-iic3143.md#e3--development): estado real, proceso, métricas, calidad, plan hacia el MVP y demo breve.

| ID      | Área        | Tipo  | Tarea                                                                                                                                                                  | CU                          | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | :-------: | ----------- | -----: |
| PREP-11 | Preparación | docs  | Spec Kit de módulos y material markdown.                                                                                                                               | CU-05, CU-06, CU-14         |    P1     | JC, MA      |      3 |
| PREP-12 | Preparación | docs  | Spec Kit de quizzes, intentos y calificaciones.                                                                                                                        | CU-07 a CU-12, CU-15, CU-16 |    P0     | SP          |      3 |
| PREP-13 | Preparación | docs  | E3: presentación (~20 min) y guion de demo con datos UC/UTFSM y rollback.                                                                                              | T                           |    P0     | DV          |      4 |
| PREP-14 | Preparación | chore | E3: ensayo de presentación y demo, local y en Railway, con plan de respaldo.                                                                                           | T                           |    P0     | Equipo      |      2 |
| BE-09   | Backend     | feat  | Migración de Course, Section, CourseMembership y SectionMembership con FK institution-aware.                                                                           | CU-03, CU-04                |    P0     | SP          |      6 |
| BE-10   | Backend     | feat  | AuditEvent mínimo: tabla append-only y registro en la misma transacción.                                                                                               | T                           |    P0     | SP          |      5 |
| BE-11   | Backend     | feat  | Listado de cursos y secciones según rol.                                                                                                                               | CU-03                       |    P0     | SP          |      6 |
| BE-12   | Backend     | feat  | Crear y actualizar secciones y configuración del curso, con auditoría.                                                                                                 | CU-04                       |    P1     | JC, MA      |      6 |
| BE-13   | Backend     | feat  | Asignar, cambiar y desactivar pertenencias de sección, con auditoría.                                                                                                  | CU-04                       |    P1     | SP          |      6 |
| BE-14   | Backend     | test  | Tests de aislamiento de cursos, secciones y pertenencias con IDs cruzados.                                                                                             | CU-03, CU-04                |    P0     | DF          |      3 |
| FE-05   | Frontend    | feat  | Shell institucional (sidebar, header y roles contextuales).                                                                                                            | CU-02                       |    P0     | JC, MA      |      5 |
| FE-06   | Frontend    | feat  | Vista "Mis cursos" y detalle de curso con secciones.                                                                                                                   | CU-03                       |    P0     | JC, MA      |      6 |
| FE-07   | Frontend    | feat  | Vista del coordinador para secciones y participantes.                                                                                                                  | CU-04                       |    P1     | JC, MA      |     10 |
| CI-10   | CI/CD       | ci    | Ejecutar migraciones como paso previo al deploy en Railway.                                                                                                            | T                           |    P0     | DV          |      2 |
| CI-11   | CI/CD       | ci    | Bot PR reviewer: incorporar criterios de `lms-reviewer` (aislamiento, roles, auditoría y tests).                                                                       | T                           |    P1     | DF          |      3 |
| DOC-07  | Docs        | docs  | OpenAPI de cursos, secciones y pertenencias.                                                                                                                           | CU-03, CU-04                |    P0     | SP          |      2 |
| DOC-08  | Docs        | docs  | E3: proceso de desarrollo (ciclo, prácticas adoptadas y abandonadas, definición de terminado, manejo de deuda y bugs) con evidencia de tablero, PRs, revisiones y ADR. | T                           |    P0     | DV          |      3 |
| DOC-09  | Docs        | docs  | E3: estrategia de testing, cobertura actual y meta; estado del código, defectos conocidos y capturas del pipeline CI/CD.                                               | T                           |    P0     | DV, DF      |      3 |
| DOC-10  | Docs        | docs  | E3: métricas de avance (burnup/burndown, lead time, tarjetas terminadas vs. backlog) con interpretación y proyección al MVP.                                           | T                           |    P0     | DV          |      3 |
| DOC-11  | Docs        | docs  | E3: plan actualizado (completo vs. pendiente, cambios y repriorización) y planilla de estimaciones.                                                                    | T                           |    P0     | DV          |      2 |
| DOC-12  | Docs        | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                                                                                      | T                           |    P0     | DV          |      2 |
|         |             |       |                                                                                                                                                                        |                             |           | **Total**   | **85** |

La semana 4 combina implementación y Entrega 3. Si la capacidad no alcanza, se traslada PREP-12 al inicio de la semana 5 o se simplifica FE-07 (P1), sin mover los casos P0 de la semana.

### Semana 5 — Módulos, material y quizzes

**Fechas:** 2026-11-02 a 2026-11-08.

**Objetivo:** el coordinador publica módulos y material markdown; un quiz publicado se rinde y un intento abandonado se puede cancelar.

| ID     | Área     | Tipo  | Tarea                                                                                                    | CU                          | Prioridad | Responsable |       h |
| ------ | -------- | ----- | -------------------------------------------------------------------------------------------------------- | --------------------------- | :-------: | ----------- | ------: |
| BE-15  | Backend  | feat  | Migración de Quiz, Question, Option y GradeItem con FK institution-aware.                                | CU-07                       |    P0     | SP          |       4 |
| BE-16  | Backend  | feat  | Autoría de quiz en borrador: preguntas, alternativas, puntajes y pauta separada de la vista estudiantil. | CU-07                       |    P0     | SP          |       6 |
| BE-17  | Backend  | feat  | Validación y publicación del quiz con elemento de nota único y auditoría.                                | CU-07                       |    P0     | SP          |       4 |
| BE-18  | Backend  | feat  | Iniciar intento con límite, numeración e intento único en progreso.                                      | CU-08                       |    P0     | SP          |       5 |
| BE-19  | Backend  | feat  | Guardar respuestas del intento en progreso sin revelar corrección.                                       | CU-08                       |    P0     | SP          |       5 |
| BE-20  | Backend  | feat  | Cancelar intento en progreso con auditoría.                                                              | CU-15                       |    P1     | SP          |       4 |
| BE-21  | Backend  | feat  | Módulos: migración, creación, orden, publicación y ocultamiento, con auditoría.                          | CU-14                       |    P1     | JC, MA      |      10 |
| BE-22  | Backend  | feat  | Material markdown: crear, editar, publicar y ocultar, con auditoría.                                     | CU-05                       |    P1     | JC, MA      |       8 |
| BE-23  | Backend  | feat  | Consulta estudiantil de módulos y material publicados.                                                   | CU-06                       |    P1     | JC, MA      |       5 |
| BE-24  | Backend  | test  | Tests de aislamiento y permisos de material y quizzes (pauta no expuesta, intentos ajenos).              | CU-06, CU-07, CU-08         |    P0     | DF          |       4 |
| FE-08  | Frontend | feat  | Organizador de módulos (orden y publicación).                                                            | CU-14                       |    P1     | JC, MA      |       8 |
| FE-09  | Frontend | feat  | Editor de material markdown.                                                                             | CU-05                       |    P1     | JC, MA      |       6 |
| FE-10  | Frontend | feat  | Vista estudiantil de módulos y material.                                                                 | CU-06                       |    P1     | JC, MA      |       5 |
| FE-11  | Frontend | feat  | Editor de quiz para coordinador y docente.                                                               | CU-07                       |    P0     | JC, MA      |      10 |
| FE-12  | Frontend | feat  | Rendir quiz sin exponer la pauta.                                                                        | CU-08                       |    P0     | JC, MA      |       6 |
| FE-13  | Frontend | feat  | Cancelar intento (estudiante y personal).                                                                | CU-15                       |    P1     | JC, MA      |       3 |
| CI-12  | CI/CD    | ci    | Smoke test post-deploy (health y login demo).                                                            | T                           |    P1     | DV          |       3 |
| CI-13  | CI/CD    | ci    | Bot PR reviewer: ajustar falsos positivos con PRs reales del equipo.                                     | T                           |    P1     | DF          |       2 |
| DOC-13 | Docs     | docs  | OpenAPI de módulos, material, quizzes e intentos.                                                        | CU-05 a CU-08, CU-14, CU-15 |    P0     | SP          |       2 |
| DOC-14 | Docs     | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                        | T                           |    P0     | DV          |       2 |
|        |          |       |                                                                                                          |                             |           | **Total**   | **102** |

Es la semana de mayor carga de implementación. Julián Contreras y Matías asumen backend y frontend de módulos y material, como define el plan base, mientras Sebastián Palma implementa quizzes e intentos.

### Semana 6 — Notas, publicación, auditoría y PR reviewer

**Fechas:** 2026-11-09 a 2026-11-15.

**Objetivo:** el intento enviado produce una nota vigente, el coordinador configura ponderaciones y publica, el estudiante ve su promedio y el bot revisa todos los PRs.

| ID     | Área     | Tipo  | Tarea                                                                                                       | CU                   | Prioridad | Responsable |      h |
| ------ | -------- | ----- | ----------------------------------------------------------------------------------------------------------- | -------------------- | :-------: | ----------- | -----: |
| BE-25  | Backend  | feat  | Envío del intento, calificación automática y nota vigente desde el último intento.                          | CU-09                |    P0     | SP          |      8 |
| BE-26  | Backend  | feat  | Ponderaciones del libro de notas (suma 100 % y bloqueo tras la primera publicación).                        | CU-10                |    P0     | SP          |      5 |
| BE-27  | Backend  | feat  | Publicación atómica de notas con auditoría.                                                                 | CU-11                |    P0     | SP          |      8 |
| BE-28  | Backend  | feat  | Notas propias publicadas y promedio parcial.                                                                | CU-12                |    P0     | SP          |      4 |
| BE-29  | Backend  | feat  | Libro de notas docente y revisión de intentos por alcance.                                                  | CU-16                |    P1     | JC, MA      |      8 |
| BE-30  | Backend  | feat  | Consulta de auditoría con filtros.                                                                          | CU-13                |    P1     | DF          |      4 |
| BE-31  | Backend  | test  | Tests de aislamiento y permisos de notas, publicación y libro docente (ayudante solo lectura).              | CU-11, CU-12, CU-16  |    P0     | DF          |      4 |
| FE-14  | Frontend | feat  | Envío del intento y confirmación de recepción.                                                              | CU-09                |    P0     | JC, MA      |      3 |
| FE-15  | Frontend | feat  | Configuración de ponderaciones.                                                                             | CU-10                |    P0     | JC, MA      |      4 |
| FE-16  | Frontend | feat  | Publicación de notas por elemento y sección.                                                                | CU-11                |    P0     | JC, MA      |      5 |
| FE-17  | Frontend | feat  | Vista de notas y promedio del estudiante.                                                                   | CU-12                |    P0     | JC, MA      |      4 |
| FE-18  | Frontend | feat  | Vista del libro de notas docente.                                                                           | CU-16                |    P1     | JC, MA      |      6 |
| FE-19  | Frontend | feat  | Vista de auditoría del curso.                                                                               | CU-13                |    P1     | JC, MA      |      4 |
| CI-14  | CI/CD    | ci    | Bot PR reviewer operando sobre todos los PRs del equipo; registrar evidencia para E4.                       | T                    |    P1     | DF          |      2 |
| DOC-15 | Docs     | docs  | OpenAPI de notas, publicación, libro docente y auditoría.                                                   | CU-09 a CU-13, CU-16 |    P0     | SP          |      2 |
| DOC-16 | Docs     | docs  | E4: arquitectura final y modelo de datos (1–2 diapositivas), con diagramas de proceso corregidos en anexos. | T                    |    P0     | DV, SP      |      3 |
| DOC-17 | Docs     | docs  | E4: incorporar el feedback de E1 a E3 y consolidar el material del curso.                                   | T                    |    P0     | DV          |      3 |
| DOC-18 | Docs     | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                           | T                    |    P0     | DV          |      2 |
|        |          |       |                                                                                                             |                      |           | **Total**   | **79** |

### Semana 7 — Hardening y Entrega 4

**Fechas:** 2026-11-16 a 2026-11-22.

**Objetivo:** endurecer el aislamiento, publicar la release final y presentar la [Entrega 4 — MVP final](../guia-entregas-proyecto-iic3143.md#e4--mvp-final): demo en vivo de todos los casos comprometidos, revisión técnica y retrospectiva.

| ID      | Área        | Tipo  | Tarea                                                                                                                                           | CU  | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- | :-------: | ----------- | -----: |
| PREP-15 | Preparación | docs  | Revisión final de riesgos con los responsables de área.                                                                                         | T   |    P0     | Equipo      |      2 |
| PREP-16 | Preparación | docs  | E4: reunión de retrospectiva final y análisis (aciertos, errores, decisiones que no se repetirían y aprendizajes con su efecto en el proyecto). | T   |    P0     | Equipo      |      3 |
| PREP-17 | Preparación | docs  | E4: informe/presentación en PDF (~30 min) y guion de demo en vivo con todos los casos comprometidos en UC y UTFSM.                              | T   |    P0     | Equipo      |      4 |
| PREP-18 | Preparación | chore | E4: ensayo de exposición y demo en vivo, local y en Railway, con plan de respaldo.                                                              | T   |    P0     | Equipo      |      3 |
| INF-04  | Infra       | chore | Verificar backup y PITR de la PostgreSQL en Railway (RNF5).                                                                                     | T   |    P1     | SP          |      2 |
| BE-32   | Backend     | fix   | Hardening: revisión de aislamiento (`lms-reviewer`) y correcciones.                                                                             | T   |    P0     | SP, DF      |      6 |
| FE-20   | Frontend    | fix   | Pasada de accesibilidad, tema oscuro y responsive.                                                                                              | T   |    P0     | JC, MA      |      4 |
| CI-15   | CI/CD       | ci    | Release final mediante merge a `main`.                                                                                                          | T   |    P0     | DV          |      1 |
| DOC-19  | Docs        | docs  | Evidencia final, [estado](10-status.md) y README.                                                                                               | T   |    P0     | DV          |      4 |
| DOC-20  | Docs        | docs  | E4: prácticas, tests, cobertura final, calidad y estado del código, con reportes de seguridad y CI/CD.                                          | T   |    P0     | DV, DF      |      2 |
| DOC-21  | Docs        | docs  | E4: plan final (completo vs. pendiente, decisiones) y estimado vs. real de la planilla.                                                         | T   |    P0     | DV          |      2 |
| DOC-22  | Docs        | chore | Gestión semanal: tablero, planilla de estimaciones (estimado vs. real) y riesgos.                                                               | T   |    P0     | DV          |      2 |
|         |             |       |                                                                                                                                                 |     |           | **Total**   | **35** |

La pauta de la Entrega 4 pondera sobre todo la demo y revisión del repositorio y la conclusión del proceso, por lo que las tareas E4 son P0. Se recomienda congelar funcionalidades al inicio de la semana; las tareas opcionales P2 solo se abordan si la semana 6 termina con holgura.

### Opcional P2

Solo si queda holgura en la semana 7.

| ID      | Área        | Tipo  | Tarea                                                        | CU    | Prioridad | Responsable |      h |
| ------- | ----------- | ----- | ------------------------------------------------------------ | ----- | :-------: | ----------- | -----: |
| PREP-19 | Preparación | docs  | Decidir el proveedor de object storage (ADR).                | CU-05 |    P2     | SP          |      2 |
| INST-04 | Instalación | build | Instalar el cliente del proveedor de storage.                | CU-05 |    P2     | SP          |      2 |
| INF-05  | Infra       | chore | Provisionar el bucket con namespace por Institution.         | CU-05 |    P2     | SP          |      3 |
| BE-33   | Backend     | feat  | Material basado en archivo (PDF, CSV, XLSX, TXT, JPEG, PNG). | CU-05 |    P2     | JC, MA      |     10 |
| FE-21   | Frontend    | feat  | Subida y descarga de archivos.                               | CU-05 |    P2     | JC, MA      |      4 |
|         |             |       |                                                              |       |           | **Total**   | **21** |

## Resumen por área

| Área        |     S1 |     S2 |     S3 |     S4 |      S5 |     S6 |     S7 |   Total |
| ----------- | -----: | -----: | -----: | -----: | ------: | -----: | -----: | ------: |
| Preparación |     20 |      6 |      3 |     12 |       — |      — |     12 |      53 |
| Instalación |      3 |      4 |      2 |      — |       — |      — |      — |       9 |
| Infra       |      — |      5 |      1 |      — |       — |      — |      2 |       8 |
| Backend     |      — |      8 |     28 |     32 |      55 |     41 |      6 |     170 |
| Frontend    |      — |      9 |     10 |     21 |      38 |     26 |      4 |     108 |
| CI/CD       |     10 |      9 |      6 |      5 |       5 |      2 |      1 |      38 |
| Docs        |      5 |      4 |      3 |     15 |       4 |     10 |     10 |      51 |
| **Total**   | **38** | **45** | **53** | **85** | **102** | **79** | **35** | **437** |

## Carga por responsable

Horas sugeridas por persona; las tareas compartidas se reparten en partes
iguales entre sus responsables.

| Responsable       |     S1 |     S2 |     S3 |     S4 |      S5 |     S6 |     S7 |   Total |
| ----------------- | -----: | -----: | -----: | -----: | ------: | -----: | -----: | ------: |
| Daniel Fierro     |    3,5 |      3 |     12 |      8 |       6 |     10 |    6,5 |    48,5 |
| Sebastián Palma   |    8,5 |     22 |     27 |   28,5 |      30 |   28,5 |    7,5 |   151,5 |
| Julián Contreras  |    4,5 |    4,5 |      5 |   15,5 |    30,5 |     17 |    4,5 |      81 |
| Matías            |    4,5 |    4,5 |      5 |   15,5 |    30,5 |     17 |    4,5 |      81 |
| Daniel Villaseñor |   17,5 |     11 |      4 |     18 |       5 |    6,5 |   12,5 |      74 |
| **Total**         | **38** | **45** | **53** | **85** | **102** | **79** | **35** | **437** |

El pico individual es de 30,5 h (Julián Contreras y Matías en S5). Para no concentrar
todo el backend académico en Sebastián Palma, Julián Contreras y Matías toman de
punta a punta secciones (CU-04), módulos y material (CU-14, CU-05, CU-06) y el
libro docente (CU-16). Si una semana sobrecarga a alguien, se reasignan primero
tareas `test` o de OpenAPI y se mantiene a una sola persona por migración.

## Dependencias críticas

- BE-01 → BE-03 → BE-05: no hay endpoints académicos sin JWT y
  guard de membership (riesgo "auth mock demasiado largo").
- BE-07 antes de S4 y BE-10 antes de las primeras escrituras
  sensibles (BE-12, BE-13): cada caso se prueba con IDs cruzados y
  se audita desde su primera versión.
- CU-14 → CU-05 → CU-06: el material vive en módulos publicados.
- CU-07 → CU-08 → CU-09 → CU-10 → CU-11 → CU-12: la cadena de la nota.
- CU-15 (BE-20) en S5, antes de publicar notas en S6: un intento
  `in_progress` bloquea la publicación.
- Cada Spec Kit (PREP) precede a la semana que implementa su alcance.
- CI-02 → CI-07: el rollback necesita releases versionadas. Desde
  CI-10, las migraciones deben ser compatibles con la versión anterior
  para que el rollback no rompa la aplicación.
- Entrega 3 al cierre de S4: la demo usa CU-01 a CU-04 en Railway y ejecuta el
  rollback; DOC-10 requiere las métricas registradas desde S1
  (PREP-03 y gestión semanal), y DOC-09 incluye los reportes
  de Trivy, análisis estático y Semgrep (CI-03, CI-04, CI-06).
- Entrega 4 al cierre de S7: PREP-16 usa las métricas acumuladas y el
  estimado vs. real; la demo en vivo usa la release final (CI-15) y las
  revisiones del bot (CI-14) son evidencia del proceso.

## Entregables mínimos por fase

### Walking skeleton

- frontend y backend distinguibles;
- endpoint de salud;
- frontend conectado al backend;
- CI y build Docker;
- deployment Railway mediante configuración versionada;
- release por tag, versionado automático y rollback.

### Multi-tenancy compartida

- una PostgreSQL;
- Institutions `uc` y `utfsm` creadas por bootstrap, no por migración;
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

- No elegir ORM ni herramienta de migraciones antes de PREP-04.
- No elegir proveedor de archivos antes de PREP-19.
- No implementar RLS.
- No agregar Redis, workers, Cassandra, MinIO ni emuladores cloud.
- No implementar provisioning dinámico o UI administrativa.
- No modelar facultades, departamentos ni campus.
- No diseñar sharding futuro.
- No agregar integración de archivos sin un consumidor real.

## Criterio de avance

Cada iteración deja evidencia ejecutable o documental: CI verde, deploy en
Railway y casos de uso demostrables en ambas Institutions. Ningún flujo
académico se considera listo sin pruebas negativas entre UC y UTFSM (`401`,
`403` y `404` según corresponda). Si una semana excede su carga, se replanifica
moviendo primero tareas P2 y P1, sin partir un caso P0 entre semanas.
