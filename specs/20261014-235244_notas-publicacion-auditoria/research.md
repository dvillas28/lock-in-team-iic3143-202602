# Research: Notas, publicación y auditoría

Investigación basada en fuentes locales vigentes; no cambia versiones ni stack.

## 1. Dependencias reales

**Decision**: reusar stack y contratos de identidad/cursos, módulos, autoría e intentos.
**Rationale**: dependencias integradas en worktree `../academix-notas-publicacion-auditoria`,
rama `feat/notas-publicacion-auditoria`, base `cf7ef53` (intentos), que incluye
`da8b59b` (autoría), `e34499e` (módulos) y `57a113e` (identidad/cursos).
El checkout original `feat/cursos-roles` y sus cambios permanecen intactos.
Spec y AGENTS.md se copiaron del checkout original, sin commits implícitos.
Código real: src/{auth,courses,modules,materials,quizzes,attempts,audit};
GradeItem en 20261019000100_quiz_authoring.sql; Grade/quiz_attempts en
20261019000200_attempts_grades.sql. Migración nueva: 20261019000300.
`canAuthorQuiz` y `attemptView` son los predicados de pauta reutilizados.
Pruebas sobre contenedor exclusivo `academix-gradebook-test`, PostgreSQL 17,
DB `gradebook_test`; no se usa la DB del worktree de intentos.
**Alternatives considered**: tablas fake o duplicadas descartadas por integridad.
Fuentes: backend/package.json; planes de módulos/intentos; contracts/handoff.md de intentos.

## 2. Permisos reconciliados

**Decision**: pesos exigen teacher activo y admin dueño; publicar/libro requieren
teacher activo, con alcance global solo si admin dueño. Assistant consulta sus
secciones sin pauta. Auditoría mantiene admin dueño o teacher de sección.
**Rationale**: spec confirma teacher para evaluación; ownership solo amplía alcance.
OpenAPI PUT pesos debe explicitar teacher; AuditService.list ya aplica la excepción
administrativa del historial y se conserva.
**Alternatives considered**: inferir docencia de admin/superadmin descartado.
Fuentes: ADR institution-admin-and-course-ownership y ui-admin-non-admin-experiences.

## 3. Selección explícita y atomicidad

**Decision**: añadir studentIds obligatorio a PublishGradesRequest; listas no vacías,
UUID únicos, todas las secciones/ítems autorizados; cada estudiante debe tener
Grade histórica en alguna sección elegida para cada ítem elegido. Validar el
producto ítems×estudiantes completo; nunca omitir notas ausentes o no calificadas.
**Rationale**: FR-003 incluye estudiantes; OpenAPI actual solo tiene ítems/secciones.
Secciones restringen la selección, no crean un producto con secciones inexistentes.
No exigir alumno actualmente activo: sección histórica manda y debe poder cerrarse
su expediente tras revocación. Revalidar siempre permisos del actor.
**Alternatives considered**: publicar todo lo disponible silenciosamente descartado.

## 4. Serialización e inmutabilidad

**Decision**: lockContext(actor)→Course FOR UPDATE→Enrollment autorizador→Quiz→
Attempt→Grade, UUID ordenados por conjunto; reconsultar datos después de bloquear.
Autoría y todos los escritores de intentos usan el mismo prefijo Course.
**Rationale**: permite decidir start/submit/publicación y pesos sin fantasmas;
publicación encuentra in_progress o se confirma antes de que start lo intente.
Primer published_at congela pesos y alta/borrado/cambio de identidad de GradeItem.
Triggers protegen invariantes SQL; servicio valida todo el conjunto bajo locks.
**Alternatives considered**: bloqueo solo Grade, SELECT previo o cancelación implícita
no protegen contra inicio concurrente ni cumplen FR-004/005.
Fuente: data-model.md y contracts/handoff.md de intentos.

## 5. Idempotencia durable

**Decision**: tabla grade_publications, única por tenant/actor/Idempotency-Key,
con request canónico, curso y recibo original; ordenar arrays para comparar.
Replay exacto revalida autorización actual sobre toda la selección antes de devolver
recibo; no vuelve a auditar. Clave con otro curso/body: 409. Fallo no reserva clave.
Otra clave sobre cualquier Grade ya publicada: 409, sin nueva publicación.
**Rationale**: conservar publishedCount/publishedAt exactos incluso tras reinicio.
**Alternatives considered**: memoria, alias de claves y timestamp recalculado descartados.

## 6. Decimales y visibilidad

**Decision**: pesos numeric(5,2); rechazar más de dos decimales sin redondear entrada.
Calcular sum(grade_value*weight_percent)/NULLIF(sum(weight_percent),0) en SQL
sobre notas publicadas del alumno, round(...,1). Cero publicado da null; isPartial
es publishedWeightPercent<100. No promediar notas no publicadas en libro académico.
**Rationale**: catálogo ya usa esa precisión; evita float JS y cero artificial.
**Alternatives considered**: promedio del curso completo o float JS descartados.
Fuentes: catálogo/modelo Entrega 2; SC-002; schemas/grades.yaml.

## 7. Reutilización de auditoría y contratos

**Decision**: ampliar allowlists por recurso y sanitizar también al leer eventos
históricos; preservar filtros, curso/sección históricos y paginación existentes.
Publicación emite grade.published por Grade en su sección histórica; pesos emite
gradebook.weightsUpdated con snapshot global section_id=NULL.
**Rationale**: AuditService.record filtra al escribir, list retorna changes almacenado;
la lectura necesita defensa para eventos antiguos y nuevos tipos sin filtrar pauta.
**Alternatives considered**: segundo historial, snapshots de answers o claves descartados.
Listar intentos reutiliza proyecciones existentes; ampliar respuesta con anyOf de
Teacher/Assistant, pues contrato actual solo lista QuizAttemptAcademicView.

Migración adicional `20261019000400_validate_publication_history.sql`: valida
publicaciones preexistentes (pesos, resultado graded, último intento y ausencia
de activos), falla sin reparar historia inválida. Se añade después de 003 para
conservar la migración ya ejecutada en la DB exclusiva durante desarrollo.
