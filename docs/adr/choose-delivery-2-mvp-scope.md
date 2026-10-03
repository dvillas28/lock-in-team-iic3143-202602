# Elegir alcance MVP para Entrega 2

Fecha: 2026-09-26

## Estado

Superado por [Alinear dominio académico y contrato de Entrega 2](align-delivery-2-domain-and-api.md)
el 2026-09-28 en alcance académico. La decisión de sharding y la migración
posterior a Google Cloud fueron reemplazadas el 2026-09-29 por
[Adoptar PostgreSQL compartida para multi-tenancy](adopt-shared-postgresql-multitenancy.md).
Se conserva este documento como registro histórico de las alternativas evaluadas.

## Contexto

Entrega 1 definió AcademiX como un LMS universitario multi-tenant con alcance
amplio: cursos, material, evaluaciones, entregas, corrección manual, libro de
notas, auditoría, GCP como cloud objetivo y extensiones como IA, chat,
calendario, workers, Redis y réplicas.

Para Entrega 2, el equipo nominal es de 5 personas, pero la implementación real
depende casi de una persona durante aproximadamente 2 meses. Mantener el alcance
original aumenta el riesgo de no entregar un sistema demostrable.

La decisión que no se quiere perder es arquitectónica: AcademiX debe validar
multi-tenancy real por universidad usando sharding. Cada institución debe operar
sobre una base de datos aislada, con registry central y schema compartido entre
tenants.

## Decisión

Acotar Entrega 2 a un MVP que conserve sharding por universidad y reduzca el
flujo funcional al mínimo demostrable:

- dos tenants demo: `uc` y `utfsm`;
- registry DB central;
- una PostgreSQL por universidad;
- portal home para elegir universidad;
- rutas por tenant `/uc` y `/utfsm`;
- resolución backend por header `x-tenant`;
- frontend y backend desplegables en Railway;
- CD automatizado con GitHub autodeploy y `railway.toml`;
- experiencias docente y estudiante;
- roles por sección: `teacher`, `student`, `assistant`;
- cursos, secciones, material, quizzes autocorregidos y libro de notas;
- publicación manual de notas y promedio visible para estudiante.

Quedan fuera del MVP:

- auditoría histórica;
- admin institucional separado;
- RBAC completo;
- creación dinámica de tenants;
- subdominios reales, porque requieren dominio propio y wildcard DNS;
- Redis, workers, réplicas y load balancer propio;
- entregas manuales, corrección manual compleja y recorrecciones;
- chat, IA, calendario y anuncios.

Railway reemplaza a GCP como plataforma inmediata para walking skeleton y
primera versión funcional. Google Cloud queda como migración posterior usando
free tier/créditos de la cuenta asociada.

## Consecuencias

Positivas:

- El proyecto puede demostrar una arquitectura multi-tenant real sin construir
  un LMS completo.
- El walking skeleton queda pequeño: frontend, backend, registry, dos tenant DB,
  CI/CD y release.
- La decisión de sharding se prueba temprano, antes de agregar funcionalidades.
- El equipo reduce riesgo de sobrealcance y concentra evidencia evaluable.
- `railway.toml` deja la configuración de deploy versionada.

Negativas:

- No hay trazabilidad histórica de cambios académicos en el MVP.
- Las rutas `/uc` y `/utfsm` son menos realistas que subdominios.
- Railway puede imponer límites de free tier o configuración.
- Las evaluaciones quedan restringidas a quizzes de alternativas.
- La migración a Google Cloud queda pendiente y debe planificarse después de
  validar Railway.

Neutrales:

- Los documentos de Entrega 1 quedan como antecedente y visión futura.
- Las funcionalidades excluidas pueden volver mediante nuevos ADRs o specs si
  el skeleton demuestra viabilidad.

## Alternativas consideradas

### Mantener alcance de Entrega 1

Rechazado. Aumenta alcance funcional y operacional sin mejorar la probabilidad
de entregar evidencia ejecutable en Entrega 2.

### Eliminar sharding y usar una sola DB multi-tenant

Rechazado. Simplifica implementación, pero elimina la decisión arquitectónica
principal del proyecto.

### Mantener Google Cloud como plataforma inmediata

Rechazado para Entrega 2. Google Cloud sigue siendo válido como arquitectura
objetivo y migración posterior con free tier/créditos, pero Railway reduce
fricción y permite obtener evidencia de despliegue antes.

## Seguimiento

- Crear Spec Kit del walking skeleton.
- Implementar CI para frontend y backend.
- Desplegar en Railway con `railway.toml` o documentar CD manual si la
  automatización no es viable.
- Crear tag y release de Entrega 2.
- Planificar migración posterior a Google Cloud.
