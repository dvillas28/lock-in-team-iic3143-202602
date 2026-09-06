# Historias De Usuario

## Resumen De Priorizacion

| US | Prioridad | Area | Resultado esperado |
| --- | --- | --- | --- |
| US1 | Must Have | Dashboard | El estudiante ve sus cursos activos. |
| US2 | Must Have | Dashboard | El estudiante ve evaluaciones pendientes ordenadas. |
| US3 | Should Have | Dashboard | El estudiante identifica la proxima actividad del curso. |
| US4 | Should Have | Dashboard | El cuerpo docente ve cursos y entregas pendientes de correccion. |
| US5 | Must Have | Administracion y cursos | El administrador crea cursos del tenant correcto. |
| US6 | Must Have | Administracion y cursos | El administrador crea secciones del curso. |
| US7 | Must Have | Administracion y cursos | El docente gestiona participantes y roles contextuales. |
| US8 | Should Have | Administracion y cursos | El administrador gestiona usuarios de su universidad. |
| US9 | Must Have | Contenido del curso | El docente organiza contenido por modulos. |
| US10 | Should Have | Contenido del curso | El docente publica u oculta modulos. |
| US11 | Must Have | Contenido del curso | El docente centraliza material academico. |
| US12 | Should Have | Contenido del curso | El estudiante accede a material publicado autorizado. |
| US13 | Must Have | Evaluaciones y entregas | El docente crea evaluaciones con reglas claras. |
| US14 | Must Have | Evaluaciones y entregas | El estudiante entrega evaluaciones con evidencia registrada. |
| US15 | Must Have | Evaluaciones y entregas | El revisor corrige sin publicar automaticamente. |
| US16 | Should Have | Evaluaciones y entregas | El estudiante confirma estado de entrega. |
| US17 | Must Have | Libro de notas | El docente configura ponderaciones y el sistema calcula promedios. |
| US18 | Must Have | Libro de notas | El docente libera notas manualmente. |
| US19 | Must Have | Libro de notas | El estudiante ve solo sus notas publicadas. |
| US20 | Must Have | Libro de notas | El estudiante ve promedio actual y estado parcial. |
| US21 | Should Have | Libro de notas | El revisor registra comentarios de correccion. |
| US22 | Could Have | Libro de notas | El estudiante solicita recorreccion. |
| US23 | Should Have | Anuncios y calendario | El cuerpo docente publica anuncios del curso. |
| US24 | Should Have | Anuncios y calendario | El estudiante ve anuncios recientes. |
| US25 | Could Have | Anuncios y calendario | El estudiante usa calendario interno en dashboard. |
| US26 | Should Have | Lector de documentos e IA | El estudiante lee PDFs dentro de la plataforma. |
| US27 | Could Have | Lector de documentos e IA | El estudiante pregunta sobre un documento. |
| US28 | Could Have | Lector de documentos e IA | El estudiante pide explicaciones sobre texto seleccionado. |
| US29 | Could Have | Lector de documentos e IA | La IA entrega citas o declara falta de evidencia. |
| US30 | Must Have | Visibilidad del cuerpo docente | El estudiante identifica docentes y ayudantes de su seccion. |
| US31 | Could Have | Extensiones Nice To Have | El docente carga videos como material. |
| US32 | Could Have | Extensiones Nice To Have | El estudiante solicita resumen de material publicado. |
| US33 | Could Have | Extensiones Nice To Have | Participantes usan chat de seccion con permisos. |
| US34 | Could Have | Extensiones Nice To Have | Estudiantes usan chat de grupo si existe modelo grupal. |
| US35 | Could Have | Extensiones Nice To Have | El estudiante recibe alertas internas. |
| US36 | Could Have | Extensiones Nice To Have | El usuario controla alertas leidas y no leidas. |
| US37 | Fuera del alcance inicial | Extension posterior | El usuario recibe alertas por correo si existe proveedor y preferencias. |

## Dashboard

US1. Como estudiante, quiero visualizar todos mis cursos actuales en un dashboard para acceder rapidamente a mi actividad academica.

Criterios de aceptacion:
- Dado un estudiante inscrito, cuando ingresa al dashboard, entonces ve solo sus cursos activos del periodo actual.
- Cada curso muestra al menos nombre, seccion y acceso directo al curso.

