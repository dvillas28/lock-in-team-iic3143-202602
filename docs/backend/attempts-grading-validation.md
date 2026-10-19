# Intentos y calificación: gate de implementación

Fecha: 2026-10-19. Base: PR #94, feat/autoria-quizzes, da8b59b.
Este PR documenta el plan; Foundation, US1, US2 y validación de cierre pendientes.

T001 verificado con 18/18 pruebas de autoría en PostgreSQL 17 exclusivo.
Migración 20261019000100_quiz_authoring.sql y tablas quizzes/grade_items reales.
GradeItem único por quiz/tenant; puntos exactos hasta dos decimales y total ≤999999.99.
canAuthorQuiz compartido; requireDraft impide editar publicados antes del intento.
T002: prefijo posterior libre 20261019000200_attempts_grades.sql.
La inspección inicial del checkout de cursos no incluía esta implementación;
se reutiliza PR #94 desde un worktree aislado, conservando cambios locales ajenos.

DB efímera propia academix_attempts_test, PostgreSQL 17 local; sin datos compartidos.
Validación: build backend y 18 pruebas quiz-*.test.mjs, sin omisiones.
El plan exige registrar aquí todos los checks de quickstart y la cobertura FR/SC
antes de marcar T003–T031 completas. No se acredita implementación de intentos.

Deuda aceptada: resolución temporal efectiva de milisegundos según ADR de intentos;
precisión inferior a 1 ms diferida por decisión explícita del usuario.
