# Recorrido de demostración de AcademiX

Requisito: `verify` exitoso según [operación Render](DEMO_SEED_RENDER.md).
Todos los nombres, contenidos y resultados son ficticios; no son datos oficiales.
Contraseñas: solicitar al equipo fuera del repositorio. No grabarlas en capturas.
Usar sesiones separadas o cerrar sesión entre roles. El login tiene límite de cinco
intentos por minuto/IP en cada instancia; espaciar accesos durante la presentación.

## Accesos y datos por institución

| Institución | Login | Curso principal (101) | Taller editable (201) | Curso sin evaluaciones (301) |
| --- | --- | --- | --- | --- |
| UC | [Acceder UC](https://uc.academix.dvillasc.me/login) | Desarrollo de Software | Programación y Algoritmos | Fundamentos de Datos |
| UTFSM | [Acceder UTFSM](https://utfsm.academix.dvillasc.me/login) | Sistemas Distribuidos | Estructuras de Datos | Redes de Computadores |

Todos llevan «· Demostración», códigos `DEMO-UC-101/201/301` o `DEMO-UTFSM-101/201/301`,
período `DEMO-2026-2`. Abrir desde `/courses`; sustituir `C`, `M`, `R`, `Q`, `A` en las
rutas por IDs obtenidos desde los enlaces de la aplicación, sin inventarlos.
El principal tiene secciones 1/2; Teacher, Assistant y Student están solo en 1.
Los otros cursos tienen sección 1. Admin es propietario y Teacher de las secciones nuevas.

## UC: cinco roles

| Cuenta | Página / datos esperados | Acción y resultado |
| --- | --- | --- |
| `superadmin.uc@academix.example` | `/courses`, sin cursos académicos asignados | Confirmar contexto UC; sus permisos institucionales no implican acceso a cursos ajenos |
| `admin.uc@academix.example` | `/courses`, tres cursos UC | Abrir principal → `/courses/C/sections`; ver secciones 1/2, editar capacidad de 2, guardar y comprobar cambio |
| `teacher.uc@academix.example` | Principal → módulos, quizzes, libro; sección 1 | Publicar material borrador, leer intentos y publicar notas dentro de sección 1 |
| `assistant.uc@academix.example` | Principal → `/courses/C/gradebook` y lista de intentos | Consultar filas y notas de sección 1; abrir intento sin pauta ni puntos corregidos por respuesta; sin publicación |
| `student.uc@academix.example` | Tres cursos UC; principal con dos módulos visibles | Leer apuntes, rendir práctica y revisar notas publicadas propias en `/courses/C/grades` |

UC tiene ocho estudiantes ficticios para búsquedas e inscripciones; el principal
tiene siete estudiantes activos en sección 1 y dos en sección 2.

## UTFSM: cinco roles

| Cuenta | Página / datos esperados | Acción y resultado |
| --- | --- | --- |
| `superadmin.utfsm@academix.example` | `/courses`, sin participación académica | Confirmar contexto UTFSM y sus permisos institucionales; cursos ajenos siguen restringidos |
| `admin.utfsm@academix.example` | Tres cursos UTFSM | Abrir Sistemas Distribuidos → secciones; administrar estructura propia; editar ponderaciones del taller |
| `teacher.utfsm@academix.example` | Sistemas Distribuidos, sección 1 | Publicar ejercicios de comunicación entre procesos y notas de su sección |
| `assistant.utfsm@academix.example` | Libro e intentos de sección 1 | Revisar resultados y participantes; no puede editar contenido ni publicar notas |
| `student.utfsm@academix.example` | Tres cursos UTFSM | Leer módulos, iniciar práctica, enviar respuestas y consultar solo notas publicadas |

UTFSM tiene seis estudiantes ficticios; el principal tiene cinco estudiantes en
sección 1 y dos en sección 2. No hay estudiantes ficticios compartidos entre tenants.

## Superadmin: función institucional disponible por API

No existe pantalla específica de memberships. Con la sesión autenticada del Superadmin
y el cliente API autorizado del equipo, consultar `GET /api/v1/institution/uc/memberships`
o `.../utfsm/memberships`; paginar si corresponde. Resultado: miembros del tenant propio.
`PUT .../memberships/{membershipId}/course-admin`, cuerpo `{"isAdmin":true|false}`,
permite delegar/revocar administración. Demostrar únicamente sobre un miembro ficticio
seleccionado conscientemente, y volver al flag inicial al terminar. No cambiar permisos
de las cuentas principales como parte del recorrido habitual ni publicar tokens.
No hay CRUD general de usuarios. El Superadmin también puede crear un curso si tiene
`is_admin`, pero esta guía no requiere hacerlo para recorrer el material precargado.

## Escenario 1: Teacher publica y Student lee (ambas instituciones)

1. Teacher correspondiente: abrir principal → `/courses/C/modules`.
   Ver tres módulos, incluido uno borrador, y ejercicios borradores dentro del primero.
2. En el primer módulo publicado, publicar «Ejercicios». El estado cambia a publicado.
3. Student de la misma institución: abrir ese módulo y el recurso
   `/courses/C/modules/M/materials/R`; ahora puede leerlo y usar el lector/PDF derivado.
4. El tercer módulo sigue oculto para Student aunque contenga un ítem publicado.
   Assistant tampoco puede editarlo. Teacher puede reordenar módulos y ocultar/publicar.
5. Admin: `/courses/C/audit` muestra los cambios de material. Teacher ve eventos de
   su sección (intentos/notas, escenario 2), no eventos comunes del curso sin sección.
   La carga inicial se registra en el ledger operativo, no simula autores.

## Escenario 2: rendición, corrección, publicación y notas

Realizar primero en el **taller 201**, con el mismo conjunto de cuentas de cada tenant.

1. Admin: `/courses/C/gradebook`, revisar peso 100 % de «Práctica de publicación».
   No hay notas publicadas; las ponderaciones pueden editarse mientras sumen 100 %.
2. Teacher: `/courses/C/quizzes`; abrir «Quiz en borrador» → `/courses/C/quizzes/Q/authoring`.
   Editar preguntas o instrucciones y publicar. Student ahora lo ve. El nuevo ítem pesa 0 %;
   Admin puede distribuir, por ejemplo, 50/50 **antes de publicar cualquier nota**.
3. Student: abrir «Práctica de publicación» en `/courses/C/quizzes/Q`, iniciar intento;
   pasa a `/attempts/A`. Responder, guardar y enviar. Se corrige automáticamente.
   La pantalla confirma recepción; no muestra una nota todavía sin publicar.
4. Teacher o Assistant: `/courses/C/quizzes/Q/attempts`; revisar el intento corregido.
   Teacher ve la pauta; Assistant ve una representación restringida.
5. Teacher: `/courses/C/gradebook`, seleccionar el ítem, sección 1 y Student principal;
   confirmar publicación. Se conserva recibo idempotente y aparecen eventos de auditoría.
6. Student: `/courses/C/grades`; ahora ve su nota (7,0 si ambas respuestas son «a»),
   ponderación y promedio calculados por backend. Admin ve los pesos congelados.
7. Admin: revisar estructura y auditoría del taller, con sus permisos efectivos.

Publicar el borrador **antes** de las notas: después se bloquean nuevos ítems.
Las operaciones del presentador son duraderas; repetir la seed no revierte el escenario.

## Escenario 3: estados precargados y permisos

- Student, principal 101, `/courses/C/grades`: una nota 7,0, peso publicado 30 % y
  promedio parcial. «Control por publicar notas» ya está corregido y sigue oculto en sus notas.
- Teacher, mismo libro: resultados variados 3,0/4,0/7,0; puede publicar el segundo control.
  Las ponderaciones 30/30/20/10/10 están congeladas por la publicación inicial.
- Teacher/Assistant, «Práctica abierta» → lista de intentos: un ficticio en curso y otro
  cancelado. Student principal no tiene intento activo ahí y puede iniciar uno propio.
- Student, principal → «Control futuro»: fecha de apertura aproximadamente un año después
  de la carga; iniciar falla. «Control cerrado»: venció siete días antes; iniciar falla.
- Teacher/Admin, taller → participantes: existe matrícula inactiva; pueden inscribir un
  ficticio elegible y cambiar/activar matrículas siguiendo las reglas e historial reales.
- Student, curso 301: módulos disponibles y evaluaciones/notas vacías, sin promedio inventado.
- Teacher no administra sección 2; Assistant no publica ni edita; Student no ve participantes,
  pauta, libro ajeno ni auditoría. Admin no es un administrador global de cursos ajenos.

## Escenario 4: aislamiento UC / UTFSM

1. Con Student UC, comprobar que `/courses` solo contiene códigos `DEMO-UC-*`.
2. Copiar una URL de curso UTFSM y abrirla con esa sesión en el origen UC: acceso denegado.
   En API, IDs UTFSM bajo `/api/v1/institution/uc/...` responden 404.
3. Repetir al revés con Teacher UTFSM y un curso UC; su acceso no debe ampliarse.
4. Cada cuenta solo tiene membresía demo en su institución; no transferir tokens entre orígenes.
   Si existen memberships adicionales previas, conservarlas y evaluar el alcance real de esa cuenta.

La integración automatizada verifica estos rechazos con los cinco roles y consumidores
frontend reales; el equipo debe completar el recorrido visual tras desplegar.
Ver [auditoría y límites](DEMO_SEED_AUDIT.md) para funciones ausentes y conteos completos.