US2. Como estudiante, quiero ver mis evaluaciones pendientes para organizar mi semana.

Criterios de aceptacion:
- El dashboard muestra evaluaciones pendientes ordenadas por fecha de vencimiento.
- Cada evaluacion indica curso, titulo, fecha limite y estado de entrega.

US3. Como estudiante, quiero ver la proxima actividad de cada curso para priorizar mi trabajo.

Criterios de aceptacion:
- Cada curso muestra su proxima evaluacion, clase, material o anuncio relevante cuando exista.
- Si un curso no tiene actividad proxima, se muestra un estado vacio claro.

US4. Como docente, quiero ver un resumen de mis cursos para revisar entregas pendientes de correccion.

Criterios de aceptacion:
- El docente ve solo cursos donde tiene rol docente o ayudante autorizado.
- Cada curso muestra cantidad de entregas pendientes de correccion y acceso directo a revisarlas.

## Administracion Y Cursos

US5. Como administrador, quiero crear un curso semestral y configurar su informacion para administrarlo desde la plataforma.

Criterios de aceptacion:
- El administrador puede crear un curso con nombre, codigo, periodo academico y tenant asociado.
- El sistema valida que el curso pertenezca a la universidad del administrador.

US6. Como administrador, quiero crear secciones de un curso para organizar estudiantes y equipos docentes.

Criterios de aceptacion:
- El administrador puede crear secciones asociadas a un curso existente del mismo tenant.
- Cada seccion permite asignar al menos nombre, cupo opcional y docentes responsables.

US7. Como docente, quiero gestionar participantes de mi curso para asignar permisos correspondientes.

Criterios de aceptacion:
- El docente puede listar participantes de sus cursos con rol y seccion.
- El docente puede asignar o cambiar roles permitidos sin afectar usuarios de otros cursos o tenants.

US8. Como administrador, quiero gestionar usuarios por universidad para mantener control institucional del tenant.

Criterios de aceptacion:
- El administrador ve y administra solo usuarios de su universidad.
- La gestion permite crear, activar, desactivar o editar datos basicos de usuario.

## Contenido Del Curso

US9. Como docente, quiero organizar el contenido por modulos o semanas para que los estudiantes puedan navegar facilmente.

Criterios de aceptacion:
- El docente puede crear, ordenar y renombrar modulos dentro de un curso.
- Los estudiantes ven los modulos publicados en el orden definido por el docente.

US10. Como docente, quiero publicar u ocultar modulos para controlar cuando los estudiantes acceden al material.

Criterios de aceptacion:
- El docente puede cambiar el estado de un modulo entre publicado y oculto.
- Los estudiantes no pueden ver modulos ocultos ni su material asociado.

US11. Como docente, quiero subir PDFs, presentaciones y links para centralizar el material academico.

Criterios de aceptacion:
- El docente puede agregar archivos o links a un modulo del curso.
- Cada material muestra titulo, tipo, fecha de publicacion y estado visible/oculto.

US12. Como estudiante, quiero visualizar el material del curso desde la plataforma para estudiar sin depender de carpetas externas.

Criterios de aceptacion:
- El estudiante puede abrir materiales publicados de cursos donde esta inscrito.
- El sistema bloquea acceso a materiales ocultos o de otros tenants.

## Evaluaciones Y Entregas

US13. Como docente, quiero crear una evaluacion con instrucciones, fecha, puntaje y ponderacion para formalizar una actividad del curso.

Criterios de aceptacion:
- El docente puede crear una evaluacion con titulo, instrucciones, fecha limite, puntaje maximo y ponderacion.
- La evaluacion queda asociada a un curso o seccion del mismo tenant.

US14. Como estudiante, quiero entregar una evaluacion desde la plataforma para dejar evidencia de mi envio.

Criterios de aceptacion:
- El estudiante puede enviar una entrega antes o despues de la fecha limite si la evaluacion lo permite.
- El sistema registra fecha, autor, archivo o contenido enviado y estado de recepcion.

US15. Como docente o ayudante, quiero revisar entregas para asignar nota y comentarios.

