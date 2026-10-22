# AcademiX — LMS Multi-Tenant Universitario

Proyecto grupal de Desarrollo de Software: LMS universitario con cursos semestrales,
material, evaluaciones autocorregidas, publicación de notas y seguimiento del estudiante.
El alcance vigente corresponde a la Entrega 2.

## Flujo principal

```txt
Curso -> Módulos -> Material -> Quiz autocorregido -> Nota -> Publicación -> Promedio
```

## Alcance inicial

- PostgreSQL compartida, aislamiento lógico por Institution y RLS mínima.
- Contexto HTTP: `/api/v1/institution/{institutionSlug}/...`.
- Identidad global; pertenencias activas y roles por sección.
- Cursos, secciones, matrículas, módulos y material markdown.
- Quizzes de alternativas, intentos, calificación automática y auditoría.
- Ponderaciones, publicación explícita y libro de notas.
- Experiencias de estudiante y docente.

Fuera del MVP: calendarios externos, quizzes en vivo, corrección manual compleja,
IA/chat/RAG, analítica avanzada y altas generales de usuarios por API.
Archivos binarios y su proveedor de object storage requieren otra misión.

## Interfaces y diseño

Mockups HTML de alta fidelidad: exploratorios, sin ampliar el alcance de Entrega 2.

```bash
python3 -m http.server 8899 -d mockups
```

Abrir `http://localhost:8899/index.html`.
[Mapa de vistas/historias](mockups/README.md) y [sistema de diseño](DESIGN.md).
Fuentes canónicas: `mockups/assets/tokens.css` y `mockups/assets/app.css`.

## Documentación

- [Índice](docs/README.md): estructura viva del repositorio.
- [Misiones backend](docs/backend/README.md): cobertura CU/RF/RNF y dependencias.
- [Entrega 2](docs/deliveries/2/README.md): arquitectura vigente.
- [PostgreSQL compartida](docs/adr/adopt-shared-postgresql-multitenancy.md).
- [Contexto y RLS](docs/adr/institution-context-and-database-isolation.md).
- [OpenAPI](docs/reference/openapi/README.md) y [cliente frontend](docs/guides/frontend-api-client.md).
- [Demo institucional y entrega](docs/backend/demo-tenant-bootstrap.md): secretos, bootstrap, smoke y pendientes remotos.

Entregas 0/1 conservan evidencia histórica; sus alternativas cloud y database-per-tenant
no describen la solución vigente.

## Convenciones y trabajo

pnpm fijado en package.json; specs con timestamp `YYYYMMDD-HHMMSS_descripcion-mision`.
Ramas `<type>/<short-name>`; constitución `.specify/memory/constitution.md`.
Guías en `docs/guides/`; skills locales en `.agents/skills/lms-*`.

```bash
/speckit-specify "descripcion funcional del cambio"
git switch -c feat/short-name
export SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>_<descripcion-mision>
/speckit-plan
/speckit-tasks
```

Crear PR hacia main enlazando el spec. [Git Flow](docs/guides/git-flow.md).

## Stack y despliegue

Frontend Next.js; backend NestJS; PostgreSQL compartida; Render ([ADR](docs/adr/deploy-on-render.md)).
RLS mínima y contexto transaccional; runtime sin ownership ni bypass.
Redis, workers, microservicios y sharding quedan fuera del MVP.

API central: `https://api.dvillasc.me`.
Frontend: `uc.academix.dvillasc.me` y `utfsm.academix.dvillasc.me`.
Host/Origin no seleccionan tenant: el path lo solicita y la pertenencia lo autoriza.
Implementación local no acredita despliegue, DNS ni TLS públicos: consultar runbook.

## Desarrollo local

Requisitos: Docker/Compose; sin Docker, Node.js 24 y pnpm 9.15.9.
Configurar entorno desde `.env.example`, incluido AUTH_JWT_SECRET, sin versionar secretos.

```bash
docker compose up --build
```

| Servicio | Dirección local |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

Compose ejecuta predeploy antes de HTTP. Frontend servidor usa `API_URL=http://backend:3001`;
fuera de Docker usa localhost:3001. Backend: `/health` informa versión/commit;
`/ready` valida esquema, rol y RLS. Detener con `docker compose down`.

## Variables y verificaciones

`.env.example` documenta configuración; secretos reales quedan fuera de Git.

- API_URL y NEXT_PUBLIC_API_URL: origen backend; esta última se incorpora al build browser.
- DATABASE_URL: conexión runtime; MIGRATION_DATABASE_URL: operador, sin fallback HTTP.
- CORS_ALLOWED_ORIGINS: array de orígenes explícitos; configuración local separada.
- AUTH_JWT_SECRET: identidad; APP_VERSION/PORT: versión y puerto.
- POSTGRES_DB/USER/PASSWORD: contenedor local; DEMO_*: bootstrap opt-in del runbook.

Instalar dependencias con pnpm en raíz, frontend y backend; luego:

```bash
pnpm build
pnpm lint
pnpm test
pnpm docs:api:lint
```

Integración/coverage reconstruyen esquema: exclusivamente dos credenciales en la misma
base descartable `_test`. [Preparación y comandos](specs/20261020-211552_demo-aislamiento-dominios/quickstart.md).
