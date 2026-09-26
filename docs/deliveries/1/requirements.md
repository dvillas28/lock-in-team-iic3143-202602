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

RF21. El estudiante debe poder visualizar los docentes y ayudantes responsables de su seccion, mostrando al menos nombre y rol, sin exponer integrantes ajenos al curso, seccion o tenant correspondiente.

RF22. El sistema debe calcular calificaciones y promedios dentro de la plataforma segun las ponderaciones configuradas, indicando cuando el resultado es parcial o la configuracion esta incompleta.

## Requisitos Funcionales Opcionales

RFO1. El docente debe poder cargar y publicar videos como material academico cuando la extension de video se habilite.

RFO2. El estudiante debe poder solicitar un resumen mediante IA sobre material publicado cuando la extension de IA se habilite.

RFO3. Los participantes autorizados deben poder comunicarse en un chat asociado a su seccion cuando la extension de chat se habilite.

RFO4. Los integrantes autorizados deben poder comunicarse en un chat de grupo cuando exista un modelo de grupos de estudiantes definido para el curso o seccion.

RFO5. El dashboard del estudiante debe poder mostrar un calendario interno junto a sus cursos, relacionando evaluaciones, fechas de entrega y estado de entrega.

RFO6. El sistema debe poder mostrar alertas dentro de la plataforma mediante toasts o listas desplegables, relacionadas con evaluaciones, entregas u otros cambios relevantes del curso.

RFO7. El sistema puede extender las alertas por correo una vez resueltos el proveedor, la entregabilidad y las preferencias de notificacion.

## Requisitos No Funcionales

RNF1. Disponibilidad: la plataforma debe mantenerse operativa durante periodos criticos de evaluaciones y entregas.

RNF2. Escalabilidad: el sistema debe permitir escalar frontend y backend horizontalmente.

RNF3. Aislamiento: los datos de un tenant no deben ser accesibles desde otro tenant.

RNF4. Seguridad: el sistema debe aplicar autenticacion y autorizacion basada en roles contextuales.

RNF5. Auditabilidad: cambios en notas, ponderaciones, entregas y liberaciones deben quedar registrados.

RNF6. Rendimiento: las vistas principales deben responder de forma estable en carga normal y degradar de forma controlada durante ventanas criticas.

RNF7. Mantenibilidad: el backend debe organizarse como monolito modular.

RNF8. Persistencia de archivos: los documentos y entregas deben almacenarse fuera de la base relacional.

RNF9. Recuperabilidad: debe existir estrategia de backup y restore por tenant.

RNF10. Observabilidad: el sistema debe exponer logs y metricas basicas para detectar errores y carga.

## Escenarios De Calidad Y Mitigacion

Estos escenarios reemplazan metas numericas prematuras. Buscan explicar accion y reaccion frente a fallas probables del producto.

| Escenario | Riesgo | Mitigacion / Reaccion |
| --- | --- | --- |
| Dashboard lento en carga normal | El estudiante no entiende rapido que cursos, pendientes o notas debe revisar. | Optimizar consultas, paginar o limitar bloques secundarios, agregar indices y medir endpoints antes de introducir cache. |
| Spike de hasta 1.000 estudiantes concurrentes durante evaluaciones o entregas | Saturacion del backend, base de datos o almacenamiento de archivos. | Mantener backend stateless para escalar replicas, usar connection pool si PostgreSQL se satura, almacenar archivos fuera de la base relacional y mover procesamiento pesado a workers si bloquea requests. |
| Falla al subir una entrega | Riesgo de perdida de evidencia academica o estado inconsistente. | Registrar estado de recepcion solo cuando archivo y metadatos queden confirmados; si falla, mostrar error recuperable y permitir reintento sin crear nota ni entrega invalida. |
| Caida parcial de una instancia de aplicacion | Interrupcion temporal durante ventanas criticas. | Mantener despliegue reproducible, logs de error y capacidad de reinicio/redeploy; usar balanceo cuando existan multiples replicas. |
| Intento de acceso cruzado entre tenants | Fuga de datos academicos entre universidades. | Resolver tenant en cada request, validar membresia y rol contextual, y bloquear la operacion si tenant, curso o seccion no coinciden. |
| Cambio de nota, ponderacion o liberacion | Perdida de trazabilidad sobre registros academicos. | Registrar actor, fecha, accion, valor anterior y valor nuevo en auditoria. |
| Restauracion por error operativo o corrupcion de datos | Perdida de datos de una universidad. | Mantener estrategia de backup y restore por tenant, para restaurar una institucion sin afectar a las demas. |

## Restricciones

- El MVP no implementa todas las funcionalidades de un LMS completo.
- El proyecto debe poder desarrollarse en 10 a 12 semanas efectivas.
- El despliegue debe privilegiar servicios cloud con free tiers.
- La IA queda como extension experimental posterior al core funcional.
- Google Calendar, Outlook y quizzes en vivo quedan fuera del primer MVP.
- El modelo inicial considera entregas individuales; grupos de estudiantes, chats grupales y entregas grupales requieren una especificacion posterior.
- Las extensiones Nice to Have solo se activan despues de validar las fundaciones Must Have definidas en [alcance](scope.md).
