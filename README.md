# AcademiX — LMS Multi-Tenant Universitario

Proyecto grupal para el ramo de Desarrollo de Software. La propuesta es construir un LMS universitario multi-tenant orientado al flujo académico crítico de cursos semestrales: material, evaluaciones, publicación de notas y seguimiento del estudiante.

El objetivo no es replicar todas las funcionalidades de Canvas o Moodle, sino proponer una plataforma integrada, trazable y preparada para crecer por institución.

## Vision

Para universidades que necesitan administrar cursos semestrales de forma clara, escalable y segura, AcademiX integra material académico, evaluaciones autocorregidas y libro de notas en un flujo único.

A diferencia de plataformas LMS genéricas, prioriza la experiencia académica crítica y el aislamiento lógico entre instituciones.

## Propuesta De Valor

El flujo principal del producto es:

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

La plataforma busca reducir la fragmentación entre LMS, hojas de cálculo, correos y carpetas externas.

## Alcance Inicial

El MVP se concentra en:

- Una PostgreSQL compartida con aislamiento lógico por `Institution`.
- Contexto HTTP explícito en `/api/v1/institutions/{institutionSlug}/...`.
- Usuarios autenticados con roles contextuales.
- Cursos semestrales, secciones e inscripciones.
- Módulos y material académico.
- Quizzes de alternativas autocorregidos.
- Ponderaciones y publicación explícita de notas.
- Libro de notas del curso.
- Experiencias de estudiante y docente.

Fuera del MVP inicial:

- Google Calendar/Outlook.
- Quizzes en vivo.
- Entregas y corrección manual compleja.
- IA, chat y RAG.
- Analítica avanzada.

## Interfaces

Los mockups son wireframes exploratorios de alta fidelidad en HTML estático. Algunas vistas representan ideas anteriores o futuras y no amplían el alcance vigente de la Entrega 2.

```bash
# Desde la raiz del repo
python3 -m http.server 8899 -d mockups
# → http://localhost:8899/index.html
```

Ver [mockups/README.md](mockups/README.md) para el mapa de vistas e historias de usuario validadas.

El sistema de diseno esta en [DESIGN.md](DESIGN.md): tokens de color, tipografia, componentes y reglas de layout. La implementacion de referencia vive en `mockups/assets/tokens.css` (tokens) y `mockups/assets/app.css` (componentes del shell).

## Documentacion

- [Indice de documentacion](docs/README.md): estructura viva del repo.
- [Entrega 2](docs/deliveries/2/README.md): documentación arquitectónica vigente.
- [ADR de PostgreSQL compartida](docs/adr/adopt-shared-postgresql-multitenancy.md): decisión de multi-tenancy actual.
- [OpenAPI](docs/reference/openapi/README.md): contrato HTTP institution-scoped.

Las Entregas 0 y 1 se conservan como evidencia histórica. Sus referencias a
database-per-tenant o infraestructura cloud anterior no describen la solución
vigente.

## Starter Del Repo

- Gestor de paquetes: pnpm, fijado en `package.json`.
- Specs: timestamp `YYYYMMDD-HHMMSS-feature-name`.
- Ramas: `<type>/<short-name>`, por ejemplo `feat/course-sections`.
- Constitution: `.specify/memory/constitution.md`.
- Guias: `docs/guides/`.
- Skills locales: `.agents/skills/lms-*`.

## Flujo De Trabajo

```bash
/speckit-specify "descripcion funcional del cambio"
git switch -c feat/short-name
export SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>-<short-name>
/speckit-plan
/speckit-tasks
git push -u origin HEAD
```

Crear PR hacia `main` y enlazar el spec trabajado. Ver
[Git Flow del equipo](docs/guides/git-flow.md).

## Stack Vigente

- Frontend: Next.js.
- Backend: NestJS.
- Base de datos: una PostgreSQL compartida para todas las Institutions.
- Despliegue: Railway.
- Archivos: proveedor de object storage todavía no seleccionado.

Redis, workers, microservicios, RLS y sharding están fuera del MVP.

## Base Tecnica Local

El repositorio incluye dos aplicaciones administradas con pnpm y una base local compartida:

