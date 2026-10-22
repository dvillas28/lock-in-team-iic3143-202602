# Implementation Plan: Módulos y material frontend

**Branch actual**: `feat/frontend-cursos-participacion` | **Date**: 2026-10-22
**Branch propuesta de implementación**: `feat/frontend-modulos-material`
**Spec**: [spec.md](spec.md) | **Input**: `specs/20261021-141350_frontend-modulos-material/spec.md`.

## Summary

Conectar consulta, edición y publicación de contenido compartido a la API existente.
Reutilizar Session, OpenAPI, shell, hooks y estilos. Lectura markdown como texto
inerte con saltos conservados; editor textarea, sin dependencias nuevas.
El dominio selecciona el slug solicitado; path institucional, membership y RLS autorizan.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Lenguaje/runtime | TypeScript 5.9.3, Node 24 y pnpm 9.15.9 existentes |
| Dependencias | Next.js 16.3.8, React 19.3.0, openapi-fetch 0.17.0, Lucide |
| Persistencia | Datos privados y borradores en memoria de la vista autorizada |
| Backend | API y PostgreSQL existentes; sin cambios API, DB ni credenciales |
| Testing | node:test + tsx, jsdom y c8 existentes; navegador para revisión visual |
| Plataforma | Navegador escritorio/móvil, dominios configurados UC/UTFSM |
| Tipo | Frontend App Router; peticiones privadas por Session.request |
| Rendimiento | Listar módulos una vez; cargar material al expandir cada módulo |
| Restricciones | JSON HTTP ≤4096 bytes; markdown ≤10000 caracteres; sin autosave |
| Escala | Tres historias; contenido compartido por curso, no por sección |
| Dependencias | Acceso y cursos existentes; no depende de búsqueda de participantes |

## Constitution Check

Pre-research: PASS. Post-design: PASS; decisiones en [research.md](research.md).

- Tenant: dominio configurado → slug solicitado → path API → membership activa → RLS.
  Sin accesos SQL nuevos, excepciones globales ni cambios de privilegios runtime.
  Barrera por omisión y reutilización de conexión siguen bajo los controles backend existentes.
- Roles: teacher activo de cualquier sección escribe contenido común y ve borradores.
  Assistant/student leen publicado; admin/superadmin sin teacher no habilita escritura.
  Admin sin Enrollment no accede. No reutilizar `manage` como permiso de autoría.
- Reconciliación: backend contentScope y ADR de contenido prevalecen sobre perfiles demo;
  ownership administrativo no es requisito para editar módulos o material.
- Integridad: edición sobrescribe con auditoría before/after backend; publicación atómica,
  no-op sin evento. Ocultar módulo conserva publicaciones hijas. Sin auditoría local.
- Independencia: US1 usa fixtures publicados; US2, contenido borrador; US3, recursos
  preexistentes. Todas requieren fundación, ninguna exige completar otra historia.
- Trazabilidad: CU-05/06/14, RF13/14(markdown)/16/25–26, RNF1–4/7/9, FE-08–10/20 (JC/MA).
- Documentación: artefactos <150 líneas; sin complejidad adicional injustificada.

## Project Structure

### Documentation (this feature)

```text
specs/20261021-141350_frontend-modulos-material/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/modules-material.md
  quickstart.md
  tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/courses/[courseId]/modules/page.tsx
frontend/src/app/courses/[courseId]/modules/[moduleId]/materials/[materialId]/page.tsx
frontend/src/components/content/{modules-panel,material-reader,module-form,material-form,publication-toggle}.tsx
frontend/src/components/courses/{course-detail,form-fields}.tsx
frontend/src/components/courses/{use-resource,use-mutation}.ts
frontend/src/components/institutions/institution-shell.tsx
frontend/src/lib/api/{modules,materials}.ts
frontend/src/lib/content/{validation,capabilities}.ts
frontend/src/styles/{tokens,app,content}.css
frontend/test/{content-api,content-capabilities,content-read-api,content-write-api}.test.ts
frontend/test/{content-reader,content-editor,content-publication-api,content-publication}.test.ts
frontend/test/fixtures/content.ts
```

Reutilizar hooks y campos existentes; sin store, caché ni framework de formularios.

## Design & Delivery

1. Fundación: tipos OpenAPI, validación DTO y relaciones padre/hijo; scope completo
   sesión/slug/curso/módulo/material y secuencia local. Sin caché privada compartida.
2. US1: curso → módulos → lectura; material cargado al expandir. Validar module.courseId
   y material.moduleId antes de mostrar enlace profundo. Carga/vacío/error/indisponible
   distintos, retorno a curso/módulo y breadcrumbs reales. Texto React escapado con
   espacios conservados y líneas ajustadas; sin HTML interpretado ni enlaces activos.
3. US2: título de módulo y posición inicial max(position)+1; edición solo de título.
   Si excede int32 o colisiona, informar y recargar, sin reenvío automático.
   Orden completo vía PUT con botones Subir/Bajar operables por teclado.
   Material: título + textarea markdown; creación borrador, edición conserva publicación.
   Validar Unicode/NUL y bytes UTF-8 de JSON.stringify(body), sin truncar el texto.
4. US3: control independiente por módulo e ítem, texto y aria-pressed. Estado propio
   y visibilidad efectiva explícitos; ocultar padre no cambia estados de hijos.
   Confirmar respuesta y refrescar representación autorizada, sin éxito optimista.
5. Alta incierta: conservar texto, bloquear envío y consultar lista antes de repetir.
   Coincidencia no prueba origen; resultado ambiguo o consulta fallida mantiene bloqueo
   y revisión manual explícita. PATCH/PUT/publicación inciertos consultan estado actual.
   No retries automáticos, ETag, merge ni protección contra sobrescritura inventados.
6. Validación/red conserva borrador en vista autorizada; no resetear editor por una key
   que cambie con el refresh. Logout, expiración, 403/404 o pérdida de contexto limpia
   datos y borradores, revalida /me y descarta respuestas tardías.
7. DESIGN.md y mockups 04/12 orientan layout; estilos integrados según la guía frontend.
   Labels, foco, anuncios, teclado, ambos temas, 375 px y reduced motion obligatorios.

## Validation & Rollout

[quickstart.md](quickstart.md) define matriz de publicación, perfiles y comandos.
FR-016 requiere pruebas adversariales, aislamiento, roles y respuestas tardías.
No repetir pruebas DB/RLS sin cambios SQL ni certificar esas garantías desde mocks UI.
MVP: US1; luego US2/US3 con fixtures propios e integración final.
PDF/binarios, delete, orden de ítems, colaboración y visor enriquecido excluidos.
US1–US3 implementadas; evidencia en docs/guides/frontend-content.md.
Validación con backend real pendiente; sin despliegue.

## Complexity Tracking

Sin violaciones. Misma aplicación/API y cero dependencias adicionales.
