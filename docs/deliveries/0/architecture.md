# Arquitectura

## Decision Principal

La plataforma se disena como un monorepo con frontend Next.js y backend NestJS. El backend parte como monolito modular, no como microservicios, para mantener velocidad de desarrollo durante el semestre.

## Proveedor De Nube

Google Cloud Platform (GCP) es el proveedor seleccionado para el despliegue del proyecto. La decision se basa en el credito gratuito de $300 USD disponibles por 3 meses, que cubre el desarrollo y la demo final sin costo adicional.

Servicios utilizados:

- Cloud Run: backend NestJS y frontend Next.js como contenedores stateless. Escala horizontalmente por demanda sin configuracion de infraestructura manual.
- Cloud SQL (PostgreSQL): base de datos relacional por tenant y base central del Tenant Registry. Ofrece backups automaticos, restauraciones por punto en el tiempo y read replicas.
- Google Cloud Storage: almacenamiento de archivos binarios (PDFs, presentaciones, entregas). Reemplaza almacenamiento en la base relacional.
- Cloud Load Balancing: API gateway y balanceo de carga frente a multiples instancias del backend cuando el despliegue lo requiera.

La eleccion de GCP no restringe la arquitectura: los componentes principales (Next.js, NestJS, PostgreSQL, object storage compatible con S3) funcionan en cualquier proveedor.

El diseno se orienta a una escala objetivo de 5 universidades con hasta 30.000 estudiantes cada una, para un total potencial de 150.000 estudiantes. Tambien considera ventanas criticas con spikes aproximados de 1.000 estudiantes concurrentes consultando evaluaciones, subiendo entregas o revisando resultados. Estos supuestos justifican preparar aislamiento, escalamiento horizontal y almacenamiento externo sin convertir cada componente de infraestructura en requisito obligatorio del primer MVP.

La arquitectura base prioriza:

- Frontend web.
- Backend modular.
- Resolucion de tenant.
- Base de datos por tenant.
- Object storage para archivos.
- Auditoria de registros academicos.

La arquitectura puede incorporar componentes de despliegue o rendimiento cuando el plan tecnico los justifique:

- Load balancer.
- Reverse proxy o API gateway.
- Connection pool.
- Redis para cache, sesiones o trabajos asincronicos.
- Workers para procesamiento fuera del request principal.

## Vista De Alto Nivel

```txt
Cliente Web
-> Next.js Frontend
-> NestJS Backend Modular
-> Tenant Resolver
-> PostgreSQL por tenant
-> Object Storage para archivos
```

Componentes condicionados por carga, despliegue o extension funcional:

```txt
Load Balancer
Reverse Proxy / API Gateway
Connection Pool por tenant
Redis para cache/jobs
Workers asincronicos
```

## Multi-Tenancy

El tenant representa una universidad.

Con los supuestos de escala del proyecto, separar los datos por tenant reduce el riesgo de fuga entre universidades y permite backups, restores y crecimiento independiente por institucion.

Estrategia propuesta:

```txt
Tenant registry central
-> resuelve universidad por subdominio
-> obtiene configuracion de base de datos
-> usa pool de conexiones del tenant
-> ejecuta operaciones en la base correspondiente
```

Implementacion del Tenant Registry:

El registry es una base de datos PostgreSQL separada en GCP Cloud SQL (distinta de las BD de tenant). Contiene una tabla de configuracion con una fila por universidad: subdominio, tenant_id, host de la BD, nombre de la BD y credenciales cifradas. El backend la carga en memoria al arrancar con un TTL corto para evitar consultas en cada request. No requiere un nuevo tipo de servicio: es una PostgreSQL estandar con acceso restringido al backend.

Ejemplos:

```txt
uc.app.cl -> db_uc
usach.app.cl -> db_usach
uchile.app.cl -> db_uchile
```

Ventajas:

- Aislamiento fuerte de datos.
- El tenant es el shard: la estrategia de sharding esta implementada desde el inicio, no es una decision futura. Cada universidad opera en su propia BD y escala de forma independiente.
- Backups y restores por tenant sin afectar a las demas instituciones.
- Menor riesgo de fuga de datos entre instituciones.

Costos:

- Migraciones mas complejas.
- Mayor carga operacional.
- Necesidad de registry central.
- Necesidad de administrar pools por tenant.

## Modulos Backend

```txt
AuthModule
TenancyModule
UsersModule
CoursesModule
MaterialsModule
AssignmentsModule
SubmissionsModule
GradesModule
AnnouncementsModule
AuditModule
```

## Datos Principales

```txt
Tenant
AcademicPeriod
User
TenantMembership
Course
CourseSection
CourseMembership
Module
Resource
Assignment
Submission
Grade
GradeCategory
GradeRelease
RegradeRequest
Announcement
AuditLog
```

