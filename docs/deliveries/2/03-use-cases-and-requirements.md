# Casos de uso y requerimientos

## Contexto funcional y alcance

AcademiX reúne el recorrido académico del MVP: elegir una institución, acceder a
cursos y secciones, organizar módulos y material, rendir quizzes de alternativas,
calcular y publicar notas, consultar el promedio y revisar cambios sensibles.
Los casos siguientes describen metas funcionales completas; varias operaciones
pueden contribuir a una misma meta. No representan una lista de endpoints ni
prometen funciones fuera del [alcance de Entrega 2](02-scope.md).

Los actores son el **usuario autenticado** (para elegir y entrar a una
institución), el **coordinador de curso** (`coordinator`), el **docente de
sección** (`teacher`), el **ayudante de sección** (`assistant`) y el
**estudiante** (`student`). Una persona puede acumular roles, incluso dentro de
una misma sección; en cada operación se comprueba el permiso correspondiente.
La pertenencia institucional activa permite entrar al contexto, pero no confiere
por sí sola permisos académicos. El sistema ejecuta las validaciones y cálculos;
no se trata como actor externo. No hay administrador institucional separado.

Los casos se agrupan por acceso (CU-01 a CU-03), gestión de curso y contenido
(CU-04 a CU-07 y CU-14), evaluación y calificaciones (CU-08 a CU-12 y CU-15) y
trazabilidad (CU-13). Se conservan los identificadores originales, normalizados
con dos dígitos. CU-14 y CU-15 completan metas explícitas del modelo vigente.

## Casos de uso del MVP

