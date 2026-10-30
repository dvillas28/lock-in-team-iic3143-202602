# Feedback E2: línea base y polish

## Fuente y corte histórico

- Fuente: `01- 2026-02 Alumnos Proyecto, Notas y Presentaciones.xlsx`, pestaña E2,
  fila 6, equipo Lock In. Nota 6,3125; puntaje relativo 0,75 en dominio y datos,
  frente a 1,0 en los demás criterios.
- SHA-256 del XLSX consultado: `af4dbab066c7b03c6b6d353fd7eaca7d65c1f4373c9fb22819d1f3993f128404`.
- Corte del polish: **2026-10-29 09:48:05 America/Santiago**.
- Commit base: `7f4334a03cc9b2245a169fd56b9a1c99942030f0`.
- Inspección de código/configuración y documentos locales; no se ejecutaron suites
  ni se consultó el entorno desplegado para esta línea base.
- No había diferencias de trabajo en backend/src, backend/migrations ni render.yaml
  frente al commit base. Hay documentación local ajena a esta misión sin versionar.

El corte indica qué existía **al empezar este polish**, no qué existía al entregar
E2 o recibir la evaluación. No se deducen fechas de implementación ni causalidad
respecto del feedback original. Una prueba presente no equivale a ejecución aprobada.
No reemplazar esta sección ni las columnas de estado previo al cerrar acciones.

## Observaciones y estado al corte

Síntesis fiel de comentarios, no transcripción literal. Los IDs descomponen E6
para distinguir decisiones; no representan comentarios adicionales del evaluador.

| ID / celda | Feedback | Estado previo al polish | Brecha y trabajo posterior previsto |
| --- | --- | --- | --- |
| E2-ARCH / C6 | Arquitectura explícita y bien evaluada; HAProxy parece excesivo, sugiere simplificar. | render.yaml declara frontend/backend y PostgreSQL, sin HAProxy. Informe/PPT aún dibujan Railway, HAProxy, HA y PgBouncer. | Documentación: reflejar configuración real y diferir componentes sin necesidad. No agregar HA para justificar dibujos. |
| E2-DOM / D6 | Faltan cardinalidades; valora la mejora multi-tenant frente a E1. | UML Markdown ya tiene multiplicidades; diagramas del informe/PPT conservan flechas sin ellas. | Documentación: revisar semántica y llevar multiplicidades a todos los entregables finales. Validar coherencia, no solo añadir etiquetas. |
| E2-ROLE / E6 | Enrollment.role podría ser enum. | BD usa varchar con CHECK teacher/student/assistant; validación de aplicación restringe esos valores. | Documentación/validación: representar dominio cerrado y justificar CHECK frente a enum físico. No cambiar esquema sin necesidad. |
| E2-ADMIN / E6 | No se entiende admin/superadmin, quién crea cursos y quién administra plataforma/institución. | Membership tiene is_admin/is_super_admin; admin crea curso y queda como created_by; superadmin delega is_admin solo en su institución. Operador provisiona instituciones. | Documentación/validación: explicar responsabilidades y límites; actualizar ER/UML/relato. No inventar superadmin global ni RBAC nuevo. |
| E2-ACCOUNTS / E6 | Declarar cuentas seeded, organizaciones demo y cómo se crean más cuentas en la próxima entrega. | Bootstrap institucional y onboarding de identidad inicial existen; seed académico separado. No hay alta general de cuentas por UI/API ni invitaciones. | Documentación/validación: declarar dataset, provisión, repetición segura y límite de altas en institución existente; estas últimas necesitan otra misión. |
| E2-RISKS / F6 | Valora la matriz de riesgos. | Matriz existente en 07-risks.md. | Conservar y actualizar solo riesgos afectados por decisiones verificadas. |
| E2-PLAN / G6 | Valora backlog y organización semanal. | Plan y backlog existentes en 08-work-plan.md y su detalle. | Conservar responsables y trazabilidad; no atribuir al polish ese trabajo previo. |

## Evidencia previa localizable

- E2-ARCH: [configuración Render](../../../render.yaml),
  [ADR de cambio de plataforma](../../adr/deploy-on-render.md),
  [arquitectura documental](04-architecture.md), [informe](report/main.tex)
  y [presentación](ppt/main.tex). Configuración presente no acredita despliegue.
- E2-DOM: [UML con cardinalidades](05-domain-model-uml.md),
  [ER](06-data-model-erd-1.md), informe/PPT anteriores y [catálogo](12-data-catalog.md).
- E2-ROLE: [DDL](../../../backend/migrations/20261016000100_courses_roles.sql),
  [validación](../../../backend/src/courses/validation.ts) y [modelo](06-data-model-part-1.md).
