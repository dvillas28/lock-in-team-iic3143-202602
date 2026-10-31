# Entrega 3 — Conciliación del tablero

Corte: **2026-10-30**, snapshot del [Project lock-in-LMS](https://github.com/users/dvillas28/projects/3)
y código en `origin/dev` (`9046305`). **A, C y F aplicados el 30/10**; B y D pendientes de decisión.
Base para E3-02, E3-12, E3-24 y E3-33/34 del [checklist](checklist-entrega-3.md).

## Por qué conciliar

El tablero marca 64/123 tarjetas Done (255/461 h), pero varias funcionalidades
de las semanas 5–6 ya están integradas en `dev`. Sin conciliar, el burnup
subestima el avance y la proyección de E3-25 sale pesimista. Además, quedan
tarjetas que apuntan a Railway, abandonado el 22/10 ([ADR](../../adr/deploy-on-render.md)).

## A. Pasar a Done (evidencia verificada en `dev`)

`Real (h)` queda por completar con cada responsable; no se inventan horas.

| Sem. | Tarjeta | Est. | Evidencia |
| --- | --- | ---: | --- |
| 1 | #23 Bot PR reviewer: proveedor, token y criterios | 3 | `.github/scripts/pr-reviewer.mjs`, PR #157 |
| 2 | #56 PostgreSQL en CI y migraciones antes de tests | 3 | Job `backend-coverage` en `ci.yml` |
| 3 | #78 Bot: workflow base que comenta cada PR | 4 | `pr-reviewer.yml`; comentó en #156, #157 y #164 |
| 3 | #84 Integración y aislamiento como check obligatorio | 2 | Rulesets `dev`/`main` exigen `CI result`, que depende de `backend-coverage` |
| 4 | Bot: incorporar criterios de lms-reviewer | 3 | Prompt de `pr-reviewer.mjs` (aislamiento, roles, auditoría) |
| 4 | Migraciones previas al deploy en Render | 2 | `render.yaml`: `serve.js` ejecuta predeploy (free sin `preDeployCommand`) |
| 5 | Organizador de módulos (orden y publicación) | 8 | `modules-panel.tsx`, `reorderCourseModules`, `publication-toggle.tsx` |
| 5 | Editor de material markdown | 6 | `material-form.tsx`, `academic-markdown.tsx` |
| 5 | Vista estudiantil de módulos y material | 5 | `courses/[courseId]/modules`, `material-reader.tsx` |
| 5 | Editor de quiz para coordinador y docente | 10 | `quizzes/[quizId]/authoring`, PR #131, #158, #164 |
| 5 | Rendir quiz sin exponer la pauta | 6 | `attempts/[attemptId]`, PR #132; `attempt-integrity.test.mjs` |
| 5 | Cancelar intento (estudiante y personal) | 3 | `attempt-cancel.tsx` |
| 6 | Libro de notas docente y revisión de intentos (BE) | 8 | `backend/src/gradebook`, PR #98; `gradebook-attempts-read.test.mjs` |
| 6 | Consulta de auditoría con filtros (BE) | 4 | `audit.controller.ts` (actor y rango de fechas), PR #98 y #160 |
| 6 | Envío del intento y confirmación de recepción | 3 | `attempt-submit.tsx` |
| 6 | Configuración de ponderaciones | 4 | `course-gradebook.tsx`; `gradebook-weights.test.mjs` |
| 6 | Publicación de notas por elemento y sección | 5 | `grade-publication.tsx`; `gradebook-publication.test.mjs` |
| 6 | Vista de notas y promedio del estudiante | 4 | `courses/[courseId]/grades`, `student-grades.tsx` |
| 6 | Vista del libro de notas docente | 6 | `courses/[courseId]/gradebook`, PR #133 |
| 6 | Vista de auditoría del curso | 4 | `courses/[courseId]/audit`, PR #133 |

**Total: 20 tarjetas, 93 h estimadas.** 16 son drafts (semanas 4–6); ver F.

## B. Confirmar con el responsable antes de mover

| Sem. | Tarjeta | Est. | Resp. | Qué hay | Propuesta |
| --- | --- | ---: | --- | --- | --- |
| 2 | #49 Matriz de escenarios de aislamiento | 3 | FierroD | Escenarios en `specs/20261020-211552_demo-aislamiento-dominios/tasks.md` | Done si se acepta como matriz |
| 3 | #76 Tests CU-01/02: slug, membership inactiva, JWT inválido | 3 | FierroD | `tenant-isolation`, `access-revocation`, `auth` | Done si cubren los tres casos; si no, abierta |
| 4 | Tests de aislamiento de cursos, secciones y pertenencias | 3 | FierroD | Casos cruzados en `courses-read`, `enrollments` | Idem |
| 5 | Tests de aislamiento de material y quizzes | 4 | FierroD | `content-access`, `attempt-permissions`, `attempt-integrity` | Idem |
| 6 | Tests de aislamiento de notas (ayudante solo lectura) | 4 | FierroD | `gradebook-*-permissions`, `gradebook-audit-scope` | Idem |
| 2–3 | #59 y #82 Gestión semanal | 4 | dvillas28 | Snapshot diario y [guía de métricas](../../guides/board-metrics.md) | Done con `Real (h)` o cerrar como no realizada |
| 5 | Smoke test post-deploy (health y login demo) | 3 | dvillas28 | `scripts/postdeploy-demo.mjs`, manual | Re-estimar a 1 h: automatizarlo en `release.yml` |

## C. Cerrar sin implementar

| Tarjeta | Est. | Motivo |
| --- | ---: | --- |
| #57 Reporte de seguridad con Semgrep | 2 | Reemplazado por SonarQube (#28) y Trivy (#27). Práctica abandonada para E3-07. |

## D. Re-titular o re-priorizar (Railway → Render)

| Tarjeta actual | Propuesta | Est. |
| --- | --- | ---: |
| #60 Rollback a la release anterior en Railway | **Decidir:** «Rollback en Render probado en la demo» (redeploy del deploy anterior) o cerrar y quitar rollback del guion E3 | 4 → 2 |
| E3: ensayo… local y en Railway | «…local y en Render (calentar servicios antes)» | 2 |
| E4: ensayo… local y en Railway | «…local y en Render» | 3 |
| E3: presentación y guion de demo… y rollback | Quitar «y rollback» si #60 se cierra | 4 |
| Verificar backup y PITR en Railway (P1, sem. 7) | **P0, sem. 5:** «Renovar la Postgres free de Render antes de su vencimiento y verificar respaldo (RNF5)» | 2 → 3 |

La Postgres free de Render expira 30 días después de creada (gracia de 14 días).
Si se creó el 22/10, vence cerca del **21/11**, la víspera de E4. Confirmar la
fecha en el dashboard de Render.

## E. Se mantienen pendientes

- **E3 (sem. 4, dvillas28 y equipo):** presentación, ensayo, proceso,
  testing/cobertura, métricas, plan actualizado y gestión semanal (≈ 21 h).
- **Bot (FierroD):** ajustar falsos positivos y operar en todos los PRs (4 h).
- **E4 (sem. 6–7):** arquitectura final, feedback E1–E3, retrospectiva,
  informe/PDF, ensayo, riesgos, accesibilidad/tema oscuro, release y evidencia (≈ 33 h).
- **P2 material en archivos (spmasabeu, Jbcleon, matiaraos):** ADR de storage,
  cliente, bucket, material por archivo, subida/descarga (21 h). Candidato a
  declararse fuera del MVP en E3-27.

## F. Drafts

El tablero tiene 56 drafts (46 %), todos creados el 03/10 al importar el
backlog. La regla de convertirlos en issue al inicio de su semana no se aplicó
desde la semana 4: sus 11 tarjetas siguen como draft. Consecuencias:

- **Sin trazabilidad:** una PR no puede cerrar un draft (`Closes #N`); por eso
  el trabajo de #128–#133, #145 y #158 no movió el tablero.
- **Fechas falsas:** `board-metrics.mjs` fecha el término de un draft en su
  primer snapshot Done y su lead time parte el 03/10. Un draft movido hoy
  marcaría ~27 días aunque se haya terminado antes.

| Grupo | Tarjetas | Tratamiento |
| --- | ---: | --- |
| Drafts del bloque A (ya implementados) | 16 | Pasar a Done **sin convertir**. Marcarlos como conciliación: cuentan en burnup, quedan fuera de lead y cycle time. |
| Drafts pendientes de semanas 4–5 | 10–12 | **Convertir a issue ahora** para que las PR de esta y la próxima semana los cierren. |
| Drafts de semanas 6–7 | 29 | Mantener como draft; convertir al inicio de su semana dentro de la gestión semanal. |

Pendientes a convertir:

- **Semana 4:** presentación y guion, ensayo, proceso de desarrollo, estrategia
  de testing, métricas, plan actualizado y gestión semanal (7).
- **Semana 5:** smoke test post-deploy, bot (falsos positivos) y gestión semanal (3).
- **Según B:** tests de aislamiento de cursos (sem. 4) y de material/quizzes
  (sem. 5), solo si FierroD confirma que siguen pendientes (0–2).

Convertir un draft en issue después de terminado y cerrarlo de inmediato daría
lead time 0, igual de falso; por eso los del bloque A no se convierten.
Los de semanas 6–7 tampoco se convierten ahora: la issue nacería semanas antes
de empezar el trabajo y el lead time incluiría esa espera.

## Efecto esperado

| | Tarjetas Done | Horas Done | Pendiente |
| --- | ---: | ---: | ---: |
| Hoy | 64 / 123 (52 %) | 255 / 461 (55 %) | 206 h |
| Tras A + C | 84 / 122 (69 %) | 348 / 459 (76 %) | 111 h |
| Tras A + B + C | hasta 91 / 122 (75 %) | hasta 369 / 459 (80 %) | ≈ 90 h, de ellas 21 h P2 |

Cerrar #57 la saca del alcance (122 tarjetas, 459 h). No incluye las
re-estimaciones de D; las cifras de B dependen de las confirmaciones.

## Cómo se aplicará

1. Revisión de esta propuesta (A–F) y decisión sobre #60 y P2.
2. Edición del Project con `gh project item-edit` y cierre de issues con un
   comentario que enlaza la evidencia.
3. Conversión de los drafts pendientes de semanas 4–5 con la mutación GraphQL
   `convertProjectV2DraftIssueItemToIssue`, que conserva los campos del Project.
4. Lista de tarjetas conciliadas en `board-metrics.mjs`, excluidas de lead y
   cycle time; se mantienen en burnup y distribución por tipo/área.
5. Responsables completan `Real (h)` de las tarjetas movidas.
6. Snapshot manual (`Board snapshot` → Run workflow) para que el burnup lo
   registre hoy; el salto se explica en E3-24 como conciliación, no como avance del día.

## Estado de aplicación (30/10)

- **A:** 20 tarjetas en Done; #23, #56, #78 y #84 cerradas con su evidencia.
- **C:** #57 cerrada como *not planned* y archivada del Project (el cierre la movía a Done).
- **F:** drafts de semanas 4–5 convertidos en #165–#174 con campos y responsables.
- **Métricas:** `board-metrics.mjs` excluye las 20 conciliadas de lead y cycle time.
  Resultado: 84/122 tarjetas (69 %) y 348/459 h (76 %); cycle time máximo 5,9 días.
- **Pendiente:** `Real (h)` de las 20 tarjetas, bloques B y D, y merge a `main`
  para que el reporte diario use la exclusión.
