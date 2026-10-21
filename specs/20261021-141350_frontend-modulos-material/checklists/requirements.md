# Specification Quality Checklist: Módulos y material

**Purpose**: Validar contenido, publicación y límites del MVP.
**Created**: 2026-10-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Valor, actores y secciones obligatorias completos.
- [x] Sin stack nuevo, tablas o mecanismos de edición prescritos.
- [x] Publicación y visibilidad descritas con reglas del producto.

## Requirement Completeness

- [x] Sin aclaraciones bloqueantes; FR verificables y SC medibles.
- [x] Éxito/rechazo/casos límite, dependencias y exclusiones claros.
- [x] Markdown dentro y binarios/PDF fuera del MVP.
- [x] Fuentes CU/RF/RNF/backlog y responsables conservados.

## Feature Readiness

- [x] FR-001–004/013: US1 y autorización por tenant/rol.
- [x] FR-005/008–012: US2, validación y recuperación sin retry automático.
- [x] FR-006–007: US3 y cuatro combinaciones de publicación.
- [x] FR-014–016: accesibilidad, fixture matrix y contenido adversarial.
- [x] Teacher no admin autoriza contenido compartido; admin aislado no lo habilita.
- [x] Historial backend preservado; no prometer colaboración ni borrado inexistentes.

## Notes

Revisión documental contra sections/materials y ADR de markdown.
Ítem publicado bajo módulo oculto conserva estado; lectura requiere ambos.
Sin pruebas de producto ni integración binaria ejecutadas aquí.
Hooks specify: before deshabilitado; after git/context opcionales omitidos por hijo.
