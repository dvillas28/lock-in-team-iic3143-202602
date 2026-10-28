# Research: Notas y seguimiento frontend

## 1. Reutilizar stack y límites existentes

**Decision**: Mantener Next/React/TypeScript, cliente OpenAPI, Session.request,
useResource y estilos sincronizados; sin dependencias nuevas.
**Rationale**: package.json, cliente y misiones previas ya resuelven transporte,
sesión, errores, shell y temas. No requiere elección de tecnología externa.
**Alternatives considered**: estado global/caché, proveedor UI o nuevo servicio:
no hacen falta para cuatro flujos con carga explícita.

## 2. Permisos por operación

**Decision**: Usar memberships académicas activas del curso; owner exige isAdmin
vigente y createdBy=actor. Libro/intentos admiten assistant; pesos/publicación
requieren teacher; auditoría permite además owner sin teacher.
**Rationale**: `backend/src/gradebook/gradebook-access.ts`, servicio de auditoría,
ADR `institution-admin-and-course-ownership.md` y spec FR-004/005/014.
**Alternatives considered**: reusar `capabilities.configure` como permiso de pesos:
incorrecto, permite owner sin teacher. Perfil demo y superadmin no autorizan.

## 3. Freeze sin campo público

**Decision**: Owner teacher consulta todas las páginas del libro sin filtro antes
 de habilitar pesos; detener al encontrar publicación. Estados unknown/unlocked/
locked; unknown impide guardar. Recibo confirmado o GRADE_WEIGHTS_LOCKED bloquea.
**Rationale**: Course y GradeItemListResponse no exponen grade_items_locked_at.
Notas publicadas son inmutables; cualquier publishedAt prueba freeze global.
Ausencia exige agotar el libro, no solo página/sección seleccionada. Una publicación
concurrente puede ocurrir después; 409 permanece autoridad y exige refrescar.
**Alternatives considered**: nuevo campo/endpoint viola exclusión API; inferir por
pesos=100 o auditoría incompleta confunde configuración con publicación.
**Limit**: recorrido O(páginas) solo al abrir editor de pesos; ante fallo mantener
unknown. No hay garantía de ausencia concurrente hasta PUT backend.

## 4. Promedio y sección histórica

**Decision**: Mostrar valores backend, null como pendiente y estado isPartial.
Libro identifica fila por student.id + sectionId histórico, incluidos revocados.
**Rationale**: `gradebook.service.ts` agrupa por sección histórica; my-grades no
acepta studentId ni devuelve notas sin publicar. Peso publicado cero da null.
**Alternatives considered**: recalcular, rellenar cero o unir por matrícula actual:
filtra historia o expone resultados/medias incorrectos.

## 5. Publicación recuperable

**Decision**: Selección explícita canónica y clave estable, solo en memoria del
contexto actual. Reintentar POST exacto tras incertidumbre; sin nueva clave para
sortear 409. Recarga sin clave permite consulta, nunca replay supuesto.
**Rationale**: ledger persistente tenant/actor/clave; mismo curso/selección devuelve
recibo original tras revalidar permisos. Cada par ítem/estudiante es obligatorio.
**Alternatives considered**: optimismo, cache localStorage o selección automática
por páginas: dificulta integridad, privacidad y confirmación del lote real.
**Limit**: libro publicado prueba visibilidad actual, no identidad del recibo perdido;
GET sin cambios tampoco prueba que una solicitud en vuelo haya fallado.

## 6. Revisión de intentos y auditoría

**Decision**: Extender adaptador de intentos con listQuizAttempts y lectura por
vista teacher/staff; conservar DTO de rendición seguro. Reusar cancelación misión 5
mediante enlace autorizado, sin implementarla de nuevo. Auditoría solo curso.
**Rationale**: contrato distingue campos académicos teacher y consulta staff;
assistant no recibe pauta. Snapshots backend ya están sanitizados al leer/escribir.
**Alternatives considered**: reutilizar parser de rendición para teacher perdería
corrección; convertir snapshot en permisos vigentes concedería acceso histórico.

## 7. Validación y entrega

**Decision**: Pruebas node:test/jsdom solicitadas por FR-020; navegador/API real
para autorización, carreras, teclado, 375 px, temas y movimiento reducido.
**Rationale**: mocks no prueban locks, RLS ni idempotencia persistente. FE-20
consolida seis misiones y registra estado pendiente de recorridos aún no disponibles.
**Alternatives considered**: añadir framework E2E o declarar conformidad con snapshots
solamente: coste innecesario o evidencia insuficiente.

## Evidencia y resultado

Revisión local de spec/constitución, package.json, CodeGraph, OpenAPI gradebook,
audit, quizzes y schemas; ADR publicación/freeze y UI admin/no admin.
Investigación de contratos delegada según speckit-plan; sin consultas web porque
las decisiones dependen de contratos/versiones del repositorio, no novedades.
No quedan NEEDS CLARIFICATION; límites de observabilidad resueltos sin ampliar API.
