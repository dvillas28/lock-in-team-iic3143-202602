# Casos de uso y requerimientos

## Contexto funcional y alcance

AcademiX cubre institución → curso → material Markdown → quiz → nota → publicación.
Síntesis vigente del MVP; los flujos detallados anteriores quedan en Git (`a60f0ff`).
Conserva CU-01–16, RF1–29 y RNF1–10 sin distribuirlos en anexos.
[Alcance](02-scope.md), [actores y permisos](05-domain-model.md),
[cuentas](../../guides/demo-accounts.md) y [evidencia del polish](../../backend/feedback-e2-validation.md).

## Casos de uso del MVP

Regla común: usuario, institución y membership activos; permisos revalidados en
cada operación. JWT inválido/ausente: 401; recurso ajeno/inexistente: 404;
acción prohibida sobre recurso visible: 403. Un error no deja escrituras parciales.
Operador provisiona; superadmin delega is_admin en su institución; admin crea
cursos y administra los propios. Enrollment define teacher/student/assistant.

## CU-01 — Elegir institución

Usuario autenticado lista instituciones accesibles y elige una. Sin memberships, se informa lista vacía; no se revela una institución ajena.

## CU-02 — Acceder al contexto institucional

El path solicita contexto; el servidor valida identidad y pertenencia persistidas. Acceso válido permite navegar; revocación o desactivación retira acceso inmediato.

## CU-03 — Ver cursos y secciones

El usuario consulta cursos/secciones visibles por ownership administrativo o matrícula vigente. Identificadores conocidos no amplían su alcance.

## CU-04 — Gestionar secciones y roles

Admin propietario crea/configura secciones; teacher gestiona participantes de sus secciones. Asignar/revocar roles conserva historia y auditoría atómica.

## CU-05 — Publicar material

Teacher crea/edita/publica u oculta Markdown común al curso. Se valida contenido; publicación de módulo e ítem son independientes. Binarios quedan diferidos.

## CU-06 — Consultar material

Estudiante autorizado lee material solo si módulo e ítem están publicados. Ocultación o pérdida de permisos retira visibilidad; no se exponen borradores.

## CU-07 — Crear y publicar quiz

Teacher prepara pauta protegida y publica quiz de curso o sección autorizada. Validar preguntas/alternativas; primer intento congela pauta, puntos y política.

## CU-08 — Responder quiz

Student inicia/reanuda y guarda respuestas completas de un intento propio, dentro de ventana y límite. Quien tiene acceso a pauta no puede rendir ese quiz.

## CU-09 — Enviar intento y obtener calificación automática

Enviar confirma respuestas, calificación NUMERIC, Grade vigente y auditoría en una transacción. Replay original es estable; último graded determina nota no publicada.

## CU-10 — Configurar libro de notas

Teacher que además es admin propietario reemplaza pesos completos, suma 100 %. Primera nota publicada congela ítems y ponderaciones; cambios inválidos se rechazan.

## CU-11 — Publicar notas

Teacher selecciona ítems, secciones y estudiantes explícitos; ownership amplía curso. Publicación atómica exige último graded y ausencia de intentos activos.

## CU-12 — Ver notas y promedio

Student consulta solo notas propias publicadas y promedio parcial ponderado. Sin pesos publicados el promedio es null; notas ajenas/no publicadas no aparecen.

## CU-13 — Consultar auditoría

Teacher consulta historia de sus secciones; owner+teacher todo curso. Owner sin teacher conserva administrativos, nunca grade. Filtros/cursor revalidan permisos.

## CU-14 — Organizar módulos del curso

Teacher crea, edita, ordena y publica/oculta módulos compartidos. Reordenamiento completo y cambios confirman con auditoría; ocultar no borra material ni historia.

## CU-15 — Cancelar un intento en progreso

Student propietario o docente autorizado cancela un intento activo. Cancelled es terminal, consume número/intento, no genera Grade ni altera nota previa; se audita.

## CU-16 — Revisar el libro de notas docente

Teacher y assistant consultan seguimiento por sección histórica; owner+teacher amplía curso. Assistant no escribe/publica ni accede a corrección por respuesta.

## Revisión de mockups por rol — Issue #22

