# Cobertura y evidencia del frontend

Fecha: 2026-10-21. Misiones M1–M6 según [índice](README.md). Responsables FE: JC/MA.
Clasificación documental: incluida (I), reutilizada (R), parcial (P), excluida (E).
I no significa implementada. Fuente: [backlog](../deliveries/2/08-work-plan-detail/08-work-plan-detail.md).

## Casos de uso

| CU | Misión | Clasificación y resultado |
| --- | --- | --- |
| CU-01 | M1 | P: selector existente; navegación entre dominios |
| CU-02 | M1/M2 | P: acceso existente; rutas limpias y shell contextual |
| CU-03 | M2 | I: cursos y secciones visibles |
| CU-04 | M2 | I: participantes, roles y secciones |
| CU-05 | M3 | I: edición/publicación markdown |
| CU-06 | M3 | P: lectura markdown; PDF/binarios E |
| CU-07 | M4 | I: autoría/publicación de quizzes |
| CU-08 | M5 | I: inicio/guardado/reanudación |
| CU-09 | M5 | I: envío/recibo; cálculo backend R |
| CU-10 | M6 | I: ponderaciones |
| CU-11 | M6 | I: publicación explícita |
| CU-12 | M6 | I: notas propias y promedio |
| CU-13 | M6 | I: auditoría consultable |
| CU-14 | M3 | I: organización de módulos |
| CU-15 | M5 | I: cancelación propia/docente; M6 enlaza acción |
| CU-16 | M6 | I: libro docente y revisión de intentos |

## Backlog frontend

| Tarjeta | Misión | Clasificación y alcance |
| --- | --- | --- |
| FE-01 | M1 | R: cliente OpenAPI y errores existentes |
| FE-02 | M1 | P: reemplazar slug visible por dominio; conservar estados |
| FE-03 | M1 | P: reutilizar login/sesión #124 y adaptar navegación |
| FE-04 | M1 | P: selector existente pasa a navegación entre dominios |
| FE-05 | M2 | I: shell/roles contextuales |
| FE-06 | M2 | I: cursos/detalle/secciones |
| FE-07 | M2 | I: gestión según admin dueño/teacher, sin rol coordinador |
| FE-08 | M3 | I: organizador/publicación |
| FE-09 | M3 | I: editor markdown |
| FE-10 | M3 | I: consulta publicada |
| FE-11 | M4 | I: autoría según permisos reales |
| FE-12 | M5 | I: rendición sin pauta |
| FE-13 | M5 | I: cancelación, incluida entrada desde M6 |
| FE-14 | M5 | I: envío/confirmación |
| FE-15 | M6 | I: pesos |
| FE-16 | M6 | I: publicación |
| FE-17 | M6 | I: notas propias |
| FE-18 | M6 | I: libro docente |
| FE-19 | M6 | I: auditoría |
| FE-20 | M1–M6 | I: accesibilidad/tema/responsive transversal; M6 consolida |
| FE-21 | Ninguna | E: archivos binarios requieren otra misión |

## Inventario de 16 vistas

Fuente: [mockups](../../mockups/README.md); números corresponden a sus archivos HTML.

| Vista | Responsable | Clasificación y acciones |
| --- | --- | --- |
| 01 landing | M1 | P: entrada a login; no rediseño comercial |
| 02 login | M1 | P: reutilizar formulario real y adaptar destino |
| 03 mis cursos | M2 | I: inicio compartido por permisos |
| 04 curso/módulos | M2/M3 | P: cabecera M2, lectura markdown M3; PDF E |
| 05 quizzes | M5/M6 | I: acceso a intento M5, enlace a notas M6 |
| 06 notas propias | M6 | I: publicadas/promedio |
| 07 administrar cursos | M2 | I: cursos propios y configuración |
| 08 libro de notas | M6 | I: consulta/pesos/publicación por actor |
| 09 lector PDF | Ninguna | E: sin binarios en MVP markdown |
| 10 instituciones | M1 | P: adaptar selector a cambio de dominio |
| 11 secciones/roles | M2 | I: participantes/secciones |
| 12 editor contenido | M3 | I: módulos y material |
| 13 autoría quiz | M4 | I: preguntas/configuración/pauta |
| 14 responder quiz | M5 | I: ciclo de intento |
| 15 auditoría | M6 | I: historial sanitizado |
| 16 revisar intentos | M6/M5 | I: consulta M6; cancelación definida solo en M5 |

## RF/RNF y reconciliación

RF1–2/4–6: M1; RF3/7–9: backend R, M1 consume contexto.
RF10–12: M2; RF13/14(markdown)/16: M3; RF14(binarios)/15: E.
RF17–18/27: M4/M5; RF19–20/28: M5; RF21–24/29: M6.
RF25: M1–M6; RF26: auditoría backend R en mutaciones y consulta M6.
RNF1–4: transversal; RNF5/6/10: backend R; RNF7/9: consumo/configuración transversal;
RNF8: E hasta archivos. La fundación no modifica persistencia ni parámetros operativos.

Prevalecen contrato y [ADR admin/ownership](../adr/institution-admin-and-course-ownership.md).
El README de mockups equipara históricamente admin/teacher: no trasladar esa afirmación.
FE-07/11 usan coordinador: no crear ese rol. FE-02 menciona slug visible: adaptar a dominio.
Admin dueño sin teacher administra configuración/secciones y consulta auditoría, pero
no accede a contenido docente/pauta/notas por ese flag. Superadmin solo delega isAdmin.
No se incluye UI general de delegación institucional ni se amplían permisos backend.

## Evidencia por misión

| Misión | Revisión documental realizada | Estado |
| --- | --- | --- |
| M1 | Dominio/API, rutas limpias, sesión #124, retorno, local, CORS y revocación | Checklist completo |
| M2 | Cinco perfiles, ownership, búsqueda reservada a teacher, sucesor de matrícula | Checklist completo |
| M3 | Cuatro combinaciones módulo/ítem, teacher no admin y markdown seguro | Checklist completo |
| M4 | Pauta protegida, destinatarios, edición/publicación y freeze | Checklist completo |
| M5 | PUT completo, claves start/submit, recibo sin nota, plazo y cancelación histórica | Checklist completo |
| M6 | Pesos/publicación, promedio propio, assistant sin pauta y auditoría diferenciada | Checklist completo |

Cada spec identifica operaciones existentes y éxito/rechazo; no se detectó una
brecha que exija cambiar API para el alcance declarado. Límites explícitos:
búsqueda de personas solo teacher; admin sin teacher usa ID conocido permitido;
reanudación de intento desde ID conocido, sin prometer descubrimiento automático;
memoria no conserva claves de operación tras cerrar documento.

## Validación de cierre

Ejecutado localmente 2026-10-21 sobre `ee4a329` más esta documentación:

- Prerrequisitos Spec Kit con `--require-tasks --include-tasks`: PASS.
- Dos checks Python de quickstart: ocho artefactos del padre y seis specs/checklists presentes.
- Auditoría de enlaces/longitud: 22 archivos de fundación/hijos/mapa, todos <150 líneas.
- Cobertura estructural: 16 CU, FE-01–20 y 16 vistas; dependencias sin ciclos: PASS.
- `python3 .github/scripts/check-doc-length.py`: PASS, 24 archivos authored del cambio.
- `git diff --check`: PASS; 26 tareas completadas, formato e IDs consecutivos.

Sin pruebas runtime nuevas: el cambio es documental y no acredita vistas/despliegue.
Metadata GitHub confirmó #124 integrado; no se cierran issues ni se alteran responsables.
