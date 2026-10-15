# Backend AcademiX: mapa de misiones

Fecha de revisión: 2026-10-14. Fuente funcional: Entrega 2, no US históricas de E0/E1.

Las carpetas se recorren por nombre ascendente (A → Z): primero base persistente,
luego las siguientes misiones en el orden de la tabla.

## Decisión de partición

Siete specs cubren el backend académico completo del MVP. Cada misión cierra una
capacidad comprobable sobre su base previa; no se crea una spec por tabla ni
una spec monolítica. Auditoría, aislamiento y permisos acompañan cada escritura.
La persistencia es una base operativa explícita, no un caso de uso inventado.

| Orden | Misión | Casos | Dependencias |
| --- | --- | --- | --- |
| 1 | [Base persistente y demo](../../specs/20261014-234644_base-persistente/spec.md) | Habilita acceso | Skeleton existente |
| 2 | [Identidad y acceso](../../specs/20261014-234744_identidad-acceso/spec.md) | CU-01/02 | Base persistente |
| 3 | [Cursos y roles](../../specs/20261014-234844_cursos-roles/spec.md) | CU-03/04 | Identidad y acceso |
| 4 | [Módulos y material](../../specs/20261014-234944_modulos-material/spec.md) | CU-14/05/06 | Cursos y roles |
| 5 | [Autoría de quizzes](../../specs/20261014-235044_autoria-quizzes/spec.md) | CU-07 | Cursos y roles |
| 6 | [Intentos y calificación](../../specs/20261014-235144_intentos-calificacion/spec.md) | CU-08/09/15 | Autoría de quizzes |
| 7 | [Notas y auditoría consultable](../../specs/20261014-235244_notas-publicacion-auditoria/spec.md) | CU-10/11/12/13/16 | Intentos; contenido para demo completa |

Módulos/material y autoría de quizzes pueden desarrollarse por separado una vez
resueltos los permisos. La calificación pertenece a envío de intento; publicación
y consulta del libro son otra misión. AuditEvent nace con cursos/roles.

## Cobertura de requisitos

| Requisitos Entrega 2 | Misión responsable |
| --- | --- |
| RF1, RF2, RF4–RF6 | Identidad y acceso |
| RF3, RF7–RF9 | Base persistente; integridad extendida en cada misión |
| RF10–RF12 | Cursos y roles |
| RF13, RF14 markdown, RF16 | Módulos y material |
| RF14 archivos, RF15 | Diferidos P2: no necesarios para cerrar MVP markdown |
| RF17, RF18, RF27 | Autoría; bloqueo de pauta también en intentos |
| RF19, RF20, RF28 | Intentos y calificación |
| RF21–RF24, RF29 | Notas y publicación |
| RF25 | Transversal: acceso + cada operación académica |
| RF26 | Generación desde cursos/roles; consulta en notas/auditoría |
| RNF1–RNF4 | Todas: aislamiento, autorización, transacciones e integridad |
| RNF5 | Base persistente: recuperación compartida, no restore individual |
| RNF6, RNF7, RNF9, RNF10 | Base y planes: monolito, portabilidad, salud, migraciones |
| RNF8 | Condicionado a archivos P2; sin binarios en PostgreSQL |

La base incorpora Institution/User/Membership; cursos añade Course/Section/Enrollment
y AuditEvent; contenido añade CourseModule/Material; autoría añade Quiz/GradeItem;
intentos añade QuizAttempt/Grade. No hay entidades del modelo MVP sin misión.

## Backlog y asignaciones verificadas

