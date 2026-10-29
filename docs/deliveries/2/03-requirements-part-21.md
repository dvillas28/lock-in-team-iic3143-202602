## Requisitos funcionales

RF1. El sistema debe autenticar una identidad global mediante JWT.

RF2. El frontend debe listar únicamente Institutions accesibles para el User.

RF3. UC y UTFSM deben existir como Institutions con slugs únicos dentro de la
misma PostgreSQL compartida mediante bootstrap opt-in implementado.

RF4. Los endpoints académicos deben declarar el contexto mediante
`/api/v1/institution/{institutionSlug}/...`.

RF5. El backend debe resolver el slug a un UUID interno y verificar una
`InstitutionMembership` activa antes de evaluar roles académicos.

RF6. Indicar una Institution en la URL no debe autenticar ni autorizar.

RF7. `User` debe ser global y poder relacionarse con más de una Institution.

RF8. Toda entidad académica tenant-owned debe conservar `institution_id`.

RF9. El sistema debe impedir relaciones entre registros de Institutions
distintas mediante constraints y FK institution-aware cuando corresponda.

RF10. El sistema debe asignar roles `teacher`, `student` o `assistant` por
sección mediante Enrollment.

RF11. Un User puede tener más de un rol activo, incluso en una misma sección.

RF12. Crear cursos exige is_admin institucional; configuración/secciones exigen
is_admin y ownership. Teacher gestiona contenido y participantes de sus secciones;
assistant consulta seguimiento y student su recorrido. Superadmin delega is_admin
sin acceso académico implícito; operador realiza onboarding inicial controlado.

RF13. El docente debe poder crear, ordenar, actualizar, publicar y ocultar
módulos de curso.

RF14. El docente debe poder crear, actualizar, publicar y ocultar material
markdown o basado en archivo.

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

RF21. Configurar ponderaciones exige teacher activo y admin propietario.

RF22. El docente autorizado debe poder publicar notas.

RF23. El estudiante ve únicamente notas propias publicadas.

RF24. El promedio parcial se calcula con notas publicadas, normalizado por la
suma de sus ponderaciones.

RF25. Toda operación académica debe autorizar Institution, curso, sección y rol.

RF26. Historial inmutable: teacher consulta eventos de sus secciones históricas;
owner+teacher amplía a su curso. Owner sin teacher conserva administrativos,
nunca grade, incluso publicado. Revalidar cada página/cursor y sanitizar snapshots.

RF27. La vista estudiantil del quiz omite pauta y corrección antes de publicar.
Quien puede consultar la pauta no puede rendir ese quiz como estudiante.

RF28. El estudiante propietario, el docente del curso o el docente de la
sección histórica pueden cancelar un intento en progreso bajo sus permisos
vigentes. La cancelación no genera nota, cuenta para el límite de intentos y
queda auditada.

RF29. El docente puede consultar y administrar el libro de notas dentro de su
alcance académico; el ayudante solo consulta las secciones donde mantiene rol
activo.
