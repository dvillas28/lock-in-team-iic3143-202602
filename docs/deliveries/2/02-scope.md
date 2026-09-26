# Alcance Entrega 2

## Principio

El MVP valida una arquitectura multi-tenant real y un flujo académico mínimo:

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

No intenta replicar un LMS completo.

## Entra en MVP

- Multi-tenant por universidad usando sharding.
- Dos universidades demo: `uc` y `utfsm`.
- Registry DB central mínimo.
- Una PostgreSQL por universidad, todas con el mismo schema.
- Portal home común para elegir universidad.
- Rutas por tenant: `/uc` y `/utfsm`.
- El frontend deriva el tenant desde la ruta y envía `x-tenant` al backend.
- Evolución futura a subdominio documentada, no implementada al inicio.
- Dos experiencias UI: docente y estudiante.
- Roles simples por sección: `teacher`, `student`, `assistant`.
- Un usuario puede ser estudiante en una sección y ayudante en otra.
- Docente coordinador administra curso, secciones, material, evaluaciones,
  ayudantes y notas.
- Cursos y secciones/paralelos.
- Material de curso con markdown renderizado.
- Archivos básicos en object storage: PDF, CSV, XLSX, TXT, JPEG, PNG.
- Evaluaciones como cuestionarios de alternativas.
- Preguntas con alternativas y pauta preestablecida.
- Cálculo automático de nota al finalizar el intento.
- Libro de notas con ponderaciones por evaluación.
- Publicación manual de notas por docente.
- Estudiante ve notas publicadas y promedio.

## Fuera del MVP

- `AuditModule` y `AuditLog`: se pospone para no bloquear el flujo base.
- Auditoría histórica de cambios: decisión explícita para una entrega futura.
- Admin institucional separado: el docente coordinador cubre gestión mínima.
- RBAC completo: roles por sección reemplazan permisos globales complejos.
- Creación dinámica de tenants desde UI: tenants demo se provisionan por config.
- Subdominios reales: requieren dominio propio/wildcard DNS; rutas + `x-tenant`
  permiten validar tenancy primero sin comprar dominio.
- Redis, workers, réplicas y load balancer propio: no son necesarios para demo.
- Entregas manuales de archivos como evaluación: reemplazadas por quizzes.
- Corrección manual compleja y recorrecciones: fuera por costo funcional.
- Chat, IA, calendario y anuncios: no aportan al flujo mínimo evaluable.

## Conservado de Entrega 1

- AcademiX sigue siendo un LMS universitario multi-tenant.
- El tenant sigue representando una universidad.
- Se mantiene monolito modular como dirección backend.
- Se mantiene PostgreSQL por consistencia relacional.
- Se mantiene object storage para binarios.
- Railway es la plataforma de la primera versión funcional.
- Google Cloud queda como migración posterior usando free tier/créditos de la
  cuenta asociada para una versión con mayor operación.

## Criterio de éxito

La demo es aceptable si prueba que:

- UC y UTFSM no comparten base de datos de tenant.
- El backend resuelve tenant por request.
- Un docente crea o gestiona datos dentro de su tenant.
- Un estudiante ve solo material, quizzes y notas de su sección.
- Un quiz produce una nota y esta se refleja en el libro de notas.
