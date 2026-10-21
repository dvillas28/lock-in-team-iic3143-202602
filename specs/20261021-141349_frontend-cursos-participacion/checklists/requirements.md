# Specification Quality Checklist: Cursos y participación

**Purpose**: Validar completitud y permisos antes del plan.
**Created**: 2026-10-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Actores, valor y secciones obligatorias completos.
- [x] Describe comportamiento sin elegir stack ni diseñar persistencia nueva.
- [x] Terminología histórica coordinador no concede rol nuevo.

## Requirement Completeness

- [x] Sin aclaraciones bloqueantes; supuestos/exclusiones explícitos.
- [x] FR verificables y SC medibles sin implementación específica.
- [x] Éxito/rechazo y límites por institución/curso/sección.
- [x] CU/RF/RNF, FE y fuentes con responsables conservados.

## Feature Readiness

- [x] FR-001–003/013: US1 y sesiones/revocación.
- [x] FR-004–006/012: US2 y conflicto de creación sin retry automático.
- [x] FR-007–011: US3; IDs sucesores, multirol e historial preservados.
- [x] FR-014–016: accesibilidad, fixtures por perfil y autoridad backend.
- [x] Admin dueño sin teacher diferenciado de admin ajeno y superadmin.
- [x] Búsqueda solo teacher; admin sin teacher usa identificador contractual conocido.

## Notes

Revisión documental contra cursos/secciones/platform y ADR vigente.
Los permisos ambiguos del mockup se reconcilian; no se modifica backend para
habilitar búsquedas adicionales. Sin pruebas de producto ejecutadas aquí.
Hooks specify: before deshabilitado; after git/context opcionales omitidos por hijo.
