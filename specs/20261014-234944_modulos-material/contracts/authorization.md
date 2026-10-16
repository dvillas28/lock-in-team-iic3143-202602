# Autorización y consumo seguro

## Scope vigente

AuthGuard identifica User, sin roles en JWT. Cada consulta comprueba User,
Institution e InstitutionMembership activos; Enrollment activo relaciona User con
Section del mismo Course e Institution. Slug/UUID no conceden acceso.
Usar course-access del prerequisito sin ampliar sus otros consumidores.

| Actor efectivo del curso | Publicados | Borradores | Escritura |
| --- | --- | --- | --- |
| Teacher activo en cualquier sección | Sí | Sí | Todo contenido compartido del curso |
| Assistant activo, sin teacher | Sí, padre e ítem | No | No |
| Student activo, sin teacher | Sí, padre e ítem | No | No |
| Admin dueño sin Enrollment académico | No | No | No |
| is_admin/is_super_admin ajeno, sin Enrollment | No | No | No |
| Membresía/usuario/institución inactivos, o sin Enrollment | No | No | No |

Roles activos se unen: teacher+student tiene capacidad docente en este contenido.
No usar propiedad del recurso ni autor original como restricción de edición entre docentes.
Teacher de sección 2 puede editar módulos comunes a sección 1: es comportamiento
requerido; teacher de otro curso nunca puede hacerlo.
El dueño admin mantiene permisos administrativos del curso, sin permiso implícito de
contenido: recurso sin acceso académico se considera invisible (404).

## Publicación y enlaces directos

| Módulo publicado | Material publicado | Lectura assistant/student |
| --- | --- | --- |
| No | No | 404 en enlaces directos; ausente en listas |
| No | Sí | 404 en enlaces directos; ausente en listas |
| Sí | No | Módulo visible; material 404/ausente |
| Sí | Sí | Módulo y material visibles |

Mismo predicado en listas, detalle de módulo, lista de materiales y detalle de material.
No cargar borradores en memoria para filtrarlos después. No incluir conteos ni IDs ocultos.
No leer desde caché; no-store en éxito y error. Peticiones posteriores al commit de
revocación de User/Institution/membership/Enrollment o despublicación pierden acceso.
Si otro Enrollment académico del mismo curso sigue activo, conserva acceso publicado.
Teacher revocado que conserva student pierde borradores/escritura, no sus publicaciones.
No devolver éxito de escritura antes de commit; permisos se comprueban bajo locks del
[modelo](../data-model.md). Pruebas concurrentes verifican orden definido, sin carreras.

## Representación segura de markdown

La API devuelve fuente como string JSON y nunca Content-Type:text/html ni HTML
renderizado. No transforma etiquetas en nodos, no ejecuta scripts/acciones, no consulta
URLs remotas. Tratar títulos, markdown y snapshots como datos no confiables.
Validación estructural/límites en servidor; SQL parametrizado; nosniff y no-store.
En consumidores actuales usar valor string como texto; prohibido innerHTML,
dangerouslySetInnerHTML, eval, interpolación en atributos o navegación automática.
No borrar snippets legítimos usando regex: no hay HTML activo que sanitizar en API.
Un futuro visor requiere escape/sanitización y política de enlaces/imágenes antes
de habilitar renderizado; esta misión no incluye visor ni modifica mockups.

Fixtures de seguridad: script, img onerror, iframe, SVG onload, javascript:/data:
links, HTML con entidades y markdown mixto; comprobar persistencia como texto,
application/json, nosniff, ausencia de HTML producido/requests remotas y consumidor
con string inerte. Pruebas de permisos también protegen esos bodies en borradores.
No poner markdown aportado por usuario en mensajes Problem o logs.
Auditoría registra snapshots permitidos atómicos y conserva sus permisos previos;
assistant/student nunca consultan eventos ni obtienen historial mediante material.
