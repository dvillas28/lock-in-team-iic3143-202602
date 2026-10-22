# Implementation Plan: Rendición frontend de quizzes

**Branch actual**: `feat/frontend-modulos-material` | **Date**: 2026-10-22
**Branch propuesta de implementación**: `feat/frontend-rendicion-quizzes`
**Spec/Input**: [spec.md](spec.md), `specs/20261021-141352_frontend-rendicion-quizzes/spec.md`.

## Summary

Conectar inicio, respuestas completas, reanudación por ID, envío idempotente y
cancelación explícita usando la API existente. Reutilizar sesión, cliente tipado,
listado/detalle de autoría, shell y estilos. Sin cambios API, DB o dependencias.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24, pnpm 9.15.9 |
| Dependencias existentes | Next.js 16.3.8 App Router, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Storage | Sesión, respuestas locales y claves en memoria del documento; PostgreSQL vía API |
| Testing | node:test + tsx, jsdom, c8 existentes; validación real en navegador/API |
| Plataforma/tipo | Web móvil/escritorio en dominios institucionales configurados UC/UTFSM |
| Rendimiento | Guardado manual; una mutación activa por intento/documento; sin polling |
| Restricciones | JSON UTF-8 ≤4096 bytes; sin offline, autosubmit ni almacenamiento privado persistente |
| Escala | Tres historias, rutas de quiz existentes y una ruta de intento conocido |
| Dependencias | Sesión/cursos/API existentes; autoría aporta listado, fixtures permiten prueba aislada |

## Constitution Check

Pre-research: PASS. Post-design: PASS; decisiones en [research.md](research.md).

- Tenant: dominio propone slug; API usa `/api/v1/institution/{institutionSlug}`
  y valida membership. RLS, credenciales sin bypass y contexto transaccional
  existentes conservan barrera por omisión; no agregar SQL ni excepciones globales.
- Roles: student propietario sin pauta inicia/guarda/envía. Teacher de sección
  histórica o teacher con isAdmin y ownership cancela; assistant solo consulta.
  Superadmin/isAdmin por sí solos no autorizan acciones académicas.
- Reconciliación admin UI: prevalecen `attempt-access.ts`, `quiz-access.ts` y ADR
  de ownership, nunca perfil demo ni capacidad genérica de administrar contenido.
- Integridad: respuestas reemplazables auditadas; sección histórica inmutable;
  graded/cancelled terminales. Transacciones backend califican y auditan; UI no
  calcula nota ni altera historial, publicación o selección del último graded.
- Independencia: US1 usa quiz publicado fixture; US2 intento guardado fixture;
  US3 intento activo conocido fixture. Sin requerir editor ni libro frontend.
- Trazabilidad: CU-08/09/15, RF19–20/25–28, RNF1–4/7/9; FE-12–14/20 (JC/MA),
  vistas 05/14/16; pruebas negativas y de integridad incluidas por FR-019.
- Documentación: artefactos <150 líneas; sin complejidad adicional injustificada.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141352_frontend-rendicion-quizzes/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/quiz-attempts.md
  quickstart.md
  tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/attempts/[attemptId]/page.tsx
