# Adoptar PostgreSQL compartida para multi-tenancy

Fecha: 2026-09-29

## Estado

Aceptado. Reemplaza las decisiones de database-per-tenant, sharding por
universidad, registry de conexiones, resolución mediante `x-tenant` y migración
posterior a Google Cloud de:

- [Elegir alcance MVP para Entrega 2](choose-delivery-2-mvp-scope.md);
- [Alinear dominio académico y contrato de Entrega 2](align-delivery-2-domain-and-api.md).

Las decisiones académicas de roles, intentos, calificaciones, auditoría y
recorte funcional de esos ADR siguen vigentes.

## Contexto

La arquitectura anterior asignaba una PostgreSQL a cada universidad, usaba una
base registry para resolver `slug -> database_url` y requería pools, migraciones
y operación independiente por tenant. Esa separación física prometía
aislamiento y recuperación por institución, pero trasladaba al MVP una
complejidad operacional que el producto todavía no necesita.

La revisión arquitectónica identificó problemas concretos:

- cada cambio de schema debía coordinarse sobre todas las bases;
- los backfills debían repetirse y supervisarse por tenant;
- el backend necesitaba registry, credenciales y pools por institución;
- aumentar el número de instituciones aumentaba conexiones y superficie
  operativa antes de existir una necesidad de escala real;
- restaurar una base por institución era sencillo, pero mantener consistencia
  global y evolucionar el modelo era más difícil;
- la documentación mezclaba Railway como despliegue inmediato con una migración
  futura a Google Cloud que el proyecto ya no tiene planificada.

Canvas LMS se consideró solamente como referencia conceptual de un LMS con
aislamiento lógico y una entidad institucional raíz. AcademiX no adopta su
arquitectura interna ni incorpora funcionalidades por analogía.

## Decisión

AcademiX utilizará una única base de datos PostgreSQL compartida para todas las
instituciones del MVP.

- `Institution` es la entidad de dominio que representa al tenant lógico.
- `institutions.id` es un UUID globalmente único y la PK usada por relaciones
  internas.
- `institutions.slug` es un identificador legible y globalmente único; no es FK.
- `User` es global y puede pertenecer a varias instituciones mediante
  `InstitutionMembership`.
- Todas las entidades académicas tenant-owned llevan `institution_id`.
- Las relaciones tenant-owned usan unicidades y FK compuestas que incluyen
  `institution_id` cuando PostgreSQL puede expresar la invariante.
- Las consultas académicas se ejecutan siempre bajo scope institucional.
- La identidad global proviene del JWT. La Institution se expresa mediante el
  path HTTP y nunca concede acceso por sí sola.
- El backend valida una `InstitutionMembership` activa antes de aplicar los
  permisos de curso o sección.
- Existe una sola secuencia de migraciones para la PostgreSQL compartida.
- Los backfills futuros deben ser institution-scoped, idempotentes cuando
  corresponda y procesarse por lotes cuando su volumen lo requiera.
- UC y UTFSM son Institutions demo dentro de la misma base. Su bootstrap futuro
  será idempotente y separado de las migraciones.
- Railway es la plataforma de despliegue elegida. No existe una migración
  planificada a Google Cloud.

El aislamiento del MVP combina autenticación, Institution explícita,
InstitutionMembership, autorización contextual, scope de aplicación,
`institution_id`, FK compuestas, constraints y tests de aislamiento.

PostgreSQL Row-Level Security queda fuera del MVP. Puede evaluarse como defensa
en profundidad futura, pero no se diseñan todavía roles de DB, variables de
sesión ni integración con pools.

## Consecuencias positivas

- una sola secuencia de migraciones y un único schema operativo;
- backfills y cambios de datos centralizados;
- menos conexiones, credenciales y componentes de routing;
- desarrollo local reproducible con una sola PostgreSQL;
- soporte natural para un User global con acceso a varias Institutions;
- Railway y el entorno local usan PostgreSQL estándar sin acoplar el dominio al
  proveedor de despliegue.

## Trade-offs y riesgos

- el aislamiento deja de estar dado por una frontera física;
- toda lectura y escritura tenant-owned debe conservar el scope institucional;
- una query defectuosa puede intentar leer datos de otra Institution si la capa
  de aplicación omite el filtro;
- FK y constraints son más verbosas porque incluyen `institution_id`;
- backup y point-in-time recovery operan sobre la base completa;
- restore lógico de una Institution individual queda fuera del MVP;
- una operación que afecte la base compartida puede impactar a varias
  Institutions, por lo que pruebas de aislamiento y cambios graduales son
  obligatorios.

## Alternativas descartadas

### Una PostgreSQL por Institution

Descartada para el MVP. Ofrece aislamiento físico y restore independiente, pero
añade registry, pools, credenciales, migraciones repetidas y backfills por base
sin una necesidad de escala que lo justifique.

### Schemas PostgreSQL por Institution

Descartada. Reduce el número de instancias, pero mantiene duplicación de schema,
migraciones y routing lógico, y dificulta el modelo de User global.

### Row-Level Security en el MVP

Diferida. Puede reforzar el aislamiento, pero requiere un diseño correcto de
roles, contexto transaccional y pooling que todavía no corresponde al walking
skeleton.

## Backup y recuperación

La estrategia vigente respalda y recupera la PostgreSQL compartida completa. Un
export/import lógico de una Institution podrá evaluarse en el futuro, pero no se
presenta como capacidad del MVP.

## Evolución futura

La arquitectura utiliza una PostgreSQL compartida con aislamiento lógico por
Institution. Estrategias de particionamiento o sharding podrán evaluarse en el
futuro únicamente si métricas reales de volumen, latencia o carga operacional
lo justifican. No se diseña routing de shards anticipadamente.
