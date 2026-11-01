# Evidencia de Proceso de Desarrollo y CI/CD — Entrega 3

**Responsable del Bloque:** Daniel Fierro | **Issues:** #167, #168, #173  
**Alcance:** Ciclo de desarrollo, PRs, revisiones, bot IA, ADRs, deuda, bugs, DoD, pipeline y producción.  
**Referencias Checklist E3:** `E3-04` a `E3-13`, `E3-22`, `E3-23`.

---

## 1. Ciclo de Desarrollo, Ramas y Pull Requests (`E3-04`, `E3-05`)

El equipo implementó un flujo de integración continua estricto sobre `dev`:
1. **Ramas atómicas:** Creadas desde `dev` bajo convención `<tipo>/<nombre-corto>` (`feat`, `fix`, `test`, `docs`) vinculadas al issue.
2. **Commits convencionales:** Trazabilidad estricta (`feat:`, `fix:`, `test:`, `docs:`) referenciando `#issue`.
3. **Squash & Merge:** Protegido por GitHub Actions; prohibido el push directo a `dev` y `main`.

| PR | Rama | Autor | Descripción y Evidencia | Merge |
| :--- | :--- | :--- | :--- | :--- |
| **#125** | `feat/demo-tenant-isolation` | SP | Aislamiento RLS en PostgreSQL y carga demo idempotente UC/UTFSM. | Merged `dev` |
| **#91** | `docs/bot-pr-reviewer-spec` | DF | ADR y especificación técnica de seguridad del Bot PR Reviewer con IA. | Merged `dev` |
| **#151** | `fix/academic-experience` | JC/MA | Corrección de sesión y gestión de participantes con QA en vivo. | Merged `dev` |
| **#177** | `fix/deploy` | DV | Corrección de URLs dinámicas del backend en despliegue Render. | Merged `dev` |
| **#76** | `test/isolation-matrix` | DF | Matriz de 23 tests de aislamiento multi-tenant; 99.53% de cobertura. | Merged `dev` |

---

## 2. Revisiones de Pares y AcademiX PR Reviewer (`E3-05`, `E3-06`)

Todo PR requiere doble filtro de validación antes del merge:
- **Revisión humana par:** Aprobación obligatoria de al menos un miembro del equipo verificando lógica de negocio y arquitectura.
- **AcademiX PR Reviewer (Bot IA):** Script Node.js 24 (`.github/scripts/pr-reviewer.mjs`) que consulta la API de Gemini 3.8 Flash en Actions. Analiza el diff buscando brechas de tenencia (`tenant_id`), inmutabilidad de notas y permisos de rol, emitiendo un comentario no bloqueante.

---

## 3. Decisiones de Arquitectura (ADRs) y Deuda Técnica (`E3-08`, `E3-09`, `E3-11`)

Las decisiones técnicas duraderas se documentan en `docs/adr/` bajo estándar Nygard:
- `adopt-shared-postgresql-multitenancy.md`: BD compartida con RLS obligatoria y rol `academix_runtime`.
- `static-api-catalog.md`: Catálogo OpenAPI estático y versionado que desacopla la generación de clientes en frontend.
- `deploy-on-render.md`: Migración ágil de infraestructura desde Railway hacia Render.

**Manejo de deuda técnica:** Se monitorea en SonarQube Cloud (Maintainability Rating A, duplicación <3%). La deuda aceptada se documenta en las consecuencias del ADR o como issue en backlog; no se inicia un nuevo módulo funcional sin pagar la deuda de infraestructura previa (ej. tipado OpenAPI antes de la vista de notas).

---

## 4. Proceso de Resolución de Bugs Reales (`E3-10`)

Ciclo de corrección: detección en CI/QA $\rightarrow$ aislamiento de causa raíz $\rightarrow$ test de regresión $\rightarrow$ fix y PR.
- **Bug de Fechas en Quizzes (QA Real):** Desfase de horas al responder cuestionarios por serialización ISO sin considerar la zona horaria del cliente. Solución: normalización en frontend y suite de regresión en backend (`docs/qa/quizzes-real-backend/`).
- **Bug URLs Render (#177):** Fallo de comunicación frontend-backend por URLs estáticas tras recreación de servicios en Render. Solución: inyección de variables de entorno dinámicas en el deploy y smoke tests.

---

## 5. Definition of Done y Transiciones del Tablero (`E3-12`, `E3-13`)

**Criterios de Terminado (DoD):** Para mover una tarjeta a **Done** es obligatorio:
1. Alcance funcional implementado según especificación o issue.
2. Tests unitarios/integración contra PostgreSQL 17 real pasando en CI ($\ge$90% cobertura).
3. 8 jobs de CI/CD en verde (ESLint, OpenAPI lint, Trivy scan, doc-length <150 líneas).
4. Quality Gate de SonarQube aprobado.
5. Aprobación en revisión de pares.
6. Registro obligatorio de horas reales (`Real (h)`) en el tablero.

**Reglas de Transición:**
- `Backlog` $\rightarrow$ `Todo`: Priorizada y estimada para la iteración semanal.
- `Todo` $\rightarrow$ `In Progress`: Al crear la rama de trabajo (prohibido mover al terminar).
- `In Progress` $\rightarrow$ `In Review`: Al abrir el PR hacia `dev` (dispara CI y bot reviewer).
- `In Review` $\rightarrow$ `Done`: Aprobación par, checks verdes, merge a `dev` y horas reales imputadas.

---

## 6. Pipeline CI/CD, Producción y Muestra en Vivo (`E3-22`, `E3-23`)

**Pipeline (`.github/workflows/ci.yml`):** 8 jobs paralelos: (1) Doc Length Gate, (2) OpenAPI Contracts, (3) Changes Detection, (4) ESLint & Build, (5) Trivy Security Scan, (6) Backend Coverage contra PostgreSQL 17 real, (7) SonarQube Cloud, y (8) Bot PR Reviewer.

**Estado de Producción:** Entorno desplegado en Render (Web Service Node.js para backend y Static Site para frontend), conectado a PostgreSQL gestionado.

**Guion de Demostración en Vivo (2 min):**
1. **PR Real del Equipo:** Abrir en GitHub un PR de integración hacia `dev` (ej. experiencia académica #151 o notas).
2. **Checks Verdes:** Mostrar los 8 jobs de GitHub Actions ejecutados exitosamente.
3. **PostgreSQL Real:** Inspeccionar job `backend-coverage` (cobertura sin mocks sobre base de datos real).
4. **Quality Gate:** Exhibir dictamen verde de SonarQube Cloud y revisión asistida.
5. **Contingencia:** Enlace permanente a run `b369474` y capturas locales de respaldo.

---

## 7. Pendientes del Bloque hacia Entrega 4 (`#173`)

1. **Despliegue Continuo (CD):** Smoke tests automáticos post-deploy en Render tras cada merge a `main`.
2. **Pruebas E2E en CI:** Integración de pruebas funcionales Playwright para el flujo crítico académico.
3. **Optimización del Runner CI:** Caching multinivel de dependencias pnpm y capas Docker para bajar runs a <3 min.
4. **Afinamiento de Bot Reviewer:** Reducir alertas innecesarias en cambios exclusivamente de diseño/UI.