- `frontend/`: Next.js con TypeScript, App Router y ESLint.
- `backend/`: NestJS con TypeScript y el endpoint de salud `GET /health`.
- `postgres`: PostgreSQL compartida provista por Docker Compose.

El frontend consulta al backend desde el servidor de Next. Fuera de Docker usa
`http://localhost:3001` por defecto; Docker Compose configura `API_URL` como
`http://backend:3001`, usando el nombre del servicio dentro de la red interna.

### Requisitos

- Docker.
- Docker Compose.

Para desarrollo sin Docker se requiere Node.js 20.9 o superior y pnpm 9.15.9.

### Levantar El Proyecto

```bash
docker compose up --build
```

### Servicios

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
PostgreSQL: localhost:5432
```

El backend expone únicamente el endpoint de salud `GET /health` para este
bootstrap:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-09-27T18:30:00.000Z"
}
```

### Detener

```bash
docker compose down
```

### Variables De Entorno

`.env.example` documenta las variables disponibles. No contienen secretos:

- `API_URL`: URL que usa el servidor de Next para consultar al backend.
- `NEXT_PUBLIC_API_URL`: URL pública para consultas desde el navegador, si se
  requieren. Next.js la incorpora durante el build; nunca contiene secretos.
- `PORT`: puerto de escucha de NestJS; su valor por defecto es `3001`.
- `APP_VERSION`: versión informada por `GET /health`.
- `DATABASE_URL`: conexión única a PostgreSQL; no existe una URL por Institution.
- `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`: bootstrap local del contenedor.

### Verificaciones Locales

Después de instalar las dependencias en `frontend/` y `backend/`, desde la raíz:

```bash
pnpm build
pnpm lint
pnpm test
pnpm docs:api:lint
docker compose config
```

### Cliente API del frontend

Los tipos versionados en `frontend/src/lib/api/schema.d.ts` se generan desde el
OpenAPI vigente, incluidas sus referencias YAML. Después de cambiar el contrato:

```bash
pnpm --dir frontend api:generate
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
```

Las pruebas usan el runner nativo de Node.js 24. `api:check` verifica que los
tipos estén sincronizados con el contrato sin escribir archivos.

`createApiClient` en `frontend/src/lib/api/client.ts` ofrece los métodos tipados
de `openapi-fetch`: `{ data, response }` en éxito y errores estructurados en
fallos. Acepta `baseUrl`, `fetch` para pruebas y `getToken` para consultar el JWT
actual. En servidor, crear una instancia por solicitud/sesión, sin compartir
tokens entre usuarios. `institutions.ts` ofrece `listAccessibleInstitutions(client)`
y `getCurrentUser(client, institutionSlug)`; requieren backend y autenticación
todavía pendientes. `/health` conserva su consumo público y validación.

El cliente usa `API_URL` en servidor y `NEXT_PUBLIC_API_URL` en navegador, o
`http://localhost:3001` en desarrollo. Producción exige configurar la URL del
entorno correspondiente (o pasar `baseUrl`). El consumo desde navegador a otro
origen requiere CORS del backend, actualmente pendiente.

Los parámetros van en `params.path` / `params.query`; el contexto institucional
se obtiene de `institutionSlug`. Para comprobar propiedades adicionales del
body, usar `body: { name: "Curso" } satisfies components["schemas"]["CourseUpdate"]`,
importando `components` como tipo desde `schema.d.ts`. La autorización sigue
siendo responsabilidad del backend según el [contrato vigente](docs/reference/openapi/README.md).

Los consumidores pueden capturar `ApiHttpError` de `errors.ts` y consultar
`kind`: `authentication` (401), `authorization` (403), `not-found` (404) o `http`
(otros estados). `status` conserva el estado HTTP incluso con un body vacío,
inválido o de otro media type. `problem` contiene metadatos para diagnóstico;
mostrar `message` en la UI, sin exponer `problem.detail`, `title` o `errors`.
`ApiNetworkError` (`kind: "network"`) conserva la causa de fallos sin respuesta
HTTP. No hay reintentos, redirecciones ni cierre automático de sesión.
