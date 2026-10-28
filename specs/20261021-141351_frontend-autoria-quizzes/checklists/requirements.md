# Specification Quality Checklist: Autoría de quizzes

**Purpose**: Validar alcance docente, pauta y publicación.
**Created**: 2026-10-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Valor, actores y secciones obligatorias completos.
- [x] Sin stack, persistencia nueva ni algoritmos prescritos.
- [x] Restricciones contractuales separadas de decisiones de plan.

## Requirement Completeness

- [x] Sin aclaraciones bloqueantes; FR verificables y SC medibles.
- [x] Éxito/rechazo, fechas/límites y edición bloqueada definidos.
- [x] Dependencias, fuentes y exclusiones explícitas.
- [x] Roles y secciones no se infieren del mockup o URL.

## Feature Readiness

- [x] FR-001–005: US1, lista segura y autoría restringida.
- [x] FR-006–008/011/013: US2, validación y multirol incompatible.
- [x] FR-009–010/014: US3, GradeItem único y curso congelado.
- [x] FR-012/015–016: recuperación, accesibilidad y escenarios de aislamiento.
- [x] Se distinguen admin dueño con teacher y admin/superadmin aislados.
- [x] Pauta limpiada con sesión e historial backend preservado.

## Notes

Revisión documental contra contrato de quizzes y ADR de autoría.
No se ofrece unpublish ni se inventa editor de notas en esta misión.
Las verificaciones de producto se exigirán al implementar, no se declaran ejecutadas.
Hooks specify: before deshabilitado; after git/context opcionales omitidos por hijo.
