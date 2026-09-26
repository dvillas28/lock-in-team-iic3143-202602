# Alcance Entrega 2

## Principio

El MVP valida una arquitectura multi-tenant real y un flujo academico minimo:

```txt
Curso -> Modulos -> Material -> Quiz autocorregido -> Nota -> Publicacion -> Promedio
```

No intenta replicar un LMS completo.

## Entra en MVP

- Multi-tenant por universidad usando sharding.
- Dos universidades demo: `uc` y `utfsm`.
- Registry DB central minimo.
- Una PostgreSQL por universidad, todas con el mismo schema.
- Portal home comun para elegir universidad.
- Rutas por tenant: `/uc` y `/utfsm`.
- El frontend deriva el tenant desde la ruta y envia `x-tenant` al backend.
- Evolucion futura a subdominio documentada, no implementada al inicio.
- Dos experiencias UI: docente y estudiante.
- Roles simples por seccion: `teacher`, `student`, `assistant`.
- Un usuario puede ser estudiante en una seccion y ayudante en otra.
- Docente coordinador administra curso, secciones, material, evaluaciones,
  ayudantes y notas.
- Cursos y secciones/paralelos.
- Material de curso con markdown renderizado.
- Archivos basicos en object storage: PDF, CSV, XLSX, TXT, JPEG, PNG.
- Evaluaciones como cuestionarios de alternativas.
- Preguntas con alternativas y pauta preestablecida.
- Calculo automatico de nota al finalizar el intento.
- Libro de notas con ponderaciones por evaluacion.
- Publicacion manual de notas por docente.
- Estudiante ve notas publicadas y promedio.

## Fuera del MVP

- `AuditModule` y `AuditLog`: se pospone para no bloquear el flujo base.
- Auditoria historica de cambios: decision explicita para una entrega futura.
- Admin institucional separado: el docente coordinador cubre gestion minima.
- RBAC completo: roles por seccion reemplazan permisos globales complejos.
- Creacion dinamica de tenants desde UI: tenants demo se provisionan por config.
- Subdominios reales: requieren dominio propio/wildcard DNS; rutas + `x-tenant`
  permiten validar tenancy primero sin comprar dominio.
- Redis, workers, replicas y load balancer propio: no son necesarios para demo.
- Entregas manuales de archivos como evaluacion: reemplazadas por quizzes.
- Correccion manual compleja y recorrecciones: fuera por costo funcional.
- Chat, IA, calendario y anuncios: no aportan al flujo minimo evaluable.

## Conservado de Entrega 1

- AcademiX sigue siendo un LMS universitario multi-tenant.
- El tenant sigue representando una universidad.
- Se mantiene monolito modular como direccion backend.
- Se mantiene PostgreSQL por consistencia relacional.
- Se mantiene object storage para binarios.
- Railway es la plataforma de la primera version funcional.
- Google Cloud queda como migracion posterior usando free tier/creditos de la
  cuenta asociada para una version con mayor operacion.

## Criterio de exito

La demo es aceptable si prueba que:

- UC y UTFSM no comparten base de datos de tenant.
- El backend resuelve tenant por request.
- Un docente crea o gestiona datos dentro de su tenant.
- Un estudiante ve solo material, quizzes y notas de su seccion.
- Un quiz produce una nota y esta se refleja en el libro de notas.
