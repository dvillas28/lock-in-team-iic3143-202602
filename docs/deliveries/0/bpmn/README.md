# Modelos BPMN de AcademiX

Se identifican **cuatro tipos de usuario**: administrador institucional (administrador de tenant), docente, ayudante docente y estudiante. Los diez modelos describen sus procesos de negocio; cada modelo tiene un PNG independiente, un HTML para conservar la composición visual y un archivo BPMN editable.

## Usuarios identificados

| Usuario | Responsabilidad y límite | Modelos |
| --- | --- | --- |
| Administrador institucional | Administra usuarios, periodos, cursos, secciones e inscripciones de **su universidad**. No se deduce un permiso para publicar notas por ser administrador. | 00, 01 |
| Docente | Configura cursos, participantes y roles permitidos, módulos, material, evaluaciones y ponderaciones. Corrige y decide la liberación de notas. También puede publicar anuncios. | 00, 02, 03; comunicación compartida con 04 |
| Ayudante docente | Apoya en corrección, comentarios, material, anuncios y recorrecciones **según permisos del curso o sección**. No adquiere la facultad de liberar notas por su rol de ayudante. | 00, 04; corrección compartida con 03 |
| Estudiante | Consulta sus cursos y pendientes, identifica a su cuerpo docente, accede a material publicado, entrega evaluaciones individuales y revisa sus notas liberadas. | 00, 05, 06, 07; extensiones 08 y 09 |

Los roles son contextuales: una misma persona puede ser estudiante en un curso y ayudante en otro. “Cuerpo docente” agrupa docentes y ayudantes; “revisor” designa a cualquiera de ellos con permiso de corrección. Ninguno constituye un quinto rol independiente.

Universidad, facultad, departamento y dirección de docencia aparecen como interesados o compradores. El equipo técnico aparece como interesado en la operación y construcción del producto, sin un flujo funcional de usuario definido. El asistente de IA es una capacidad del sistema. No se inventan roles de superadministrador, invitado, apoderado o proveedor externo.

## Archivos PNG

Las imágenes están en [`../inform/images/bpmn/`](../inform/images/bpmn/), listas para incluirse en el informe. La resolución de exportación es 2×: **3520 px de ancho**, con altura ajustada al número de carriles. Los diagramas usan un estilo neutro en escala de grises, según la preferencia indicada.

| Nº | Modelo y PNG | Alcance | Fuente editable |
| --- | --- | --- | --- |
| 00 | [Acceso y autorización contextual](../inform/images/bpmn/00-acceso-contextual.png) | Compartido: autenticación, tenant, membresía, permiso y rechazo. | [BPMN](fuentes/00-acceso-contextual.bpmn) · [HTML](fuentes/00-acceso-contextual.html) |
| 01 | [Administrador: habilitar el semestre](../inform/images/bpmn/01-administrador-institucional.png) | Usuarios, periodos, cursos, secciones e inscripciones. | [BPMN](fuentes/01-administrador-institucional.bpmn) · [HTML](fuentes/01-administrador-institucional.html) |
| 02 | [Docente: preparar el curso](../inform/images/bpmn/02-docente-preparacion.png) | Información, roles, material, evaluaciones y ponderaciones. | [BPMN](fuentes/02-docente-preparacion.bpmn) · [HTML](fuentes/02-docente-preparacion.html) |
| 03 | [Docente: corregir y liberar calificaciones](../inform/images/bpmn/03-docente-correccion-publicacion.png) | Corrección oculta, cálculo, decisión y liberación manual. | [BPMN](fuentes/03-docente-correccion-publicacion.bpmn) · [HTML](fuentes/03-docente-correccion-publicacion.html) |
| 04 | [Ayudante: ejecutar apoyo autorizado](../inform/images/bpmn/04-ayudante-apoyo.png) | Corrección, gestión de material o publicación de anuncios. | [BPMN](fuentes/04-ayudante-apoyo.bpmn) · [HTML](fuentes/04-ayudante-apoyo.html) |
| 05 | [Estudiante: consultar actividad académica](../inform/images/bpmn/05-estudiante-actividad.png) | Dashboard, curso, cuerpo docente y elección de actividad. | [BPMN](fuentes/05-estudiante-actividad.bpmn) · [HTML](fuentes/05-estudiante-actividad.html) |
| 06 | [Estudiante: enviar una evaluación](../inform/images/bpmn/06-estudiante-entrega.png) | Reglas de envío, persistencia, reintento y confirmación. | [BPMN](fuentes/06-estudiante-entrega.bpmn) · [HTML](fuentes/06-estudiante-entrega.html) |
| 07 | [Estudiante: revisar notas y avance](../inform/images/bpmn/07-estudiante-calificaciones.png) | Notas propias publicadas, comentarios y promedio parcial. | [BPMN](fuentes/07-estudiante-calificaciones.bpmn) · [HTML](fuentes/07-estudiante-calificaciones.html) |
| 08 | [Estudiante: consultar el asistente de material](../inform/images/bpmn/08-estudiante-asistente-ia.png) | **Opcional**: preguntas, explicaciones y resumen con evidencia. | [BPMN](fuentes/08-estudiante-asistente-ia.bpmn) · [HTML](fuentes/08-estudiante-asistente-ia.html) |
| 09 | [Estudiante: solicitar recorrección](../inform/images/bpmn/09-estudiante-recorreccion.png) | **Opcional**: admisibilidad y registro de solicitud. | [BPMN](fuentes/09-estudiante-recorreccion.bpmn) · [HTML](fuentes/09-estudiante-recorreccion.html) |