[Inventario de vistas](../../../mockups/README.md): referencia visual CU-01–16.
Los HTML son demostración, no autorización. Rol y capacidad administrativa son
independientes; UI, API y contratos siguen la [matriz vigente](05-domain-model.md).

## Requisitos funcionales

| ID | Regla vigente |
| --- | --- |
| RF1 | Autenticar identidad global mediante JWT. |
| RF2 | Listar únicamente instituciones accesibles al usuario. |
| RF3 | UC/UTFSM coexisten en PostgreSQL compartida; bootstrap opt-in. |
| RF4 | Rutas académicas: /api/v1/institution/{institutionSlug}/... |
| RF5 | Resolver slug a UUID y validar membership activa antes de roles. |
| RF6 | URL institucional no autentica ni autoriza. |
| RF7 | User global puede pertenecer a varias instituciones. |
| RF8 | Entidades académicas conservan institution_id. |
| RF9 | FK/constraints compuestas impiden relaciones entre instituciones. |
| RF10 | Enrollment.role cerrado: teacher/student/assistant; varchar+CHECK. |
| RF11 | Varios roles activos distintos por usuario/sección; sin duplicar mismo rol. |
| RF12 | is_admin crea cursos; is_admin+ownership administra propios; teacher gestiona sus participantes; superadmin delega solo is_admin institucional. |
| RF13 | Teacher crea/ordena/edita/publica/oculta módulos de curso. |
| RF14 | Teacher gestiona material Markdown; archivos requieren extensión futura. |
| RF15 | PDF/CSV/XLSX/TXT/JPEG/PNG son propuesta binaria diferida, fuera del MVP actual. |
| RF16 | Student solo ve material publicado con matrícula activa autorizada. |
| RF17 | Teacher autorizado crea quizzes de alternativas. |
| RF18 | Cada pregunta publicada tiene alternativas y exactamente una correcta. |
| RF19 | Intentos con límite positivo opcional; uno activo por estudiante/quiz. |
| RF20 | Calificación automática; último graded determina Grade vigente no publicada. |
| RF21 | Configurar pesos requiere teacher y admin propietario. |
| RF22 | Teacher autorizado publica notas dentro de su alcance. |
| RF23 | Student solo recibe notas propias publicadas. |
| RF24 | Promedio parcial normalizado por ponderación publicada; sin peso, null. |
| RF25 | Cada operación autoriza institución, curso, sección y permiso vigente. |
| RF26 | Historia inmutable sanitizada; grade exige docencia; owner sin teacher conserva administrativos. |
| RF27 | Vista estudiantil omite pauta/corrección; acceso a pauta impide rendir. |
| RF28 | Cancelación propia/docente autorizada consume intento, no genera Grade y se audita. |
| RF29 | Teacher gestiona libro según permiso; assistant solo seguimiento de sus secciones. |

## Reglas de negocio y seguridad

UUID como relación interna; slug único solo selecciona contexto. FK compuestas,
RLS y runtime sin bypass refuerzan aislamiento sin sustituir autorización.
Notas publicadas, intentos terminales y auditoría conservan historia; escrituras
sensibles son atómicas. Curso se crea con sección/teacher inicial sin imponer
mínimo permanente de docentes. Onboarding inicial no es alta general de cuentas.

## Requisitos no funcionales

| ID | Regla vigente |
| --- | --- |
| RNF1 | Ningún acceso, escritura, relación o proceso cruza instituciones. |
| RNF2 | JWT, membership activa y permisos contextuales obligatorios. |
| RNF3 | Transacciones para cambios conjuntos de respuestas, notas, pesos y auditoría. |
| RNF4 | Constraints/unicidades/FK incluyen institution_id cuando corresponde. |
| RNF5 | Recuperación objetivo de base completa; Render free no acredita backups/PITR. Restore individual diferido. |
| RNF6 | Monolito modular; sin microservicios. |
| RNF7 | Render configurado; dominio independiente del proveedor. Git no acredita despliegue. |
| RNF8 | Binarios externos con namespace institucional son extensión diferida; proveedor por decidir. |
| RNF9 | Health/readiness/logs sin secretos ni datos académicos ajenos. |
| RNF10 | Una secuencia de migraciones; backfills scoped/idempotentes y por lotes cuando proceda. |
