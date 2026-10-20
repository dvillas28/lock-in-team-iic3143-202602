# Módulos y material: Foundation

Capa Foundation sobre PR #87, integrado en dev.
Rama feat/modulos-material-foundation; siguiente capa feat/modulos-material-api.
Validación actualizada 2026-10-20. Variable explícita:
SPECIFY_FEATURE_DIRECTORY=specs/20261014-234944_modulos-material.

## Alcance verificado

Migración SQL adicional, FK tenant, CHECK, índices y posiciones únicas diferibles.
Contexto/roles/locks reutilizados y validadores compartidos; whitelist audit para
contenido y snapshots de orden como objetos, sin ampliar lectores existentes.
Servicios/controladores registrados y compilables sin rutas de esta misión.
Readiness exige tablas nuevas. OpenAPI/tipos markdown-only y consumidor inerte.
Binarios de RF14/RF15 conservan alcance P2, sin nuevas dependencias ni renderer.
Contratos corrigen snapshots de orden y detallan headers/415/límite HTTP heredado.

## Validación propia de esta capa

Instalaciones existentes con lockfiles intactos; Node 24.14.0, pnpm 9.15.9.
PostgreSQL 17 exclusivo, academix_pr89_test en puerto local dinámico.
Helpers recrean public; suite serial, sin bases compartidas.

- Backend lint y test:coverage: PASS; 53/53 pruebas, líneas 99.47 %, ramas 93.24 %.
- OpenAPI lint y frontend api:check/typecheck/test: PASS; 25/25 frontend.
- FK institucionales cruzadas y de autor, CHECK, posición ocupada y swap diferible.
- Instalación vacía, upgrade poblado preserva cursos/Enrollment/auditoría,
  repetición no altera filas; down solo en DB exclusiva vacía.
- Validación Unicode, whitespace, NUL, límites y cadenas hostiles como datos.
- Acceso docente, estudiante y ayudante; publicación, curso/tenant y revocación.
- Content-access y validación: 100 % líneas/ramas; headers inertes y rechazo 415.
- Regresión de identidad/cursos permanece operativa; no cambia su autorización.
- Longitud documental y git diff --check: PASS.

Las rutas US1/US2, sus negativos HTTP, concurrencia y cierre de la misión quedan
pendientes en la siguiente capa. Este resultado no acredita su implementación
ni los checks remotos de GitHub/Sonar.
Límite HTTP heredado: 4096 bytes; markdown semántico hasta 10000 caracteres.
Persisten warning /ready sin 4xx y HIGH preexistente braces del tooling frontend.
[ADR publicación/representación](../adr/shared-markdown-publication.md).