Los modelos 01 y 02 describen el recorrido de preparación inicial; sus tareas agrupan operaciones de administración que también pueden realizarse sobre registros existentes. El modelo 03 admite correcciones pendientes o guardadas: revisar una corrección ya registrada no exige cambiar la nota. Los modelos 04 y 05 eligen una actividad por instancia; una nueva actividad inicia otra instancia. La liberación de notas y la consulta del estudiante son procesos separados, no pasos que obliguen a mantener una sesión abierta hasta que el otro actor actúe.

## Fuentes y trazabilidad

Se revisaron los documentos de dominio de `docs/deliveries/0/`, el contenido del informe en [`inform/main.tex`](../inform/main.tex), la presentación en [`ppt/main.tex`](../ppt/main.tex) y los **tres mocks de la carpeta solicitada**. Los PDF y ZIP son versiones de entrega; no se modificaron.

| Evidencia | Aporte al modelado |
| --- | --- |
| [Design doc, secciones 4 y 5](../design-doc-entrega-1.md) y [glosario](../glossary.md) | Identificación explícita de los cuatro usuarios; alcance del ayudante; separación de interesados y usuarios. |
| [Alcance](../scope.md) y [roadmap](../roadmap.md) | Fundaciones prioritarias, entregas individuales y extensiones condicionadas. |
| [Requisitos](../requirements.md) y [historias de usuario](../user-stories.md) | Permisos, resultados, decisiones, errores de entrega y criterios de publicación. |
| [Arquitectura, secciones Multi-Tenancy y Seguridad](../architecture.md) | Tenant = universidad; membresía institucional y rol por curso o sección. |
| [Dashboard estudiante](../inform/images/mockup-dashboard.png) | Cursos activos, próximas evaluaciones, anuncios y acceso a calificaciones. El calendario visible es una extensión opcional. |
| [Lector PDF](../inform/images/mockup-pdf-reader.png) | Documento abierto, selección de texto, respuestas con citas y ausencia de evidencia. El lector y la IA tienen prioridades distintas. |
| [Libro de notas docente](../inform/images/mockup-teacher-gradebook.png) | Advertencia de ponderaciones al 95 %, estados de corrección y publicación, liberación manual y privacidad por estudiante. |

