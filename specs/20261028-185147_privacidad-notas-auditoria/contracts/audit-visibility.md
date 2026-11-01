# Contract: Lectura privada de auditoría académica

Estado: implementado y validado localmente; ver [evidencia](../../../docs/backend/audit-grade-privacy-validation.md).
Fuente vigente a actualizar durante implementación:
`docs/reference/openapi/paths/audit.yaml`.

## Interfaz existente

`GET /api/v1/institution/{institutionSlug}/courses/{courseId}/audit-events`
Operación: listCourseAuditEvents. Identidad autenticada y contexto institucional
válido; Host, Origin o datos enviados por cliente no otorgan permisos.

Respuesta existente: `{items, hasMore, nextCursor}`. Cada evento mantiene id,
institutionId, actorUserId, action, resourceType, resourceId, courseId, sectionId,
occurredAt y changes.before/after. No se agregan campos ni tipos de evento.
Mantener Cache-Control: no-store, sanitización y límites actuales.

## Autorización

| Condición vigente | Resultado |
| --- | --- |
| Owner admin sin teacher | Solo eventos no grade de su curso |
| Owner admin con teacher en el curso | Todos los eventos autorizados del curso, incluidos grade |
| Teacher sin owner | Solo eventos cuya sección histórica pertenece a su docencia activa |
| Student/assistant sin owner o teacher | Acción prohibida sobre curso visible |
| Admin ajeno/superadmin sin rol académico | No obtiene visibilidad de curso ajeno |
| Institución, pertenencia o recurso ajenos/inactivos | Sin acceso; no revelar su existencia |

Publicación no cambia esta matriz. Eventos grade se excluyen completos si falta
docencia; no se devuelve una copia vaciada ni una señal de evento oculto.
Eventos grade sin sectionId requieren owner+teacher, como el resto del curso.

## Filtros y páginas

Conservar action, resourceType, resourceId, actorUserId, sectionId, from, to,
limit y cursor. Límite predeterminado 20, máximo 100; validación existente intacta.
Aplicar autorización antes de filtros de página y del cálculo de continuación.

- Owner sin teacher + resourceType=grade: 200, items vacío, hasMore=false,
  nextCursor=null cuando no existen filas visibles posteriores.
- Igual regla para action=grade.created, grade.updated o grade.published y filtros por id.
  Usar resourceType=grade como frontera; no clasificar solo por prefijo de acción.
- Página mixta: contiene solo filas autorizadas y se llena con ellas hasta limit.
- Continuación después de revocar teacher: revalidar; nunca conserva acceso grade.
- Cursor de otro actor, institución, curso o filtros: mantener rechazo de cursor.
- Filtro sectionId ajeno: mantener no visibilidad y rechazo existentes.

## Resultados y errores

- 200 para consulta autorizada; colección vacía si no hay eventos visibles.
- 400 para filtros o cursor inválidos según contrato actual.
- 401 para identidad ausente, inválida o inactiva.
- 403 para auditoría prohibida sobre curso visible.
- 404 para contexto/recurso no visible, incluidos filtros de sección ajena.
- No distinguir recurso ajeno de inexistente ni incluir datos sensibles en errores.

## Compatibilidad

La forma de respuesta, filtros y cliente generado no cambian. Se restringe el
conjunto de filas permitido a owner sin teacher; CourseAudit conserva historial
administrativo y estado vacío sin una variante de interfaz nueva.
Actualizar descripciones OpenAPI y ADR que prometen historial total al owner.
No cambiar permisos de libro, intentos o notas para emular esta restricción.

## Comprobaciones mínimas

- HTTP real: owner+student sin teacher, notas propias/ajenas y publicadas/no.
- Historial antiguo/nuevo, acciones y filtros, páginas vacías/mixtas y cursor previo.
- Teacher ordinario, owner+teacher, pérdida de admin/docencia y dos instituciones.
- Snapshot before/after sanitizado y ausencia de escrituras al consultar.
- Consumidor existente acepta respuesta vacía sin inferir nota o privilegio nuevo.
