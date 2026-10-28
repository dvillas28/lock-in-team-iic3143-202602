- después de la primera Grade publicada no se agregan ítems ni cambian pesos.

### grades

Nota vigente por estudiante y GradeItem. Una fila representa el resultado de un
estudiante en un ítem evaluado, derivado desde un QuizAttempt.

Campos: `id uuid PK`, `institution_id uuid`, `grade_item_id uuid`,
`quiz_id uuid`, `student_id uuid`, `section_id uuid`, `attempt_id uuid`,
`score_percent numeric(5,2)`, `grade_value numeric(3,1)`,
`published_at timestamptz(6) nullable`, `created_at timestamptz(6)`,
`updated_at timestamptz(6)`.

Reglas:

- `unique (institution_id, grade_item_id, student_id)`;
- FK `(institution_id, grade_item_id, quiz_id)` referencia GradeItem;
- FK `(institution_id, attempt_id, quiz_id, student_id, section_id)` referencia
  QuizAttempt;
- FK `(institution_id, student_id)` referencia InstitutionMembership;
- `score_percent between 0 and 100`;
- `grade_value between 1.0 and 7.0`, a un decimal;
- índice `(institution_id, student_id, published_at)` para la vista propia;
- el último intento graded actualiza una Grade no publicada y genera auditoría;
- una Grade publicada es inmutable.

### audit_events

Historial académico inmutable y tenant-owned.

Campos: `id uuid PK`, `institution_id uuid`, `actor_user_id uuid nullable solo operativo`,
`action varchar(64)`, `resource_type varchar(32)`, `resource_id uuid`, `course_id uuid nullable solo institucional`,
`section_id uuid nullable`, `occurred_at timestamptz(6)`, `changes jsonb`.

Reglas:

- FK `(institution_id, actor_user_id)` referencia InstitutionMembership;
- FK `(institution_id, course_id)` referencia Course;
- FK `(institution_id, section_id, course_id)` referencia Section cuando existe;
- triggers impiden UPDATE/DELETE; actor nulo exige origen, operación y operador;
- snapshots permitidos y FK compuestas protegen contexto institucional;
- índice `(institution_id, course_id, occurred_at, id)`;
- `resource_id` es polimórfico y se valida dentro de la operación de dominio;
- changes omite JWT, credenciales, claves de almacenamiento y pauta;
- evento y cambio académico se confirman en la misma transacción.

## Cálculo del libro de notas

1. `score_percent = 100 * score_points / sum(question.points)` con dos decimales
   y `HALF_UP`.
2. Hasta 60 %, `grade_value = 1 + score_percent * 3 / 60`; sobre 60 %,
   `grade_value = 4 + (score_percent - 60) * 3 / 40`, a un decimal.
3. El promedio parcial usa solo Grades publicadas:
   `sum(grade_value * weight_percent) / sum(weight_percent)`.
4. Sin ponderación publicada el promedio es `null`.
5. El backend calcula el promedio; no se almacena como columna derivada.

## Transacciones críticas

- Crear Course: insertar Course, primera Section y Enrollment `teacher` del
  creador con la misma `institution_id`.
- Iniciar intento: bloquear la serie
  `(institution_id, quiz_id, student_id)`, validar permisos y asignar número.
- Finalizar intento: inmovilizar respuestas, calificar, actualizar Grade no
  publicada y registrar AuditEvent en una transacción.
- Cancelar intento: cambiar estado, fijar fecha y auditar sin alterar Grade.
- Publicar Grades: validar scope, intentos, ponderaciones y ausencia de intentos
  activos; publicar y auditar atómicamente.
- Cambiar ponderaciones: bloquear el libro de la Institution y Course, validar
  suma y ausencia de publicaciones, persistir y auditar.

## Migraciones y backfills

- Existe una sola secuencia de migraciones para la PostgreSQL compartida.
- No se coordinan schemas ni versiones entre bases por Institution.
- node-pg-migrate ejecuta SQL nuevo sin modificar migraciones aplicadas.
- Un backfill futuro filtra explícitamente por `institution_id`, es idempotente
  cuando corresponde y usa lotes cuando el volumen lo requiere.
- Un backfill nunca infiere ni mezcla la Institution mediante datos del cliente.

## Backup y recuperación

Backup y point-in-time recovery cubren la PostgreSQL compartida completa.
Export/import lógico de una Institution puede evaluarse en el futuro, pero
restore independiente no es una capacidad del MVP.

## ERD Mermaid


Diagrama conservado en partes:

- [ERD 1](06-data-model-erd-1.md)
- [ERD 2](06-data-model-erd-2.md)

Publicación: selección explícita ítems×estudiantes, sección histórica; teacher activo,
pesos además admin dueño. Primer published_at congela pesos/ítems; Grade publicada
inmutable. grade_publications persiste recibo/selección canónica por tenant/actor/clave,
append-only con FK tenant/curso/membership. Pesos NUMERIC(5,2), total exacto 100;
promedio publicado HALF_UP, null con peso cero. Detalle y trazabilidad:
[ADR de publicación](../../adr/grade-publication-and-weight-freeze.md).
