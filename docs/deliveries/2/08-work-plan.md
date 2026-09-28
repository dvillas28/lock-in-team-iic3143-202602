# Plan de trabajo actualizado

## Enfoque

Primero se demuestra que el sistema existe, despliega y respeta tenancy. Luego
se implementa el flujo académico mínimo.

Iteraciones sugeridas: 1 semana.

## Orden de implementación

1. Walking skeleton.
2. Tenancy con registry y dos DB demo.
3. Cursos, secciones e inscripciones.
4. JWT, pertenencias de coordinador/sección y auditoría mínima.
5. Material markdown/archivo.
6. Quizzes de alternativas con límite opcional de intentos.
7. Cálculo de nota y libro de notas desde el último intento.
8. Publicación de notas y vista estudiante.
9. Hardening, evidencia y release.

## Plan por iteración

| Iteración | Foco | Resultado |
| --- | --- | --- |
| 1 | Repo, frontend/backend Hello World, CI | Frontend consume backend; CI corre en PR/main. |
| 2 | Railway y registry | Servicios desplegados con CD automático y `railway.toml`. |
| 3 | Tenant DBs `uc`/`utfsm` | `/uc` y `/utfsm` envían `x-tenant` a la DB correcta. |
| 4 | Cursos, secciones y roles | Coordinador por curso, roles acumulables por sección y JWT. |
| 5 | Material | Docente publica markdown; estudiante lo ve. |
| 6 | Archivos básicos | Metadatos y storage para tipos permitidos. |
| 7 | Quizzes | Docente crea quiz con pauta protegida y límite opcional de intentos. |
| 8 | Notas | Backend calcula nota del último intento y registra auditoría. |
| 9 | Libro de notas | Docente configura ponderaciones y publica notas inmutables. |
| 10 | Cierre | Tests críticos, release, evidencia y docs finales. |

## Entregables mínimos por fase

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

### Flujo académico

- curso con secciones;
- pertenencias de coordinador y enrollments con roles acumulables;
- JWT para operaciones académicas;
- material publicado;
- quiz con preguntas, pauta protegida y límite opcional de intentos;
- intentos numerados con sección histórica;
- nota calculada desde el último intento;
- publicación de nota;
- promedio estudiante;
- eventos de auditoría inmutables.

## No hacer antes del Spec Kit

- No elegir dependencias nuevas fuera del plan.
- No implementar auth real durante el walking skeleton; sí antes del flujo
  académico.
- No agregar Redis/workers.
- No crear UI de administración institucional.
- No omitir la auditoría mínima transaccional del MVP.
- No migrar a Google Cloud antes de validar la primera versión funcional en
  Railway.

## Criterio de avance

Cada iteración debe dejar evidencia ejecutable o documental. Si una función no
se puede demostrar en la demo, se recorta antes de agregar otra.
