# Matriz de casos borde del MVP

Fecha: 2026-10-26. Todos los escenarios enumerados están cubiertos por pruebas.
Las rutas de pruebas son relativas a frontend/test o backend/test/integration.
No representa una demostración de ausencia de cualquier defecto posible.

| Flujo | Perfil | Estado o borde | Resultado esperado | Prueba | Resolución |
| --- | --- | --- | --- | --- | --- |
| Sesión | Todos | Foco, visibilidad y pageshow simultáneos | Una revalidación, mismo contexto y borrador | context-events, auth-ui | Corregido |
| Sesión | Estudiante | Quiz con respuestas sin guardar | Conservar radio y texto; ningún PUT/POST | attempt-session | Corregido |
| Sesión | Docente | Publicación incierta al volver | Misma selección/cuerpo/clave; ningún POST implícito | gradebook-publication-ui | Corregido |
| Acceso | Todos | `/me` temporalmente inaccesible | Lectura conservada, aviso y bloqueo de escrituras | session, auth-ui | Corregido |
| Acceso | Todos | Identidad o permisos cambian | Reconstruir frontera privada; descartar respuestas viejas | auth-ui, session | Corregido |
| Acceso | Todos | Expiración, 401, logout, pagehide | Borrar sesión/datos y exigir nuevo login | session, auth-ui | Verificado |
| Errores | Todos | 403/404 secundario con `/me` válido | Error local y navegación institucional operativa | session, auth-ui, participants | Corregido |
| Aislamiento | Multiinstitución | Respuesta UC llega tras cambiar a UTFSM | No mostrar ni completar operación anterior | session, gradebook-student-ui | Verificado |
| Login | Todos | Inputs inválidos y 429 | Validación local y espera; sin reintento automático | auth-ui, session, login-limit | Verificado |
| Directorio | Docente | Nombre/correo, Unicode, mayúsculas | Coincidencia parcial literal en la institución | participant-search | Implementado |
| Directorio | Docente | `%_`, comillas e inyección SQL | Texto literal, SQL parametrizado | participant-search | Implementado |
| Directorio | Otros roles | Admin/superadmin sin docencia, ayudante, estudiante | Directorio denegado | participant-search, participants | Verificado |
| Directorio | Docente | Inactivos, revocados y tenant ajeno | Sin filtraciones; revalidación en cada solicitud | participant-search | Verificado |
| Directorio | Docente | Cursor cruzado, filtro nuevo, límites inválidos | Rechazo 400; cursor vinculado a actor/tenant/búsqueda | participant-search | Verificado |
| Búsqueda UI | Docente | Vacío, sin coincidencias, búsqueda repetida | Sin petición vacía; mensaje local; consulta repetible | participants | Corregido |
| Búsqueda UI | Docente | Paginación y respuesta tardía | Conservar selección; descartar resultados antiguos | participants | Corregido |
| Matrículas | Docente/admin | Asignación duplicada, múltiples roles, historial | Idempotencia sin duplicar; conservar sucesores/historia | enrollments, participants | Verificado |
| Matrículas | Docente | Autorrevocación y último docente | Refrescar permisos y retirar controles | participants, enrollments | Verificado |
| Cursos/secciones | Admin propietario | PATCH mínimo, capacidad cero, concurrencia | Guardar solo cambios, no inventar éxito | course-admin, course-workflow | Verificado |
| Contenido | Docente/estudiante | Módulo e ítem publicados/ocultos | Visibilidad conjunta; estados independientes | content-publication, content-read | Verificado |
| Contenido | Docente | Crear/reordenar, doble clic, red perdida | Conservar borrador; no repetir escritura incierta | content-editor, creation-reset | Verificado |
| Material | Todos | Markdown/HTML adversarial | Texto seguro; enlaces autorizados; ningún script | academic-markdown, content-reader | Verificado |
| Quizzes | Docente/multirol | Borrador, pauta y publicación | Pauta restringida; publicado inmutable | quiz-editor, quiz-session, quiz-integrity | Verificado |
| Intentos | Estudiante | Ventana, máximo y sección histórica | Backend decide elegibilidad; no adivinar disponibilidad | attempt-start, attempt-window | Verificado |
| Intentos | Estudiante | Guardar vacío, submit, cancelación y terminales | Confirmación explícita; no perder respuestas ni duplicar | attempt-ui, attempt-submit, attempt-cancel | Verificado |
| Intentos | Ayudante/docente | Revisión y pauta por capacidad | Ayudante sin corrección ni escritura | tracking-attempts, attempt-permissions | Verificado |
| Notas propias | Estudiante | Sin notas, promedio null, ponderación cero | Vacío único; pendiente distinto de cero | gradebook-student-ui, gradebook-student-api | Corregido |
| Notas propias | Estudiante | Publicación parcial/completa | Solo notas propias publicadas y promedio del backend | gradebook-read, gradebook-student-ui | Verificado |
| Libro | Staff | Secciones históricas y cambio de filtro | Filas separadas; cursor/selección reiniciados | gradebook-book-ui | Verificado |
| Publicación | Docente | Selección vacía o rectángulo incompleto | No habilitar confirmación ni enviar POST | gradebook-publication-ui | Corregido |
| Publicación | Docente | Doble clic, timeout, 5xx, replay | Misma clave/cuerpo; un recibo y auditoría atómica | gradebook-publication-ui, gradebook-concurrency | Verificado |
| Publicación | Docente | 409 definitivo | Liberar filtros y corregir selección explícitamente | gradebook-publication-ui | Corregido |
| Ponderaciones | Admin+teacher+owner | Freeze global, otra página, carrera | Comprobar al abrir; bloquear edición y resolver 409 | gradebook-publication-ui, gradebook-weights | Verificado |
| Auditoría | Docente/owner | Acción, tipo, UUID, fechas y limpiar | Filtros controlados, errores por campo y cursor inicial | audit-ui, audit-api | Corregido |
| Auditoría | Docente | 30 de febrero, año cero y rango invertido | Rechazo local sin normalización silenciosa | audit-api, audit-ui | Corregido |
| Auditoría | Docente | Falla la siguiente página | Conservar página autorizada; no reutilizar tras cambiar filtros | audit-ui | Corregido |
| Auditoría | Docente/owner | Antes/después y dato sensible | Texto escapado; snapshots sanitizados; UTC disponible | audit-ui, gradebook-audit-read | Verificado |
| Interacción | Todos | Botón deshabilitado | Cursor sin espera; indicador solo durante operación | Navegador, auth.css | Corregido |
| Avisos | Todos | Éxitos acumulados, repetidos y error posterior | Éxito desaparece a los 5 s; preservar foco, borradores y errores | transient-feedback | Corregido |
| Avisos | Docente/estudiante | Publicación, pesos y guardado de respuestas | Aviso temporal; recibos, bloqueos e incertidumbre persistentes | transient-feedback | Corregido |
| Interacción | Docente | Revisión modal, Escape y cierre | Foco seguro en Volver; retorno al disparador | gradebook-publication-ui, navegador | Corregido |
| Responsive | Todos | 375 px, ambos temas, tabla ancha | Sin desbordamiento global; scroll local de tabla | Navegador y capturas | Verificado |
| Runtime | Operador | Otro servidor en otra base | Apagado comprueba solo conexiones de su base | readiness | Corregido en test |
| Catálogo | Consumidores | Se implementa el último endpoint pendiente | Clasificar `/users` como implementada, sin exigir pendientes | scripts/api-catalog.test.mjs | Corregido |

Escala académica vigente: nota 1–7; el cero válido aplica a puntaje/ponderación.
Las pruebas de integración usan PostgreSQL 17 desechable y credenciales runtime sin
bypass RLS. No se alteraron datos de producción. Las adiciones autorizadas a
Docker local se describen en [el inventario de demo](demo-data.md).