Criterios de aceptacion:
- El revisor puede ver entregas de evaluaciones donde tiene permiso de correccion.
- El revisor puede guardar nota y comentarios sin publicarlos automaticamente al estudiante.

US16. Como estudiante, quiero ver el estado de mi entrega para confirmar que fue recibida.

Criterios de aceptacion:
- El estudiante ve si su entrega esta pendiente, enviada, atrasada, corregida o publicada.
- El estado incluye fecha de envio cuando existe una entrega registrada.

## Libro De Notas

US17. Como docente, quiero configurar ponderaciones para que el promedio del curso se calcule de forma transparente.

Criterios de aceptacion:
- El docente puede definir o editar ponderaciones de evaluaciones del curso.
- El sistema advierte si las ponderaciones no suman el total esperado.
- El libro de notas calcula promedios dentro de la plataforma usando las ponderaciones validas e indica cuando la configuracion esta incompleta.

US18. Como docente, quiero liberar notas manualmente para controlar cuando son visibles para estudiantes.

Criterios de aceptacion:
- Las notas corregidas permanecen ocultas hasta que el docente las publique.
- Al publicar, solo los estudiantes correspondientes pueden ver sus propias notas.

US19. Como estudiante, quiero visualizar mis notas liberadas para conocer mi avance academico.

Criterios de aceptacion:
- El estudiante ve solo notas publicadas de cursos donde esta inscrito.
- Cada nota muestra evaluacion, puntaje, ponderacion y comentarios publicados cuando existan.

US20. Como estudiante, quiero ver mi promedio actual para entender mi situacion en el curso.

Criterios de aceptacion:
- El promedio se calcula usando solo evaluaciones publicadas y ponderaciones configuradas.
- La vista indica cuando el promedio es parcial por notas aun no publicadas.

US21. Como ayudante o docente, quiero registrar comentarios de correccion para justificar una nota.

Criterios de aceptacion:
- El revisor puede guardar comentarios asociados a una entrega corregida.
- Los comentarios se vuelven visibles al estudiante solo cuando la nota se publica.

US22. Como estudiante, quiero solicitar recorreccion para resolver dudas sobre una calificacion.

Criterios de aceptacion:
- El estudiante puede solicitar recorreccion sobre una nota publicada dentro del plazo definido.
- La solicitud registra motivo, fecha y estado de revision.

## Anuncios Y Calendario

US23. Como docente o ayudante, quiero publicar anuncios asociados al curso para comunicar informacion relevante.

Criterios de aceptacion:
- El autor autorizado puede crear anuncios con titulo, cuerpo, curso y visibilidad.
- Los anuncios publicados quedan visibles para estudiantes inscritos en el curso.

US24. Como estudiante, quiero ver anuncios recientes en el curso y dashboard para no perder informacion importante.

Criterios de aceptacion:
- El estudiante ve anuncios recientes de sus cursos en el dashboard.
- Los anuncios se ordenan desde el mas reciente y muestran curso, titulo y fecha.

US25. Como estudiante, quiero visualizar un calendario interno de evaluaciones para organizar mis pendientes.

Criterios de aceptacion:
- El calendario se muestra en el dashboard junto a los cursos, sin exigir navegar a una seccion separada para consultar la actividad proxima.
- El calendario muestra evaluaciones y fechas de entrega de cursos donde el estudiante esta inscrito.
- Cada evento muestra curso, titulo, fecha limite y estado de entrega cuando corresponda, con acceso al contexto de la evaluacion.

## Lector De Documentos E IA

US26. Como estudiante, quiero leer PDFs dentro de la plataforma para estudiar sin descargar archivos.

Criterios de aceptacion:
- El estudiante puede abrir PDFs publicados desde el material del curso.
- El lector permite navegar paginas y volver al contexto del curso.

US27. Como estudiante, quiero hacer preguntas sobre el documento abierto para resolver dudas puntuales.

Criterios de aceptacion:
- El estudiante puede enviar una pregunta asociada al documento abierto.
- La respuesta se limita al contenido disponible del documento o indica cuando no hay evidencia suficiente.

US28. Como estudiante, quiero seleccionar una parte del documento y pedir una explicacion para comprender conceptos complejos.

