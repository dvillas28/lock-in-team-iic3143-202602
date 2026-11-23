# Alcance y versión de entrega E4

Corte comprobado: **21/11/2026**. Entrega informada: **22/11/2026**.
Fuentes: [plan E3](../../3/ppt/dvillas28/10-plan-mvp/frames.tex),
[enunciado actualizado](../enunciado_e4.pdf), [operación de hoy](operacion-demo.md).

## Versión y decisión de alcance

- Backend remoto: **v0.13.1**, commit `7d4b666e379aedaec86eb6fd3d4e7a9d518a184a`, confirmado por `/health`.
- [Release](https://github.com/dvillas28/lock-in-team-iic3143-202602/releases/tag/v0.13.1) y [merge #329](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/329).
- La documentación de arquitectura/datos de [#330](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/330) está en `dev` y se reutiliza en esta rama. Todavía no forma parte de la release desplegada.
- Frontend remoto: dominios UC/UTFSM funcionales. El último [deploy registrado](evidencia/deploys-render.json) figura exitoso en 7d4b666.
- **Material en archivos se incluye:** había ADR e implementación antes del 15/11 y hoy pasó carga/descarga real en ambos tenants. La condición de E3 para excluirlo ya no aplica.
- Perfiles/altas, tareas/entregas, grupos/revisiones y calendario son ampliaciones implementadas. Sus límites operativos se explicitan abajo; no se presentan como pendientes futuros prometidos.
- Antes del ensayo, mantener este corte funcional. Si cambia código, repetir las comprobaciones afectadas y registrar otro SHA.

## Matriz del compromiso académico

`API`: ejercicio remoto ejecutado hoy; `UI`: navegador real hoy; `CI`: pruebas versionadas y ejecución previa.
Una fila con CI y sin API/UI **no** acredita que se haya ensayado manualmente hoy.
Secuencia `D` corresponde al recorrido de [operación](operacion-demo.md).

| Caso | Resultado y evidencia | Ensayo por UI / paso de demo |
| --- | --- | --- |
| CU-01 Acceso institucional | UI: UC/UTFSM por dominio; sin selector intermedio, conforme al flujo vigente. [Accesos](evidencia/access.json). | UI: ingreso por ambos dominios. |
| CU-02 Contexto y permisos | UI login docente/estudiante; API rechaza IDs ajenos. [Ciclo](evidencia/remote-cycle.json). | UI: acceso por rol y rechazo cruzado. |
| CU-03 Cursos y secciones | API: listar cursos, crear curso y sección sintéticos en ambas instituciones. | UI: curso y sección nuevos por institución. |
| CU-04 Secciones y roles | API: matrícula de estudiante en cada curso de validación; sin alterar roles existentes. [CI](../../../../e2e/specs/courses.spec.ts). | UI: altas de estudiante y ayudante en cursos nuevos. |
| CU-05 Publicar material | API: Markdown y archivo TXT creados/publicados; archivo descargado con bytes idénticos. | UI: módulo, lectura y TXT publicados. |
| CU-06 Consultar material | API: estudiante lee Markdown y descarga archivo autorizado. | UI: lectura abierta y TXT de 20 bytes idéntico. |
| CU-07 Autoría/publicación quiz | API: quiz nuevo de una pregunta por tenant; publicación aprobada. | UI: quiz de una pregunta creado y publicado. |
| CU-08 Responder quiz | API: intento propio, preguntas sin pauta y guardado de respuesta. | UI: intento respondido y enviado. |
| CU-09 Calificación automática | API: envío genera nota **7,0** en ambos tenants; sin exposición antes de publicar. | UI: nota automática 7,0. |
| CU-10 Configurar libro | API: ítem creado y promedio 7,0 tras publicación; configuración avanzada cubierta por [CI](../../../../e2e/specs/grades.spec.ts). | UI: se guardó 50/50 en los dos cursos nuevos; promedio parcial 6,3. |
| CU-11 Publicar notas | API: selección explícita y un resultado publicado por tenant. | UI: publicación explícita de resultados nuevos. |
| CU-12 Notas y promedio | API: antes vacío, después nota/promedio 7,0. | UI: comprobación de ocultación previa y resultado posterior. |
| CU-13 Auditoría | API: eventos de curso, módulo, material, intento y `grade.published` observados. | UI: revisión de auditoría del curso. |
| CU-14 Organizar módulos | API: módulo creado/publicado; [CI](../../../../e2e/specs/content.spec.ts) para orden y visibilidad. | UI: creación y publicación del módulo. |
| CU-15 Cancelar intento | [CI](../../../../e2e/specs/attempts.spec.ts). | UI: cancelación en curso sintético. |
| CU-16 Seguimiento docente/ayudante | API docente con libro; estudiante rechazado. [CI permisos](../../../../backend/test/integration/gradebook-write-permissions.test.mjs). | UI: ayudante accedió al libro sin acción de publicación. |

Para la verificación posterior por interfaz, consultar [ensayo remoto por institución](ensayo-remoto.md) y [respaldo local](respaldo-local.md). Las filas anteriores distinguen los resultados del primer ciclo API y el ensayo técnico posterior.

## Ampliaciones y verificación por entorno

| Capacidad | Fuente / evidencia | Estado operativo al corte |
| --- | --- | --- |
| Archivos en módulos | [Implementación](../../../planning/academic-files/implementation.md), [ciclo de hoy](evidencia/remote-cycle.json). | Carga/publicación/descarga real aprobadas UC/UTFSM. TXT de 52 bytes; PDF/imagen y persistencia tras redeploy no se repitieron hoy. |
| CU-17/18/21 Perfil, contraseña y foto | [Trazabilidad](../../../../specs/20261106-170457_perfiles-altas-usuarios/traceability.md). | Código y pruebas existentes; en el [respaldo local](respaldo-local.md) se verificaron edición, foto, cambio de clave y reingreso. |
| CU-19/20 Invitación y CSV | [Evidencia](../../../planning/perfiles/evidencia.md), PR #238. | Altas pendientes individuales y CSV en el ensayo de ambos tenants. El respaldo validó CSV inválido y confirmó dos altas. El envío de correo mantiene su evidencia histórica. |
| CU-22/23 Tareas | [Contrato funcional](../../../planning/course-assignments.md), PR #254. | Docente creó y publicó una tarea escrita en ambos cursos nuevos. |
| CU-24/25 Entrega y calificación | [Contrato funcional](../../../planning/assignment-submissions.md), PR #258. | Entrega escrita, corrección y publicación por navegador en ambos tenants. El [respaldo UC](respaldo-local.md) acreditó entrega escrita, corrección de 8/10 y nota publicada 5,5. |
| Grupos y revisiones de notas | [ADR](../../../adr/gradebook-groups-and-revisions.md), PR #252. | Código y CI; no se corrigen notas publicadas existentes en esta revisión. |
| Calendario de plazos | [PR #317](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/317). | Visible en navegador; no se integra calendario externo. |

## Exclusiones y entrega material

- No se comprometen IA/chat/RAG, quizzes en vivo, integraciones con calendarios externos, HA ni restauración individual de notas.
- El equipo confirmó PostgreSQL en Neon y el servicio en Render.
- [Arquitectura](../arquitectura.md) y [modelo](../modelo-datos.md) están integrados en la [presentación](../ppt/main.pdf).
- Línea base conciliada de E4: 77 h estimadas en 26 tarjetas. La diferencia de 2 h correspondía al ensayo de E3 (#166). El [balance por persona y tarjeta](gestion.md) separa presupuesto, valores registrados y aproximaciones retrospectivas.
- La retrospectiva queda pendiente de la sesión del equipo. El [guion](../ppt/guion.md) especifica el recorrido de exposición.
