# Arquitectura

## Decisión vigente

AcademiX utiliza una PostgreSQL compartida para todas las Institutions y
aislamiento lógico mediante `institution_id`. Railway es la plataforma de
despliegue elegida para el proyecto. No existe una migración planificada a otro
proveedor cloud.

La decisión completa y sus trade-offs se registran en
[Adoptar PostgreSQL compartida para multi-tenancy](../../adr/adopt-shared-postgresql-multitenancy.md).

## Vista de alto nivel

```txt
                         Railway

              +-------------+-------------+
              |                           |
       academix-frontend           academix-backend
                                          |
                                          v
                              PostgreSQL compartida
                                          |
                    +---------------------+---------------------+
                    |                     |                     |
             Institution UC       Institution UTFSM     Institution ...
```

El repositorio demuestra configuraciones Railway separadas para frontend y
backend. El walking skeleton todavía no consume PostgreSQL, por lo que la
provisión del recurso de base y su `DATABASE_URL` pertenecen a la etapa de
persistencia y no se inventan aquí.

## Despliegue Railway

Componentes comprobables en el repositorio:

- `academix-frontend`: Next.js empaquetado mediante `frontend/Dockerfile`;
- `academix-backend`: NestJS empaquetado mediante `backend/Dockerfile`;
- `frontend/railway.json`: build por Dockerfile y healthcheck `/`;
- `backend/railway.json`: build por Dockerfile y healthcheck `/health`;
- GitHub Actions valida ambas aplicaciones y sus imágenes Docker.

PostgreSQL es una única persistencia compartida del MVP. El backend se conectará
mediante una URL de conexión estándar cuando se implemente la capa de datos. No
se documentan credenciales, IDs, URLs privadas ni una topología Railway que no
esté versionada o comprobada.

Railway es infraestructura de despliegue, no parte del dominio. El código de
negocio depende de HTTP, PostgreSQL y configuración por entorno.

## Desarrollo local

```txt
Docker Compose
  +-- frontend
  +-- backend
  +-- postgres
```

El entorno local usa los mismos contenedores de aplicación y una sola
PostgreSQL. No necesita registry, múltiples bases, Redis, workers, MinIO ni
emuladores cloud.

## Backend lógico

```txt
PlatformModule
Authentication
Institution context
  - resolver Institution desde institutionSlug
  - validar Institution activa
  - validar InstitutionMembership activa
  - fijar scope institucional para la operación
CoursesModule
MaterialsModule
QuizzesModule
GradesModule
AuditModule
```

Los nombres representan responsabilidades arquitectónicas, no módulos ya
implementados. El repositorio solo implementa actualmente `PlatformModule` y
`GET /health`.

## Flujo de request

```txt
1. El cliente autentica al User global mediante JWT.
2. Consulta GET /api/v1/institutions para descubrir contextos visibles.
3. Navega a /api/v1/institutions/{institutionSlug}/...
4. El backend valida el JWT y obtiene sub.
5. Resuelve institutionSlug a Institution.id.
6. Si la Institution no existe o no es visible, responde 404.
7. Valida InstitutionMembership activa para User + Institution.
8. Evalúa CourseMembership, Enrollment y permisos de la operación.
9. Ejecuta lógica y queries bajo institution_id.
10. Constraints y FK institution-aware rechazan relaciones cruzadas.
11. Cambios sensibles y AuditEvent se confirman en la misma transacción.
```

El slug del path solo solicita un contexto. Nunca autentica ni autoriza.

## Multi-tenancy

`Institution` es la entidad raíz del dominio y tenant lógico. `User` es global;
`InstitutionMembership` responde a qué Institutions puede acceder. Los roles
académicos no se trasladan a esa membership:

- `CourseMembership` mantiene `coordinator` por curso;
- `Enrollment` mantiene `teacher`, `assistant` y `student` por sección.

Toda entidad tenant-owned lleva `institution_id`. La estrategia de aislamiento
combina:

1. autenticación global;
2. Institution explícita en el path;
3. InstitutionMembership;
4. autorización académica;
5. scope de aplicación;
6. `institution_id`;
7. FK compuestas y constraints;
8. tests de aislamiento.

RLS queda fuera del MVP y solo puede evaluarse posteriormente como defensa en
profundidad.

## Persistencia

Existe una sola PostgreSQL y un solo schema evolutivo.

- `institutions` contiene UUID, slug, nombre, estado y timestamps;
- `users` contiene identidades globales;
- `institution_memberships` relaciona ambos;
- tablas académicas llevan `institution_id`;
- relaciones tenant-owned incluyen Institution en sus claves declarativas;
- unicidades académicas se scopean por Institution;
- índices parten por `institution_id` cuando responde al acceso real;
- existe una sola secuencia de migraciones;
- los backfills futuros procesan una Institution a la vez cuando corresponda.

Backup y point-in-time recovery cubren la base completa. Restore lógico por
Institution no es una capacidad del MVP.

## Object storage

El proveedor no está elegido. Cuando Material admita binarios, se usará
almacenamiento compartido con namespace interno por Institution y acceso
mediado por backend. No se agrega infraestructura antes de que exista una
implementación que la consuma.

## Seguridad inicial

- `GET /health` es público y no consulta contexto institucional.
- La API académica exige JWT; `sub` identifica al User global.
- Institution, recursos y relaciones se resuelven dentro del mismo scope.
- Instituciones o recursos no visibles responden `404`.
- Falta de rol sobre un recurso visible responde `403`.
- Requests no aceptan `institution_id`, actor, puntajes ni otros campos
  sensibles derivados por el servidor.
- Auditoría excluye tokens, credenciales, claves internas y pautas.

## CI/CD

CI instala dependencias, ejecuta lint, test/build y construye imágenes Docker
para frontend y backend. Railway usa las configuraciones versionadas de cada
aplicación para build, healthcheck y restart policy. Releases se generan desde
tags semánticos mediante GitHub Actions.

## Evolución

La arquitectura utiliza una PostgreSQL compartida con aislamiento lógico por
Institution. Estrategias de particionamiento o sharding podrán evaluarse en el
futuro únicamente si métricas reales de volumen, latencia o carga operacional
lo justifican. No se diseñan routers ni shards en el MVP.
