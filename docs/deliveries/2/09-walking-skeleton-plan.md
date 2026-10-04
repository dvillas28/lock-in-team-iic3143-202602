# Plan de walking skeleton

## Objetivo

Mantener un frontend y backend desplegables en Railway, conectados entre sí y
validados por CI/CD. La siguiente evolución del skeleton incorpora una sola
PostgreSQL compartida y prueba el contexto institucional sin implementar aún el
flujo LMS completo.

JWT, memberships y auditoría son requisitos para habilitar endpoints académicos;
no se sustituyen por una sesión mock fuera de pruebas iniciales.

## Estado comprobable

- frontend Next.js y backend NestJS separados;
- `GET /health` implementado;
- frontend consulta el health del backend;
- Dockerfiles para ambas aplicaciones;
- `frontend/railway.json` y `backend/railway.json` versionados;
- CI con lint, test/build y Docker build;
- workflow de release por tag.

El repositorio todavía no contiene acceso a PostgreSQL, ORM, migraciones, JWT ni
resolución de Institution.

## Alcance técnico siguiente

Frontend:

- conservar estado de conexión al backend;
- listar Institutions visibles cuando exista autenticación;
- navegar usando el slug institucional;
- no enviar `institution_id` en bodies académicos.

Backend:

- conservar `GET /health` público;
- exponer `GET /api/v1/institutions` para la identidad global;
- resolver `/api/v1/institutions/{institutionSlug}/...`;
- validar InstitutionMembership antes de permisos académicos;
- responder `404` ante Institution inexistente o no visible.

Datos:

- una PostgreSQL compartida;
- Institution, User e InstitutionMembership como mínimo institucional;
- UC y UTFSM en la misma base mediante bootstrap idempotente futuro;
- ninguna implementación de seeds hasta elegir la capa de persistencia;
- ninguna base, URL ni pool por Institution.

## CI

Los checks existentes instalan con pnpm, ejecutan lint y test/build por
aplicación y construyen ambas imágenes Docker. Al implementar persistencia se
agregan tests de integración solo mediante el plan correspondiente.

Los primeros escenarios multi-tenant deben cubrir:

- User miembro de UC puede acceder a UC;
- User no miembro recibe `404` al solicitar UTFSM;
- un `courseId` de UC bajo el path UTFSM recibe `404`;
- una escritura no puede crear relaciones cruzadas;
- falta de rol sobre un recurso visible recibe `403`;
- JWT ausente, inválido o expirado recibe `401`.

## CD Railway

Railway es la plataforma de despliegue vigente. Cada aplicación usa su
Dockerfile y archivo `railway.json`. Los healthchecks son `/` para frontend y
`/health` para backend.

La PostgreSQL compartida se conectará mediante `DATABASE_URL` cuando exista la
implementación. El repositorio no demuestra actualmente la provisión del
servicio, por lo que no se inventan nombres, credenciales ni URLs.

## Desarrollo local

El Compose existente debe permitir:

```txt
frontend -> backend -> postgres
```

Solo se agrega una PostgreSQL. No se agregan Redis, workers, múltiples bases,
MinIO ni emuladores cloud.

Variables previstas sin secretos:

- `DATABASE_URL`: conexión única del backend a PostgreSQL;
- `PORT`: puerto backend;
- `APP_VERSION`: versión del healthcheck;
- `API_URL`: URL usada por frontend para consultar backend.

## Criterios de aceptación

- CI corre para frontend y backend.
- Frontend muestra una respuesta real del backend.
- Backend responde `/health`.
- Railway despliega las aplicaciones con sus healthchecks.
- El entorno local levanta frontend, backend y una PostgreSQL.
- Cuando exista persistencia, UC y UTFSM coexisten en la misma base.
- Cambiar el slug o un ID no permite saltarse InstitutionMembership.
- Existe tag y release GitHub para la entrega.

## Evidencia

- link a workflow CI exitoso;
- link a release/tag;
- URL frontend;
- URL o captura del healthcheck backend;
- captura o log del deployment Railway;
- configuración Railway versionada;
- tests de aislamiento cuando se implemente persistencia.

## Preparación para Spec Kit

El próximo Spec Kit de persistencia debe:

- seleccionar explícitamente la capa de acceso y migraciones;
- conectar el backend a una sola PostgreSQL;
- implementar el modelo Institution/User/InstitutionMembership;
- definir bootstrap idempotente para UC y UTFSM;
- implementar resolución por `institutionSlug` y scope institucional;
- crear constraints y tests cruzados;
- mantener Railway y Docker Compose coherentes.

No debe implementar RLS, sharding, jerarquías, provisioning dinámico ni
servicios no consumidos.
