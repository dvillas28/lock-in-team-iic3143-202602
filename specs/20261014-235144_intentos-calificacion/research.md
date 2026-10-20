# Research: Intentos y calificación automática

## Evidencia y alcance

Lecturas: siete specs backend, planes base/identidad/cursos/módulos, constitución
1.4.0, modelos de Entrega 2, CU-08/09/15, OpenAPI quizzes/grades/parameters y ADR
admin/ownership y cancelación. Código actual: AuthGuard, DatabaseService,
course-access, AuditService y ProblemFilter; package.json backend/frontend.
Investigación local con agente de lectura; sin nuevas tecnologías ni dependencias.

## Decisiones

### Inspección del gate T001 — 2026-10-19

Base PR #94, commit da8b59b: migración 20261019000100_quiz_authoring.sql,
quizzes y grade_items operativos, unicidad compuesta del ítem y puntos exactos
hasta dos decimales/suma ≤999999.99. canAuthorQuiz en quiz-access.ts se reutiliza
sin duplicar permisos. QuizzesService.update exige requireDraft: publicados no se
editan, una protección anterior al primer intento. 18/18 pruebas de autoría pasan
en PostgreSQL 17 exclusivo. Intentos usa prefijo posterior libre 20261019000200.
La inspección inicial de feat/cursos-roles no cubría las ramas de PR; se corrigió
usando un worktree aislado desde autoría, conservando el trabajo local ajeno.
[Registro de validación](../../docs/backend/attempts-grading-validation.md).

### 1. Ciclo temporal

**Decision**: usuario confirmó el 2026-10-19 ventana [opensAt, closesAt) para
iniciar/guardar/enviar. NULL elimina ese límite. Usar clock_timestamp() después
de adquirir locks y revalidar permisos. Fuera de ventana: 409 sin cambios.
Lectura/cancelación y replay exitoso no dependen del reloj.
**Rationale**: concreta FR-004 y mantiene cancelación explícita del ADR existente.
**Alternatives considered**: permitir entrega tardía o autocancelar al cierre;
primera descartada por usuario, segunda contradice FR-004/006 y requiere scheduler.

### 2. Serialización

**Decision**: extender protocolo User → Institution → memberships → Course
FOR UPDATE → Enrollment → Quiz → Attempt → Grade. Bloqueos en orden UUID en
cada conjunto. Course serializa también autores y futuro publicador.
**Rationale**: course-access ya usa este lock para cambios y revocaciones.
**Alternatives considered**: advisory locks por serie y tabla de contadores;
no necesarios en MVP y no coordinan solos con publicación de curso.

### 3. Persistencia y corrección

**Decision**: questions/answers JSONB según dominio; quiz_attempts guarda
score_points, score_percent y grade_value históricos; grades apunta al graded
más reciente por attempt_number, actualizable solo mientras no esté publicada.
**Rationale**: conservar evidencia de cada resultado aunque otro intento lo reemplace.
**Alternatives considered**: tablas por alternativa/respuesta o solo mejor nota;
primera no exigida, segunda contradice FR-009.

### 4. Aritmética

**Decision**: extraer puntos JSON como NUMERIC en SQL; validar pauta antes de
usar, sumar aciertos, round(100*score/total,2), luego fórmula y round(...,1).
NUMERIC positivo y round de PostgreSQL resuelven HALF_UP sin float JS.
**Rationale**: el modelo usa numeric(8,2)/(5,2)/(3,1); incluye límites de precisión
como contrato de autoría, no conversiones implícitas que cambien puntos.
**Alternatives considered**: Math.round, librería decimal o escala fija BigInt;
SQL ya disponible evita errores binarios y dependencia nueva.

### 5. Idempotencia

**Decision**: conservar start_key/submit_key en intento, únicas por tenant,
actor y operación. Comparar destino de ruta al reutilizar clave; cuerpo vacío.
La clave no puede iniciar otro quiz/sección ni enviar otro intento. Start replay
reconstruye respuesta inicial; submit devuelve recibo estable solo con la clave
original. Otra clave sobre graded da 409, sin aliases. Sin expiración MVP.
**Rationale**: OpenAPI exige Idempotency-Key; no basta índice de intento activo.
**Alternatives considered**: ledger genérico, cache o clave solo en memoria;
primero innecesario; otros pierden garantía en reinicios o entre instancias.
Aceptar claves alternativas sin persistirlas se descarta: permitiría reutilizar
una clave ya aceptada en otro intento y devolver un resultado distinto.

### 6. Permisos y visibilidad

**Decision**: propietario con student vigente en el curso y sin acceso a pauta
puede operar; inicio exige sección solicitada activa. Snapshot histórico no se
reescribe al cambiar de sección. Teacher activo cancela/lee en sección histórica;
admin dueño amplía scope solo si además conserva teacher del curso.
Assistant solo lectura de su sección, sin corrección por respuesta.
**Rationale**: ADR vigente y FR-003/005; OpenAPI AcademicView actual necesita
proyección assistant explícita para no revelar isCorrect/pointsAwarded. GET
usa anyOf: ambas vistas académicas pueden coincidir sin corrección; oneOf
rechazaría esas respuestas válidas. No agregar discriminador al DTO.
**Alternatives considered**: confiar en JWT, is_admin solo o devolver fila SQL;
todos amplían permisos o revelan campos indebidos.

### 7. Auditoría y límites entre misiones

**Decision**: allowlist de metadatos de intento y nota, sin answers/pauta ni
claves de idempotencia. Evento y mutación en una transacción; saves efectivos
se auditan sin guardar opciones elegidas. Terminales inmutables en DB.
**Rationale**: AuditService actual descarta campos desconocidos: extender allowlist
con pruebas; nunca registrar bodies ni pauta en historial docente.
**Alternatives considered**: snapshots completos o eventos fuera de tx; filtración
anticipada y posibilidad de resultado sin historia.

Autoría verificada mediante gate T001 y contrato compartido. Notas aún sin
implementación: carreras se prueban con SQL controlado y se repiten por HTTP en
su misión. No presentar esas pruebas como validación del publicador futuro.

Validación T001/T002: base PR #94 da8b59b; 18 pruebas de autoría pasan en
PostgreSQL 17 exclusivo (2026-10-19). Esquema 20261019000100_quiz_authoring.sql,
canAuthorQuiz compartido y requireDraft bloquea edición publicada antes del intento.
Puntos hasta dos decimales y total ≤999999.99 validados; GradeItem único en SQL.
Intentos usa prefijo posterior libre 20261019000200. DB efímera academix_attempts_test.
