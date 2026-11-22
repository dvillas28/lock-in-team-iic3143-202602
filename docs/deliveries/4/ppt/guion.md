# Guion de exposición y demo

Duración objetivo de 30 minutos. Los tramos son presupuestos para el presentador. Las mediciones de ejecución se registran en el [ensayo](../cierre/ensayo-remoto.md). Mantener abiertas las sesiones privadas por rol en contextos separados, en UC y UTFSM. Reservar cursos nuevos por institución y dos evaluaciones por curso. Abrir health y ready antes de exponer. Escalonar los ingresos para evitar el límite de autenticación. Mantener a mano el [respaldo local](../cierre/respaldo-local.md).

| Minuto | Diapositiva | Qué decir o hacer y qué debe verse |
| --- | --- | --- |
| 0–1 | 1 | Presentar la pregunta del MVP. ¿Puede un estudiante recibir su nota sin ver resultados ajenos ni borradores? |
| 1–3 | 2–3 | Seguir el JWT hasta la transacción con RLS. Mostrar dónde se unen usuario, institución y sección. Seguir un quiz hasta la nota y su revisión. |
| 3–5 | 4 | Contar qué cambió en E4: auditamos con SonarQube y Trivy, corregimos los hallazgos y separamos sus gates del check obligatorio (#257). Explicar cómo se complementan integración con PostgreSQL real, pruebas frontend y E2E en tres navegadores. Contrastar la auditoría manual con el gate D sobre código nuevo en #329. Mencionar la exclusión de dependencias de desarrollo de Trivy. |
| 5–6 | 5 | Leer medianas del login. Explicar por qué se instrumentó el cambio de ruta dentro de la sesión y por qué recargar sesga la medición. |
| 6–8 | 6 | Mostrar compromiso cumplido y lo que agregamos fuera de él. Explicar cómo se validó el archivo y qué quedó fuera por decisión. Consultar esfuerzo por responsable en el anexo de gestión. |
| 8–10 | 7–8 | Lámina 7: recorte de alcance, vertical end-to-end y cambio de sharding a RLS. Lámina 8: proveedor único, CI acoplado, onboarding postergado y bot revisor. En cada punto decir decisión, efecto y qué haríamos distinto. |
| 10–13 | 9 · acceso y estructura | En UC y UTFSM, abrir como admin; crear curso nuevo y sección, asignar docente, ayudante y estudiante de prueba. Abrir el curso con cada rol y comparar acciones disponibles. |
| 13–16 | 9 · material | Docente crea módulo, ordena recursos, añade Markdown y TXT, publica. Estudiante abre lector y descarga TXT. Alternar las dos ventanas institucionales. |
| 16–20 | 9 · quiz | Docente publica dos quizzes de una pregunta. Estudiante guarda y cancela el primero; comprobar ausencia de nota. En el segundo responde y envía. Docente muestra la corrección; estudiante sigue sin ver la nota. |
| 20–23 | 9 · tarea | Docente crea tarea y plazo; estudiante la encuentra en calendario, adjunta archivo y confirma entrega. Docente abre archivo y califica la entrega de ensayo. |
| 23–26 | 9 · notas | Configurar grupos y pesos, comprobar libro y lectura del ayudante. Docente publica la selección. Estudiante consulta nota y promedio. Abrir auditoría y ubicar publicación por curso. |
| 26–28 | 9 · perfiles y altas | Entrar en perfil propio; mostrar edición y foto con cuenta descartable. En administración previsualizar CSV sintético. Para foto y clave usar una cuenta descartable del respaldo local. El envío y la activación por correo requieren un buzón autorizado. |
| 28–29 | 9 · aislamiento | En UTFSM consultar el curso propio. Abrir referencia UC desde el contexto UTFSM y mostrar el rechazo sin datos ajenos. |
| 29–30 | 9 · cierre | Volver al resultado del estudiante y abrir el [repositorio en el corte funcional](https://github.com/dvillas28/lock-in-team-iic3143-202602/tree/7d4b666). Mostrar dónde verificar una afirmación y declarar los pasos pendientes. |

Los anexos 10–16 quedan disponibles para preguntas. Ante una caída, cambiar al respaldo e identificar el entorno en voz alta. Si un paso solo puede mostrarse mediante captura, declararlo y registrarlo como pendiente en vivo. Crear un identificador nuevo por repetición para preservar intentos, notas y auditoría.

## Notas para contar la historia con las imágenes

- **Arquitectura.** Arrancar desde una descarga que el público acaba de ver en la lámina. El dominio elige UC o UTFSM; la API valida el JWT y comprueba pertenencia y sección antes de entregar bytes. Neon guarda los metadatos y aplica RLS. S3 conserva el objeto privado. Resend interviene cuando se envía una invitación. Seguir las flechas entre el navegador, los dos servicios de Render y los proveedores externos. [Arquitectura final](../arquitectura.md)
- **Datos.** Seguir un solo ejemplo: la matrícula habilita al estudiante en una sección; la entrega de un quiz produce una nota asociada al ítem del libro. Cambiar de vista al estudiante antes de publicarla explica por qué la corrección y la publicación son dos operaciones. [Modelo y cardinalidades](../modelo-datos.md)
- **Calidad.** Lo nuevo de E4 es el ciclo auditar, corregir y separar gates. El número 0 corresponde a un análisis manual identificado. La PR de integración tenía un gate distinto y falló por mantenibilidad del código nuevo. Explicar qué ejercicios cubren los tests y por qué el equipo conserva los dos resultados. [Informes y alcances](../cierre/calidad-para-ppt.md)
- **Plan y análisis del proceso.** El TXT que vuelve idéntico en los dos tenants es la evidencia de que P2 entró. En las láminas 7–8 hilar el relato: recortar estuvo bien, pero no dejamos diseñado cómo volver a incorporar lo administrativo. En la lámina 8, cerrar cada punto con lo que haríamos distinto. [Guía para la reunión](../cierre/retrospectiva.md)
