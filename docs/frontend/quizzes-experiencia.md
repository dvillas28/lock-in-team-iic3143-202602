# Interfaz de quizzes

Fecha: 2026-10-28. Rama: `feat/quizzes-experiencia-usuario`.
Alcance: listado, creación, detalle, autoría y presentación de publicación.
Continúa la misión `20261021-141351_frontend-autoria-quizzes` (CU-07,
RF17–18/25–27), con acceso a rendición existente (CU-08/09).

## Organización visual

- Cabecera de curso y pestañas compartidas, usando tokens y componentes existentes.
- Listado con tarjetas completas como enlaces, estado, destinatarios, cierre e intentos.
- Filtros locales combinables por título, estado y destinatarios; vacíos diferenciados.
- Creación desplegable al principio del listado; se conserva el recibo confirmado.
- La creación permite agregar, reordenar y validar preguntas antes del primer guardado,
  con el mismo editor de autoría; sigue admitiendo borradores sin preguntas.
- Detalle con instrucciones, fechas locales, intentos y acciones agrupadas.
- Editor con configuración y preguntas en tarjetas, alternativas compactas e IDs internos.
- Guardado manual visible durante el desplazamiento, con estado de cambios pendientes.
- Publicación confirma destino, horario e irreversibilidad; publicado sigue inmutable.
- Recuperación de intento conocido desplegable y visible para participantes estudiantes.

## Validaciones y casos borde

La API sigue siendo la autoridad de permisos, disponibilidad y registros académicos.
No hay endpoints, migraciones, dependencias ni cambios de permisos nuevos.

- Título obligatorio y de hasta 200 caracteres Unicode; NUL rechazado.
- Intentos: entero positivo hasta int32; vacío significa ilimitados.
- Puntajes: positivos, hasta dos decimales y dentro del límite contractual.
- Rechazo de exponentes, coerciones hexadecimales, números incompletos y valores duplicados.
- Fechas locales completas y reales; se rechazan normalizaciones de días y saltos DST.
- Una fecha intacta conserva zona y microsegundos del valor recibido.
- Cierre posterior a apertura; fechas opcionales vacías se envían como nulos.
- Al menos dos alternativas, IDs distintos y exactamente una correcta por pregunta.
- IDs existentes y selecciones se conservan al reordenar; nuevas alternativas evitan colisiones.
- Borrador vacío permitido; publicación requiere al menos una pregunta guardada.
- Límite de 4096 bytes aplicado al JSON UTF-8 que se enviará, incluidos escapes.
- Errores conservan entradas y enfocan el control, con etiqueta y descripción accesibles.
- Una creación confirmada no se reclasifica como incierta si falla actualizar el listado.

## Integridad y acceso

Se mantienen `canAuthor`, destinos autorizados y scopes por sesión/institución/curso.
Listado y detalle usan la proyección segura; la pauta solo se solicita al abrir
autoría autorizada y sus enlaces siguen sin prefetch. Las operaciones inciertas
permanecen bloqueadas; publicar usa la versión guardada, no cambios pendientes.
Los tests existentes cubren revocación, cambios de institución, respuestas tardías,
conflictos, doble envío e inmutabilidad. Los datos privados permanecen en memoria.

## Verificación

- Suite completa: 343 pruebas aprobadas, incluidos 10 casos nuevos de formulario/interfaz.
- Ampliación de creación con preguntas: 48 pruebas de regresión aprobadas, con cuatro
  casos nuevos para envío/reordenamiento, validación, red incierta y cambio de institución.
- TypeScript, ESLint, `api:check` y build de producción: aprobados.
- Cobertura global: 95,05 % líneas y 88,47 % ramas; umbrales de 80 % aprobados.
- Chrome: escritorio 1440 px y móvil 375 px; listado, detalle, editor y estado vacío.
- Perfiles docente y estudiante; tema claro y listado en tema oscuro.
- Sin desbordamiento horizontal de página en quizzes ni errores de JavaScript observados.
- 11 comprobaciones de navegador: formatos inválidos, creación, edición, reordenamiento,
  respuesta correcta, guardado visible y ciclo de foco/Escape/publicación del diálogo.

La revisión visual inicial usó respuestas API simuladas. Posteriormente se completó
la [validación con API y PostgreSQL reales](../qa/quizzes-real-backend/README.md),
incluyendo tres perfiles, persistencia, auditoría y rechazo sin contexto de tenant.
Allí se documenta también la corrección de fechas detectada en integración.
No se realizó una auditoría WCAG completa.
Para repetir pruebas automatizadas: `pnpm --dir frontend test`;
para cobertura: `pnpm --dir frontend test:coverage`.
La revisión de acceso e integridad siguió la skill local `lms-reviewer`.
