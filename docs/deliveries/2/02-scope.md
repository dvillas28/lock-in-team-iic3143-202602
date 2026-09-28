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
- Rol `coordinator` por curso y roles `teacher`, `student`, `assistant`
  por sección.
- Un usuario puede acumular roles, incluso varios en una misma sección.
- El coordinador administra el curso completo; un docente administra solo sus
  secciones. La primera pertenencia coordinadora se aprovisiona con el curso.
- Cursos y secciones/paralelos.
- Material de curso con markdown renderizado.
- Archivos básicos en object storage: PDF, CSV, XLSX, TXT, JPEG, PNG.
- Evaluaciones como cuestionarios de alternativas.
- Preguntas con alternativas y pauta preestablecida.
- Intentos ilimitados por defecto o limitados por un máximo positivo definido
  en el quiz; la nota vigente proviene del último intento calificado.
- Cálculo automático de nota al finalizar el intento.
- Libro de notas con ponderaciones por evaluación.
- Publicación manual de notas por coordinador o docente de la sección.
- Estudiante ve notas publicadas y promedio parcial.
- JWT para operaciones académicas y pertenencias persistidas para autorización.
- Auditoría inmutable de cambios académicos sensibles dentro de cada tenant.

## Fuera del MVP

- Admin institucional separado: el docente coordinador cubre gestión mínima.
- RBAC global complejo: se usan pertenencias de curso y sección.
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
- Un estudiante ve solo material y quizzes autorizados, y sus propias notas
  publicadas; la pauta permanece oculta.
- Un quiz produce una nota desde el último intento calificado y esta se refleja
  en el libro de notas.
- Las operaciones académicas usan JWT y los cambios sensibles generan auditoría.
