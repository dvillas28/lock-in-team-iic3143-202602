# Publicación de notas y congelamiento de ponderaciones

Fecha: 2026-10-19. Estado: implementado; aceptación registrada en
[validación](../backend/gradebook-validation.md).

## Decisión

Configurar pesos exige teacher activo y admin dueño del curso. Publicar exige
teacher activo; ownership con admin amplía el alcance a todo el curso.
Assistant lee seguimiento de sus secciones, sin corrección ni escritura.
Auditoría conserva la excepción del admin dueño aun sin teacher.
Se aplica el [ADR de permisos](institution-admin-and-course-ownership.md).

Publicación recibe listas explícitas completas de ítems, secciones y estudiantes.
Cada par ítem/estudiante exige Grade del último intento graded y sección histórica
seleccionada. Un intento activo bloquea todo el lote; cancelar sigue siendo explícito.
No exigir matrícula vigente al destinatario ni sustituir su historia por Enrollment.
Las consultas estudiantiles devuelven únicamente notas propias publicadas.
Staff autorizado puede consultar no publicadas dentro de su alcance histórico.

Una transacción toma locks de contexto del actor, Course, Enrollment autorizador,
ítems, quizzes, intentos y notas, con UUID ordenados en cada conjunto. Nunca toma
locks de identidad de destinatarios después de Course. Todos los escritores
académicos reutilizan Course para serializar publicación, autoría e intentos.

Primera publicación congela pesos y nuevos GradeItems; SQL protege inserción,
borrado, identidad del ítem y notas publicadas. No reescribir migraciones anteriores.
Se conserva grade_items_locked_at monotónico introducido por autoría.
Pesos NUMERIC(5,2); total SQL exactamente 100. Promedio NUMERIC de publicadas,
normalizado por peso publicado, HALF_UP a un decimal; peso cero produce null.

El ledger append-only grade_publications guarda selección canónica y recibo.
Clave única por tenant/actor; mismo curso/selección devuelve recibo original tras
revalidar permisos, otro curso/selección da conflicto. Una clave nueva sobre una
nota publicada falla. Eventos por nota, Grades y recibo confirman juntos; cualquier
fallo revierte también reserva de clave y freeze. Auditoría filtra escritura y lectura
histórica mediante allowlists, incluidos snapshots anidados de ponderaciones.

## Alternativas y límites

Se descartan caches de idempotencia, publicación parcial, cancelación implícita,
float JS, tablas académicas sustitutas, corrección manual y exportación.
El lock por curso limita paralelismo; cambiar solo con evidencia de carga.
No añade infraestructura ni dependencias. La serialización SQL directa exige
respetar el protocolo Course antes de modificar filas, igual que la API.

## Trazabilidad

CU-10/11/12/13/16; RF21–26/29; FR-001–010; SC-001–003; RNF1–4/9.
Backlog BE-26–32 y DOC-15: conservar responsables existentes.
[Spec](../../specs/20261014-235244_notas-publicacion-auditoria/spec.md),
[modelo](../../specs/20261014-235244_notas-publicacion-auditoria/data-model.md).
