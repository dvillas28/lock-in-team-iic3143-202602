# Auditoría de cobertura de la demostración

Fecha: 2026-10-29. Referencia: código backend/frontend y migraciones, no los mockups.
CodeGraph se intentó usar; el ejecutable no está instalado. Se inspeccionaron servicios,
controladores, acceso, DTO, validaciones, esquema, consumidores y rutas App Router.

## Matriz de funcionalidades implementadas

| Funcionalidad | Rol efectivo | Datos / relaciones | Implementación y cobertura |
| --- | --- | --- | --- |
| Login, sesión, instituciones y `/me` | Todos | User activo, membership e institución activas | API + UI; diez cuentas existentes, nunca creadas por esta seed |
| Administrar permisos de curso | Superadmin institucional | Memberships del mismo tenant | API `/memberships`, sin pantalla específica; miembros reales y ficticios |
| Listar/ver cursos | Admin propietario o participante | Course → creador institucional; enrollments activos | API + UI `/courses`; tres por tenant |
| Crear/editar cursos | `is_admin`; editar exige ownership | Institución, curso, sección inicial | API + UI; Admin dueño; crear es una operación del presentador |
| Crear/editar secciones | Admin propietario | Section → course y tenant | API + UI `/courses/C/sections`; cuatro secciones, capacidades 30/12 |
| Listar participantes | Owner, teacher/assistant de sección | Enrollment → membership y section | API + UI; 25 UC / 23 UTFSM, una matrícula inactiva por tenant |
| Inscribir/cambiar rol/activar matrícula | Owner o teacher de sección | Miembro activo, historial de enrollments | API + UI; candidatos ficticios, sin cambiar flags institucionales |
| Buscar participantes | Teacher | Directorio institucional activo | API + UI en formulario; ocho UC / seis UTFSM ficticios visibles |
| Módulos: crear/editar/ordenar/publicar/ocultar | Teacher del curso | CourseModule → course, posición única | API + UI `/courses/C/modules`; nueve por tenant, seis publicados |
| Material markdown: crear/editar/publicar/leer | Teacher escribe; participante lee lo publicado | Material → module → course, autor institucional | API + UI; 18 por tenant, dos visibles inicialmente en cada curso |
| Publicación combinada de contenido | Teacher / lectores | Visibilidad = módulo e ítem publicados | Dos módulos publicados, uno borrador; un ítem publicado y uno borrador en cada módulo |
| Quizzes: listar/ver/crear/editar/publicar | Teacher de sección; global exige owner + teacher | Quiz → course/section, JSON de preguntas | API + UI; siete por tenant, seis publicados y un borrador |
| Ventanas y límites de rendición | Student de sección | Quiz publicado, ventana, máximo tres intentos | API + UI; abierto sin vencimiento, futuro (+365 días), cerrado (−7 días) |
| Iniciar/guardar/cancelar/enviar | Student propio; teacher puede cancelar | Attempt → quiz/section/student | API + UI; corregidos, uno en curso y uno cancelado por tenant |
| Corrección automática | Envío de Student | Preguntas, respuestas, escala y redondeo SQL | Fórmula existente `calculateGrade`; notas 3,0 / 4,0 / 7,0 |
| Consultar intentos | Teacher/Assistant en su sección | Attempts y alcance académico | API + UI; Assistant sin pauta ni puntos por respuesta |
| Libro de notas | Teacher/Assistant; owner teacher amplía alcance | Grade → item/attempt/student/section | API + UI `/courses/C/gradebook`; 14 UC / 10 UTFSM |
| Ponderaciones | Admin propietario + teacher | GradeItems del curso, suma 100 | API + UI; 30/30/20/10/10 en principal; taller 100, editable antes de publicar |
| Publicar notas con idempotencia | Teacher autorizado por sección | Selección válida, último intento corregido, sin activos | API + UI; primer control publicado, segundo preparado para publicar |
| Notas propias y promedio parcial | Student | Solo grades publicadas | API + UI `/courses/C/grades`; principal: 30 % publicado; tercer curso vacío |
| Auditoría académica y filtros | Owner o teacher; notas requieren teacher | AuditEvent → course/section/actor | API + UI `/courses/C/audit`; acciones reales de la demo generan eventos |
| Salud y aislamiento | Operador / todos | Runtime separado, RLS, tenant context | `/health`, `/ready`; pruebas negativas HTTP y FK |

## Fuentes de implementación

- Esquema: `backend/migrations/*.sql`, hasta `20261026000100_operator_maintenance`.
- Backend: `backend/src/{auth,institutions,courses,sections,enrollments,modules,materials}`.
- Evaluaciones: `backend/src/{quizzes,attempts,gradebook,audit}` y sus archivos de acceso.
- Frontend: `frontend/src/app/courses/**`, `components/**`, `lib/api/**` y `lib/*/capabilities.ts`.
- Contratos: `docs/reference/openapi/`; los adaptadores reales validan la respuesta HTTP en tests.
- Operación: `render.yaml`, `backend/Dockerfile`, `commands/{serve,predeploy,start,migrate}.ts`.
- Seeds anteriores: bootstrap institucional y seed legacy; se conservan sin cambios de semántica.

## Diseño y volúmenes iniciales administrados

