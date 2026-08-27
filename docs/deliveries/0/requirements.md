# Requisitos

## Requisitos Funcionales

RF1. El sistema debe permitir autenticar usuarios pertenecientes a una universidad.

RF2. El sistema debe resolver el tenant segun subdominio o contexto institucional.

RF3. El administrador debe poder crear periodos academicos.

RF4. El administrador debe poder crear cursos semestrales y secciones.

RF5. El administrador debe poder inscribir estudiantes, docentes y ayudantes.

RF6. El docente debe poder configurar informacion general del curso.

RF7. El docente debe poder crear modulos y publicar u ocultar contenido.

RF8. El docente debe poder subir material academico asociado a modulos.

RF9. El docente debe poder crear evaluaciones o tareas con categoria, fecha, puntaje y ponderacion.

RF10. El estudiante debe poder visualizar evaluaciones pendientes.

RF11. El estudiante debe poder entregar una evaluacion.

RF12. El docente o ayudante autorizado debe poder corregir entregas.

RF13. El docente debe poder liberar notas manualmente.

RF14. El estudiante debe poder visualizar solo notas liberadas.

RF15. El sistema debe mostrar un libro de notas por curso.

RF16. El sistema debe permitir comentarios de correccion.

RF17. El sistema debe permitir solicitudes de recorreccion como extension del core.

RF18. El sistema debe mostrar un dashboard con cursos, pendientes y anuncios relevantes.

RF19. El sistema debe registrar cambios relevantes en notas, ponderaciones y evaluaciones.

RF20. El sistema debe permitir almacenar y visualizar material en formato PDF dentro de la plataforma como extension inicial.

## Requisitos No Funcionales

RNF1. Disponibilidad: la plataforma debe mantenerse operativa durante periodos criticos de evaluaciones y entregas.

RNF2. Escalabilidad: el sistema debe permitir escalar frontend y backend horizontalmente.

RNF3. Aislamiento: los datos de un tenant no deben ser accesibles desde otro tenant.

RNF4. Seguridad: el sistema debe aplicar autenticacion y autorizacion basada en roles contextuales.

RNF5. Auditabilidad: cambios en notas, ponderaciones, entregas y liberaciones deben quedar registrados.

RNF6. Rendimiento: las vistas principales deben responder dentro de metas medibles.

RNF7. Mantenibilidad: el backend debe organizarse como monolito modular.

RNF8. Persistencia de archivos: los documentos y entregas deben almacenarse fuera de la base relacional.

RNF9. Recuperabilidad: debe existir estrategia de backup y restore por tenant.

RNF10. Observabilidad: el sistema debe exponer logs y metricas basicas para detectar errores y carga.

## SLOs Iniciales

SLO significa Service Level Objective: una meta medible de calidad del sistema.

- El 95% de las cargas del dashboard deben completarse bajo 2 segundos.
- La confirmacion de una entrega debe completarse bajo 3 segundos en condiciones normales.
- La disponibilidad mensual objetivo debe ser 99.5%.
- Los datos de notas deben mantener auditoria de cambios.
- El sistema no debe permitir acceso cruzado entre tenants.

## Restricciones

- El MVP no implementa todas las funcionalidades de un LMS completo.
- El proyecto debe poder desarrollarse en 10 a 12 semanas efectivas.
- El despliegue debe privilegiar servicios cloud con free tiers.
- La IA queda como extension experimental posterior al core funcional.
- Google Calendar, Outlook y quizzes en vivo quedan fuera del primer MVP.

