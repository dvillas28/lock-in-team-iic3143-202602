# Research: Rendición frontend de quizzes

## 1. Stack y reutilización

**Decision**: Conservar Next/React/TypeScript, Session.request, cliente OpenAPI,
listado/detalle existentes y estilos compartidos; coordinación local de intentos.
**Rationale**: API y UI de autoría ya existen en workspace; useMutation bloquea
mutaciones inciertas y no admite replay idempotente con identidad propia.
**Alternatives considered**: Nueva librería de estado, retry genérico y cambios
al hook de todos los formularios: complejidad y riesgo sin valor requerido.
**Evidence**: `frontend/package.json`, `frontend/src/components/courses/use-mutation.ts`,
`frontend/src/lib/auth/session.ts`, `frontend/src/components/quizzes/quiz-list.tsx`.

## 2. Operaciones y replay

**Decision**: Clave UUID opaca independiente para start y submit, ligada a
actor/tenant/destino. Mantenerla en memoria hasta resolver; nunca rotarla por 409.
Start no lleva cuerpo; sección va en path. Después de start siempre GET actual.
**Rationale**: Replay start reconstruye creación original, incluyendo answers [],
inProgress y fechas terminales null; no representa estado actual. Submit replay
retorna recibo original sin recalificar y revalida permisos aun tras cierre/publicación.
**Alternatives considered**: Tratar 201 como estado actual o nuevo UUID por clic:
restaura estado obsoleto o impide recuperar una operación aplicada.
**Evidence**: `backend/src/attempts/attempts.service.ts`,
`docs/reference/openapi/paths/quizzes.yaml`, `docs/adr/quiz-attempt-lifecycle-and-grading.md`.

## 3. Guardado y envío coordinados

**Decision**: Guardado manual de snapshot completo, controles congelados durante
mutación; confirmación explícita para borrar todas. Submit guarda cambios primero.
PUT incierto bloquea nuevas escrituras; submit incierto solo permite consulta o
replay POST original sin guardar de nuevo. Nunca convertir timeout en rechazo.
**Rationale**: PUT no tiene versión/ETag; GET puede adelantarse a una petición tardía.
Backend define pertenencia de alternativas, límites, ventana y calificación.
**Alternatives considered**: Autosave, PUT concurrentes o replay de toda la cadena:
pueden sobrescribir respuestas o impedir recuperar submit ya aplicado.
**Limit**: No garantizar coordinación entre pestañas/clientes ni recuperar PUT
incierto con una sola lectura; sin ampliar API, conservar bloqueo y explicación.
**Evidence**: `backend/src/attempts/attempts.service.ts`, FR-005/008/009/011.

## 4. Reanudación y navegación

**Decision**: Reanudar solo desde ID conocido. GET intento aporta quizId; GET quiz
seguro aporta courseId; validar antes de adoptar contexto. Mantener resumen terminal
sin preguntas si falla lectura de quiz. Extender retorno login solo con ruta UUID.
**Rationale**: Attempt DTO carece de courseId; getQuiz actual pide courseId esperado.
safeReturnPath solo acepta institutions/courses y ProtectedInstitution pierde pathname.
GET intento histórico puede autorizarse tras traslado de sección aunque GET quiz dé
404; no exigir preguntas para terminales/cancelación. Si Session invalida contexto
por ese 404, mostrar acceso no disponible y revalidar, sin eludir su limpieza.
**Alternatives considered**: CourseId de query/storage, listar intentos como student,
aceptar cualquier next: datos no confiables, operación inexistente o redirección abierta.
**Evidence**: `backend/src/attempts/attempt-dto.ts`, `frontend/src/lib/auth/navigation.ts`,
`frontend/src/components/auth/protected-institution.tsx`, `frontend/src/lib/api/quizzes.ts`.

## 5. Permisos y cancelación

**Decision**: Seguir attemptView/studentEligible y canAuthorQuiz actuales. Student
propietario sin pauta; teacher de sección histórica o teacher admin dueño cancela;
assistant consulta sin cancelar. Admin institucional aislado no da acceso académico.
**Rationale**: Curso administrable y acceso a pauta son capacidades distintas;
sección histórica no se reemplaza por matrícula actual. Cancelación permite resolver
abandono fuera de ventana aun con estudiante revocado, conserva número y no crea nota.
**Alternatives considered**: Permiso por URL demo, isAdmin solo, ventana frontend o
matrícula actual del propietario: contradicen API y snapshot histórico.
**Evidence**: `backend/src/attempts/attempt-access.ts`, `backend/src/quizzes/quiz-access.ts`,
`docs/adr/close-abandoned-quiz-attempts.md`, `docs/adr/institution-admin-and-course-ownership.md`.

## 6. Vistas seguras y validación

**Decision**: Validar payloads runtime y proyectar seguimiento mínimo; student
rechaza campos académicos inesperados. Recibo solo id/status/submittedAt.
No renderizar puntos de pregunta ni corrección en esta misión. Conservar claves y
respuestas solo en memoria autorizada, limpiar al perder acceso.
**Rationale**: OpenAPI usa anyOf; vistas académicas se solapan antes de calificar.
Los mocks HTML no son autorización ni contrato de persistencia.
**Alternatives considered**: Cast TypeScript, imprimir DTO completo o copiar
sessionStorage del mockup: expone datos y oculta contratos rotos.
**Evidence**: `docs/reference/openapi/components/schemas/quizzes.yaml`,
`frontend/src/lib/api/errors.ts`, DESIGN.md y mockups/README.md.

## Resolución

Sin aclaraciones pendientes. Investigación basada en código/contratos locales;
no se cambiaron versiones ni se requiere investigación externa para elegir stack.
Deuda backend conocida: resolución temporal submilisegundo documentada en ADR;
no modificarla en esta misión frontend.

## Evidencia de implementación (2026-10-22)

- T001: `pnpm --dir frontend api:check` PASS; sin discrepancias ni cambios API.
- Rama observada: `feat/frontend-autoria-quizzes`; la referencia de rama actual
  del plan era anterior. Se trabajó sobre esta spec sin cambiar de rama.
- T013: GET inicial proyecta seguimiento; metadata segura deriva courseId. Solo
  student editable carga preguntas. Terminales/staff no dependen de preguntas.
- El 404 del quiz histórico sigue limpiando/revalidando Session: no se elude
  la barrera para mostrar datos ni cancelar; reanudar puede requerir recuperar
  acceso institucional. Una caída no autorizativa permite resumen terminal mínimo.
- UUID compartido ahora exige 36 caracteres: `$` aceptaba un salto final,
  incompatible con retorno local exacto. Regresiones de cursos/login incluidas.
- Resultados y límites: [evidencia](../../docs/guides/frontend-quiz-attempts.md).
