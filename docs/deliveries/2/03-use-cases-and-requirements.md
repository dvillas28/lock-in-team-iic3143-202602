# Casos de uso y requerimientos

## Actores

- Coordinador de curso: administra curso, secciones, material, quizzes,
  ayudantes, ponderaciones, publicación de notas y auditoría.
- Docente de sección: gestiona quizzes y publica notas solo en sus secciones.
- Ayudante: apoya secciones donde tiene rol `assistant`.
- Estudiante: consume material, responde quizzes y ve notas publicadas.
- Una misma persona puede acumular roles, incluso dentro de una sección.
- Sistema: resuelve tenant, calcula notas y aplica restricciones de acceso.

No existe administrador institucional separado en el MVP.

## Casos de uso MVP

| ID | Caso de uso | Actor | Resultado |
| --- | --- | --- | --- |
| CU1 | Elegir universidad | Estudiante/Docente | Portal home redirige a `/uc` o `/utfsm`. |
| CU2 | Resolver tenant por request | Sistema | Request usa DB correcta según `x-tenant`. |
| CU3 | Ver cursos y secciones | Docente/Estudiante | Usuario ve solo cursos dónde está inscrito. |
| CU4 | Gestionar secciones y roles | Coordinador | El primer coordinador se aprovisiona con el curso; se asignan roles de sección. |
| CU5 | Publicar material | Coordinador | Material markdown o archivo queda visible. |
| CU6 | Consultar material | Estudiante | Accede a material publicado del curso donde tiene inscripción activa. |
| CU7 | Crear quiz | Docente | Quiz tiene preguntas, alternativas y pauta. |
| CU8 | Responder quiz | Estudiante | Intento numerado queda registrado con sección histórica y límite opcional. |
| CU9 | Calcular nota | Sistema | Nota se calcula automáticamente al finalizar. |
| CU10 | Configurar libro de notas | Coordinador | Evaluaciones tienen ponderación. |
| CU11 | Publicar notas | Coordinador/Docente | Notas quedan visibles para estudiantes según alcance. |
| CU12 | Ver notas y promedio | Estudiante | Ve solo notas publicadas y promedio parcial. |
| CU13 | Consultar auditoría | Coordinador | Ve historial inmutable de cambios de su curso. |

## Requisitos funcionales

RF1. El frontend debe ofrecer un portal home para elegir universidad.

RF2. Cada universidad demo debe tener una ruta canónica: `/uc` y `/utfsm`.

RF3. El frontend debe derivar el tenant desde la ruta y enviar `x-tenant` al
backend.

RF4. El backend debe resolver el tenant usando el header `x-tenant`.

RF5. El registry central debe mapear `slug` de tenant a `database_url`.

RF6. El sistema debe rechazar requests sin tenant válido.

RF7. Cada tenant debe tener su propia base PostgreSQL con el mismo schema.

RF8. El sistema debe permitir usuarios dentro de una universidad.

RF9. El sistema debe modelar cursos y secciones por tenant.

RF10. El sistema debe asignar `coordinator` por curso y roles `teacher`,
`student` o `assistant` por sección.

RF11. Un usuario puede tener más de un rol activo, incluso en una misma sección.

RF12. El coordinador administra todo su curso; el docente de sección solo
administra las secciones donde tiene `teacher` activo.

RF13. El coordinador debe poder crear módulos de curso y ordenarlos.

RF14. El coordinador debe poder crear material markdown o material basado en archivo.

RF15. El sistema debe aceptar archivos PDF, CSV, XLSX, TXT, JPEG y PNG.

RF16. El estudiante debe poder ver solo material publicado de cursos donde está
inscrito.

RF17. El docente debe poder crear quizzes de alternativas.

RF18. Cada pregunta debe tener alternativas y una alternativa correcta.

RF19. El estudiante debe poder iniciar y finalizar intentos de quiz, con
límite positivo opcional o sin límite. Solo hay un intento en progreso por
estudiante y quiz.

RF20. El sistema debe calcular la nota automáticamente al finalizar cada
intento y usar el último intento calificado como nota vigente.

RF21. El docente debe poder configurar ponderaciones por evaluación.

RF22. El docente debe poder publicar/liberar notas.

RF23. El estudiante debe ver solo notas publicadas propias.

RF24. El sistema debe calcular el promedio parcial con notas publicadas y
sus ponderaciones, normalizado por la suma de estas.

RF25. Las operaciones académicas deben autenticar JWT y autorizar con
pertenencias activas del tenant seleccionado.

RF26. El sistema debe registrar eventos inmutables de cambios académicos
sensibles y permitir al coordinador consultar el historial de su curso.

RF27. La vista estudiantil del quiz debe omitir la pauta y los resultados de
corrección antes de publicar la nota. Una persona con acceso a la pauta de un
quiz no puede rendir ese mismo quiz como estudiante.

## Requisitos no funcionales

RNF1. Aislamiento: datos de un tenant no deben consultarse desde otro tenant.

RNF2. Seguridad: toda operación académica debe validar JWT, tenant, curso,
sección y rol. `x-tenant` no autentica.

RNF3. Integridad: notas, respuestas, ponderaciones y eventos de auditoría
deben usar transacciones cuando cambian juntas.

RNF4. Recuperabilidad: cada DB de tenant debe poder respaldarse/restaurarse sin
afectar a las otras.

RNF5. Mantenibilidad: backend como monolito modular, sin microservicios.

RNF6. Portabilidad: Railway es plataforma inmediata para la primera versión
funcional; Google Cloud queda como migración posterior con free tier/créditos.

RNF7. Archivos: binarios viven fuera de PostgreSQL; la DB guarda metadatos.

RNF8. Observabilidad mínima: healthcheck, logs de errores y estado de despliegue.

RNF9. Despliegue: el CD debe quedar automatizado en Railway mediante
configuración versionada `railway.toml`, salvo bloqueo explícito de cuenta.

## Reglas de negocio

- `/uc` y `/utfsm` son las rutas públicas del MVP.
- `x-tenant` es obligatorio en llamadas al backend hasta implementar
  subdominios.
- `slug` de tenant debe ser único en registry.
- El mismo schema debe aplicarse a `academix_uc_db` y `academix_utfsm_db`.
- Un coordinador puede publicar notas de cualquier sección de su curso; un
  docente solo de las secciones donde tiene `teacher`.
- Un ayudante no puede publicar notas; solo apoya según permisos definidos.
- Una nota no publicada no es visible para estudiante; tampoco se revela la
  alternativa correcta ni la corrección antes de publicarla. Un usuario con
  varios roles no puede rendir un quiz cuya pauta puede consultar.
- `max_attempts = null` permite intentos ilimitados; un entero positivo los
  limita. El último intento calificado por número determina la nota vigente.
- La primera publicación exige ponderaciones totales de 100 %. Una vez
  publicada cualquier nota del curso, el libro de notas queda configurado y no se agregan ítems ni se cambian ponderaciones. Una vez
  publicada la nota de un estudiante para un quiz no se permiten nuevos
  intentos ni cambiar esa nota.
- La escala de nota es 1,0 a 7,0 con exigencia de 60 % para 4,0, redondeo
  `HALF_UP` a un decimal. El promedio parcial usa solo notas publicadas y se
  normaliza por la suma de sus ponderaciones; sin peso publicado es `null`.
- Los cambios sensibles se auditan en el mismo tenant y transacción.
