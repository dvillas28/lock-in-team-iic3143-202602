# Choose Delivery 2 MVP Scope

Date: 2026-09-26

## Status

Accepted.

## Context

Entrega 1 definio AcademiX como un LMS universitario multi-tenant con alcance
amplio: cursos, material, evaluaciones, entregas, correccion manual, libro de
notas, auditoria, GCP como cloud objetivo y extensiones como IA, chat,
calendario, workers, Redis y replicas.

Para Entrega 2, el equipo nominal es de 5 personas, pero la implementacion real
depende casi de una persona durante aproximadamente 2 meses. Mantener el alcance
original aumenta el riesgo de no entregar un sistema demostrable.

La decision que no se quiere perder es arquitectonica: AcademiX debe validar
multi-tenancy real por universidad usando sharding. Cada institucion debe operar
sobre una base de datos aislada, con registry central y schema compartido entre
tenants.

## Decision

Acotar Entrega 2 a un MVP que conserve sharding por universidad y reduzca el
flujo funcional al minimo demostrable:

- dos tenants demo: `uc` y `utfsm`;
- registry DB central;
- una PostgreSQL por universidad;
- portal home para elegir universidad;
- rutas por tenant `/uc` y `/utfsm`;
- resolucion backend por header `x-tenant`;
- frontend y backend desplegables en Railway;
- CD automatizado con GitHub autodeploy y `railway.toml`;
- experiencias docente y estudiante;
- roles por seccion: `teacher`, `student`, `assistant`;
- cursos, secciones, material, quizzes autocorregidos y libro de notas;
- publicacion manual de notas y promedio visible para estudiante.

Quedan fuera del MVP:

- auditoria historica;
- admin institucional separado;
- RBAC completo;
- creacion dinamica de tenants;
- subdominios reales, porque requieren dominio propio y wildcard DNS;
- Redis, workers, replicas y load balancer propio;
- entregas manuales, correccion manual compleja y recorrecciones;
- chat, IA, calendario y anuncios.

Railway reemplaza a GCP como plataforma inmediata para walking skeleton y
primera version funcional. Google Cloud queda como migracion posterior usando
free tier/creditos de la cuenta asociada.

## Consequences

Positive:

- El proyecto puede demostrar una arquitectura multi-tenant real sin construir
  un LMS completo.
- El walking skeleton queda pequeno: frontend, backend, registry, dos tenant DB,
  CI/CD y release.
- La decision de sharding se prueba temprano, antes de agregar funcionalidades.
- El equipo reduce riesgo de sobrealcance y concentra evidencia evaluable.
- `railway.toml` deja la configuracion de deploy versionada.

Negative:

- No hay trazabilidad historica de cambios academicos en el MVP.
- Las rutas `/uc` y `/utfsm` son menos realistas que subdominios.
- Railway puede imponer limites de free tier o configuracion.
- Las evaluaciones quedan restringidas a quizzes de alternativas.
- La migracion a Google Cloud queda pendiente y debe planificarse despues de
  validar Railway.

Neutral:

- Los documentos de Entrega 1 quedan como antecedente y vision futura.
- Las funcionalidades excluidas pueden volver mediante nuevos ADRs o specs si
  el skeleton demuestra viabilidad.

## Alternatives Considered

### Mantener alcance de Entrega 1

Rechazado. Aumenta alcance funcional y operacional sin mejorar la probabilidad
de entregar evidencia ejecutable en Entrega 2.

### Eliminar sharding y usar una sola DB multi-tenant

Rechazado. Simplifica implementacion, pero elimina la decision arquitectonica
principal del proyecto.

### Mantener Google Cloud como plataforma inmediata

Rechazado para Entrega 2. Google Cloud sigue siendo valido como arquitectura
objetivo y migracion posterior con free tier/creditos, pero Railway reduce
friccion y permite obtener evidencia de despliegue antes.

## Follow-up

- Crear Spec Kit del walking skeleton.
- Implementar CI para frontend y backend.
- Desplegar en Railway con `railway.toml` o documentar CD manual si la
  automatizacion no es viable.
- Crear tag y release de Entrega 2.
- Planificar migracion posterior a Google Cloud.
