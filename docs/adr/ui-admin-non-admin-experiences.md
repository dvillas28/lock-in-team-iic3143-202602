# Dos experiencias de UI: admin y no admin

Fecha: 2026-10-06

## Estado

Aceptado para los mockups de Issue #22 por instrucción del usuario.
La representación de privilegios en dominio, persistencia y API queda pendiente;
esta decisión define la UI propuesta, no cambia autorización implementada.

## Contexto

El alcance describe dos experiencias docente/estudiante y tres roles de sección:
`teacher`, `assistant`, `student`. El modelo actual hace de `teacher` un rol
administrativo. La simplificación solicitada distingue dos experiencias
**admin/no admin**, permite un docente sin administración y agrupa estudiante y
ayudante en la experiencia no admin. Agrupar pantallas por rol impedía mostrar
esa independencia.

## Decisión para UI/UX

- El rol académico y la administración del curso son dimensiones distintas.
  Admin representa una capacidad sobre el curso, sin agregar administrador
  institucional, coordinador ni otro valor al enum académico.
- Hay dos inicios/navegaciones académicas: admin (07) y no admin (03).
  Login, institución y galería son acceso compartido.
- El docente puede usar cualquiera de las dos experiencias. Carla conserva
  identidad y secciones 1/2 en ambas. Estudiante y ayudante usan no admin.
- No admin comparte estructura y material publicado. Las consultas adicionales
  respetan el rol: estudiante ve sus quizzes/notas; docente y ayudante consultan
  resultados e intentos de sus secciones. El ayudante de ejemplo solo ve sección 2.
- Las consultas no admin reutilizan libro/intentos sin controles de escritura.
  Una página extra de ayudante no constituye una tercera experiencia.
- El prototipo usa `role=teacher|assistant|student` y
  `experience=admin|non-admin` como perfiles de ejemplo. Los enlaces preservan
  el perfil; elegir otro escenario no asigna privilegios reales. Un parámetro
  admin con estudiante/ayudante conserva la experiencia no admin.

## Matriz de acciones propuesta en el prototipo

| Acción | Docente admin | Docente no admin | Ayudante no admin | Estudiante no admin |
| --- | --- | --- | --- | --- |
| Cursos y material publicado | Sí, dentro de su alcance | Sí, secciones 1/2 | Sí, sección 2 | Sí, inscripción propia |
| Configurar curso, secciones y roles | Sí | No | No | No |
| Editar/publicar módulos, material y quizzes; acceder a pauta | Sí | No | No | No |
| Consultar libro e intentos de estudiantes | Sí, secciones 1/2 | Solo lectura, secciones 1/2 | Solo lectura, sección 2 | No |
| Ponderar/publicar notas y cancelar como personal docente | Sí | No | No | No |
| Consultar auditoría | Sí | No | No | No |
| Rendir/cancelar intento propio y ver notas propias publicadas | No en este perfil docente | No en este perfil docente | No en este perfil ayudante | Sí, si no accede a pauta |

Esta matriz mantiene el flujo estudiantil separado de seguimiento académico.
Tener simultáneamente otro Enrollment estudiantil no elimina la regla de acceso
incompatible a pauta; las combinaciones completas de roles no se implementan en
esta demo.

## Dependencia de implementación

Antes de implementar esta separación se debe alinear CU/RF, modelo y contrato:

1. Definir cómo se representa, concede y revoca administración del curso y su
   alcance, sin inferirla únicamente de `teacher` ni de parámetros de URL.
2. Reconciliar CU-04/05/06/07/10/11/13/14/15 y RF12/RF28 con la matriz acordada;
   hoy describen permisos ligados al rol docente y consulta de material estudiantil. Aclarar también el alcance
   docente por curso/sección pendiente en CU-03/CU-16.
3. Aplicar las capacidades en API, con membership institucional y roles/alcance
   vigentes, conservación de historia y auditoría de concesión/revocación.
4. Probar docente con/sin administración, ayudante/estudiante sin escritura,
   acceso directo, revocación y aislamiento entre instituciones/secciones.

Esta rama no modifica modelos de datos, OpenAPI, backend ni frontend de producto.
Ocultar controles y bloquear visualmente una ruta en HTML no constituye seguridad.
El documento [de casos de uso](../deliveries/2/03-use-cases-and-requirements.md#revisión-de-mockups-por-rol--issue-22)
y el [inventario](../../mockups/README.md) registran qué metas cubren las pantallas
sin presentar esta dependencia como resuelta.