Se consultaron las issues del repositorio asignadas a `spmasabeu`, incluyendo
cerradas. El tablero [Projects 3](https://github.com/users/dvillas28/projects/3)
no pudo leerse: el token CLI carece de `read:project`. No se afirma conocer su
estado, campos, drafts ni que las issues siguientes estén todas en ese tablero.

| Issue | Estado consultado | Misión o tratamiento |
| --- | --- | --- |
| [#18](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/18) Validar los riesgos con cada responsable de área y actualizar la lista de riesgos. | OPEN | Gestión transversal de riesgos; no crear feature artificial |
| [#20](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/20) Spec Kit de persistencia: elegir ORM o capa SQL y herramienta de migraciones. | OPEN | Base persistente |
| [#21](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/21) Definir el dataset demo UC/UTFSM (usuarios, memberships, cursos y roles) para bootstrap y tests. | OPEN | Base persistente |
| [#29](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/29) Revisar el contrato OpenAPI vigente entre frontend y backend (rutas institucionales y política 401/403/404). | CLOSED | Contrato transversal; ya cerrada, no reabrir |
| [#48](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/48) Spec Kit de autenticación: emisión y validación de JWT, cuentas demo. | OPEN | Identidad y acceso |
| [#50](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/50) Instalar y configurar ORM y migraciones; conexión del backend mediante DATABASE_URL. | OPEN | Base persistente |
| [#51](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/51) Compose: healthcheck de postgres, migraciones y bootstrap al arrancar. | OPEN | Base persistente |
| [#52](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/52) Bootstrap idempotente de UC, UTFSM y usuarios demo. | OPEN | Base persistente |
| [#54](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/54) Provisionar PostgreSQL en Railway y exponer DATABASE_URL al backend. | OPEN | Base persistente |
| [#55](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/55) Migración inicial de Institution, User e InstitutionMembership con unicidades. | OPEN | Base persistente |
| [#58](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/58) ADR de la capa de persistencia y migraciones elegida. | OPEN | Base persistente |

Las tareas futuras BE-01–BE-32 se mapean en cada spec desde el
[backlog detallado local](../deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
No se limita el backend a las once issues ya asignadas: eso dejaría incompleto
el flujo académico. Conservar responsables de las tarjetas: SP, DF, JC y MA.
No se modificaron GitHub ni asignaciones.

## Discrepancias que el plan debe resolver

1. Capacidad admin del curso frente a teacher: la ADR de UI separa alcance de
   todas las secciones y sección propia; CU/RF/modelo aún presentan ambigüedad.
   FR-009 de cursos-roles requiere aclaración; bloquea planes académicos dependientes.
   Nunca usar experience de URL como permiso ni ampliar privilegios por omisión.
2. Concesión/revocación inicial de administración y alta de cursos: definir actor
   autorizado e historial antes de habilitar operaciones públicas. Por defecto,
   creación inicial solo mediante bootstrap operativo.
3. Títulos BE-09/BE-15 antiguos mencionan memberships y tablas Question/Option:
   seguir Enrollment y preguntas integradas en Quiz del modelo vigente.
4. Autenticación: el plan debe definir identificador inequívoco; no asumir unicidad
   de email si el modelo no la garantiza. Sin registro público.
5. Ventana de guardado/envío: intentos-calificacion propone exigir vigencia también
   al guardar/enviar; validar el supuesto antes de planificar esa misión.

## Orden de ejecución

Empezar con el plan de base persistente; identidad sigue sobre esa base.
Resolver cursos-roles con speckit-clarify antes de sus planes dependientes.
Cada spec tiene su checklist; aprobación documental no equivale a implementación.

```bash
SPECIFY_FEATURE_DIRECTORY=specs/20261014-234644_base-persistente \
  .specify/scripts/bash/setup-plan.sh --json
```

Usar ese mismo directorio explícito al invocar speckit-plan. No se eligió ORM
ni se generaron planes/tasks antes de acordar las decisiones correspondientes.
No aprovisionar infraestructura para completar esta fase documental.

## Fuentes

- [Alcance](../deliveries/2/02-scope.md), [CU y RF/RNF](../deliveries/2/03-use-cases-and-requirements.md).
- [Dominio](../deliveries/2/05-domain-model.md), [datos](../deliveries/2/06-data-model.md).
- [ADR UI/permisos](../adr/ui-admin-non-admin-experiences.md).
- [Convenciones Spec Kit](../guides/speckit-flow.md).
