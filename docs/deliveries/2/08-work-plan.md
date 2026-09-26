# Plan De Trabajo Actualizado

## Enfoque

Primero se demuestra que el sistema existe, despliega y respeta tenancy. Luego
se implementa el flujo academico minimo.

Iteraciones sugeridas: 1 semana.

## Orden de implementacion

1. Walking skeleton.
2. Tenancy con registry y dos DB demo.
3. Cursos, secciones e inscripciones.
4. Material markdown/archivo.
5. Quizzes de alternativas.
6. Calculo de nota y libro de notas.
7. Publicacion de notas y vista estudiante.
8. Hardening, evidencia y release.

## Plan por iteracion

| Iteracion | Foco | Resultado |
| --- | --- | --- |
| 1 | Repo, frontend/backend Hello World, CI | Frontend consume backend; CI corre en PR/main. |
| 2 | Railway y registry | Servicios desplegados con CD automatico y `railway.toml`. |
| 3 | Tenant DBs `uc`/`utfsm` | `/uc` y `/utfsm` envian `x-tenant` a la DB correcta. |
| 4 | Cursos/secciones/enrollments | Usuarios ven cursos segun rol por seccion. |
| 5 | Material | Docente publica markdown; estudiante lo ve. |
| 6 | Archivos basicos | Metadatos y storage para tipos permitidos. |
| 7 | Quizzes | Docente crea quiz; estudiante responde. |
| 8 | Notas | Backend calcula nota y crea grade. |
| 9 | Libro de notas | Docente configura ponderaciones y publica notas. |
| 10 | Cierre | Tests criticos, release, evidencia y docs finales. |

## Entregables minimos por fase

### Walking skeleton

- frontend y backend separados o claramente distinguibles;
- endpoint de salud;
- frontend conectado al backend;
- CI con stages;
- deploy Railway automatizado con `railway.toml`;
- release por tag.

### Tenancy

- `registry_db.tenants` con `uc` y `utfsm`;
- `academix_uc_db` y `academix_utfsm_db`;
- portal home con rutas `/uc` y `/utfsm`;
- header `x-tenant` en llamadas backend;
- bloqueo de tenant inexistente.

### Flujo academico

- curso con secciones;
- enrollments con rol;
- material publicado;
- quiz con preguntas y alternativas;
- intento estudiante;
- nota calculada;
- publicacion de nota;
- promedio estudiante.

## No hacer antes del Spec Kit

- No elegir dependencias nuevas fuera del plan.
- No implementar auth real completa.
- No agregar Redis/workers.
- No crear UI de administracion institucional.
- No construir auditoria historica.
- No migrar a Google Cloud antes de validar la primera version funcional en
  Railway.

## Criterio de avance

Cada iteracion debe dejar evidencia ejecutable o documental. Si una funcion no
se puede demostrar en la demo, se recorta antes de agregar otra.
