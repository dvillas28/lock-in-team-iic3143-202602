# HTTP: Módulos y material markdown

Base: `/api/v1/institutions/{institutionSlug}`. JWT Bearer; application/json.
Rutas relativas a base. UUID inválido → 400. Scope siempre resuelto en servidor.
Mantener operationId de OpenAPI existentes; este contrato guía su alineación.

## Módulos

| Método/ruta | Entrada | Éxito |
| --- | --- | --- |
| GET /courses/{courseId}/modules | — | 200 {items: CourseModule[]} por position |
| POST /courses/{courseId}/modules | {title,position} | 201 CourseModule + Location |
| PUT /courses/{courseId}/modules/order | {moduleIds: UUID[]} | 200 {items: CourseModule[]} |
| GET /modules/{moduleId} | — | 200 CourseModule visible |
| PATCH /modules/{moduleId} | {title} | 200 CourseModule |
| POST /modules/{moduleId}/publish | sin body | 200 CourseModule |
| POST /modules/{moduleId}/unpublish | sin body | 200 CourseModule |

CourseModule = {id,courseId,title,position,publishedAt}; publishedAt fecha ISO o null.
Crear siempre oculto. Posición entero positivo int32; no desplaza otras filas.
Order exige todos los módulos, sin duplicados; permitir [] solo en curso vacío.
No acepta posiciones parciales ni cambia publicación. PATCH exige title.

## Materiales

| Método/ruta | Entrada | Éxito |
| --- | --- | --- |
| GET /modules/{moduleId}/materials | — | 200 {items: MarkdownMaterial[]} por id |
| POST /modules/{moduleId}/materials | {title,markdownBody} | 201 MarkdownMaterial + Location |
| GET /materials/{materialId} | — | 200 MarkdownMaterial visible |
| PATCH /materials/{materialId} | {title?,markdownBody?}, al menos uno | 200 MarkdownMaterial |
| POST /materials/{materialId}/publish | sin body | 200 MarkdownMaterial |
| POST /materials/{materialId}/unpublish | sin body | 200 MarkdownMaterial |

MarkdownMaterial = {id,moduleId,title,kind:'markdown',markdownBody,publishedAt,createdBy}.
No se expone institutionId ni campos de almacenamiento. Alta oculta; actor del guard.
No existen upload /materials/files ni /materials/{id}/content en el MVP implementado;
conservar su alcance futuro en documentación P2, fuera del contrato activo generado.
No agregar DELETE ni mover módulos/materiales; ocultar preserva estado e historia.

## Validación y errores

Objetos JSON con claves permitidas exclusivamente; tipos estrictos, nunca coerción.
Trim título, 1–200 caracteres Unicode; markdown original no blanco, 1–10000 caracteres
Unicode y sin NUL. Rechazar null, arrays, body vacío o desconocidos. Validar antes
las credenciales y existencia visible para no revelar recursos por errores de dominio.
No aceptar institutionId, courseId, moduleId, createdBy, kind ni publishedAt como campos
escribibles. No aceptar role/experience como permiso.
Bodies de publish/unpublish ausentes; objeto o contenido inesperado → 400.

| Estado | Significado |
| --- | --- |
| 400 | JSON/UUID/tipo/clave/campo requerido inválido |
| 401 | Token o User inválido/inactivo |
| 403 | Recurso visible pero no teacher para escritura |
| 404 | Tenant/membership/curso/recurso ausente o invisible; también padre oculto |
| 409 | Posición ocupada o conjunto order local incompleto/desactualizado |
| 413 | Límite HTTP de payload existente excedido |
| 415 | Body no application/json; no se interpreta como HTML/texto activo |
| 422 | Título/cuerpo vacío/excesivo, posición fuera de rango o IDs duplicados |
| 500/503 | Fallo inesperado/DB no disponible, Problem sanitizado |

Orden con UUID de otro curso/tenant → 404 sin exposición; no hacer cambios parciales.
En GET lista, curso autorizado sin módulos visibles devuelve items:[]; módulo oculto
para lector obtiene 404 también al listar sus materiales.
Cache-Control:no-store, X-Content-Type-Options:nosniff en todas las respuestas protegidas.
Errores application/problem+json sin SQL, stack, payload markdown ni datos privados.
Publish/unpublish y PATCH/order sin diferencias devuelven estado actual sin evento.
No garantizar idempotencia de altas; no reintentar POST automáticamente.

## Sincronización compartida e historias

Foundation alinea paths/sections.yaml, paths/materials.yaml, schemas/courses.yaml,
schemas/materials.yaml, openapi.yaml y README.md en docs/reference/openapi/:
eliminar staff ambiguo, separar teacher de assistant, retirar binarios del MVP,
añadir límites/no-store/nosniff y errores. Regenerar frontend/src/lib/api/schema.d.ts.
Foundation también registra servicios/controladores compilables sin rutas; cada historia
implementa sus endpoints sobre ese registro y verifica arranque HTTP por separado.
US2 comprueba filtros/autorización de todos los GET con esos tipos, sin nuevos DTO
ni endpoints US1; revocación/ocultación concurrente usa transacciones SQL de fixtures.
Pruebas HTTP usan cliente generado y verifican valores/headers/negativos, no solo tipos.
