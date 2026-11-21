# Alcance y versión de entrega E4

Corte comprobado: **21/11/2026**. Entrega informada: **22/11/2026**.
Fuentes: [plan E3](../../3/ppt/dvillas28/10-plan-mvp/frames.tex),
[enunciado actualizado](../enunciado_e4.pdf), [operación de hoy](operacion-demo.md).

## Versión y decisión de alcance

- Backend remoto: **v0.13.1**, commit `7d4b666e379aedaec86eb6fd3d4e7a9d518a184a`, confirmado por `/health`.
- [Release](https://github.com/dvillas28/lock-in-team-iic3143-202602/releases/tag/v0.13.1) y [merge #329](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/329).
- La documentación de arquitectura/datos de [#330](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/330) está en `dev` y se reutiliza en esta rama. Todavía no forma parte de la release desplegada.
- Frontend remoto: dominios UC/UTFSM funcionales. No expone SHA verificable en esta revisión; no se atribuye identidad de commit por inferencia.
- **Material en archivos se incluye:** había ADR e implementación antes del 15/11 y hoy pasó carga/descarga real en ambos tenants. La condición de E3 para excluirlo ya no aplica.
- Perfiles/altas, tareas/entregas, grupos/revisiones y calendario son ampliaciones implementadas. Sus límites operativos se explicitan abajo; no se presentan como pendientes futuros prometidos.
- Antes del ensayo, mantener este corte funcional. Si cambia código, repetir las comprobaciones afectadas y registrar otro SHA.

## Matriz del compromiso académico

`API`: ejercicio remoto ejecutado hoy; `UI`: navegador real hoy; `CI`: pruebas versionadas y ejecución previa.
Una fila con CI y sin API/UI **no** acredita que se haya ensayado manualmente hoy.
Secuencia `D` corresponde al recorrido de [operación](operacion-demo.md).

| Caso | Resultado y evidencia | Paso de demo / validación restante |
| --- | --- | --- |
| CU-01 Acceso institucional | UI: UC/UTFSM por dominio; sin selector intermedio, conforme al flujo vigente. [Accesos](evidencia/access.json). | D1: abrir cada dominio. |
| CU-02 Contexto y permisos | UI login docente/estudiante; API rechaza IDs ajenos. [Ciclo](evidencia/remote-cycle.json). | D1/D7: acceso y aislamiento. |
| CU-03 Cursos y secciones | API: listar cursos, crear curso y sección sintéticos en ambas instituciones. | D2: abrir curso reservado para demo. |
| CU-04 Secciones y roles | API: matrícula de estudiante en cada curso de validación; sin alterar roles existentes. [CI](../../../../e2e/specs/courses.spec.ts). | D2: mostrar participantes; ensayar cambio/revocación en datos nuevos si se presenta. |
| CU-05 Publicar material | API: Markdown y archivo TXT creados/publicados; archivo descargado con bytes idénticos. | D3: crear/publicar recurso nuevo. |
| CU-06 Consultar material | API: estudiante lee Markdown y descarga archivo autorizado. | D3: abrir lector/descarga en navegador durante ensayo. |
| CU-07 Autoría/publicación quiz | API: quiz nuevo de una pregunta por tenant; publicación aprobada. | D4: mostrar autoría y publicar otro quiz de ensayo. |
| CU-08 Responder quiz | API: intento propio, preguntas sin pauta y guardado de respuesta. | D4: responder con estudiante en navegador. |
| CU-09 Calificación automática | API: envío genera nota **7,0** en ambos tenants; sin exposición antes de publicar. | D4/D5: contrastar vista docente/estudiante. |
| CU-10 Configurar libro | API: ítem creado y promedio 7,0 tras publicación; configuración avanzada cubierta por [CI](../../../../e2e/specs/grades.spec.ts). | D5: mostrar grupos/pesos; ensayar cambio explícito sin tocar notas de demostración anteriores. |
| CU-11 Publicar notas | API: selección explícita y un resultado publicado por tenant. | D5: publicar selección de demo nueva. |
| CU-12 Notas y promedio | API: antes vacío, después nota/promedio 7,0. | D6: vista estudiantil y captura de resultado. |
| CU-13 Auditoría | API: eventos de curso, módulo, material, intento y `grade.published` observados. | D6: mostrar línea de tiempo con cuenta autorizada. |
| CU-14 Organizar módulos | API: módulo creado/publicado; [CI](../../../../e2e/specs/content.spec.ts) para orden y visibilidad. | D3: mostrar orden y publicación en ensayo. |
| CU-15 Cancelar intento | [CI](../../../../e2e/specs/attempts.spec.ts); hoy no se ejecutó cancelación remota. | D4: iniciar otro intento sintético y cancelar; comprobar que no genera nota. |
| CU-16 Seguimiento docente/ayudante | API docente con libro; estudiante rechazado. [CI permisos](../../../../backend/test/integration/gradebook-write-permissions.test.mjs). | D5: entrar como ayudante y verificar solo lectura durante ensayo. |

## Ampliaciones implementadas y límites

| Capacidad | Fuente / evidencia | Estado operativo al corte |
| --- | --- | --- |
| Archivos en módulos | [Implementación](../../../planning/academic-files/implementation.md), [ciclo de hoy](evidencia/remote-cycle.json). | Carga/publicación/descarga real aprobadas UC/UTFSM. TXT de 52 bytes; PDF/imagen y persistencia tras redeploy no se repitieron hoy. |
| CU-17/18/21 Perfil, contraseña y foto | [Trazabilidad](../../../../specs/20261106-170457_perfiles-altas-usuarios/traceability.md). | Código y pruebas existentes; hoy no se cambia contraseña ni foto. |
| CU-19/20 Invitación y CSV | [Evidencia](../../../planning/perfiles/evidencia.md), PR #238. | Aceptación manual previa de Resend; no se envían correos reales en esta revisión. |
| CU-22/23 Tareas | [Contrato funcional](../../../planning/course-assignments.md), PR #254. | Listado remoto consultado; nueva tarea/publicación no ejercitadas hoy. |
| CU-24/25 Entrega y calificación | [Contrato funcional](../../../planning/assignment-submissions.md), PR #258. | Código y CI existentes; envío/corrección de tarea pendiente del ensayo funcional final. |
| Grupos y revisiones de notas | [ADR](../../../adr/gradebook-groups-and-revisions.md), PR #252. | Código y CI; no se corrigen notas publicadas existentes en esta revisión. |
| Calendario de plazos | [PR #317](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/317). | Visible en navegador; no se integra calendario externo. |

## Exclusiones y entrega material

- No se comprometen IA/chat/RAG, quizzes en vivo, integraciones con calendarios externos, HA ni restauración individual de notas.
- No se atribuye a `/ready` la confirmación del proveedor físico de base; Neon requiere evidencia del operador/configuración remota.
- [Arquitectura](../arquitectura.md) y [modelo](../modelo-datos.md) están integrados en la [presentación](../ppt/main.pdf).
- Línea base conciliada de E4: 77 h estimadas en 26 tarjetas. La diferencia de 2 h correspondía al ensayo de E3 (#166). El [balance por persona y tarjeta](gestion.md) separa presupuesto, valores registrados y aproximaciones retrospectivas.
- La retrospectiva queda pendiente de la sesión del equipo. El [guion](../ppt/guion.md) especifica el recorrido de exposición.