- E2-ADMIN: [creación de cursos](../../../backend/src/courses/courses.service.ts),
  [delegación](../../../backend/src/institutions/membership-admin.service.ts),
  [ADR de permisos](../../adr/institution-admin-and-course-ownership.md) y
  [pruebas existentes](../../../backend/test/integration/membership-admin.test.mjs).
- E2-ACCOUNTS: [bootstrap](../../../backend/src/data-migrations/demo-institutions.ts),
  [onboarding](../../../backend/src/data-migrations/onboard-institution.ts),
  [contrato operativo](../../../specs/20261014-234844_cursos-roles/contracts/onboarding.md)
  y [seed académico](../../guides/demo-academic-seed.md).
- E2-RISKS: [matriz](07-risks.md). E2-PLAN: [plan](08-work-plan.md)
  y [backlog](08-work-plan-detail/08-work-plan-detail.md).

## Hallazgo técnico asociado, fuera del feedback textual

**AUD-PRIV**: AuditService.list permite a owner sin teacher leer eventos grade,
incluso no publicados. Ya estaba registrado en
[validación de intentos](../../backend/attempts-grading-validation.md) y
[notas](../../backend/gradebook-validation.md). El polish prevé restringir esa
lectura conservando historia administrativa y docente. No se atribuye al profesor.
Estado al corte: pendiente; generación del spec no corrige el código.

## Registro de cambios posteriores

Clasificaciones: **documentación**, **validación**, **funcional** o **diferida**.
Registro 2026-10-29; versión funcional `395e26746fb05e238403fb2575add74ddc273549`,
pruebas extendidas `3d18f45afc786283d3a5a890c40f1a0e598de080`, rama `fix/polish-feedback-e2`.
Documentación/exportaciones en commit local de
cierre de esta rama; sin PR, push ni despliegue. [Evidencia posterior](../../backend/feedback-e2-validation.md)
y [regresión de privacidad](../../backend/audit-grade-privacy-validation.md).
Las filas siguientes no reemplazan estado previo ni atribuyen causalidad retroactiva.

| Acción / IDs | Clase | Responsable de referencia | Resultado posterior y limitación |
| --- | --- | --- | --- |
| POL-01 / todos: matriz y corte | Documentación | Equipo; DOC-17/DOC-19 | 2026-10-29: hash/XLSX/corte contrastados; bloque inicial idéntico. Evidencia enlazada, sin inferir fecha de recepción. |
| POL-02 / E2-DOM D6 | Documentación + validación | DOC-16, responsables existentes | 2026-10-29: cardinalidades/reglas revisadas; 14 tablas/122 columnas/25 FK coinciden con DDL; XLSX/MD/MMD/TeX y PDF/SVG regenerados/revisados. ER requiere zoom/formato grande. |
| POL-03 / E2-ROLE E6 | Documentación + validación | Backend/modelo, BE-31 relacionado | 2026-10-29: CHECK cerrado ya existente explicado; nuevo rechazo HTTP 400/SQL 23514 sin cambios. Sin enum SQL ni migración nuevos. |
| POL-04 / E2-ADMIN y E2-ACCOUNTS E6 | Documentación + validación | PREP-05/BE-02 y cursos-roles | 2026-10-29: seis actores/cuentas/provisión declarados; suites existentes 6/6 y extensión UC/UTFSM 2/2 PASS, replay conserva identidad/hash/revocaciones. Alta general/invitaciones diferidas fuera del MVP; sin superadmin global. |
| POL-05 / E2-ARCH C6 | Documentación | DOC-16/DOC-19 | 2026-10-29: relato Render/app/API/DB coincide con Blueprint; informe/PPT revisados. HAProxy/HA/pool externo y binarios diferidos; sin comprobación remota. |
| POL-06 / AUD-PRIV propio | Funcional + validación | BE-30/BE-31 y DOC-15 | 2026-10-29: regresión válida falló por exposición grade; SQL corregido antes de paginar. Coverage 174/174 y consumidor 8/8 PASS; conserva historia/acceso legítimo. No cierra tareas heredadas ni acredita despliegue. |
| POL-07 / E2-RISKS F6 y E2-PLAN G6 | Documentación | Responsables vigentes | 2026-10-29: positivos, responsables y semanas conservados; estado local separado de planificación. No se infiere validación personal de responsables ni cierre operativo. |

## Criterio de cierre

Cada observación conserva origen, evidencia previa y decisión posterior. Los
formatos finales concuerdan; las pruebas ejecutadas indican versión y alcance.
Una exclusión se registra con motivo y efecto: no se disfraza de capacidad entregada.
El [spec](../../../specs/20261028-185147_privacidad-notas-auditoria/spec.md)
y sus tareas registran el cierre local comprobado; exclusiones y operación remota
permanecen separadas de capacidades aprobadas.