## Extensiones Condicionadas Del Dominio

El modelo base mantiene entregas individuales. Las extensiones Nice to Have no agregan entidades ni infraestructura hasta contar con una especificacion y un plan que justifiquen su complejidad.

- Un chat de seccion debe usar la membresia del curso o seccion como limite de acceso.
- Un chat de grupo o una evaluacion grupal requiere definir `StudentGroup`, membresias, alcance por curso o seccion y autoria de la entrega. Todos esos registros deben conservar el limite del tenant, con pertenencia y autoria auditables.
- Si se habilita, el calendario interno puede incorporar `CalendarModule` y `CalendarEvent` para proyectar fechas de evaluaciones y entregas existentes; no requiere una integracion externa en el alcance inicial.
- Los videos usan object storage, pero formatos, cuotas, previews o transcodificacion deben definirse antes de habilitar la carga.
- Las alertas internas pueden derivarse de eventos del dominio. El correo requiere un proveedor y una estrategia de entregabilidad separados del flujo academico.

## Procesos Asincronicos

Los procesos que no deben bloquear una request pueden ejecutarse con workers. Este componente esta en veremos: se activa al implementar las US que lo requieran y cuando la latencia de esos procesos supere lo aceptable en ejecucion sincrona.

Workers justificados por US concretas:

- Procesamiento de archivos subidos (US11 material, US14 entregas): validacion de formato, generacion de previews de PDF. Si la conversion bloquea la request de subida, se mueve a worker.
- Recalculo de promedios al cambiar ponderaciones (US17): cuando un docente ajusta pesos, recalcular todas las notas del curso puede ser costoso. Se ejecuta en background si el volumen lo justifica.
- Dispatch de notificaciones (US35, RFO6): alertas internas o correos futuros. Siempre async para no acoplar el flujo academico al proveedor de envio.
- Indexacion de documentos para IA futura (experimental, posterior al core).

Los workers requieren Redis como cola de trabajos. Ambos se incorporan juntos cuando el plan tecnico de la US correspondiente los justifique.

## Archivos

Los PDFs, presentaciones y entregas no deben almacenarse directamente en PostgreSQL. La base de datos mantiene metadatos y referencias; los binarios viven en object storage.

Ejemplo:

```txt
Resource
- id
- course_id
- module_id
- filename
- mime_type
- storage_key
- size
- published_at
```

## Seguridad

El sistema debe aplicar autorizacion en dos niveles:

- TenantMembership: rol global dentro de una universidad.
- CourseMembership: rol especifico dentro de un curso o seccion.

Esto permite que un usuario sea estudiante en un curso, ayudante en otro y docente en otra universidad.

## Escalabilidad

Escalamiento base:

- Frontend y backend stateless para permitir replicas cuando el despliegue lo requiera.
- Archivos fuera de PostgreSQL para evitar que entregas y material saturen la base relacional.
- Separacion por tenant para aislar datos, backups y restores.

Escalamiento condicionado:

- Load balancer al frente, si el despliegue requiere mas de una instancia.
- Connection pool, si la cantidad de tenants o conexiones empieza a presionar PostgreSQL.
- Cache para lecturas frecuentes de dashboard y curso, si los escenarios de calidad no se cumplen con consultas directas.
- Workers para carga pesada, si el procesamiento de archivos, notificaciones o recalculos bloquea requests.
- Replica de lectura por tenant, cuando la carga de reads de una universidad especifica sature el primary. Se agrega por instancia, no globalmente: un tenant grande puede tener replica mientras otro no.

Escalamiento posterior:

- Sub-sharding dentro de un tenant: si una sola universidad crece tanto que una instancia de PostgreSQL no la sostiene, se parte su BD en shards internos por algun criterio (rango de usuarios, periodo academico, etc.). Cada sub-shard tendria su propio primary y replicas. Este escenario no aplica al alcance actual del proyecto.
- Colas dedicadas por tipo de procesamiento si los workers genericos se saturan.

## Replicacion Por Tenant

El MVP parte con un primary por tenant, sin replicas. Esta es la configuracion mas simple y suficiente para el alcance inicial.

Cuando un tenant especifico justifique mayor capacidad de lectura (por ejemplo, una universidad con 30.000 estudiantes en ventana de publicacion de notas), se agrega una replica de lectura a ese tenant en GCP Cloud SQL. Las replicas son independientes por tenant: UC puede tener replica mientras USACH sigue con solo primary.

```txt
MVP:
  db_uc     -> primary (write + read)
  db_usach  -> primary (write + read)

Cuando UC crece:
  db_uc     -> primary (writes) + replica (reads)
  db_usach  -> primary (write + read)  [sin cambios]
```

La logica de enrutamiento write/read en el connection pool o en la capa de acceso a datos del backend decide que endpoint usar segun el tipo de operacion.
