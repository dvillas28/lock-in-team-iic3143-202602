# Privacidad de notas en auditoría

Fecha: 2026-10-29. Decisión aceptada para AUD-PRIV, hallazgo técnico asociado;
no es comentario textual del evaluador E2. Implementación/validación enlazadas
al completar [evidencia](../backend/audit-grade-privacy-validation.md).

## Decisión

Cada consulta obtiene contexto institucional y roles activos de nuevo.
Owner con is_admin sin teacher conserva solo eventos distintos de grade.
Owner+teacher conserva todas las secciones de su curso, incluidos grade sin sección.
Teacher ordinario conserva únicamente eventos de sus secciones docentes históricas.
Student/assistant/superadmin no obtienen auditoría por esos roles o flags.
Publicación no concede acceso a eventos grade: estudiante consulta my-grades.
Assistant conserva seguimiento autorizado sin adquirir auditoría.

Filtro SQL por resource_type antes de ORDER/LIMIT y continuación: evento grade
completo excluido sin docencia, no se vacía solamente el payload. Cursor no
conserva permisos revocados; se revalida con misma sesión en cada petición.
Se conservan tenant/RLS, DTO, allowlists, filtros y paginación existentes.
No se cambia courseScope ni autorización global de otros módulos.

## Historia y alternativas

Sin migración, borrado, redacción persistida o regeneración de eventos.
Lecturas aplican también a historia previa y no alteran datos académicos.
Ocultar UI, filtrar después de LIMIT o permitir notas publicadas por auditoría
no cumplen privacidad ni paginación. La restricción localizada conserva acceso
administrativo legítimo y la historia docente independiente de matrícula actual.
Acota las excepciones generales de los ADR de ownership y publicación.

## Verificación

Regresión HTTP/SQL owner+student sin teacher antes de rendir; filtros y páginas,
revocaciones con sesión/cursor, alcance docente de dos secciones/instituciones,
sanitización y snapshot sin escrituras. Base exclusiva _test, dos credenciales.
