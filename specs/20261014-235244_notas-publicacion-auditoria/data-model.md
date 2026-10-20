# Data Model: Publicación y libro de notas

PostgreSQL 17; UUID, timestamptz(6), NUMERIC; tenant explícito en todas las relaciones.
Dependencias: GradeItem de autoría; quiz_attempts/grades de intentos. No recrearlas.

## grade_items (existente; reforzar invariantes)

id,institution_id,course_id,quiz_id UUID NOT NULL; title varchar(200);
weight_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK entre 0 y 100; created_at.
UNIQUE(institution_id,quiz_id); FK compuestas a curso/quiz del mismo tenant.
Mantener UNIQUE(institution_id,id,quiz_id) usado por Grade.
Actualizar pesos exige lista completa exacta de IDs y total NUMERIC 100.
Total inicial 0 o parcial es válido antes de configurar; publicar exige 100.

Desde cualquier Grade publicada del curso: impedir INSERT/DELETE de GradeItem,
UPDATE de weight_percent y cambio de identidad/quiz/curso de un ítem. BEFORE
trigger toma Course FOR UPDATE antes de comprobar publicación, también para SQL
directo. No permitir mover un ítem entre cursos. Mantener edición de título
según autoría; no implica recorrección ni cambio de identidad de nota.
Antes de publicar, reemplazo de pesos en una tx, evento global con before/after.
PUT idéntico sin publicaciones es no-op sin evento; tras freeze responde 409.

## grades (existente; publicación)

id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id NOT NULL;
score_percent numeric(5,2), grade_value numeric(3,1), published_at NULL o timestamp;
created_at/updated_at existentes. UNIQUE(institution_id,grade_item_id,student_id).
FK compuesta a intento conserva quiz, estudiante y sección originales.
No reemplazar sección histórica por Enrollment actual.

Transición permitida: no publicada → publicada, conservando resultado/attempt_id/
identidades/created_at, cambiando solo published_at y updated_at.
Nota publicada no admite UPDATE/DELETE; trigger de intentos se conserva/refuerza.
Servicio exige Attempt graded y Grade correspondiente al último intento calificado;
si falta Grade o hay in_progress del estudiante/quiz elegido, 409 para todo el lote.
No se cancela ni recalifica dentro de publicación.

Índices: conservar unique por ítem/alumno y acceso por tenant/student/published_at;
añadir solo si no existen lookup grade_items(institution_id,course_id) y
Grades(institution_id,section_id,student_id). Confirmar EXPLAIN antes de duplicar.

## grade_publications (nueva; recibo durable)

id uuid PK; institution_id,course_id,actor_user_id uuid NOT NULL;
idempotency_key text NOT NULL CHECK longitud 1..200;
request jsonb NOT NULL; published_count integer NOT NULL CHECK >0;
published_at timestamptz NOT NULL, mismo valor que Grades del lote.
UNIQUE(institution_id,actor_user_id,idempotency_key).
FK(institution_id,course_id) → courses(institution_id,id);
FK(institution_id,actor_user_id) → institution_memberships(institution_id,user_id).
ON DELETE RESTRICT; actor/membership pueden desactivarse, no borrarse.
request = {gradeItemIds,sectionIds,studentIds}, UUID únicos, arrays ordenados.
CHECK jsonb_typeof(request)='object'; servidor valida forma exacta del contrato.
Trigger impide UPDATE/DELETE. No exponer request/claves por DTO ni auditoría.
Recibo = {publishedCount: published_count,publishedAt: published_at}.

## AuditEvent (existente; append-only)

Reutilizar audit_events y sus FK institution/course/section; no crear tabla paralela.
Evento grade.published usa resource_type=grade y resource_id=Grade.id,
course_id y section_id históricos, before/after permitidos de Grade.
Evento gradebook.weightsUpdated usa resource_type=gradebook y resource_id=Course.id,
course_id=Course.id, section_id=NULL, snapshots {items:[{gradeItemId,weightPercent}]}.
Allowlist anidada explícita; no permitir objetos arbitrarios por aceptar items.
Sanitizar igualmente al leer eventos antiguos; nunca answers/isCorrect/pointsAwarded,
pauta, credenciales, tokens, claves ni emails. Fallo al auditar revierte todo.

## Transacción y carreras

1. Validar body/header sin consultar recursos ajenos; resolver tenant vigente.
2. lockContext actor (User/Institution/membership); Course FOR UPDATE; Enrollment
   autorizador. No pedir locks de identidad de estudiantes después del curso.
3. Revalidar teacher/owner/selección. Buscar recibo por tenant/actor/key: distinto
   curso/request da 409; mismo request exige alcance vigente completo y retorna original.
4. Para request nuevo: bloquear GradeItems, quizzes, intentos y Grades en orden
   estable; todos los escritores comparten Course primero. Releer selección exacta,
   suma 100, estado graded y ausencia in_progress sin filtrar silenciosamente.
5. Rechazar cualquier Grade ya publicada; fijar un timestamp DB común al lote;
   actualizar todas, insertar eventos y recibo; COMMIT único.

Dos requests con misma clave/selección devuelven recibo idéntico; unique y rollback
resuelven carreras entre cursos del mismo actor sin filtrar datos. Distinta selección
misma clave produce 409. Distintas claves que se solapan: una publica, otra falla.
Start primero → publicación 409; publicación primero → start 409.
Submit primero → publicación usa Grade final; publicación con activo primero → 409.
Cambio de pesos primero → publicación valida nuevos pesos; publicación primero →
pesos/alta de ítems 409. Reintento de submit confirmado no muta nota publicada.

## Migración y lecturas

Propuesta backend/migrations/20261019000300_grade_publication.sql, confirmar orden
tras autoría e intentos. Sin cambiar notas previas ni borrar eventos. Añadir
constraints/trigger sin reescribir migraciones aplicadas; fallar si datos violan reglas.
Verificar vacío, upgrade poblado, repetición y readiness tras reinicio.
Libro y promedio consultan bajo contexto vigente; revocación confirmada se observa
en la siguiente petición. Student solo own published; assistant sin pauta.
Paginación académica por filas históricas estudiante/sección con cursor ligado a
actor/tenant/curso/filtros; no multiplicar una Grade por Enrollments actuales.
