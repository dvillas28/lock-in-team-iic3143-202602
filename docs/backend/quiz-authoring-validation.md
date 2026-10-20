# Validación: Autoría y publicación de quizzes

Fecha: 2026-10-19. Base: #90 → #93 → feat/autoria-quizzes.
Alcance: CU-07; RF17–18/25–27; RNF1–4; BE-15–17. Sin reasignar backlog.
PREP-12 solo por autoría; intentos/notas conservan sus propias misiones.
Pruebas en PostgreSQL 17 desechable con TEST_DATABASE_URL terminado en _test.

## Resultados locales

- Backend build/lint y test:coverage: PASS, 81/81 pruebas.
- Cobertura global: 99,60 % líneas y 95,31 % ramas.
- Quizzes: 100 % líneas/funciones y 97,18 % ramas.
- Frontend api:check/typecheck/test/lint/build: PASS, 26/26 pruebas.
- OpenAPI: PASS; warning heredado de respuesta 4xx en /ready.
- Compose aislado: PASS; imagen real, PostgreSQL 17, cinco migraciones,
  seed repetible, probes, login/contexto y logs sanitizados.
- Audit backend: sin vulnerabilidades conocidas.
- Audit frontend: HIGH preexistente braces en eslint-config-next; sin cambios
  de dependencias/lockfiles. No se presenta como check aprobado.
- Longitud documental, enlaces, IDs de tareas y git diff --check: PASS.
- CI/Sonar remoto: consultar PR; estos resultados corresponden a ejecución local.

## Cobertura de requisitos

| Requisito | Evidencia ejecutable |
| --- | --- |
| FR-001 | quiz-authoring: create/PATCH/reasignación y IDs primarios estables |
| FR-002 | quiz-validation + quiz-schema: puntos/IDs/alternativas y restricciones |
| FR-003 | quiz-validation/authoring/schema: ventanas y FK tenant/curso |
| FR-004 | quiz-publish/integrity: ítem único peso 0, retry, rollback audit |
| FR-005 | quiz-schema/integrity: marcador monotónico y carreras con freeze SQL |
| FR-006 | quiz-contract/read + audit: DTO seguro, metadata-only, errores/logs |
| FR-007 | quiz-contract: guard con student+teacher y permisos actuales |
| FR-008 | quiz-authoring/integrity: PATCH publicado siempre 409 |
| FR-009 | quiz-authoring/read/revocation: roles, alcance y destinatarios |

SC-001: pauta inválida no publica ni crea GradeItem parcial.
SC-002: seguro no tiene isCorrect/corrección; errores/eventos/logs sin pauta.
SC-003: publish repetido conserva ítem/timestamp/evento; publicado no se edita.

## Integridad y concurrencia

Dos publish crean un único GradeItem/evento. PATCH/reasignación vs publish,
y freeze vs publish se prueban con ambos órdenes de lock y resultados seriales.
Fixtures fuerzan fallos audit en create/PATCH/reasignación/publish: estado íntegro
antes/después, sin conexiones idle in transaction.
Errores SQL del trigger de congelación se convierten selectivamente a 409;
otros checks siguen 422, fallos inesperados 500, siempre sin texto de pauta.
Revocación de User/Institution/membership/teacher/is_admin compite con cada
create/PATCH/publish en ambos órdenes usando barreras de transacción reales.
Revocación primero deniega; escritura ya autorizada primero puede confirmar,
y la siguiente petición observa el permiso revocado. Roles restantes se conservan.
Reasignar exige permiso en origen/destino; evento de curso evita exponer
snapshot histórico de origen a docente que solo tiene acceso al destino.

## Migración y consumidores

Instalación vacía y upgrade desde #90 poblado conservan identidad, cursos,
Enrollments, módulos, material y auditoría. Repetición no modifica datos.
Down se ejecutó solo tras reset de DB exclusiva vacía; no se recomienda con datos reales.
Readiness detecta ausencia de Quiz/GradeItem y del marcador de Course.
US2 prepara datos por SQL, sin endpoints de autoría; consumidor generado prueba
HTTP real, lista/detalle, errores y no-store/nosniff.
El cliente también verifica tipos de sectionId nullable y QuestionUpdate.id opcional.

## Reproducir

Prerequisitos y comandos completos en el [quickstart](../../specs/20261014-235044_autoria-quizzes/quickstart.md).
Migraciones y pruebas usan DB descartable; nunca apuntar TEST_DATABASE_URL a una compartida.
Compose smoke se ejecuta desde raíz con node backend/test/compose-smoke.mjs.

## Límites y aceptación pendiente en otras misiones

JSON HTTP conserva máximo 4096 bytes; cuerpos mayores responden 413.
No hay renderizador HTML, pantallas, binarios, intentos ni notas HTTP nuevos.
FR-005 se verifica aquí por marcador/SQL: publicación de Grade real debe fijarlo
y aplicar enforcement DB en la misma tx en notas-publicacion-auditoria.
FR-007 prueba guard; su consumo HTTP debe verificarse en intentos-calificacion.
Bloqueo tras primer intento real también se valida allí; aquí comienza al publicar.
Estas integraciones no se declaran terminadas por pasar fixtures o predicados.
