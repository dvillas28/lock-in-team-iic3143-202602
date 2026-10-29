## Revisión de mockups por rol — Issue #22

El seguimiento de [Issue #22](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/22)
incorpora las correcciones y nuevos mockups solicitados después del mapeo inicial.
Se mantienen estos CU, el [alcance](02-scope.md) y el
[modelo de dominio](05-domain-model.md) como fuente vigente; las US y BPMN de
Entregas 0/1 son antecedentes históricos. `specs/` no contiene otro alcance funcional.

Hay **17 HTML: 16 pantallas y una galería**. Se reutilizan tokens, shell,
formularios, tablas y tarjetas existentes. Las siete pantallas nuevas (10–16)
agrupan metas relacionadas para evitar una pantalla artificial por CU.
El acceso de login es previo a CU-01/CU-02 y la landing/galería no constituyen
casos de uso académicos nuevos.

### Experiencia / rol → vista → caso de uso

| Experiencia / perfil | Vista / mockup | Casos de uso vigentes | Propósito y evidencia visual |
| --- | --- | --- | --- |
| Compartido | [Galería](../../../mockups/index.html) | Sin CU operativo | Dos experiencias académicas y cuatro perfiles de demostración. |
| Público | [Landing](../../../mockups/01-landing.html) | Acceso previo | Propuesta de valor y acceso global. |
| Compartido | [Acceso a AcademiX](../../../mockups/02-login.html) | Acceso previo | Acceso de demostración previo a elegir institución (RF1); sin invitación ni branding por subdominio. |
| No admin · estudiante, ayudante o docente | [Mis cursos](../../../mockups/03-dashboard.html) | CU-02 — Acceder al contexto institucional; CU-03 — Ver cursos y secciones | Inicio no admin compartido; docente gestiona su sección y contenido, ayudante consulta y estudiante rinde. |
| No admin · consulta | [Curso y módulos](../../../mockups/04-course-modules.html) | CU-03 — Ver cursos y secciones; CU-06 — Consultar material | Solo módulos publicados, lectura markdown y PDF; controles por teclado. |
| Estudiante | [Quizzes](../../../mockups/05-evaluations.html) | CU-08 — Responder quiz; CU-09 — Enviar intento y obtener calificación automática; CU-12 — Ver notas y promedio | Listado de quizzes, inicio/reanudación y acceso a notas publicadas; envío detallado en 14. |
| Estudiante | [Calificaciones](../../../mockups/06-grades.html) | CU-12 — Ver notas y promedio | Notas propias publicadas, promedio parcial 6.1, ponderación 65 % y estado sin notas. |
| Admin · docente | [Administrar mis cursos](../../../mockups/07-teacher-dashboard.html) | CU-02 — Acceder al contexto institucional; CU-03 — Ver cursos y secciones | Inicio admin con gestión académica de todas las secciones del curso. |
| Docente admin/no admin; ayudante (consulta) | [Libro de notas](../../../mockups/08-teacher-gradebook.html) | CU-10 — Configurar libro de notas; CU-11 — Publicar notas; CU-16 — Revisar el libro de notas docente | Admin configura pesos comunes; ambos docentes publican dentro de su alcance. Ayudante solo consulta sección 2. |
| Estudiante | [Lector de documentos](../../../mockups/09-pdf-reader.html) | CU-06 — Consultar material | PDF de ejemplo y retorno al módulo, sin IA; archivo condicionado al almacenamiento futuro. |
| Usuario autenticado (compartido) | [Elegir institución](../../../mockups/10-institutions.html) | CU-01 — Elegir institución; CU-02 — Acceder al contexto institucional | Instituciones accesibles, roles disponibles, lista vacía, contexto no disponible y UTFSM sin cursos. |
| Docente admin/no admin | [Secciones y roles](../../../mockups/11-course-management.html) | CU-04 — Gestionar secciones y roles | Admin gestiona todas las secciones y crea nuevas; docente no admin asigna/desactiva participantes solo en su sección. |
| Docente admin/no admin | [Módulos y material](../../../mockups/12-content-editor.html) | CU-14 — Organizar módulos del curso; CU-05 — Publicar material | Contenido compartido: creación y orden de módulos, edición de ítems y check verde de publicación independiente por fila. |
| Docente admin/no admin | [Autoría de quiz](../../../mockups/13-quiz-editor.html) | CU-07 — Crear y publicar quiz | Ambos docentes crean quizzes y acceden a pauta; no admin dirige el quiz a su sección y admin puede seleccionar todas. |
| Estudiante | [Responder quiz](../../../mockups/14-quiz-attempt.html) | CU-08 — Responder quiz; CU-09 — Enviar intento y obtener calificación automática; CU-15 — Cancelar un intento en progreso | Guardar/reanudar, envío sin nota anticipada, cancelación terminal y máximo; nota publicada o acceso a pauta bloquean rendición. |
| Docente admin/no admin | [Auditoría del curso](../../../mockups/15-audit.html) | CU-13 — Consultar auditoría | Auditoría sanitizada: owner sin teacher solo administrativos; owner+teacher todo curso; teacher ordinario sus secciones. |
| Docente admin/no admin; ayudante (consulta) | [Revisar intentos](../../../mockups/16-attempt-review.html) | CU-16 — Revisar el libro de notas docente; CU-15 — Cancelar un intento en progreso | Ambos docentes consultan/cancelan intentos dentro de su alcance; ayudante solo consulta su sección. |

### Cobertura y relaciones

Los **16 CU tienen representación de su meta principal**; no quedan CU sin
mockup principal en este inventario. El listado 05 conduce al flujo detallado 14;
03 es el inicio no admin compartido; 07 es el inicio admin. Libro/intentos
(08/16) permiten gestión docente por alcance y consulta del ayudante sin escritura. Las variantes
usan `role` y `experience`, sin una tercera experiencia por rol. Los escenarios ilustran flujos,
no equivalen a implementación de requisitos ni a pruebas de seguridad del producto.

- Acceso: 02 → 10 → 03 (no admin) o 07 (admin), con CU-01/CU-02/CU-03. UC y UTFSM son contextos
  de ejemplo accesibles; el estado UTFSM sin cursos no reutiliza datos de UC.
- Contenido: 12 organiza/publica módulos y material (CU-14/CU-05); 04 consulta
  markdown publicado y abre 09 para PDF (CU-06). Módulos y material son de curso,
  compartidos por las secciones y editables por ambos docentes. Cada módulo e ítem tiene un check verde de publicación independiente; la visibilidad efectiva exige ambos publicados.
- Evaluación: 13 prepara quiz/pauta (CU-07); 05 → 14 inicia/reanuda, guarda y
  envía (CU-08/CU-09). Ambos docentes acceden a autoría/pauta: no admin dirige el quiz a su sección; admin puede seleccionar todas. Tener además un rol
  estudiantil no habilita rendir cuando existe acceso a la pauta.
- Notas: el admin configura pesos comunes en 08 (CU-10); ambos docentes revisan filas dentro de su alcance (CU-16) y
  confirma evaluación, secciones y cantidad de notas (CU-11). 06 muestra solo
  notas propias publicadas y promedio parcial normalizado (CU-12).
- Cierre y trazabilidad: 14 permite cancelar al estudiante propietario;
  16 permite cancelar a ambos docentes dentro de su alcance (CU-15 en la propuesta de UI), sin nota y consumiendo un intento.
  Un intento en progreso detiene publicación; se cancela explícitamente, nunca
  de forma automática. 15 consulta eventos sanitizados e inmutables (CU-13).

### Dos experiencias y roles académicos

Los roles académicos siguen siendo `teacher`, `assistant`, `student` por
Enrollment. **Admin / No admin son experiencias según capacidad de administrar
el curso**, no nuevos roles institucionales. El usuario autenticado conserva el
acceso compartido. La galería agrupa ambas experiencias y las instituciones
ofrecen cuatro perfiles de ejemplo:

- Docente admin: Carla Contreras, perteneciente a sección 2, inicio 07. Gestiona todas las secciones del curso, crea secciones y configura políticas comunes.
- Docente no admin: la misma Carla, inicio 03 compartido. Gestiona participantes, quizzes, intentos y publicación de notas solo en sección 2. También edita/publica módulos y materiales compartidos por el curso.
- Ayudante no admin: Javier Morales, sección 2, mismo inicio 03 y consultas del libro/intentos de su sección sin escritura.
- Estudiante no admin: María González, sección 2, mismo inicio 03 con su avance, quizzes y notas propias publicadas. No ve registros de otros estudiantes.

La navegación conserva `role` y `experience=admin|non-admin`. Los enlaces de
escenarios seleccionan perfiles de demostración, sin otorgar privilegios reales.
Estudiante/ayudante siguen no admin ante un parámetro admin. Las rutas de gestión
docente deniegan acceso a estudiante/ayudante; el docente no admin conserva las
acciones de su sección. Los enlaces antiguos de ayudante a 07 conducen al inicio
compartido 03. Módulos e ítems ocultos se omiten de la consulta estudiantil.

La [decisión de UI y matriz de acciones](../../adr/ui-admin-non-admin-experiences.md)
registra el acuerdo y la dependencia funcional. El modelo/API vigente aún liga
administración a `teacher`: los CU/RF ligados a edición/publicación y cancelación
se deben reconciliar con estas capacidades antes de implementar. Esta revisión
no modifica silenciosamente sus precondiciones ni contratos de autorización.

Se retiraron entregas/corrección manual, recorrección, IA, anuncios/calendario,
exportación e invitación por token de las vistas operativas. La navegación conserva identidad, rol y experiencia admin/no admin al consultar
material, notas e intentos. El promedio del ejemplo se corrigió a **6.1**:
`(6.5×15 + 6.8×15 + 5.1×25 + 7.0×10) / 65`, con 65 % publicado.
Los controles de pesos/nuevos elementos se bloquean tras publicar y la
confirmación identifica la selección real. Las selecciones usan controles
nativos de teclado; los diálogos nativos gestionan foco, Escape y retorno.
Colores, incluido el papel fijo del lector, están centralizados en tokens.

Las páginas muestran enlaces «Escenarios del mockup»: memberships vacías,
acceso no disponible, sin cursos/notas, libro bloqueado, intento que bloquea
publicación, nota publicada, límite de intentos, roles incompatibles y permiso
de auditoría perdido. Los filtros de auditoría permiten mostrar ausencia de
coincidencias; los formularios ilustran validaciones de fechas, alternativas,
formatos, duplicados y suma de pesos.

### Límites y decisiones pendientes

- Separación rol/administración implementada antes del polish; la matriz visual
  por sí sola no acredita permisos. Ver matriz institucional y pruebas de cursos.
- Los HTML son estáticos: no hay JWT, API, autorización real, escritura de datos,
  auditoría persistida ni carga de archivos. Los resultados mostrados son
  escenarios independientes; no se sincronizan entre pantallas. Solo el intento
  estudiantil simula guardado/reanudación local en `sessionStorage` por contexto uc.
- 09 es un extracto ilustrativo de PDF, sin binario descargable; no demuestra
  storage. La lectura markdown de 04 cubre el material inmediato del MVP.
- CU-03/CU-16: teacher ordinario conserva sus secciones; is_admin+ownership
  amplía administración, y evaluación exige teacher aparte. Resuelto en dominio
  antes del polish; mockups no son prueba de implementación ni de despliegue.
- Hay estados representativos, no todas las combinaciones de flujos alternativos.
  Esta actualización cierra los vacíos de pantallas, sin ampliar el alcance ni
  sustituir la validación posterior de implementación.
