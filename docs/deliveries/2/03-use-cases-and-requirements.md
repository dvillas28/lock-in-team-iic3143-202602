# Casos de uso y requerimientos

## Actores

- Coordinador de curso: administra curso, secciones, material, quizzes,
  ayudantes, ponderaciones, publicación de notas y auditoría.
- Docente de sección: gestiona quizzes y publica notas solo en sus secciones.
- Ayudante: apoya secciones donde tiene rol `assistant`.
- Estudiante: consume material, responde quizzes y ve notas publicadas.
- Una misma persona puede pertenecer a varias Institutions y acumular roles.
- Sistema: autentica al User global, resuelve Institution, comprueba
  InstitutionMembership y aplica permisos académicos.

No existe administrador institucional separado en el MVP.

## Casos de uso MVP

| ID | Caso de uso | Actor | Resultado |
| --- | --- | --- | --- |
| CU1 | Elegir Institution | User autenticado | Portal lista Institutions visibles y entra al contexto elegido. |
| CU2 | Resolver contexto institucional | Sistema | El slug del path se resuelve y se valida la InstitutionMembership. |
| CU3 | Ver cursos y secciones | Docente/Estudiante | Solo aparecen cursos con membership académica activa en esa Institution. |
| CU4 | Gestionar secciones y roles | Coordinador | Se crean secciones y roles institution-scoped. |
| CU5 | Publicar material | Coordinador | Material markdown o archivo queda visible en su Institution. |
| CU6 | Consultar material | Estudiante | Accede a material publicado de cursos autorizados. |
| CU7 | Crear quiz | Coordinador/Docente | Actúa solo dentro del curso o sección autorizada. |
| CU8 | Responder quiz | Estudiante | Intento numerado conserva sección e Institution históricas. |
| CU9 | Calcular nota | Sistema | Nota se calcula automáticamente al finalizar. |
| CU10 | Configurar libro de notas | Coordinador | Evaluaciones tienen ponderación. |
| CU11 | Publicar notas | Coordinador/Docente | Notas quedan visibles según alcance. |
| CU12 | Ver notas y promedio | Estudiante | Ve solo notas propias publicadas. |
| CU13 | Consultar auditoría | Coordinador | Ve historial inmutable de su curso e Institution. |

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
