# AcademiX — LMS Multi-Tenant Universitario

Proyecto grupal para el ramo de Desarrollo de Software. La propuesta es construir un LMS universitario multi-tenant orientado al flujo academico critico de cursos semestrales: material, evaluaciones, entregas, correccion, publicacion de notas y seguimiento del estudiante.

El objetivo no es replicar todas las funcionalidades de Canvas o Moodle, sino proponer una plataforma mas integrada, trazable y preparada para escalar por institucion.

## Vision

Para universidades que necesitan administrar cursos semestrales de forma clara, escalable y segura, esta plataforma es un LMS multi-tenant que integra material academico, evaluaciones, entregas y libro de notas en un flujo unico.

A diferencia de plataformas LMS genericas, prioriza la experiencia academica critica y una arquitectura preparada para aislar y escalar instituciones completas.

## Propuesta De Valor

El flujo principal del producto es:

```txt
Curso -> Modulos -> Material -> Evaluaciones -> Entregas -> Correccion -> Publicacion de notas -> Libro de clases
```

La plataforma busca reducir la fragmentacion entre LMS, hojas de calculo, correos, carpetas externas y calendarios separados.

## Alcance Inicial

El MVP se concentra en:

- Multi-tenancy por universidad.
- Usuarios autenticados con roles contextuales.
- Cursos semestrales, secciones e inscripciones.
- Modulos y material academico.
- Evaluaciones/tareas con ponderaciones.
- Entregas de estudiantes.
- Correccion y publicacion manual de notas.
- Libro de notas del curso.
- Dashboard estudiante/docente.
- Lector de PDF en plataforma con asistente IA (citas por pagina, explicacion de seleccion).

Fuera del MVP inicial:

- Google Calendar/Outlook.
- Quizzes en vivo.
- Planificacion docente avanzada.
- RAG sobre el corpus completo del curso.
- Analitica avanzada.

## Interfaces

Los mockups son wireframes de alta fidelidad en HTML estatico. Cubren el flujo completo para los roles publico, estudiante y docente, incluyendo estados de entrega, libro de notas con ponderaciones y lector PDF con asistente IA.

```bash
# Desde la raiz del repo
python3 -m http.server 8899 -d mockups
# → http://localhost:8899/index.html
```

Ver [mockups/README.md](mockups/README.md) para el mapa de vistas e historias de usuario validadas.

El sistema de diseno esta en [DESIGN.md](DESIGN.md): tokens de color, tipografia, componentes y reglas de layout. La implementacion de referencia vive en `mockups/assets/tokens.css` (tokens) y `mockups/assets/app.css` (componentes del shell).

## Documentacion

- [Indice de documentacion](docs/README.md): estructura viva del repo.
- [Design doc Entrega 1](docs/deliveries/0/design-doc-entrega-1.md): bajada formal alineada al checklist de la primera entrega.
- [Alcance](docs/deliveries/0/scope.md): decisiones de scope, prioridades y lo que queda fuera.
- [Requisitos](docs/deliveries/0/requirements.md): requisitos funcionales, no funcionales, restricciones y SLOs.
- [Historias de usuario](docs/deliveries/0/user-stories.md): historias priorizadas por modulo con criterios de aceptacion.
- [Arquitectura](docs/deliveries/0/architecture.md): primera version de arquitectura, tenancy e infraestructura.
- [Roadmap](docs/deliveries/0/roadmap.md): plan de trabajo tentativo para 10-12 semanas.
- [Glosario](docs/deliveries/0/glossary.md): terminos clave del dominio.
- [Notas de descubrimiento](docs/deliveries/0/discovery-notes.md): decisiones y supuestos levantados durante la iteracion inicial.

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

## Stack Tentativo

- Frontend: Next.js.
- Backend: NestJS.
- Base de datos: PostgreSQL.
- Cache/colas: Redis.
- Archivos: object storage compatible con S3.
- Infraestructura: load balancer, reverse proxy/API gateway, connection pool y despliegue cloud con free tiers cuando sea posible.

## Modelo De Proceso

Se propone un enfoque iterativo liviano, tipo Scrum/Kanban hibrido, con iteraciones de una semana. El proyecto tiene incertidumbre funcional y tecnica, por lo que conviene validar temprano el core antes de sumar funcionalidades estrella como IA.
