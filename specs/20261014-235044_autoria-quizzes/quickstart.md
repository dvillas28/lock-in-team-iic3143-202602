# Quickstart de validación: Autoría y publicación de quizzes

Guía reproducible; resultados ejecutados en [evidencia](../../docs/backend/quiz-authoring-validation.md).

## Prerequisitos

Base #90 con identidad, cursos, auditoría y módulos migrados.
Node 24, pnpm 9.15.9, PostgreSQL 17 exclusiva cuyo nombre termina en _test.
TEST_DATABASE_URL configurada fuera del repositorio; nunca imprimir credenciales.
Helpers recrean public: usar únicamente DB descartable.
Aplicar migración desde instalación vacía y desde base poblada de #90 mediante
migrador existente; no probar down contra datos reales.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir backend build
node --test backend/test/quiz-validation.test.mjs backend/test/quiz-access.test.mjs
node --test --test-concurrency=1 backend/test/integration/quiz-schema.test.mjs backend/test/integration/quiz-authoring.test.mjs backend/test/integration/quiz-publish.test.mjs backend/test/integration/quiz-integrity.test.mjs
node --test --test-concurrency=1 backend/test/integration/quiz-read.test.mjs backend/test/integration/quiz-revocation.test.mjs backend/test/integration/quiz-contract.test.mjs
pnpm docs:api:lint
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir backend lint
pnpm --dir backend test:coverage
python3 .github/scripts/check-doc-length.py
git diff --check
```

## Fixtures e independencia

quiz-fixtures.mjs reutiliza course-fixtures.mjs y helpers.mjs.
UC y UTFSM; dos cursos/secciones; teacher no admin, teacher admin dueño,
dueño sin teacher, admin ajeno, assistant, student y actor con roles acumulados.
Cada historia siembra Quiz/GradeItem por SQL cuando necesita estado de la otra;
US2 no llama a POST/PATCH/publish para preparar lecturas.
Foundation debe permitir arranque y registro HTTP sin tareas de historias pendientes.
No modificar seed demo, responsables ni credenciales reales.

## US1: preparar y publicar

1. Teacher de sección crea draft; teacher admin dueño también crea quiz global.
2. Vaciar questions guarda draft; publish sin preguntas devuelve 422 sin efectos.
3. Rechazar puntos <=0, varias/ninguna correcta, alternativas <2, duplicados,
   fechas invertidas, IDs ajenos, tipos coercionados y claves desconocidas.
4. PATCH preserva UUID de pregunta retenida; agrega sin id una nueva; eliminar
   y reordenar en draft conserva identidades de las restantes.
   Reasignar sectionId conserva Quiz.id/Section.id; omisión conserva y NULL amplía
   al curso. Exigir permiso en origen/destino; rechazar otro curso/tenant y publicado.
   Auditar reasignación sin revelar snapshot de origen a docentes solo del destino.
5. Publicar válido: un Quiz publicado, un GradeItem peso 0 y un evento publish.
6. Repetir publish antes/después de congelación: mismos IDs/timestamp/eventos.
7. Publicación nueva después de marcador da 409 sin ítem ni evento.
8. PATCH tras publicar da 409; no cambia ni metadata ni pauta.
9. Provocar fallo audit: rollback de Quiz/GradeItem/marker y evento.
10. Dos publish simultáneos crean solo un ítem/evento; PATCH vs publish y freeze
    vs publish respetan orden del lock. Probar ambos órdenes con barreras SQL.
11. Assistant/student/admin sin teacher no escriben ni reciben pauta.
    Probar create/PATCH/publish tras revocar User/Institution/membership/teacher/is_admin,
    y carreras con barreras: revocación primero deniega; escritura primero conserva
    solo efectos autorizados anteriores al COMMIT de revocación. Revalidar ambos
    scopes de reasignación; permisos restantes siguen habilitando su propio alcance.
12. Verificar allowlist de eventos incluso con preguntas que contengan secretos
    centinela; inspeccionar errores, logs capturados y consulta real de auditoría.

Esperado: FR-001..005/009 y SC-001/003, sin resultados parciales.

## US2: leer sin pauta

1. Sembrar drafts/publicados globales y por sección, con preguntas por SQL.
2. Lista/GET como student/assistant solo muestran publicados destinatarios;
   comparar authoring docente con GET seguro sin isCorrect ni campos adicionales.
3. Quiz global visible a student de cualquier sección; sección ajena no se descubre.
4. Teacher ordinario ve draft propio, no pauta global ni otra sección;
   teacher admin dueño sí. Admin/superadmin sin rol no acceden académicamente.
5. Probar filtro sectionId, enlaces previos, tenant/curso/quiz UUID sustituidos,
   lista vacía y esquemas exactos, también con roles acumulados.
6. Revocar User, Institution, membership, teacher, student e is_admin por separado:
   siguiente petición respeta permisos restantes; nada cacheado.
7. Guard de elegibilidad rechaza actor student con canAuthorQuiz=true; permite
   teacher de otra sección que solo es student destinatario y no obtiene pauta.
8. PATCH de fixture publicada da 409 si US1 está implementada; en US2 aislada
   verificar invariantes de estado/predicados sin requerir ruta aún ausente.
9. Verificar 413 sobre 4096 bytes, no-store/nosniff, errores sanitizados y cliente
   generado. Nunca incluir payload authoring en snapshot de test público.

Esperado: FR-006/007/008/009 y SC-002; integración HTTP de intento queda posterior.

## Evidencia de cierre

Registrar comandos/resultados en docs/backend/quiz-authoring-validation.md.
Distinguir checks con SQL simulado de futuras pruebas con intento/Grade reales.
Documentar preservación de datos previos, FK cruzadas, revocación y limitación 4 KiB.
No cerrar si falta DB, existen negativos pendientes o tipos/contrato divergen.
