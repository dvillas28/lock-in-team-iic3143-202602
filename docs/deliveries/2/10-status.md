# Estado Entrega 2

Actualización documental 2026-10-29. [Corte y fuente E2](15-feedback-e2.md)
inmutables; no representa la fecha de entrega ni recepción de comentarios.

## Existente antes del polish

En commit 7f4334a: Next.js/NestJS, PostgreSQL compartida y migraciones SQL pg,
identidad JWT, memberships, flags institucionales y ownership, cursos/secciones,
Enrollment por rol, contenido markdown, quizzes, intentos/calificación automática,
publicación y libro de notas, auditoría inmutable, RLS/runtime y provisión demo.
Presencia en código no equivale a prueba ejecutada ni despliegue acreditado.
Render ya estaba configurado: dos servicios y PostgreSQL 17 sin HA propia.

## Respuesta posterior

- Documentación: cardinalidades y opcionalidad, catálogo, dominio cerrado de role,
  seis actores, cuentas/provisión y límites de altas; arquitectura mínima Render.
- Validación nueva: suites HTTP/SQL existentes de creación, delegación y replay,
  nuevo rechazo de role inválido; resultados en [evidencia](../../backend/feedback-e2-validation.md).
- Funcional: lectura de auditoría excluye grade sin teacher antes de paginar;
  conserva administrativos owner e historia docente. [Evidencia](../../backend/audit-grade-privacy-validation.md).
- Fuentes y exportaciones: estado y revisión registrados en la evidencia, sin
  deducir aprobación por presencia del PDF.

## Límites y pendientes

Sin alta general/invitaciones, superadmin global, administración general,
binarios, jerarquías, sharding, restore individual, Redis, workers, IA o chat.
HAProxy/HA/PgBouncer externo diferidos hasta necesidad medida.
Onboarding inicial es operativo, no signup ni gestión general de personas.
No se hizo push, PR, merge ni despliegue; DNS/TLS, settings y disponibilidad
remota necesitan validación del operador. Ensayo y confirmación con responsables
no se infieren de pruebas locales. No se cierran tareas de otras misiones.

## Riesgos y planificación

F6/G6 valoran matriz y organización: se conservan responsables y backlog,
sin atribuir su creación al polish. [Riesgos](07-risks.md), [plan](08-work-plan.md).
Historia de otras entregas permanece fuera del alcance; ADR vigentes guían
implementación y este estado distingue configuración, prueba local y operación.