Criterios de aceptacion:
- El estudiante puede seleccionar texto visible del documento y pedir una explicacion.
- La explicacion conserva referencia a la seleccion usada como contexto.

US29. Como estudiante, quiero que las respuestas de IA citen paginas o secciones del documento para confiar en la respuesta.

Criterios de aceptacion:
- Cada respuesta basada en documentos incluye pagina o seccion de origen cuando la fuente esta disponible.
- Si no hay cita confiable, la respuesta indica que no puede respaldarse con el documento.

## Visibilidad Del Cuerpo Docente

US30. Como estudiante, quiero visualizar el docente y el cuerpo docente de mi seccion para saber quienes son los responsables del curso.

Criterios de aceptacion:
- Al ingresar a una seccion, el estudiante puede visualizar a sus docentes y ayudantes.
- Para cada integrante se muestra al menos nombre y rol.
- Solo se muestran integrantes asignados a la seccion correspondiente o integrantes con alcance sobre el mismo curso.
- La consulta no expone integrantes de otros cursos, secciones o tenants.

## Extensiones Nice To Have

US31. Como docente, quiero cargar videos como material academico para centralizar los recursos del curso.

Criterios de aceptacion:
- El docente puede agregar un video a un modulo de un curso donde tiene permiso de gestion de material.
- El video respeta formatos y limites de tamano definidos y conserva estado visible u oculto.
- Solo participantes autorizados pueden acceder a videos publicados del curso correspondiente.

US32. Como estudiante, quiero solicitar un resumen de material publicado para repasar sus contenidos principales.

Criterios de aceptacion:
- El resumen usa solo material publicado al que el estudiante tiene acceso.
- La respuesta identifica el material utilizado y advierte cuando no existe evidencia suficiente.

US33. Como participante de una seccion, quiero usar un chat de seccion para comunicarme con estudiantes y cuerpo docente del mismo contexto academico.

Criterios de aceptacion:
- Solo participantes activos de la seccion pueden leer o enviar mensajes.
- Cada mensaje registra autor, seccion y fecha de envio.
- El sistema impide acceder a conversaciones de otras secciones o tenants.

US34. Como estudiante, quiero usar un chat con mi grupo de trabajo para coordinar actividades grupales.

Criterios de aceptacion:
- La historia solo puede habilitarse cuando exista un modelo de grupos y membresias definido para el curso o seccion.
- Solo integrantes activos del grupo pueden leer o enviar mensajes.
- La pertenencia al grupo no concede acceso a otros grupos, secciones o tenants.

US35. Como estudiante, quiero recibir alertas dentro de la plataforma para identificar cambios o vencimientos relevantes.

Criterios de aceptacion:
- Las alertas se presentan como toast o lista desplegable sin bloquear el flujo principal.
- Las alertas se originan en evaluaciones, entregas u otros cambios relevantes del curso.
- Cada alerta identifica el curso, el motivo y el acceso a la actividad relacionada cuando corresponda.
- El estudiante recibe solo alertas de cursos donde esta inscrito.
- La informacion relevante permanece disponible en la lista y no se comunica unicamente mediante color o un toast transitorio.

US36. Como usuario, quiero controlar el estado de mis alertas para distinguir novedades de informacion ya revisada.

Criterios de aceptacion:
- El usuario puede identificar alertas leidas y no leidas.
- Marcar una alerta como leida no afecta el estado de otros usuarios.

US37. Como usuario, quiero recibir alertas academicas por correo para conocer eventos relevantes fuera de la plataforma.

Criterios de aceptacion:
- El envio respeta preferencias de notificacion configurables.
- Cada correo identifica el tenant y curso de origen sin revelar informacion de otros contextos.
- Los fallos de entrega no alteran el registro academico ni bloquean el flujo principal.

## Priorizacion MVP

### Must Have

- US1, US2, US5, US6, US7, US9, US11, US13, US14, US15, US17, US18, US19, US20, US30.

### Should Have

- US3, US4, US8, US10, US12, US16, US21, US23, US24, US26.

### Could Have

- US22, US25, US27, US28, US29, US31, US32, US33, US34, US35, US36.

### Fuera Del Alcance Inicial

- US37.