frontend/src/components/attempts/{attempt-start,attempt-detail,attempt-submit,attempt-cancel}.tsx
frontend/src/lib/api/attempts.ts
frontend/src/lib/attempts/{validation,capabilities,operations}.ts
frontend/src/components/quizzes/{quiz-list,quiz-detail}.tsx
frontend/src/lib/api/quizzes.ts
frontend/src/components/auth/protected-institution.tsx
frontend/src/lib/auth/navigation.ts
frontend/test/fixtures/attempts.ts
frontend/test/{attempt-api,attempt-validation,attempt-capabilities,attempt-save,attempt-start,attempt-submit,attempt-cancel,attempt-session}.test.ts
frontend/test/{session,auth-ui,quiz-list}.test.ts
```

Reutilizar `ProtectedInstitution`, Session.request, useResource, route-states,
radio/fieldset, dialog y clases existentes de `frontend/src/styles/` sincronizadas
con tokens/app.css. No crear hoja de estilos ni wrapper genérico sin necesidad.

## Design & Delivery

1. [Contrato](contracts/quiz-attempts.md) y [modelo](data-model.md) definen parsers,
   permisos y estados. GET intento devuelve vistas superpuestas: seleccionar por
   permisos vigentes y propietario, nunca inferir teacher por presencia de nota.
2. Listado/detalle seguro existente muestra destino, ventana y máximo; inicio
   selecciona matrícula student activa compatible. Mantener clave y destino
   mientras la operación esté pendiente/incierta; doble clic comparte operación.
3. Tras start/replay usar ID devuelto y GET actual antes de editar: replay start
   representa creación original aunque el intento ahora sea terminal.
4. Ruta directa GET intento → GET quiz seguro por quizId → courseId validado del
   DTO → curso/roles. Adaptar mínimamente getQuiz para ese contexto desconocido;
   conservar validación de courseId esperado en callers existentes.
   Lectura terminal/cancelación no debe depender de cargar preguntas si quiz falla.
5. Retorno login: permitir solo `/attempts/{UUID}` además de destinos existentes,
   enviar pathname validado desde ProtectedInstitution; rechazar URL externa,
   query/hash, doble codificación y separadores alternativos. No persistir sesión.
6. Guardar snapshot completo manualmente. Congelar controles durante mutaciones;
   guardar solo confirma snapshot recibido coincidente. Vacío exige confirmación
   de borrar. No guardar en paralelo ni recargar borrador silenciosamente.
   Red/timeout de PUT conserva incertidumbre y bloquea escrituras posteriores;
   una lectura aislada no prueba que un PUT tardío haya terminado.
7. Enviar confirma snapshot actual, lo guarda si cambió, verifica éxito y solo
   entonces POST submit con clave propia. Durante incertidumbre de submit,
   consultar GET o repetir exclusivamente POST con misma clave, sin repetir PUT.
   GET graded permite recibo id/estado/submittedAt; GET inProgress no es rechazo
   definitivo de una petición en vuelo. 409 no rota clave ni fuerza nuevo envío.
8. Cancelación confirma consecuencias; POST sin cuerpo retorna 204. Mostrar éxito
   confirmado aun si GET posterior falla; fecha solo desde backend. Red incierta:
   consultar GET/repetir cancelación explícita autorizada, sin competir con submit.
9. 401/logout/expiración/cambio de identidad/tenant limpia estado privado y claves;
   403/404 limpia datos y revalida contexto. Scope incluye generation, slug,
   actor, IDs y permisos; descartar respuestas tardías de recursos anteriores.
10. No exponer pauta, score, grade ni corrección en recibo/vista de rendición.
    Staff recibe solo seguimiento mínimo necesario para cancelar intento conocido;
    revisión/listado académico y notas publicadas pertenecen a misión 6.
11. Ventana backend [apertura,cierre), null ilimitado; cierre no cancela/envía.
    UI no promete disponibilidad por reloj local ni descubre intentos sin endpoint.
12. DESIGN.md y mockups 05/14/16 guían labels, aria-live, foco/diálogos, teclado,
    375 px, ambos temas y reduced motion. No copiar sessionStorage del mockup.

## Validation & Rollout

[quickstart.md](quickstart.md) define pruebas por historia y matriz FR-019.
MVP US1; luego US2/US3 con fixtures independientes. Mocks prueban interacción,
API real prueba aislamiento, replay, locks, auditoría y no duplicación de notas.
Sin garantía de control entre pestañas: API no ofrece versión/ETag para respuestas.
Excluidos: autosave, timers, descubrimiento de activos, persistencia de claves,
nuevos endpoints, cambios DB, corrección manual y notas publicadas.

## Complexity Tracking

Sin violaciones. Coordinación local específica de intentos exige claves de replay;
useMutation genérico no las conserva y bloquea reenvíos inciertos permanentemente.
