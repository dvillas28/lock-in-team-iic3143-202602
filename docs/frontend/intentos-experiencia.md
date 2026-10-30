# Interfaz de intentos de quizzes

Fecha: 2026-10-30. Rama: `feat/quizzes-experiencia-usuario`.
Continúa el [ajuste visual de quizzes](quizzes-experiencia.md) para rendición,
listado docente y revisión (CU-08/09/15/16).

## Presentación

- Cabecera de curso y navegación compartidas mediante `QuizWorkspace`.
- Resumen con número de intento, estado en español, instrucciones y fechas locales.
- Identificador, sección histórica e inicio disponibles en un detalle desplegable.
- Preguntas numeradas dentro de tarjetas, alternativas completas seleccionables
  y estados de selección/foco visibles en ambos temas.
- Panel de avance del borrador con accesos a preguntas; no representa un guardado.
- Guardado manual con aviso de cambios, vaciado confirmado y barra de acciones.
- Envío y cancelación en bloques separados, con confirmación antes de actuar.
- Recibos y cancelaciones confirmadas con fecha legible y datos de referencia.
- Listado con filtros etiquetados, estados semánticos, tabla y paginación existentes.
- Revisión con resultado autorizado y corrección únicamente para el docente.
- Disposición en dos columnas en escritorio y una columna en móvil.
- Colores, tipografía, botones y superficies reutilizan los tokens y estilos comunes.

## Acceso e integridad

Revisión con las skills locales `lms-ui-ux` y `lms-reviewer`.
No cambia endpoints, DB, dependencias del producto, permisos ni operaciones.
Se conservan scopes institucionales, sesión en memoria y proyecciones autorizadas.
El estudiante no recibe nota, porcentaje ni corrección en el recibo.
El ayudante mantiene lectura sin pauta/corrección ni cancelación.

El avance cuenta selecciones locales; guardar sigue siendo explícito.
Guardar, enviar y cancelar preservan sus bloqueos, claves y recuperación existentes.
Un guardado incierto no se desbloquea por consultar el estado.
Recargar pierde borrador y recuperación pendientes; cerrar no envía ni cancela.
Los diálogos conservan foco inicial en Volver, Escape y retorno al botón de origen.

## Verificación

- Suite completa del frontend: 349 pruebas aprobadas, sin omisiones.
- TypeScript, ESLint, build de producción y `git diff --check`: aprobados.
- Regresiones de guardado, vaciado, envío incierto, cancelación, terminales,
  cambio de contexto y revisión por rol cubiertas por las suites existentes.
- Chromium sobre frontend, API NestJS y PostgreSQL locales reales.
- Escritorio 1440×1000 y móvil 375×812; claro/oscuro y sin desborde de página móvil.
- Selección actualiza avance; guardar confirma persistencia con la API real.
- Diálogo de envío: foco inicial y Escape con retorno al botón comprobados.
- Docente: listado y revisión de corrección. Ayudante: corrección y cancelación ausentes.
- Sin errores JavaScript observados en esos recorridos.

Evidencia y capturas: [validación de intentos](../qa/intentos-experiencia/README.md).
Entorno y cuentas locales: [guía existente](../qa/quizzes-real-backend/README.md).
No equivale a una auditoría WCAG completa ni verifica el despliegue remoto.
