# Data model: Módulos y material frontend

Proyecciones OpenAPI existentes; sin tablas, migraciones ni entidades persistidas nuevas.

## CourseModule

| Campo | Contrato |
| --- | --- |
| id | UUID servidor |
| courseId | UUID del curso padre, inmutable |
| title | 1–200 caracteres Unicode, recortado, sin NUL |
| position | Entero 1–2147483647, único por curso |
| publishedAt | date-time o null, controlado por publish/unpublish |

Alta `{title, position}`; edición `{title}`. Nueva posición: max(position)+1 o 1 si vacío.
Orden `{moduleIds}` completo, sin duplicados; retorna `{items: CourseModule[]}`,
normalizando posiciones 1..N. No reordenar mediante PATCH individual.

## MarkdownMaterial

| Campo | Contrato |
| --- | --- |
| id | UUID servidor |
| moduleId | UUID módulo padre, inmutable |
| title | 1–200 caracteres Unicode, recortado, sin NUL |
| kind | Constante markdown |
| markdownBody | String no blanco, sin NUL, ≤10000 caracteres; conserva espacios |
| publishedAt | date-time o null, publicación propia |
| createdBy | UUID autor fijado por backend, solo lectura |

Alta `{title, markdownBody}`; PATCH al menos un campo editable.
Lista `{items: Material[]}` incluye markdownBody; sin paginación ni orden editable de ítems.
Toda escritura JSON respeta también 4096 bytes después de serializar y codificar UTF-8.
No confundir caracteres Unicode por campo con bytes del cuerpo HTTP completo.

## Relaciones y autorización

Institution → Course → CourseModule → MarkdownMaterial; sin pertenencia directa a Section.
Frontend valida courseId del módulo y moduleId del material antes de mostrar ruta profunda.
Sesión/slug identifican contexto solicitado; backend controla acceso real en cada petición.
Teacher activo de cualquier sección lee/escribe borradores compartidos del curso.
Assistant/student solo leen publicado; flags admin no agregan derechos sobre contenido.

## Visibilidad efectiva (student/assistant autorizado)

| Módulo publicado | Ítem publicado | Lectura |
| --- | --- | --- |
| No | No | No |
| No | Sí | No |
| Sí | No | No |
| Sí | Sí | Sí |

Alta → borrador. Publicar/ocultar cambia solo publishedAt del recurso objetivo.
Ocultar módulo conserva estado y contenido de hijos. Editar conserva publicación;
edición publicada aparece inmediatamente, sin nueva aprobación editorial.
Backend sobrescribe representación con auditoría before/after atómica; no-op sin evento.
Sin versión/ETag: último guardado confirmado sustituye contenido, sin merge prometido.

## Estado UI efímero

Scope: generación Session + slug + courseId + moduleId + materialId + secuencia local.
Recurso: cargando, disponible, vacío real, error recuperable o no disponible.
Formulario: edición, enviando, error validado, resultado incierto o confirmado.
Sin mutaciones automáticas. Resultado incierto exige consulta antes de repetir;
si sigue ambiguo, mantener bloqueo y revisión manual, sin éxito inventado.
Borrador en memoria autorizada; limpiar al logout, expiración, revocación y cambio de
identidad/contexto/recurso. Refresh autorizado no reinicia el formulario por su key.
Descartar respuestas de solicitudes anteriores al cambio de scope o secuencia.
