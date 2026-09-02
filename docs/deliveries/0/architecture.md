# Arquitectura

## Decision Principal

La plataforma se disena como un monorepo con frontend Next.js y backend NestJS. El backend parte como monolito modular, no como microservicios, para mantener velocidad de desarrollo durante el semestre.

La escalabilidad se aborda desde infraestructura y separacion de datos:

- Load balancer.
- Reverse proxy o API gateway.
- Connection pool.
- Base de datos por tenant.
- Object storage para archivos.
- Redis para cache y trabajos asincronicos.
- Workers para procesamiento fuera del request principal.

## Vista De Alto Nivel

```txt
Cliente Web
-> Load Balancer
-> Reverse Proxy / API Gateway
-> Next.js Frontend
-> NestJS Backend Modular
-> Tenant Resolver
-> Connection Pool por tenant
-> PostgreSQL por tenant
-> Object Storage para archivos
-> Redis para cache/jobs
-> Workers asincronicos
```

## Multi-Tenancy

El tenant representa una universidad.

Estrategia propuesta:

```txt
Tenant registry central
-> resuelve universidad por subdominio
-> obtiene configuracion de base de datos
-> usa pool de conexiones del tenant
-> ejecuta operaciones en la base correspondiente
```

Ejemplos:

```txt
uc.app.cl -> db_uc
usach.app.cl -> db_usach
uchile.app.cl -> db_uchile
```

Ventajas:

- Aislamiento fuerte de datos.
- Sharding natural por universidad.
- Backups y restores por tenant.
- Escalamiento independiente para tenants grandes.
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

Los procesos que no deben bloquear una request pueden ejecutarse con workers:

- Procesamiento de archivos subidos.
- Generacion de previews de documentos.
- Calculo o recalculo de promedios.
- Envio de notificaciones, si se habilita la extension de alertas.
- Indexacion de documentos para IA futura.

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

Escalamiento inicial:

- Replicas del frontend.
- Replicas del backend stateless.
- Load balancer al frente.
- Connection pool para evitar saturar PostgreSQL.
- Cache para lecturas frecuentes de dashboard y curso.
- Workers para carga pesada.

Escalamiento posterior:

- Replicas de lectura para tenants grandes.
- Separacion de bases por tenant.
- Sharding por tenant.
- Colas dedicadas para procesamiento de documentos.
