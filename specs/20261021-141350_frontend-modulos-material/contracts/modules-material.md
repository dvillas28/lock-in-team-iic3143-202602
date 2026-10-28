# Contract: Módulos y material frontend

Fuente normativa: docs/reference/openapi/openapi.yaml, paths sections.yaml/materials.yaml
 y schemas courses.yaml/materials.yaml. Sin endpoints o payloads nuevos.

## Navegación

- `/courses/{courseId}/modules`: consulta, expansión, formularios y publicación según rol.
- `/courses/{courseId}/modules/{moduleId}/materials/{materialId}`: lectura y retorno al módulo.
- Enlace desde course-detail.tsx; reutilizar shell institucional y layout courses protegido.
- Slug del dominio configurado en cada path API; nunca parámetros demo de perfil.
- Antes de mostrar enlace profundo: GET module y validar courseId, GET material y moduleId.

## API existente

Todas las rutas tienen prefijo `/api/v1/institution/{institutionSlug}`.

| Método y sufijo | Input | Output | Historia |
| --- | --- | --- | --- |
| GET /courses/{courseId}/modules | Ninguno | ModuleListResponse | US1 |
| GET /modules/{moduleId} | Ninguno | CourseModule | US1 |
| GET /modules/{moduleId}/materials | Ninguno | MaterialListResponse | US1 |
| GET /materials/{materialId} | Ninguno | Material | US1 |
| POST /courses/{courseId}/modules | ModuleCreate | CourseModule, 201 | US2 |
| PATCH /modules/{moduleId} | ModuleUpdate | CourseModule | US2 |
| PUT /courses/{courseId}/modules/order | ModuleOrderRequest | ModuleListResponse | US2 |
| POST /modules/{moduleId}/materials | MarkdownMaterialCreate | Material, 201 | US2 |
| PATCH /materials/{materialId} | MaterialUpdate | Material | US2 |
| POST /modules/{moduleId}/publish | Sin body | CourseModule | US3 |
| POST /modules/{moduleId}/unpublish | Sin body | CourseModule | US3 |
| POST /materials/{materialId}/publish | Sin body | Material | US3 |
| POST /materials/{materialId}/unpublish | Sin body | Material | US3 |

Campos/límites en [data-model.md](../data-model.md). Tenant/course/module no se modifican
por body; publish/unpublish no envía ni `{}`. Alta posición al final usa max(position)+1.
Reorder exige todos los moduleIds, incluidos borradores, con orden final deseado.
ID desconocido → 404; conjunto incompleto → 409; duplicados → 422. Recargar sin retry.

## Permisos y publicación

Teacher activo de cualquier sección: leer borradores, crear, editar, ordenar y publicar.
Assistant/student: leer publicado en ambos niveles. Admin/superadmin sin teacher no
habilita autoría; admin sin Enrollment no accede. No usar capabilities.manage.
UI orienta acciones; backend autoriza siempre. Publicado = publishedAt no null;
disponible = publicaciones de ambos niveles más acceso autorizado.
Control conserva foco, anuncia resultado y combina texto, Lucide y aria-pressed.

## Rendido seguro

Mostrar texto mediante interpolación React, sin HTML interpretado ni URLs activas,
incluidos scripts, javascript:, data:, imágenes y enlaces markdown. Sin innerHTML.
Conservar espacios/saltos, ajustar líneas largas y permitir lectura a 375 px.

## Respuestas y errores

- Tipos schema.d.ts; validar UUID, campos, dates/null, kind, relaciones padre/hijo,
  duplicados y posiciones válidas antes de confirmar representación UI.
- 400/409/413/415/422: explicar validación/conflicto; conservar texto si sigue autorizado.
- 401: Session invalida conexión. 403/404: limpiar privado, revalidar /me y mostrar
  indisponible genérico, sin confirmar existencia de contenido oculto.
- 500/503/red: error distinto de vacío; retry GET explícito solamente.
- Alta sin respuesta fiable: bloquear envío y consultar lista; coincidencia no prueba
  origen del envío. Ambigüedad o consulta fallida conserva incertidumbre y bloqueo.
- PATCH/PUT/publicación inciertos: consultar estado y revisar antes de repetir;
  sin garantía nueva de idempotencia ni control de sobrescritura concurrente.
- Mutación confirmada y refresh fallido: informar confirmación y lectura indisponible;
  no repetir mutación ni presentar datos anteriores como representación vigente.
- Session.request y guarda local de scope/secuencia para cada petición; logout,
  expiración, navegación o cambio de contexto descartan respuestas tardías.
- Datos privados y borradores nunca en localStorage/sessionStorage, URL o logs.