| Modelo | Requisitos e historias principales |
| --- | --- |
| 00 | RF1, RF2; RNF3, RNF4. |
| 01 | RF3–RF5; US5, US6, US8; US7 delimita la gestión contextual del docente. |
| 02 | RF6–RF9, RF19, RF22; US7, US9–US11, US13, US17. |
| 03 | RF12–RF16, RF19, RF22; US15, US17, US18, US21. |
| 04 | RF12, RF16, RF18, RF19; US4, US15, US21, US23; alcance del ayudante en el design doc. |
| 05 | RF10, RF18, RF20, RF21; US1–US3, US12, US24, US26, US30. |
| 06 | RF10, RF11; US14, US16; RNF5 y escenario de fallo de subida. |
| 07 | RF14, RF15, RF22; US18–US20. |
| 08 | RFO2; US27–US29, US32. |
| 09 | RF17; US22. |

## Convenciones BPMN y decisiones de alcance

Se utiliza [BPMN 2.0.2 de OMG](https://www.omg.org/spec/BPMN/2.0.2/): círculos de inicio, círculos de borde grueso para fin, tareas de usuario con figura humana, tareas automáticas con engranaje y compuertas exclusivas con una X. Cada imagen incluye su leyenda.

Cada modelo contiene un participante —la operación académica de una universidad— dividido en carriles por responsable. Las flechas continuas son flujos de secuencia dentro de ese participante, incluso cuando cambian de carril. No se utilizan flechas de mensaje para representar navegación entre pantallas. Las uniones exclusivas de 04 y 05 reúnen alternativas; no sincronizan tareas paralelas. Las referencias a otro número de modelo son referencias documentales a su detalle, no llamadas ejecutables.

Los archivos `.bpmn` contienen procesos **descriptivos, no ejecutables**, con coordenadas de intercambio BPMN DI. Las condiciones se expresan con nombres de ramas y reglas documentadas; no se añade lenguaje de ejecución, integración ni infraestructura. Los HTML conservan la composición exacta utilizada para los PNG; un editor BPMN puede distribuir textos de otra manera al abrir el XML.

- **Acceso:** 00 es la precondición de los demás modelos y se revalida al operar sobre un recurso. “Acceso autorizado” nunca habilita recursos de otros cursos, secciones o tenants.
- **Corrección y publicación:** nota y comentarios permanecen ocultos hasta la acción del docente. La auditoría corresponde a cada modificación académica relevante, no solamente al cierre del semestre o de una sesión.
- **Promedios:** la vista del estudiante usa únicamente notas liberadas y ponderaciones configuradas. Se declara parcialidad cuando faltan notas y configuración incompleta cuando los pesos no son válidos. El 100 % procede del mock; no se inventa una fórmula de normalización o redondeo.
- **Entregas:** se permite atraso solo cuando la evaluación lo admite. El reintento vuelve a validar las reglas. La confirmación exige contenido y metadatos persistidos; un error no equivale a una entrega recibida.
- **Recorrección:** 09 termina en la solicitud registrada. No se inventan el plazo exacto, el responsable de resolución, un mecanismo de apelación o una política de republicación de notas ya liberadas.
- **Extensiones:** 08 y 09 están separadas y marcadas como opcionales. El lector PDF pertenece a la extensión inicial/Should Have; incluirlo en 05 no convierte la IA en obligatoria. Videos, chats, calendario y alertas no generan nuevos tipos de usuario y permanecen sujetos al alcance documentado. Grupos y correo requieren definiciones posteriores, por lo que no se inventan procesos para ellos.

Los nombres y el orden de tareas son una síntesis de negocio de estas fuentes, no una especificación adicional de pantallas, endpoints ni transacciones.

## Revisión de los archivos

Se comprobó que todos los nodos fueran alcanzables desde un inicio y pudieran llegar a un fin, que los flujos mantuvieran sus extremos dentro del proceso y que las tareas estuvieran en el carril de su responsable. También se revisaron las rutas de flechas, la legibilidad de los textos y el resultado PNG de cada modelo.

Los cuatro roles están respaldados por documentación explícita. No existen mocks de administrador o ayudante en la carpeta solicitada: sus modelos se derivan de las responsabilidades y criterios escritos, sin presentar pantallas inventadas como evidencia.