| Caso | Meta principal |
| --- | --- |
| [CU-01](#cu-01--elegir-institución) | Elegir una institución accesible. |
| [CU-02](#cu-02--acceder-al-contexto-institucional) | Entrar al contexto institucional autorizado. |
| [CU-03](#cu-03--ver-cursos-y-secciones) | Encontrar cursos y secciones propios. |
| [CU-04](#cu-04--gestionar-secciones-y-roles) | Mantener secciones y participantes del curso. |
| [CU-05](#cu-05--publicar-material) | Poner material a disposición del curso. |
| [CU-06](#cu-06--consultar-material) | Acceder a material publicado. |
| [CU-07](#cu-07--crear-y-publicar-quiz) | Preparar y ofrecer un quiz válido. |
| [CU-08](#cu-08--responder-quiz) | Guardar respuestas en un intento propio. |
| [CU-09](#cu-09--enviar-intento-y-obtener-calificación-automática) | Finalizar un intento y registrar su calificación. |
| [CU-10](#cu-10--configurar-libro-de-notas) | Definir ponderaciones del curso. |
| [CU-11](#cu-11--publicar-notas) | Hacer visibles notas calificadas. |
| [CU-12](#cu-12--ver-notas-y-promedio) | Consultar notas propias publicadas. |
| [CU-13](#cu-13--consultar-auditoría) | Revisar historial académico del curso. |
| [CU-14](#cu-14--organizar-módulos-del-curso) | Ordenar y publicar módulos. |
| [CU-15](#cu-15--cancelar-un-intento-en-progreso) | Cerrar un intento abandonado sin calificarlo. |

### Reglas comunes de lectura

En todos los casos académicos, el usuario está autenticado y mantiene una
pertenencia activa a la institución elegida, salvo que un flujo alternativo
indique la pérdida de esa condición. Un recurso inexistente o ajeno a la
institución no se revela; una acción prohibida sobre un recurso visible se
rechaza. Estas reglas se aplican de nuevo en cada operación, sin asumir que una
validación anterior sigue vigente. Los flujos detallan las variaciones propias
de cada meta.

## CU-01 — Elegir institución

### Descripción

El usuario identifica entre sus instituciones accesibles aquella en la que
quiere trabajar. **Meta:** seleccionar un contexto institucional válido para
continuar sus actividades.

### Actores

- Usuario autenticado.

### Stakeholders

- Usuario: necesita distinguir sus contextos de trabajo.
- Instituciones a las que pertenece: requieren que solo se ofrezcan contextos autorizados.

### Precondiciones

- El usuario posee una identidad autenticada vigente.

### Postcondiciones

- El contexto elegido corresponde a una institución con pertenencia activa del usuario; aún no se le atribuye un rol académico por esa elección.

### Trigger

- El usuario abre el selector de instituciones.

### Flujo básico

1. El usuario solicita ver las instituciones a las que puede acceder.
2. El sistema muestra solo instituciones con pertenencia activa de ese usuario.
3. El usuario elige una de las instituciones mostradas.
4. El sistema establece la institución elegida como contexto de navegación y conduce al usuario a ella.

### Flujos alternativos

#### FA-01 — Sin instituciones accesibles

**Se origina en:** Paso 2 del flujo básico, cuando no hay pertenencias institucionales activas.

1. El sistema muestra una lista vacía e informa que no hay instituciones disponibles.
2. El usuario permanece fuera de un contexto académico.

**Resultado:** No se selecciona institución ni se accede a datos académicos.

#### FA-02 — La pertenencia deja de estar activa

**Se origina en:** Paso 4 del flujo básico, cuando la pertenencia cambió desde que se mostró la lista.

1. El sistema rechaza el acceso al contexto elegido sin revelar sus datos.
2. El sistema devuelve al usuario a la selección de instituciones vigentes.

**Resultado:** No se establece un contexto no autorizado.

## CU-02 — Acceder al contexto institucional

### Descripción

El usuario entra a una institución seleccionada y reconoce los roles académicos
que tiene allí. **Meta:** trabajar únicamente dentro de un contexto al que
pertenece, sin confundir pertenencia institucional con autorización de curso.

### Actores

- Usuario autenticado.

### Stakeholders

- Institución: necesita preservar la separación de su información académica.
- Usuario: necesita conocer sus alcances reales en el contexto elegido.

### Precondiciones

- El usuario posee una identidad autenticada vigente.
- Existe una institución seleccionada o solicitada por el usuario.

### Postcondiciones

- El usuario permanece en una institución activa con pertenencia vigente y conoce sus roles disponibles; ninguna operación académica queda autorizada sin comprobar además el curso o la sección.

### Trigger

- El usuario navega a la institución elegida o solicita una vista dentro de ella.

### Flujo básico

1. El usuario solicita entrar a la institución seleccionada.
2. El sistema identifica la institución solicitada y verifica que sea visible para ese usuario.
3. El sistema confirma su pertenencia institucional activa y recupera sus roles de curso y sección en ese contexto.
4. El sistema presenta la identidad contextual y permite continuar hacia las vistas que correspondan a esos roles.

### Flujos alternativos

#### FA-01 — Institución inexistente o no visible

**Se origina en:** Paso 2 del flujo básico, cuando la institución no existe o el usuario no puede verla.

1. El sistema informa que el contexto solicitado no está disponible.
2. El sistema no entrega identidad contextual ni recursos académicos de esa institución.

**Resultado:** No se establece acceso institucional.

#### FA-02 — Pertenencia inactiva

**Se origina en:** Paso 3 del flujo básico, cuando la pertenencia institucional dejó de estar activa.

1. El sistema impide continuar en ese contexto.
2. El sistema ofrece volver a las instituciones accesibles.

**Resultado:** El usuario no puede operar en la institución solicitada.

## CU-03 — Ver cursos y secciones

### Descripción

El participante localiza su trabajo académico dentro de una institución.
**Meta:** encontrar los cursos y secciones donde mantiene un rol activo, con
visibilidad ajustada a su alcance.

### Actores

- Coordinador de curso.
- Docente de sección.
- Ayudante de sección.
- Estudiante.

### Stakeholders

- Equipo docente: necesita ubicar las secciones que atiende.
- Estudiantes: necesitan acceder solo a sus cursos y secciones.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- Existe al menos un curso en la institución seleccionada.

### Postcondiciones

- Se muestra un listado de cursos y secciones visibles conforme a las pertenencias académicas activas del actor; los datos del curso no cambian.

### Trigger

- El participante abre su lista de cursos o entra a un curso visible.

### Flujo básico

1. El participante solicita sus cursos en la institución elegida.
2. El sistema presenta únicamente cursos donde posee pertenencia académica activa.
3. El participante selecciona un curso y solicita sus secciones.
4. El sistema muestra todas las secciones al coordinador; al docente, ayudante o estudiante le muestra solo las secciones en que participa.
5. El participante abre una sección visible y consulta su información académica permitida.

### Flujos alternativos

#### FA-01 — Sin cursos visibles

**Se origina en:** Paso 2 del flujo básico, cuando el participante no tiene pertenencia académica activa en ningún curso.

1. El sistema presenta la lista vacía dentro de la institución.
2. El sistema no muestra cursos de otros usuarios o instituciones.

**Resultado:** No se abre un curso ni se modifica información.

#### FA-02 — Curso o sección fuera del alcance

**Se origina en:** Paso 4 o 5 del flujo básico, cuando el recurso solicitado no existe, pertenece a otra institución o ya no es visible para el actor.

1. El sistema rechaza la consulta sin confirmar la existencia de un recurso ajeno.
2. El sistema conserva al participante en el último listado autorizado.

**Resultado:** No se divulga información fuera de su alcance.

## CU-04 — Gestionar secciones y roles

### Descripción

El coordinador mantiene la organización y las personas de su curso.
**Meta:** disponer de secciones actualizadas y asignar roles académicos a
participantes de la misma institución.

### Actores

- Coordinador de curso.

### Stakeholders

- Equipo docente: depende de asignaciones correctas para trabajar en sus secciones.
- Estudiantes: dependen de una inscripción de sección vigente.
- Institución: requiere trazabilidad de los cambios de participantes.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El curso existe y el actor tiene rol `coordinator` activo en él.
- La persona a incorporar ya posee pertenencia activa a la misma institución.

### Postcondiciones

- La sección queda creada o actualizada y la pertenencia académica queda registrada con el rol solicitado, dentro del curso y la institución correctos; los cambios sensibles quedan auditados.

### Trigger

- El coordinador solicita crear o actualizar una sección y asignar un participante.

### Flujo básico

1. El coordinador abre el curso y consulta sus secciones y participantes.
2. El sistema muestra todas las secciones y las pertenencias del curso que puede administrar.
3. El coordinador define o actualiza una sección y busca una persona perteneciente a la institución.
4. El sistema comprueba que la sección corresponde al curso y que la persona puede participar en esa institución.
5. El coordinador selecciona el rol de sección (`teacher`, `assistant` o `student`) y confirma la asignación.
6. El sistema registra la sección y la pertenencia de sección, y muestra la asignación vigente con su historial de cambio cuando corresponde.

### Flujos alternativos

#### FA-01 — Falta de rol coordinador

**Se origina en:** Paso 2 o 6 del flujo básico, cuando el actor ya no coordina el curso.

1. El sistema impide la modificación de secciones y pertenencias.
2. El sistema informa que la operación requiere coordinación del curso.

**Resultado:** No cambia la organización del curso.

#### FA-02 — Participante o relación fuera de la institución

**Se origina en:** Paso 4 del flujo básico, cuando la persona, sección o curso no existe en el contexto solicitado o no pertenece a la misma institución.

1. El sistema rechaza la relación propuesta y no incorpora a la persona.
2. El coordinador puede elegir una persona y sección válidas.

**Resultado:** No se crea una relación académica cruzada o inexistente.

#### FA-03 — Rol activo duplicado o datos de sección inválidos

**Se origina en:** Paso 6 del flujo básico, cuando ya existe el mismo rol activo para esa persona y sección o los datos de sección incumplen una restricción.

1. El sistema informa el conflicto o el dato que debe corregirse.
2. El coordinador revisa la asignación existente o corrige la sección.

**Resultado:** Se conserva el estado previo sin duplicar roles activos.

#### FA-04 — Cambiar o desactivar una pertenencia

**Se origina en:** Paso 5 del flujo básico, cuando el coordinador selecciona una pertenencia existente en vez de crear otra.

1. El coordinador indica el nuevo rol o desactiva la pertenencia.
2. El sistema verifica que no se duplique un rol activo y registra el estado anterior y el nuevo.

**Resultado:** La pertenencia queda actualizada sin eliminar su historial.

## CU-05 — Publicar material

### Descripción

El coordinador prepara contenido de un módulo y decide cuándo hacerlo visible.
**Meta:** poner material académico autorizado a disposición de los estudiantes
del curso.

### Actores

- Coordinador de curso.

### Stakeholders

- Estudiantes del curso: necesitan material publicado y accesible.
- Equipo docente: necesita que el contenido corresponda al módulo correcto.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El coordinador tiene rol activo en el curso y existe un módulo de ese curso.
- Para visibilidad estudiantil, el módulo está publicado.

### Postcondiciones

- El material queda asociado al módulo y publicado dentro de la institución del curso; su publicación queda auditada.

### Trigger

- El coordinador solicita incorporar material a un módulo y publicarlo.

### Flujo básico

1. El coordinador abre el módulo del curso y elige crear material markdown o basado en archivo.
2. El sistema comprueba la pertenencia del módulo al curso y solicita el contenido y los metadatos pertinentes.
3. El coordinador proporciona el contenido o archivo admitido y confirma la creación.
4. El sistema registra el material en el módulo sin exponerlo aún a estudiantes.
5. El coordinador revisa el material y solicita publicarlo.
6. El sistema publica el material, registra el cambio sensible y lo deja visible en el módulo publicado.

### Flujos alternativos

#### FA-01 — Archivo o información inválida

**Se origina en:** Paso 3 o 4 del flujo básico, cuando faltan datos o el archivo no es PDF, CSV, XLSX, TXT, JPEG o PNG.

1. El sistema indica qué información o formato debe corregirse.
2. El coordinador puede volver a proporcionar un material válido.

**Resultado:** No se publica contenido inválido.

#### FA-02 — Módulo no visible o permiso insuficiente

**Se origina en:** Paso 2 o 6 del flujo básico, cuando el módulo no pertenece al curso e institución o el actor deja de coordinar el curso.

1. El sistema rechaza la creación o publicación según corresponda.
2. El sistema no revela un módulo de otra institución ni cambia material existente.

**Resultado:** No se crea ni publica material fuera del alcance.

#### FA-03 — Corregir u ocultar material existente

**Se origina en:** Paso 5 del flujo básico, cuando el coordinador elige modificar metadatos o retirar material ya publicado.

1. El coordinador indica el cambio permitido o solicita ocultar el material.
2. El sistema actualiza el contenido editable o retira la visibilidad estudiantil y registra el cambio sensible.

**Resultado:** El material permanece en su módulo con el estado de publicación actualizado; no se reemplaza el binario de un archivo existente.

## CU-06 — Consultar material

### Descripción

El estudiante consulta recursos didácticos de sus cursos. **Meta:** acceder al
contenido publicado que corresponde a su institución y a una sección en la que
mantiene inscripción activa.

### Actores

- Estudiante.

### Stakeholders

- Estudiante: necesita estudiar con el material correcto.
- Equipo docente: necesita distribuir solo versiones publicadas.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El estudiante tiene inscripción `student` activa en una sección del curso.
- Existe al menos un módulo y material publicados del curso.

### Postcondiciones

- El estudiante recibe el material publicado solicitado; el estado académico no cambia.

### Trigger

- El estudiante abre los módulos de su curso o selecciona un material.

### Flujo básico

1. El estudiante abre el curso al que está inscrito y solicita sus módulos.
2. El sistema muestra únicamente módulos publicados y, dentro de ellos, materiales publicados.
3. El estudiante selecciona un material.
4. El sistema verifica su acceso vigente y muestra el markdown o entrega el archivo autorizado sin revelar su ubicación interna.

### Flujos alternativos

#### FA-01 — Contenido no publicado o inexistente

**Se origina en:** Paso 2 o 4 del flujo básico, cuando el módulo o material está oculto, no existe o es ajeno al contexto.

1. El sistema no incluye el contenido en el listado o rechaza su apertura.
2. El estudiante permanece en los contenidos publicados disponibles.

**Resultado:** No se divulga material no publicado ni de otra institución.

#### FA-02 — Inscripción inactiva

**Se origina en:** Paso 4 del flujo básico, cuando la inscripción estudiantil dejó de estar activa.

1. El sistema deniega la consulta del material.
2. El sistema informa que el curso ya no está disponible para ese estudiante.

**Resultado:** No se entrega el contenido solicitado.

## CU-07 — Crear y publicar quiz

### Descripción

El coordinador o docente autorizado prepara una evaluación de alternativas.
**Meta:** ofrecer a los estudiantes un quiz válido, con pauta protegida y
alcance de curso o sección según el rol del autor.

### Actores

- Coordinador de curso.
- Docente de sección.

### Stakeholders

- Estudiantes destinatarios: necesitan una evaluación disponible y consistente.
- Equipo docente: necesita una pauta correcta y notas vinculables al libro de notas.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El curso existe; el docente, si actúa, tiene rol `teacher` activo en la sección objetivo.

### Postcondiciones

- El quiz queda publicado con preguntas y pauta válidas, disponible en su alcance autorizado y vinculado a un único elemento del libro de notas; la publicación queda auditada.

### Trigger

- El coordinador o docente solicita preparar un quiz para su curso o sección.

### Flujo básico

1. El actor elige el curso y, si corresponde, la sección destinataria.
2. El sistema verifica su alcance: el coordinador puede elegir curso o sección; el docente solo una de sus secciones.
3. El actor define los datos del quiz y su política de intentos; el sistema lo guarda como borrador.
4. El actor agrega preguntas con puntajes, al menos dos alternativas por pregunta y una respuesta correcta en cada una.
5. El sistema conserva la pauta en la vista de autoría, separada de la vista estudiantil.
6. El actor revisa el borrador y solicita publicarlo.
7. El sistema valida preguntas, pauta, fechas y puntajes, crea o confirma el elemento de nota único y publica el quiz con auditoría.

### Flujos alternativos

#### FA-01 — Alcance o rol insuficiente

**Se origina en:** Paso 2 o 7 del flujo básico, cuando el docente elige otra sección o pierde el rol requerido.

1. El sistema rechaza la creación o publicación fuera del alcance autorizado.
2. El sistema no expone la pauta ni modifica quizzes ajenos.

**Resultado:** El quiz no queda publicado por un actor sin permiso.

#### FA-02 — Pauta o configuración incompleta

**Se origina en:** Paso 4 o 7 del flujo básico, cuando falta una pregunta válida, hay alternativas insuficientes o duplicadas, más de una correcta, puntajes o fechas inválidos.

1. El sistema señala las condiciones incumplidas.
2. El actor corrige el borrador y puede volver a solicitar publicación.

**Resultado:** El quiz conserva estado de borrador hasta superar la validación.

#### FA-03 — Quiz bloqueado o libro de notas ya publicado

**Se origina en:** Paso 3 o 7 del flujo básico, cuando el quiz ya fue publicado o utilizado, o existe una nota publicada del curso que impide agregar el elemento.

1. El sistema rechaza el cambio incompatible e informa el conflicto de estado.
2. El actor conserva la versión vigente sin alterar intentos ni notas.

**Resultado:** No se modifica una pauta protegida ni se añade un ítem después del bloqueo del libro.

## Requisitos funcionales

RF1. El sistema debe autenticar una identidad global mediante JWT.

RF2. El frontend debe listar únicamente Institutions accesibles para el User.

RF3. UC y UTFSM deben existir como Institutions con slugs únicos dentro de la
misma PostgreSQL compartida cuando se implemente persistencia.

RF4. Los endpoints académicos deben declarar el contexto mediante
`/api/v1/institutions/{institutionSlug}/...`.

RF5. El backend debe resolver el slug a un UUID interno y verificar una
`InstitutionMembership` activa antes de evaluar roles académicos.

RF6. Indicar una Institution en la URL no debe autenticar ni autorizar.

RF7. `User` debe ser global y poder relacionarse con más de una Institution.

RF8. Toda entidad académica tenant-owned debe conservar `institution_id`.

RF9. El sistema debe impedir relaciones entre registros de Institutions
distintas mediante constraints y FK institution-aware cuando corresponda.

RF10. El sistema debe asignar `coordinator` por curso y roles `teacher`,
`student` o `assistant` por sección.

RF11. Un User puede tener más de un rol activo, incluso en una misma sección.

RF12. El coordinador administra todo su curso; el docente solo las secciones
donde tiene `teacher` activo.

RF13. El coordinador debe poder crear módulos de curso y ordenarlos.

RF14. El coordinador debe poder crear material markdown o basado en archivo.

RF15. Los archivos del MVP son PDF, CSV, XLSX, TXT, JPEG y PNG. Su
almacenamiento concreto se decide cuando se implemente esa funcionalidad.

RF16. El estudiante ve solo material publicado de cursos donde mantiene una
inscripción activa dentro de la Institution del path.

RF17. El docente autorizado debe poder crear quizzes de alternativas.

RF18. Cada pregunta debe tener alternativas y exactamente una correcta.

RF19. El estudiante debe poder iniciar y finalizar intentos, con límite positivo
opcional o sin límite. Solo hay un intento en progreso por estudiante y quiz.

RF20. El sistema calcula la nota al finalizar y usa el último intento calificado
como nota vigente.

RF21. El coordinador debe poder configurar ponderaciones por evaluación.

RF22. El coordinador o docente autorizado debe poder publicar notas.

RF23. El estudiante ve únicamente notas propias publicadas.

RF24. El promedio parcial se calcula con notas publicadas, normalizado por la
suma de sus ponderaciones.

RF25. Toda operación académica debe autorizar Institution, curso, sección y rol.

RF26. El sistema registra eventos inmutables de cambios académicos sensibles y
permite al coordinador consultar el historial de su curso.

RF27. La vista estudiantil del quiz omite pauta y corrección antes de publicar.
Quien puede consultar la pauta no puede rendir ese quiz como estudiante.

## Requisitos no funcionales

RNF1. Aislamiento: ninguna lectura, escritura, relación o proceso debe mezclar
datos de Institutions distintas.

RNF2. Seguridad: autenticación, InstitutionMembership y permisos contextuales
son obligatorios. El slug del path no constituye autorización.

RNF3. Integridad: notas, respuestas, ponderaciones y auditoría usan
transacciones cuando cambian juntas.

RNF4. Integridad relacional: constraints, unicidades y FK compuestas incluyen
`institution_id` cuando expresan una relación tenant-owned.

RNF5. Recuperabilidad: backup y point-in-time recovery cubren la PostgreSQL
compartida completa. Restore lógico por Institution queda fuera del MVP.

RNF6. Mantenibilidad: backend como monolito modular, sin microservicios.

RNF7. Portabilidad: Railway es la plataforma de despliegue; el dominio no usa
APIs propietarias de Railway.

RNF8. Archivos: binarios viven fuera de PostgreSQL y usan namespace por
Institution; el proveedor queda por decidir.

RNF9. Observabilidad mínima: healthcheck, logs de errores y estado de despliegue
sin secretos ni datos de otra Institution.

RNF10. Persistencia: existe una sola secuencia de migraciones. Backfills futuros
son institution-scoped, idempotentes cuando corresponda y por lotes si su
volumen lo exige.

## Reglas de negocio y seguridad

- `institutions.id` es UUID interno; `slug` es legible y globalmente único.
- Las relaciones internas usan UUID, no slug.
- Un slug válido pero no visible para el User produce `404`.
- Un recurso de otra Institution produce `404` para no revelar su existencia.
- Una acción prohibida sobre un recurso visible produce `403`.
- JWT ausente, inválido o expirado produce `401`.
- Los códigos académicos son únicos dentro de su Institution cuando corresponda.
- Los cambios sensibles se auditan en la misma transacción y con
  `institution_id`.
- Las reglas de intentos, pauta, ponderaciones y publicación se mantienen como
  define el modelo de dominio.
- RLS, jerarquías institucionales, provisioning dinámico y restore lógico por
  Institution quedan fuera del MVP.
