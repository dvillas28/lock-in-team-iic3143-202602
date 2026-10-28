# Implementation Plan: Autoría frontend de quizzes

**Branch actual**: `feat/frontend-modulos-material` | **Date**: 2026-10-22
**Branch propuesta de implementación**: `feat/frontend-autoria-quizzes`
**Spec**: [spec.md](spec.md) | **Input**: `specs/20261021-141351_frontend-autoria-quizzes/spec.md`.

## Summary

Conectar listado seguro, creación, edición de pauta y publicación docente a la API
existente. Reutilizar Session, cliente OpenAPI, shell, campos, hooks y estilos.
Consultar GradeItem solo para mostrar el efecto confirmado; no configurar notas.
Sin cambios backend, DB, permisos, dependencias ni infraestructura.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, pnpm 9.15.9 existentes |
| Dependencias | Next.js 16.3.8 App Router, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Storage | Pauta y formulario solo en memoria de la vista autorizada; PostgreSQL vía API |
| Testing | node:test + tsx, jsdom; c8 existente y revisión en navegador |
| Plataforma/tipo | Web escritorio/móvil; orígenes institucionales configurados UC/UTFSM |
| Rendimiento | Una lista sin pauta; detalle seguro antes de cargar autoría explícitamente |
| Restricciones | JSON UTF-8 ≤4096 bytes; sin autosave, caché privada ni retry de mutaciones |
| Escala | Tres historias, quizzes por curso/sección; no implementar rendición |
| Dependencias | Sesión y cursos existentes; módulos/material no bloquean la misión |

## Constitution Check

Pre-research: PASS. Post-design: PASS. Evidencia en [research.md](research.md).

- Tenant: dominio selecciona slug solicitado; path API, membership y RLS autorizan.
  Validar courseId del quiz y relación de sección antes de renderizar cada ruta.
  Sin SQL nuevo: barrera por omisión, conexiones y credenciales conservan controles backend.
  Sin excepciones globales nuevas; mocks frontend no certifican RLS.
- Roles: teacher activo obligatorio. Teacher ordinario: sus secciones; teacher con
  isAdmin y createdBy propio: curso completo. Admin/superadmin aislados no dan pauta.
  No usar `capabilities.manage` ni permisos de contenido compartido para quizzes.
- Reconciliación admin UI: `quiz-access.ts` y ADR de autoría prevalecen sobre perfil demo;
  administrar curso y autorizar pauta son capacidades distintas.
- Integridad: draft sobrescrito con auditoría backend sin pauta; publicado inmutable.
  Backend crea GradeItem y evento atómicamente; repetición autorizada es no-op.
  UI no modifica ownership, snapshots históricos, calificaciones ni auditoría.
- Independencia: US1 crea draft vacío; US2 edita fixture draft; US3 publica fixture
  válido preexistente. Cada historia comprobable sin implementar las otras dos.
- Trazabilidad: CU-07, RF17–18/25–27, RNF1–4/7/9; FE-11/20 (JC/MA), vista 13.
- Documentación: cada artefacto <150 líneas; complejidad sin excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141351_frontend-autoria-quizzes/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/quiz-authoring.md
  quickstart.md
  tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/courses/[courseId]/quizzes/page.tsx
frontend/src/app/courses/[courseId]/quizzes/[quizId]/page.tsx
frontend/src/app/courses/[courseId]/quizzes/[quizId]/authoring/page.tsx
frontend/src/components/quizzes/{quiz-list,quiz-detail,quiz-create,quiz-editor,question-editor,quiz-publish}.tsx
frontend/src/lib/api/quizzes.ts
frontend/src/lib/quizzes/{validation,capabilities}.ts
frontend/src/components/courses/course-detail.tsx
frontend/src/components/institutions/institution-shell.tsx
frontend/src/components/courses/{use-resource,use-mutation}.ts
frontend/src/components/courses/form-fields.tsx
frontend/src/styles/quizzes.css
frontend/src/app/layout.tsx
frontend/test/fixtures/quizzes.ts
frontend/test/{quiz-api,quiz-capabilities,quiz-list,quiz-validation,quiz-editor,quiz-publication-api,quiz-publication,quiz-session}.test.ts
```

Reutilizar `ProtectedInstitution`, Session.request y estados compartidos; hooks solo
se modifican si falta una garantía, preservando sus otros callers y pruebas.
Lectura acotada de GradeItem en `lib/api/quizzes.ts`; sin módulo genérico de notas.

## Design & Delivery

1. Fundación: tipos generados, parsers separados seguro/autoría, permisos por destino,
   fixtures UC/UTFSM y scope sesión/generation/slug/courseId/quizId/tipo de vista.
2. US1: enlace desde curso; lista y detalle sin pauta, creación con título, destino,
   instrucciones, fechas e intentos; `questions: []` permite draft inicial.
   La opción curso completo existe solo para teacher admin dueño; omisión al crear
   equivale a curso, por lo que teacher ordinario envía sección explícita.
3. US2: ruta de autoría explícita, sin prefetch de pauta; sección de configuración y
   preguntas con alternativas y radio de correcta. Retener UUID de preguntas existentes;
   nuevas omiten UUID. PATCH reemplaza questions completo y conserva sectionId omitido.
   Reordenar preguntas con botones por teclado; no drag obligatorio ni tipos nuevos.
4. Validar límites en [data-model.md](data-model.md), bytes serializados y fechas con
   zona explícita. Si el usuario no cambia una fecha, conservar su valor original.
   Guardado manual; conservar entradas inválidas autorizadas y asociar errores a campos.
5. US3: confirmar destino e irreversibilidad en dialog; publicar solo estado guardado,
   bloquear si hay cambios locales. Reflejar status/publishedAt recibidos, consultar
   grade-items y mostrar el asociado por quizId con peso actual, inicial 0.
   Si falla esa lectura, conservar publicación confirmada y ofrecer reintentar lectura.
6. Curso congelado: API no expone flag en Course; explicar posibilidad al confirmar y
   409 sin afirmar causa única. Crear/editar draft sigue permitido; FR-010 se refiere
   al bloqueo de publicación de nuevos borradores, según API y escenario US3.3.
7. Resultado incierto bloquea reenvío; consultar lista/estado antes de otra acción.
   POST create no tiene idempotencia: coincidencia por título no prueba creación.
   Ambigüedad o lectura fallida mantiene bloqueo y requiere revisión explícita.
8. 401/logout/expiración/cambio de usuario/tenant limpian pauta y formularios.
   403/404 o revocación limpian datos privados, revalidan /me e ignoran respuestas viejas.
   En 409 recargar estado; no sobrescribir formulario autorizado silenciosamente.
9. Usuario teacher+student con alcance de pauta no recibe acción de rendición;
   esta misión solo explica la restricción, sin construir UI de intentos.
10. DESIGN.md, tokens/app.css integrados y mockup 13 orientan layout. Labels, fieldset,
    foco al agregar/quitar, aria-live, teclado, 375 px, ambos temas y reduced motion.

## Validation & Rollout

[quickstart.md](quickstart.md): pruebas por historia y matriz adversarial FR-016.
MVP: US1, seguido de US2/US3 con fixtures independientes y recorrido real integrado.
Registrar evidencia real separada de mocks; no declarar no-duplicación de eventos
ni RLS basándose solo en DOM. Reusar checks backend existentes sin modificar SQL.
Excluidos: intentos, corrección manual, delete/unpublish, notas, archivos y nuevos tipos.

## Complexity Tracking

Sin violaciones: misma aplicación y API; cero dependencias o servicios adicionales.
