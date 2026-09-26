# Casos De Uso Y Requerimientos

## Actores

- Docente coordinador: administra curso, secciones, material, quizzes,
  ayudantes, ponderaciones y publicacion de notas.
- Ayudante: apoya secciones donde tiene rol `assistant`.
- Estudiante: consume material, responde quizzes y ve notas publicadas.
- Sistema: resuelve tenant, calcula notas y aplica restricciones de acceso.

No existe administrador institucional separado en el MVP.

## Casos de uso MVP

| ID | Caso de uso | Actor | Resultado |
| --- | --- | --- | --- |
| CU1 | Elegir universidad | Estudiante/Docente | Portal home redirige a `/uc` o `/utfsm`. |
| CU2 | Resolver tenant por request | Sistema | Request usa DB correcta segun `x-tenant`. |
| CU3 | Ver cursos y secciones | Docente/Estudiante | Usuario ve solo cursos donde esta inscrito. |
| CU4 | Gestionar secciones y roles | Docente | Se asignan `teacher`, `student`, `assistant`. |
| CU5 | Publicar material | Docente | Material markdown o archivo queda visible. |
| CU6 | Consultar material | Estudiante | Accede solo a material publicado de su seccion. |
| CU7 | Crear quiz | Docente | Quiz tiene preguntas, alternativas y pauta. |
| CU8 | Responder quiz | Estudiante | Intento queda registrado por estudiante. |
| CU9 | Calcular nota | Sistema | Nota se calcula automaticamente al finalizar. |
| CU10 | Configurar libro de notas | Docente | Evaluaciones tienen ponderacion. |
| CU11 | Publicar notas | Docente | Notas quedan visibles para estudiantes. |
| CU12 | Ver notas y promedio | Estudiante | Ve solo notas publicadas y promedio parcial. |

## Requisitos funcionales

RF1. El frontend debe ofrecer un portal home para elegir universidad.

RF2. Cada universidad demo debe tener una ruta canónica: `/uc` y `/utfsm`.

RF3. El frontend debe derivar el tenant desde la ruta y enviar `x-tenant` al
backend.

RF4. El backend debe resolver el tenant usando el header `x-tenant`.

RF5. El registry central debe mapear `slug` de tenant a `database_url`.

RF6. El sistema debe rechazar requests sin tenant valido.

RF7. Cada tenant debe tener su propia base PostgreSQL con el mismo schema.

RF8. El sistema debe permitir usuarios dentro de una universidad.

RF9. El sistema debe modelar cursos y secciones por tenant.

RF10. El sistema debe inscribir usuarios en secciones con rol `teacher`,
`student` o `assistant`.

RF11. Un usuario puede tener roles distintos en secciones distintas.

RF12. El docente coordinador debe poder administrar cursos y secciones donde
tiene rol `teacher`.

RF13. El docente debe poder crear modulos de curso y ordenarlos.

RF14. El docente debe poder crear material markdown o material basado en archivo.

RF15. El sistema debe aceptar archivos PDF, CSV, XLSX, TXT, JPEG y PNG.

RF16. El estudiante debe poder ver solo material publicado de cursos donde esta
inscrito.

RF17. El docente debe poder crear quizzes de alternativas.

RF18. Cada pregunta debe tener alternativas y una alternativa correcta.

RF19. El estudiante debe poder iniciar y finalizar un intento de quiz.

RF20. El sistema debe calcular la nota automaticamente al finalizar el intento.

RF21. El docente debe poder configurar ponderaciones por evaluacion.

RF22. El docente debe poder publicar/liberar notas.

RF23. El estudiante debe ver solo notas publicadas propias.

RF24. El sistema debe calcular promedio usando ponderaciones publicadas.

## Requisitos no funcionales

RNF1. Aislamiento: datos de un tenant no deben consultarse desde otro tenant.

RNF2. Seguridad: toda operacion academica debe validar tenant, seccion y rol.

RNF3. Integridad: notas, respuestas y ponderaciones deben usar transacciones
cuando cambian juntas.

RNF4. Recuperabilidad: cada DB de tenant debe poder respaldarse/restaurarse sin
afectar a las otras.

RNF5. Mantenibilidad: backend como monolito modular, sin microservicios.

RNF6. Portabilidad: Railway es plataforma inmediata para la primera version
funcional; Google Cloud queda como migracion posterior con free tier/creditos.

RNF7. Archivos: binarios viven fuera de PostgreSQL; la DB guarda metadatos.

RNF8. Observabilidad minima: healthcheck, logs de errores y estado de despliegue.

RNF9. Despliegue: el CD debe quedar automatizado en Railway mediante
configuracion versionada `railway.toml`, salvo bloqueo explicito de cuenta.

## Reglas de negocio

- `/uc` y `/utfsm` son las rutas publicas del MVP.
- `x-tenant` es obligatorio en llamadas al backend hasta implementar
  subdominios.
- `slug` de tenant debe ser unico en registry.
- El mismo schema debe aplicarse a `academix_uc_db` y `academix_utfsm_db`.
- Un docente no puede publicar notas de una seccion donde no es `teacher`.
- Un ayudante no puede publicar notas; solo apoya segun permisos definidos.
- Una nota no publicada no es visible para estudiante.
- Un promedio estudiante usa solo `grades.published_at IS NOT NULL`.
- Un quiz finalizado no se recalcula salvo que se ejecute una accion docente
  explicita definida en una entrega futura.
