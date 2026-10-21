# Specification Quality Checklist: Demo institucional y contexto de ruta

**Purpose**: Validar alcance y aceptación antes de planificar.
**Created**: 2026-10-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No introduce lenguajes, frameworks ni arquitectura; conserva restricciones expresas del usuario.
- [x] Describe valor, actores y necesidades operativas del backend.
- [x] Distingue superadmin, admin, dueño y roles de sección.
- [x] Completa todas las secciones obligatorias.

## Requirement Completeness

- [x] Sin marcadores NEEDS CLARIFICATION.
- [x] Requisitos verificables y permisos explícitos.
- [x] Criterios medibles: cardinalidad, repeticiones, concurrencia y cero cruces.
- [x] Criterios describen resultados sin prescribir framework.
- [x] Escenarios de carga, slug, persistencia y delegación definidos.
- [x] Casos límite incluyen spoofing, conexiones reutilizadas y seed anterior.
- [x] Alcance separado de UI y altas generales de personas.
- [x] Dependencias y cambio respecto de la gobernanza anterior explícitos.

## Feature Readiness

- [x] FR-001–004/019 cubiertos por US1 y SC-001/006.
- [x] FR-005–013/018/020 cubiertos por US2 y SC-002/003/005/007.
- [x] FR-014–017 cubiertos por US3 y SC-004/005/006.
- [x] Historias verificables con fixtures propios, sin depender de la demo pública.
- [x] Selección técnica y evaluación de rendimiento quedan para el plan.

## LMS Constitution Checks

- [x] Tenant y permisos explícitos en lecturas, escrituras y operaciones técnicas.
- [x] Historial y conservación de credenciales/estados definidos.
- [x] Complejidad limitada al MVP, sin infraestructura adicional.
- [x] Longitud menor de 150 líneas, trazabilidad y exclusiones presentes.

## Notes

- Validación documental; no acredita implementación ni pruebas ejecutadas.
- Gobernanza reconciliada por constitución 1.5.0 y ADR institution-context-and-database-isolation; runtime pendiente.
- Contexto transaccional, credenciales sin bypass y cobertura de tablas se concretan en el plan; middleware solo no basta.
- URLs, rutas y PostgreSQL son restricciones solicitadas, no una elección nueva de stack.
- Alta futura de cuentas/pertenencias: deuda fuera de alcance (FR-017).
- Frontend UC/UTFSM bajo academix.dvillasc.me; API central api.dvillasc.me y /api/v1/institution/{institutionSlug}; CORS exacto para ambos frontend.
