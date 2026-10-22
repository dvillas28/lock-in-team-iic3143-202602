# Implementation Plan: Notas y seguimiento frontend

**Branch actual**: `feat/frontend-autoria-quizzes` | **Date**: 2026-10-22
**Branch propuesta de implementación**: `feat/frontend-notas-seguimiento`
**Spec/Input**: [spec.md](spec.md), `specs/20261021-141353_frontend-notas-seguimiento/spec.md`.

## Summary

Conectar notas propias, libro e intentos, pesos/publicación y auditoría mediante
API existente. Reutilizar sesión, cliente tipado, shell, estados y estilos.
Cuatro incrementos verificables con fixtures; sin cambios API/DB/dependencias.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, pnpm 9.15.9 |
| Dependencias existentes | Next.js 16.3.8 App Router, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Storage | Datos privados, filtros, selección y claves solo en memoria; PostgreSQL vía API |
| Testing | node:test + tsx, jsdom, c8; navegador y API real para aceptación |
| Plataforma/tipo | Web institucional UC/UTFSM, escritorio y móvil 375 px |
| Rendimiento | Páginas API de 20 por defecto, máximo 100; sin polling ni carga global habitual |
| Restricciones | Solo datos autorizados, sin promedios locales ni notas anticipadas; JSON ≤4096 bytes |
| Escala | Cuatro historias; notas, libro, intentos por quiz y auditoría bajo curso |
| Dependencias | Misiones 1–4 aportan sesión/cursos/quizzes; misión 5 aporta cancelación |

## Constitution Check

Pre-research: PASS. Post-design: PASS con límites explícitos en [research.md](research.md).

- Tenant: dominio propone slug; API valida contexto institucional del path y
  membership activa. RLS/contexto transaccional y runtime sin bypass existentes
  mantienen barrera por omisión; no introducir SQL ni excepciones globales.
- Roles: student ve sus publicadas; teacher/assistant consultan secciones activas
  propias. Teacher + isAdmin + ownership amplía libro/intentos/publicación al curso
  y configura pesos. Admin dueño sin teacher solo amplía auditoría.
  Superadmin aislado no concede permisos académicos. Multirol exige evaluación
  por acción y sección, nunca por perfil visual ni presencia de campos de nota.
- Reconciliación admin UI: prevalecen `gradebook-access.ts`, `attempt-access.ts`,
  auditoría y ADR de ownership sobre parámetros de demostración de mockups.
- Integridad: notas publicadas/recibos/eventos inmutables; pesos editables auditados
  hasta freeze. Backend calcula nota/promedio y publica atómicamente; frontend
  no recalifica, cancela automáticamente ni presenta escrituras optimistas.
- Independencia: US1/US2/US4 usan fixtures sin US3; revisión consulta GET de intento
  sin depender del formulario de rendición. Cancelación enlaza misión 5.
- Trazabilidad: CU-10/11/12/13/16; RF21–26/29; RNF1–4/7/9;
  FE-15–19/20 (JC/MA), mockups 05/06/08/15/16, FR-001–021.
- Documentación <150 líneas por artefacto; no complejidad adicional injustificada.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141353_frontend-notas-seguimiento/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/gradebook.md
  contracts/tracking-audit.md
  quickstart.md
  tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/courses/[courseId]/grades/page.tsx
