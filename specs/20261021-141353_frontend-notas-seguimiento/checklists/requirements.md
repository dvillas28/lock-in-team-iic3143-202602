# Specification Quality Checklist: Notas y seguimiento

**Purpose**: Validar publicación, seguimiento y auditoría en una misión acotada.
**Created**: 2026-10-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Valor, actores y cuatro historias independientemente comprobables con fixtures.
- [x] Secciones obligatorias y terminología del producto completas.
- [x] Sin stack ni cálculo de notas frontend nuevo.

## Requirement Completeness

- [x] Sin aclaraciones bloqueantes; FR verificables y SC medibles.
- [x] Éxito/rechazo, freeze, replay y pérdida de clave definidos.
- [x] Fuentes, dependencias y exclusiones explícitas.
- [x] Seguimiento de sección histórica separado de permisos actuales.

## Feature Readiness

- [x] FR-001–003: US1 y ausencia de nota anticipada.
- [x] FR-004–006/016–017: US2, cursor/representación y cancelación enlazada.
- [x] FR-007–013: US3, pesos completos, freeze y publicación idempotente.
- [x] FR-014–015: US4 y auditoría sanitizada con permisos propios.
- [x] FR-018–021: errores, aislamiento, accesibilidad y FE-20 transversal.
- [x] Admin dueño sin teacher consulta auditoría, pero no libro/pauta por ese flag.
- [x] Persistencia/historial backend intactos; no ofrecer edición de nota publicada.

## Notes

Revisión documental contra gradebook/quizzes/audit y ADR de freeze.
Auditoría y libro tienen permisos diferentes; assistant no obtiene corrección.
No se declaran ejecutados recorridos UI ni publicación real de notas.
Hooks specify: before deshabilitado; after git/context opcionales omitidos por hijo.