| Entidad | UC | UTFSM |
| --- | ---: | ---: |
| Instituciones existentes / cuentas existentes | 1 / 5 | 1 / 5 |
| Usuarios ficticios / memberships nuevas | 8 / 8 | 6 / 6 |
| Cursos / secciones | 3 / 4 | 3 / 4 |
| Matrículas activas / inactivas | 24 / 1 | 22 / 1 |
| Matrículas Student activas | 14 | 12 |
| Módulos / materiales | 9 / 18 | 9 / 18 |
| Quizzes publicados / borradores | 6 / 1 | 6 / 1 |
| Ítems de nota | 6 | 6 |
| Intentos corregidos / en curso / cancelados | 14 / 1 / 1 | 10 / 1 / 1 |
| Notas publicadas / sin publicar | 7 / 7 | 5 / 5 |
| Recibos de publicación | 1 | 1 |
| Eventos de auditoría académica insertados | 0 | 0 |

Nombres, programas, contenidos y resultados son ficticios, sin carácter oficial.
Período es un campo de Course (`DEMO-2026-2`), no una tabla independiente.
Cada sección tiene matrículas explícitas; el Student principal participa en los tres cursos.
Teacher/Assistant principales participan solo en sección 1; Admin posee los tres cursos
y tiene matrícula Teacher en sus secciones, como al crear cursos mediante la API.
Superadmin mantiene sus permisos institucionales; no recibe participación académica.
El grafo y operador quedan registrados en `demo_data_runs`, versión `academix-presentation-v1`.

## Límites confirmados

- No existen departamentos, tareas con archivos, anuncios, comentarios, asistencia,
  rúbricas, notificaciones, exportaciones de notas ni CRUD general de usuarios.
- Solo se persiste material markdown; PDF es una vista derivada del lector del frontend.
  No se insertan enlaces ni objetos de almacenamiento; no se requieren recursos externos.
- La nota usa 1,0–7,0 con exigencia 60 %. `submitted` es transitorio: un trigger impide
  dejar entregas pendientes al commit; no hay corrección manual ni estado pendiente persistente.
- Un quiz publicado no se edita. Después de publicar notas se congelan ponderaciones
  y nuevos ítems del curso. Usar el taller para la edición y publicación de borradores.
- No hay pantalla dedicada de memberships/superadmin: esa parte se demuestra por API.
  Superadmin no ve automáticamente cursos ajenos; su `/courses` inicial está vacío.
- No se fabrican eventos académicos atribuidos a usuarios: el historial de la carga
  es operativo; la guía incluye cambios reales para poblar la auditoría académica.
- Repetir conserva cambios y revocaciones; `verify` informa diferencias sin restaurarlas.
  El resumen cuenta exclusivamente registros administrados, no filas creadas luego en la demo.
- Las fechas se fijan al primer apply; el futuro dejará de ser futuro después de un año.
  La práctica abierta no depende del calendario ni se reprograma al repetir.
- Se prueba integración HTTP con consumidores frontend; no se acredita aceptación visual
  en navegador ni acceso a producción. La validación visual final corresponde al equipo.

Operación: [Render](DEMO_SEED_RENDER.md). Recorridos: [guía](DEMO_GUIDE.md).

## Archivos y evidencia local

| Cambio | Responsabilidad |
| --- | --- |
| `backend/src/seeds/presentation.ts` | CLI, configuración, opt-in, transacción y ledger |
| `presentation-manifest.ts` | Identificadores, contenido y relaciones por tenant |
| `presentation-data.ts` | Fórmula real de notas, inserción y grafo de ownership |
| `presentation-check.ts` | Migraciones, cuentas, colisiones y comprobación de resultado |
| `backend/package.json` | Comando manual `db:seed:demo` |
| `backend/test/integration/presentation-fixtures.mjs`, `presentation-*.test.mjs` | Fixtures y pruebas de seguridad, integridad y consumidores reales |
| `docs/DEMO_SEED_RENDER*.md`, `docs/DEMO_GUIDE.md` | Comandos de operación, respaldo, recuperación y recorridos |
| `docs/adr/presentation-seed.md`, esta matriz y enlace desde guía legacy | Decisión, límites y trazabilidad |

Ejecutado en PostgreSQL 17 temporal y exclusivo, sin usar la base local de desarrollo:

- Build y lint backend: aprobados. Tests unitarios: **35/35**.
- Suite completa de integración: **146/146**. Después de la última mejora de lectura
  concurrente, se ejecutaron de nuevo los **8/8** tests específicos, incluida esa prueba nueva.
- Se probaron IDs principales arbitrarios, hashes/memberships preservados, filas manuales
  intactas, rollback tardío de ambos tenants, repetición concurrente y diferencias conservadas.
- HTTP real: diez logins, cinco roles, negativos de autorización y UC/UTFSM, contenido,
  rendición/corrección/publicación, notas privadas y validadores reales del frontend.
- Propietario sin superusuario bajo FORCE RLS: aprobado; runtime rechazado como operador.
- Longitud documental y `git diff --check`: aprobados. Sin despliegue ni escritura productiva.

Para repetir, configurar `TEST_DATABASE_URL` y `TEST_RUNTIME_DATABASE_URL` de una base
**exclusiva terminada en `_test`**, PostgreSQL 17/18. Los tests reinician su esquema.
Instalar dependencias backend/frontend y ejecutar desde la raíz:

```bash
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir backend lint
python3 .github/scripts/check-doc-length.py
```

No ejecutar builds simultáneos del backend: Nest limpia `dist` y puede interrumpir
los subprocesos de una suite que ya está corriendo.
