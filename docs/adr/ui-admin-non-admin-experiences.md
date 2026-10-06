# Dos experiencias de UI: admin y no admin

Fecha: 2026-10-06

## Estado

Aceptado para los mockups de Issue #22. Esta versión incorpora la aclaración del
usuario: **docente no admin no significa docente de solo lectura**. Ambos docentes
gestionan contenido y actividad académica; admin amplía el alcance a diferentes
secciones. Dominio/persistencia/API aún deben representar y validar ese privilegio.

## Decisión de UI/UX

- El rol académico y el alcance administrativo son dimensiones distintas.
  Admin es una capacidad del curso, sin agregar un administrador institucional,
  coordinador ni valor nuevo al enum académico.
- Hay dos inicios: admin (07) y no admin (03). El inicio no admin es compartido
  por estudiante, ayudante y docente. Sus acciones se adaptan al rol.
- Carla es docente de sección 2. Como no admin gestiona esa sección; como admin
  puede gestionar todas las secciones del curso. Cambiar el ejemplo no cambia
  su identidad ni concede permisos reales.
- **Módulos y materiales permanecen compartidos por curso**, confirmado por el
  usuario. Ambos docentes pueden crearlos, editar, ordenar y publicar; el cambio
  afecta a las secciones que comparten el contenido. No se duplican por sección.
- Participantes, destinatarios de quizzes, intentos, publicación de notas y
  consulta de eventos de sección respetan el alcance: sección 2 para docente
  no admin; diferentes secciones para admin. El ayudante conserva consulta de
  sección 2, sin escritura ni pauta.
- Crear secciones, configurar metadatos globales y modificar ponderaciones
  comunes del curso son acciones de administración global. El docente no admin
  consulta los pesos y publica notas de su sección usando esa política común.
- Los parámetros `role=teacher|assistant|student` y
  `experience=admin|non-admin` seleccionan perfiles de demostración. Los enlaces
  conservan el perfil. Ayudante/estudiante siguen no admin si la URL pide admin.

## Matriz propuesta para los mockups

| Acción | Docente admin | Docente no admin | Ayudante | Estudiante |
| --- | --- | --- | --- | --- |
| Gestionar módulos y material compartido | Sí | Sí | No; consulta publicados | Consulta publicados |
| Gestionar participantes/roles de sección | Todas las secciones | Solo sección 2 | No | No |
| Crear secciones y configurar el curso | Sí | No | No | No |
| Crear/publicar quiz y consultar pauta | Todas o sección elegida | Destinatarios de sección 2 | No | No |
| Configurar ponderaciones comunes | Sí | Consulta | No | No |
| Consultar resultados/intentos de estudiantes | Todas las secciones | Solo sección 2 | Solo sección 2, lectura | No |
| Publicar notas/cancelar como docente | Dentro de todo su alcance | Solo sección 2 | No | No |
| Consultar eventos académicos de sección | Todas | Solo sección 2 | No | No |
| Rendir/cancelar intento propio y ver notas propias | No en perfil docente | No en perfil docente | No en perfil ayudante | Sí, sin acceso incompatible a pauta |

El rol docente sigue habilitando autoría incluso sin admin; acceso a pauta
mantiene la incompatibilidad con rendir ese quiz como estudiante. Combinaciones
completas de múltiples Enrollments no se implementan en estos perfiles estáticos.

## Publicación por módulo e ítem

El editor 12 coloca un botón de publicación en **cada cabecera de módulo y cada
fila de material**, inspirado en el check de la referencia Canvas suministrada.
Usa Lucide `circle-check` verde y texto «Publicado»; sin publicar usa `circle` y
texto «Sin publicar». `aria-label`, `aria-pressed`, foco visible y avisos de estado
permiten operarlo por teclado sin depender del color.

La publicación del módulo y de cada ítem es independiente. Un ítem puede
conservar su check verde bajo un módulo sin publicar, pero su visibilidad
estudiantil requiere ambas publicaciones. Ocultar un módulo no borra el estado
de sus ítems ni su historial. Los ítems nuevos se guardan sin publicar y reciben
su propio control; reordenar y colapsar no altera publicación. No se importan
otras funciones de Canvas a este MVP. El estado es local a la página de ejemplo.

## Dependencia de implementación

Esta rama cambia UI y documentación, sin modificar esquemas, OpenAPI o código de
producto. Antes de implementar:

1. Representar y auditar concesión/revocación del alcance admin del curso.
   No inferirlo solo de `teacher` ni de parámetros de URL.
2. Resolver la ambigüedad curso/sección de CU-03/CU-16 y alinear los permisos de
   CU-04/07/10/11/13/15 y RF12/RF28/RF29 con la matriz acordada. Conservar el
   contenido compartido de CU-05/06/14 y el bloqueo de pauta/notas publicadas.
3. Validar membership institucional, curso, rol y sección histórica en API;
   aplicar filtros y escritura dentro de la transacción con auditoría.
4. Probar docente no admin con escritura propia y rechazo de otra sección,
   admin con alcance múltiple, ayudante sin escritura, revocación y aislamiento.

Los controles HTML son una demostración y no implementan seguridad. El
[mapeo de CU](../deliveries/2/03-use-cases-and-requirements.md#revisión-de-mockups-por-rol--issue-22)
y el [inventario](../../mockups/README.md) registran la cobertura y estas limitaciones.
