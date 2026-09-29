# Alcance Entrega 2

## Principio

El MVP valida aislamiento multi-tenant lógico y un flujo académico mínimo:

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

No intenta replicar un LMS completo ni anticipar infraestructura de escala.

## Entra en MVP

- Una PostgreSQL compartida para todas las Institutions.
- `Institution` como entidad raíz con UUID interno y slug único.
- Dos Institutions demo: `uc` y `utfsm`, dentro de la misma base.
- `User` global e `InstitutionMembership` para pertenencia institucional.
- Contexto explícito mediante `/api/v1/institutions/{institutionSlug}/...`.
- El path identifica la Institution solicitada, pero no concede acceso.
- Entidades académicas con `institution_id` y relaciones institution-aware.
- Consultas institution-scoped y tests explícitos de acceso cruzado.
- Portal común para elegir una Institution visible.
- Dos experiencias UI: docente y estudiante.
- Rol `coordinator` por curso y roles `teacher`, `student`, `assistant` por
  sección.
- Un User puede acumular roles, incluso varios en una misma sección.
- Cursos, secciones, módulos y material académico.
- Material markdown y archivos PDF, CSV, XLSX, TXT, JPEG y PNG cuando exista un
  adaptador de almacenamiento.
- Quizzes de alternativas con pauta protegida e intentos configurables.
- Cálculo automático, ponderaciones, publicación manual y promedio parcial.
- JWT para autenticación global y memberships persistidas para autorización.
- Auditoría inmutable de cambios académicos sensibles, scoped por Institution.
- Railway como plataforma de despliegue.

## Fuera del MVP

- Administrador institucional separado: el coordinador cubre la gestión mínima.
- Creación dinámica de Institutions desde UI o API.
- Jerarquías de facultad, departamento, campus u otra unidad organizacional.
- Row-Level Security; queda como posible defensa en profundidad futura.
- Sharding, particionamiento y routing de bases.
- Restore lógico de una Institution individual.
- Proveedor concreto para object storage; los binarios se incorporan cuando su
  implementación lo requiera.
- Branding, SSO, locale, settings arbitrarios e integraciones por Institution.
- Redis, workers, réplicas, load balancer propio y microservicios.
- Entregas manuales, corrección manual compleja y recorrecciones.
- Chat, IA, calendario y anuncios.

## Criterio de éxito

La demo es aceptable si prueba que:

- UC y UTFSM coexisten en la misma PostgreSQL sin exponer datos cruzados;
- una identidad global solo accede a Institutions con membership activa;
- recursos e identificadores de otra Institution se tratan como no visibles;
- un coordinador o docente solo actúa dentro de su alcance académico;
- un estudiante ve únicamente material y quizzes autorizados y sus propias
  notas publicadas;
- un quiz produce una nota desde el último intento calificado y la refleja en el
  libro de notas;
- cambios sensibles generan auditoría con scope institucional;
- frontend y backend se despliegan en Railway y se ejecutan localmente con
  Docker Compose.

## Evolución

La arquitectura utiliza una PostgreSQL compartida con aislamiento lógico por
Institution. Estrategias de particionamiento o sharding podrán evaluarse en el
futuro únicamente si métricas reales de volumen, latencia o carga operacional
lo justifican.
