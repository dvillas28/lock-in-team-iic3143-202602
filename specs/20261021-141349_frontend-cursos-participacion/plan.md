# Implementation Plan: Cursos y participación frontend

**Branch actual**: `feat/frontend-acceso-multitenant` | **Date**: 2026-10-21
**Branch de implementación propuesta**: `feat/frontend-cursos-participacion` | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261021-141349_frontend-cursos-participacion/spec.md`.

## Summary

Conectar `/courses`, detalle y secciones a la API existente; entregar consulta,
configuración propia y gestión de participantes como incrementos separados.
Reutilizar Session, OpenAPI, shell y estilos; sin nuevos permisos, servicios ni DB.
El dominio identifica el slug solicitado; solo path API, membership y RLS autorizan.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24 y pnpm 9.15.9 existentes |
| Dependencias | Next.js 16.3.8 App Router, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Persistencia | Datos privados y formularios en memoria; backend existente conserva registros |
| Testing | node:test + tsx, jsdom, c8 existentes; browser manual para validación visual |
| Plataforma | Navegadores escritorio/móvil, UC y UTFSM por dominio configurado |
| Tipo | Frontend sobre API central; sin BFF ni consultas autenticadas SSR |
| Rendimiento | Consulta de secciones al abrir curso; evitar N+1 desde directorio |
| Restricciones | Timeout Session 15 s; sin retry automático de mutaciones ni storage privado |
| Escala | Tres historias, tres rutas; listas de usuarios/matrículas paginadas |
| Dependencia | Misión acceso multitenant y ADR de ownership ya presentes en checkout |

## Constitution Check

Pre-research: PASS. Post-design: PASS constitucional; decisiones en [research.md](research.md).
Readiness runtime US3: bloqueada por [DEP-FE-SEARCH-001](dependencies/participant-search.md);
contrato `/users` sin handler backend. US1/US2 no dependen de su resolución.

- Tenant: origin configurado → slug solicitado → path API → membership activa → RLS.
  Sin cambios SQL, privilegios runtime, excepciones globales ni barrera por omisión.
- Roles: isAdmin permite alta; isAdmin + createdBy permite configuración.
  Teacher gestiona su sección; admin dueño todas. Superadmin aislado no crea cursos.
  Assistant/student no montan gestión ni consultan sus listas desde esta superficie.
- Reconciliación UI: [ADR vigente](../../docs/adr/institution-admin-and-course-ownership.md)
  prevalece sobre perfiles demo y propuestas históricas de mockups.
- Integridad: backend audita curso/sección; Enrollment conserva origen y sucesor.
  UI usa respuesta confirmada y recarga historial; no DELETE ni auditoría local.
- Independencia: US1 consulta; US2 agrega formularios propios; US3 funciona sobre
  cursos/secciones fixture sin necesitar US2. Fundación compartida obligatoria.
- Cobertura: CU-03/04, RF10–12/25–26, RNF1–4/7/9, FE-05–07/20 (JC/MA).
- Documentación: cada artefacto <150 líneas; sin complejidad adicional injustificada.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141349_frontend-cursos-participacion/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/courses-participation.md
  dependencies/participant-search.md
  quickstart.md
  tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/courses/{layout.tsx,page.tsx,loading.tsx,error.tsx,not-found.tsx}
frontend/src/app/courses/[courseId]/{page.tsx,sections/page.tsx}
frontend/src/components/courses/{course-directory,course-detail,course-form,sections-panel,section-form,participants-panel,enrollment-form}.tsx
frontend/src/components/institutions/institution-shell.tsx
frontend/src/components/auth/protected-institution.tsx
frontend/src/lib/api/{courses,sections,enrollments}.ts
frontend/src/lib/courses/{validation,capabilities}.ts
frontend/src/lib/{route-feedback,institution-routes}.ts
frontend/test/{courses-api,courses-ui,course-admin,participants}.test.ts
frontend/test/fixtures/courses.ts
frontend/test/{session,institution-layout,auth-ui}.test.ts
frontend/src/styles/{tokens,app,institution-layout}.css
```

Nuevos componentes se crean solo para las responsabilidades enumeradas; no repositorio,
store, caché ni framework de formularios. Adaptar Session solo si los checks descubren
un fallo compartido; todas las operaciones pasan por `Session.request` existente.

## Design & Delivery

1. Fundación: tipos de `schema.d.ts`, validación de DTO en frontera, capacidades
   de presentación desde `/me` y detalle confirmado; nunca autoridad frontend.
2. US1: directorio usa CourseSummary; detalle obtiene Course con createdBy y secciones.
   No inferir ownership desde resumen. Mostrar todos los roles activos por sección.
   Shell y breadcrumbs usan rutas reales, sin selector ni parámetros demo de perfil.
3. US2: crear desde directorio; editar configuración en detalle y secciones en su panel.
   Backend fija owner y teacher inicial; POST devuelve Course, luego consultar secciones
   y refrescar `/me`. Capacidad vacía → null; PATCH envía solo campos modificados.
4. US3: participantes dentro de `/courses/{courseId}/sections`, selección local de
   sección autorizada; sin ruta ni API nueva. Teacher busca usuarios; dueño sin teacher
   institucional usa UUID conocido. Listar activas e históricas con paginación.
5. Mutaciones: bloqueo durante envío, confirmación de revocación, respuesta perdida
   deja resultado incierto y exige consulta antes de repetir. No asumir idempotencia.
   En alta de sección, recargar listSections del curso y revisar código/capacidad;
   una coincidencia muestra estado observado, no prueba autoría del envío perdido.
   Si la consulta falla o el resultado no se resuelve, mantener incertidumbre y bloquear
   repetición hasta revisión del estado. No convertir 409 en éxito.
   Cambio de rol usa ID devuelto y recarga lista; no reemplaza historia por userId.
   Búsqueda real depende de un handler `/users` todavía ausente; probar con fixtures
   sin declarar US3 runtime completa ni interpretar 404 como búsqueda vacía.
6. Refrescar `/me` tras cambios propios; 403/404 limpia datos y revalida contexto.
   Al perder contexto desmontar vistas. Descartar respuestas por sesión, slug,
   curso, sección y secuencia; la generación Session sola no cubre cambio de recurso.
7. Accesibilidad: labels, errores asociados, live regions y diálogo con foco seguro;
   375 px, teclado, ambos temas, reduced motion. Reutilizar tokens/app CSS y Lucide.

### Referencias visuales

[DESIGN.md](../../DESIGN.md), [mapa](../../mockups/README.md), vistas 03/07/11 y
cabecera 04; usar copias integradas en `frontend/src/styles/` según
[guía](../../docs/guides/frontend-styles.md). No inventar notas, módulos o actividad.
Los enlaces a capacidades futuras se omiten o muestran texto pendiente sin rutas rotas.

## Validation & Rollout

[quickstart.md](quickstart.md) define aceptación, matriz de perfiles y comandos.
Pruebas de aislamiento, permisos, integridad y respuestas tardías requeridas por FR-015.
No repetir pruebas DB/RLS sin cambios backend; documentar que esta misión no las certifica.
Entrega local incremental: US1 MVP, luego US2 y US3; sin despliegue ni cambios remotos.
Hooks git opcionales omitidos; actualización de contexto requerida por plan ejecutada.

## Complexity Tracking

Sin violaciones; se extiende el frontend existente sin dependencias nuevas.
