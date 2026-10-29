# Reglas y contratos del catálogo

## Constraints

| Tabla | Tipo | Campos o condición | Justificación |
| --- | --- | --- | --- |
| institutions | UNIQUE | (slug) | Evita repetir el identificador legible de una institución. |
| institution_memberships | UNIQUE | (institution_id, user_id) | Una pertenencia estable por usuario e institución. |
| courses | UNIQUE | (institution_id, code, term) | Evita duplicar un curso del mismo periodo en una institución. |
| sections | UNIQUE | (institution_id, course_id, code) | Código de sección único dentro de cada curso institucional. |
| course_modules | UNIQUE | (institution_id, course_id, position) | Evita módulos con la misma posición dentro de un curso. |
| quiz_attempts | UNIQUE | (institution_id, quiz_id, student_id, attempt_number) | Evita repetir un número de intento para el mismo estudiante y quiz. |
| grade_items | UNIQUE | (institution_id, quiz_id) | Un único ítem del libro de notas por quiz. |
| grades | UNIQUE | (institution_id, grade_item_id, student_id) | Una única nota vigente por estudiante e ítem evaluado. |
| courses | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| sections | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| course_modules | UNIQUE | (institution_id, id) | Respalda una FK compuesta que comprueba institución y contexto. |
| sections | UNIQUE | (institution_id, id, course_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| quizzes | UNIQUE | (institution_id, id, course_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| grade_items | UNIQUE | (institution_id, id, quiz_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| quiz_attempts | UNIQUE | (institution_id, id, quiz_id, student_id, section_id) | Respalda una FK compuesta que comprueba institución y contexto. |
| enrollments | UNIQUE INDEX parcial | (institution_id, section_id, user_id, role) WHERE active | No duplica un rol activo; conserva filas históricas. |
| quiz_attempts | UNIQUE INDEX parcial | (institution_id, quiz_id, student_id) WHERE status = 'in_progress' | Un único intento activo por quiz y estudiante. |
| sections | CHECK | capacity IS NULL OR capacity >= 0 | Valida los valores permitidos por el modelo. |
| enrollments | CHECK | role IN ('teacher', 'student', 'assistant') | Valida los valores permitidos por el modelo. |
| materials | CHECK | kind = 'markdown' | Valida los valores permitidos por el modelo. |
| materials | CHECK | markdown_body NOT NULL; char_length 1..10000; btrim no vacío | MVP Markdown; metadatos binarios no persistidos. |
| quizzes | CHECK | max_attempts IS NULL OR max_attempts > 0 | Valida los valores permitidos por el modelo. |
| quizzes | CHECK | opens_at IS NULL OR closes_at IS NULL OR opens_at < closes_at | Valida los valores permitidos por el modelo. |
| quiz_attempts | CHECK | status IN ('in_progress', 'submitted', 'graded', 'cancelled') | Valida los valores permitidos por el modelo. |
| quiz_attempts | CHECK | score_percent IS NULL OR score_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grade_items | CHECK | weight_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grades | CHECK | score_percent BETWEEN 0 AND 100 | Valida los valores permitidos por el modelo. |
| grades | CHECK | grade_value BETWEEN 1.0 AND 7.0 | Valida los valores permitidos por el modelo. |

| grade_publications | UNIQUE | (institution_id, actor_user_id, idempotency_key) | Replay por tenant/actor. |
| grade_publications | CHECK | key 1..200; request objeto; published_count > 0 | Recibo privado append-only. |

## Contratos JSON y estado vigente

| Columna | Contrato vigente |
| --- | --- |
| quizzes.questions | Pauta JSON con preguntas/alternativas e IDs locales estables; validada al publicar, puede estar incompleta en borrador. Límites en contrato de autoría. |
| quiz_attempts.answers | Reemplazo completo questionId/alternativeId; pregunta única y alternativa propia; graded añade isCorrect/pointsAwarded privados. |
| audit_events.changes | before/after sanitizados por allowlist en escritura y lectura; sin secretos, respuestas ni pauta. Grade exige docencia al consultar. |
| grade_publications.request | Selección canónica privada de ítems/secciones/estudiantes, no respuesta pública. |

[Contrato de quizzes](../../reference/openapi/components/schemas/quizzes.yaml),
[contrato de auditoría](../../reference/openapi/components/schemas/audit.yaml) y
[migraciones](../../../backend/migrations/) son fuentes ejecutables.

## Decisiones existentes y diferidas

| Área | Estado contrastado |
| --- | --- |
| Identidad | JWT sub resuelve users.id global; email normalizado y único por lower(btrim(email)). |
| Cadenas/defaults | Validación de aplicación y CHECK en migraciones; UUID generados por aplicación y fechas/defaults de DB según tabla. |
| Referencias | ON DELETE/UPDATE RESTRICT; historia y ownership no se borran. |
| Enteros | attempt_number positivo; position de módulos/quiz validada; capacity opcional no negativa. |
| Material | Markdown implementado; binarios, MIME/máximo/proveedor requieren otra misión. |
| Auditoría | Curso opcional solo institucional; actor nulo solo operativo con evidencia. Privacidad nueva según ADR enlazado. |
| Inmutabilidad | Triggers protegen auditoría/ledger, intentos terminales, pauta congelada y notas publicadas. |
| Persistencia | pg y node-pg-migrate ya implementados; sin ORM ni migración nueva por polish. |

[Privacidad de auditoría](../../adr/grade-audit-visibility.md),
[roles](05-domain-model.md) y [límites de cuentas](../../guides/demo-accounts.md).

Intentos: checks coherentes de estado/fechas/resultados, claves de 1..200 únicas
por tenant/student/operación; constraint diferible impide submitted persistido.
Triggers conservan identidad e intentos terminales; Grade publicada es inmutable.
GET student omite resultados/corrección; assistant omite corrección por respuesta.

Publicación: selección explícita ítems×estudiantes, sección histórica; teacher activo,
pesos además admin dueño. Primer published_at congela pesos/ítems; Grade publicada
inmutable. grade_publications persiste recibo/selección canónica por tenant/actor/clave,
append-only con FK tenant/curso/membership. Pesos NUMERIC(5,2), total exacto 100;
promedio publicado HALF_UP, null con peso cero. Detalle y trazabilidad:
[ADR de publicación](../../adr/grade-publication-and-weight-freeze.md).

Ledger: id, institution_id, course_id, actor_user_id UUID; idempotency_key text
(1..200), request JSONB canónico privado, published_count integer >0,
published_at timestamptz(6). UNIQUE(tenant,actor,key); FK tenant/curso y
membership; UPDATE/DELETE prohibidos, recibo público solo count/timestamp.
