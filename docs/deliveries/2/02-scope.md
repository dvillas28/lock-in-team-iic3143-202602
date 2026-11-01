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
- Contexto explícito mediante `/api/v1/institution/{institutionSlug}/...`.
- El path identifica la Institution solicitada, pero no concede acceso.
- Entidades académicas con `institution_id` y relaciones institution-aware.
- Consultas institution-scoped y tests explícitos de acceso cruzado.
- Portal común para elegir una Institution visible.
- Administración institucional implementada mediante flags independientes:
  is_super_admin delega is_admin; is_admin crea cursos y administra los propios.
  Teacher mantiene funciones académicas; ownership no las concede por sí solo.
  [Matriz de actores](05-domain-model.md) y [cuentas](../../guides/demo-accounts.md).
- Roles por sección: `teacher`, `student` y `assistant`.
- Un User puede acumular roles, incluso varios en una misma sección.
- Cursos, secciones, módulos y material académico.
- Los módulos y materiales pertenecen al curso completo; todas las secciones del
  curso ven el mismo material publicado.
- Material markdown y archivos PDF, CSV, XLSX, TXT, JPEG y PNG cuando exista un
  adaptador de almacenamiento.
- Quizzes de alternativas con pauta protegida e intentos configurables.
- Cálculo automático, ponderaciones, publicación manual y promedio parcial.
- JWT para autenticación global y memberships persistidas para autorización.
- Auditoría inmutable de cambios académicos sensibles, scoped por Institution.
- Render como plataforma configurada; estado remoto no verificado en este polish.
- RLS y runtime sin bypass como barrera adicional de aislamiento.

## Fuera del MVP

- Administración general de usuarios, superadmin global y RBAC completo.
- Creación dinámica de Institutions desde UI o API.
- Jerarquías de facultad, departamento, campus u otra unidad organizacional.
- Alta general/invitaciones en institución existente; onboarding inicial es operativo.
- Sharding, particionamiento y routing de bases.
- Restore lógico de una Institution individual.
- Carga/descarga de binarios; proveedor por definir en otra misión.
- Branding, SSO, locale, settings arbitrarios e integraciones por Institution.
- Redis, workers, load balancer propio y microservicios.
- Entregas manuales, corrección manual compleja y recorrecciones.
- Chat, IA, calendario y anuncios.

## Criterio de éxito

La demo es aceptable si prueba que:

- UC y UTFSM coexisten en la misma PostgreSQL sin exponer datos cruzados;
- una identidad global solo accede a Institutions con membership activa;
- recursos e identificadores de otra Institution se tratan como no visibles;
- admin crea cursos y administra los propios; teacher actúa en sus secciones;
- un estudiante ve únicamente material y quizzes autorizados y sus propias
  notas publicadas;
- un quiz produce una nota desde el último intento calificado y la refleja en el
  libro de notas;
- cambios sensibles generan auditoría con scope institucional;
- frontend/backend tienen configuración Render y ejecución local Docker Compose;
  disponibilidad remota requiere evidencia operativa separada.

## Evolución

La arquitectura utiliza una PostgreSQL compartida con aislamiento lógico por
Institution. Estrategias de particionamiento o sharding podrán evaluarse en el
futuro únicamente si métricas reales de volumen, latencia o carga operacional
lo justifican.
