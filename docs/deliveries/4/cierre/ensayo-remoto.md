# Ensayo por interfaz en UC y UTFSM

21/11/2026, Chrome de escritorio con Playwright sobre los dominios públicos. Backend v0.13.1, `7d4b666`. GitHub registra [ambos despliegues](evidencia/deploys-render.json) en ese SHA. Se usaron contextos independientes por institución y rol. Este ensayo técnico incluye esperas de red, inspección y reintentos de automatización. Falta cronometrar la exposición oral del equipo.

| Institución | Curso creado por interfaz | ID |
| --- | --- | --- |
| UC | E4-UI-2111-UC | `3d335e0c-b3d1-4bb4-9e7e-c51449454d52` |
| UTFSM | E4-UI-2111-UTFSM | `a0e7bef4-49c8-4c5f-b9f9-e40c8acdcbca` |

## Recorrido observado

Tiempos acumulados desde el inicio del navegador, redondeados al segundo. Las dos instituciones se recorrieron dentro del mismo reloj.

| Hasta | Actor | Acción y resultado en ambas instituciones |
| --- | --- | --- |
| 0:52 | Administración | Primer ingreso mostró error de conexión en ambos dominios. Segundo envío con la API despierta llegó a Mis cursos. |
| 1:22 | Administración/docente del curso | Creó curso con sección 1 y capacidad 10. Apareció en el listado. |
| 2:17 | Administración | Buscó y asignó estudiante y ayudante. La tabla mostró ambas matrículas activas con su rol. |
| 3:00 | Docencia | Creó y publicó Unidad de ensayo, Lectura del ensayo y ensayo-e4.txt. La vista distinguió los estados borrador/publicado. |
| 3:48 | Docencia | Guardó y publicó Quiz del ensayo (una pregunta) y Tarea del ensayo (respuesta escrita sobre 10 puntos). |
| 4:05 | Estudiante | Abrió el curso y la lectura, descargó el TXT y comparó sus 20 bytes con el original en cada institución. |
| 5:10 | Estudiante | Entregó la tarea escrita. En el quiz canceló el primer intento, inició otro, marcó la respuesta correcta, guardó y confirmó el envío. |
| 5:25 | Estudiante | La vista Mis notas cargó «Aún no hay notas publicadas» en ambos cursos. |
| 5:46 | Docencia y estudiante | Publicó el quiz seleccionando evaluación, sección y estudiante. Mis notas mostró 1/1, nota 7 y promedio 7. Corrigió la tarea con 8/10, guardó el borrador y publicó la selección. |
| 6:02 | Ayudante y administración | El ayudante abrió el libro de la sección sin control para publicar. Auditoría mostró creación, asignaciones, publicaciones, entrega y cancelación. |
| 6:21 | Administración y estudiante | Registró una invitación individual y otra por CSV de una fila, ambas pendientes. Estudiante consultó el perfil propio. |
| 6:22 | Estudiante | Navegó con la sesión activa a la ruta de módulos del curso sintético ajeno mediante el enrutador del navegador. Ambas instituciones mostraron «Recurso no disponible». |
| 6:48 | Docencia y estudiante | Guardó pesos 50/50 entre quizzes y tareas. Al abrir Mis notas se observaron 7,0 y 5,5, promedio parcial 6,3. |

Capturas de Mis notas con curso sintético, pesos, puntajes por grupo y promedio: [UC](evidencia/uc-ensayo-nota.png) y [UTFSM](evidencia/utfsm-ensayo-nota.png). El recorrido usó la cuenta administradora que quedó matriculada como docente al crear cada curso. El login de la cuenta docente independiente consta en [accesos previos](evidencia/access.json).

No se enviaron correos ni se cambiaron credenciales o fotos compartidas. El envío de correo quedó fuera del ensayo. Para repetir la publicación, crear otro curso o evaluación sintéticos.

Los cursos de validación anteriores y sus calificaciones se conservaron. [Ciclo API previo](evidencia/remote-cycle.json) · [Matriz CU y ampliaciones](alcance-final.md).