frontend/src/app/courses/[courseId]/gradebook/page.tsx
frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/page.tsx
frontend/src/app/courses/[courseId]/quizzes/[quizId]/attempts/[attemptId]/page.tsx
frontend/src/app/courses/[courseId]/audit/page.tsx
frontend/src/components/gradebook/{student-grades,course-gradebook,weights-form,grade-publication}.tsx
frontend/src/components/attempts/{attempt-list,attempt-review}.tsx
frontend/src/components/audit/course-audit.tsx
frontend/src/lib/api/{gradebook,audit,attempts}.ts
frontend/src/lib/gradebook/{validation,capabilities,publication}.ts
frontend/src/lib/audit/validation.ts
frontend/src/lib/attempts/review.ts
frontend/src/components/courses/course-detail.tsx
frontend/src/components/quizzes/quiz-detail.tsx
frontend/src/components/institutions/institution-shell.tsx
frontend/src/lib/auth/navigation.ts
frontend/test/fixtures/{gradebook,audit,attempts}.ts
frontend/test/{gradebook-*,tracking-*,audit-*}.test.ts
```

## Design & Delivery

1. [Modelo](data-model.md) y [contratos](contracts/gradebook.md) fijan DTO y estados.
   Reusar `Session.request`, `useResource`, route-states y parsers existentes cuando
   apliquen. Filas del libro no tienen id propio: validar clave studentId/sectionId,
   sin usar `list/page` genérico que exige id único por elemento.
2. Rutas limpias bajo `/courses/{courseId}` con layout ProtectedInstitution.
   Enlaces por capacidad; ampliar breadcrumbs y allowlist de retorno con UUID
   exactos, sin permitir destinos externos/query/hash. API conserva slug validado.
3. US1 solo GET my-grades: promedio/pesos/isPartial backend, null como pendiente.
   Nunca llamar grade-items/libro para completar resultados de student.
4. US2 muestra sección histórica y notas de staff; listar intentos por quiz con
   filtros API. Revisión teacher usa representación académica, assistant usa
   únicamente vista staff, sin pauta/isCorrect/pointsAwarded. No elevar assistant
   por compartir DTO ni filtrar una pauta ya solicitada indebidamente.
5. US3 exige colección completa de pesos, 0–100 con hasta dos decimales; validar
   suma con centésimas enteras =10000. Backend sigue siendo autoridad numérica.
6. API no expone freeze. Para editar pesos, owner teacher recorre libro sin filtro
   hasta encontrar publishedAt o agotar páginas; bloquear mientras sea desconocido,
   tras publicación confirmada o GRADE_WEIGHTS_LOCKED. No concluir desbloqueo
   desde una página vacía/filtrada. Carrera posterior se resuelve por 409.
7. Publicación selecciona explícitamente ítems/secciones/estudiantes, sin seleccionar
   páginas ocultas. Resumen muestra IDs/títulos, cantidades y pares ítem×estudiante;
   todos los pares deben existir, ser graded/publicables y corresponder al alcance.
   Backend verifica último graded e intentos activos; UI no promete preflight atómico.
8. Conservar selección ordenada y clave por operación en memoria, inmóviles durante
   envío/incertidumbre. Doble clic comparte operación; replay usa misma clave/cuerpo.
   Tras recarga consultar libro; no atribuir recibo ni repetir POST sin clave original.
   Navegar fuera con operación incierta exige aviso de pérdida de recuperación.
9. US4 filtra eventos por campos contractuales y muestra snapshots como texto seguro,
   nunca HTML. Sin reconstruir datos ocultos ni consultas institucionales generales.
10. Scope de datos/cursors/selección incluye generation, slug, actor, curso, quiz,
    sección y filtros. Reiniciar paginación/selección al cambiar contexto; descartar
    respuestas tardías. Logout/401/expiración limpia; 403/404 limpia y revalida roles.
11. DESIGN.md y mockups guían tablas con caption/th/scope, labels, cifras tabulares,
    diálogo con foco inicial seguro/retorno, aria-live, teclado y ambos temas.
    Reusar estilos sincronizados en frontend/src/styles; FE-20 valida seis recorridos.

## Validation & Rollout

[quickstart.md](quickstart.md) cubre aceptación por historia, contratos y API real.
MVP: US1. Luego US2, US3 y US4; US4 puede adelantarse con foundation lista.
Fixtures prueban UI; API real prueba aislamiento, permisos, freeze concurrente,
replay y auditoría única. FE-20 registra evidencia/pending de cada misión sin
presentar como implementadas pantallas ajenas. Sin nuevos endpoints ni migraciones.

## Complexity Tracking

Sin violaciones. Memoria específica para publicación conserva replay incierto;
`useMutation` genérico no garantiza selección/clave estable. El recorrido global
del libro solo para pesos compensa la ausencia de freeze explícito en la API.
