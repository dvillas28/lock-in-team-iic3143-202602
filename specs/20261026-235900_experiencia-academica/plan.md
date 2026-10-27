# Plan: experiencia académica

Rama: `fix/experiencia-academica`. Implementación solicitada por el usuario.

## Diseño

Reusar Next/React, Nest, PostgreSQL, pnpm y estilos canónicos existentes.
Sin dependencias ni migraciones nuevas. El endpoint `/users` cumple OpenAPI actual.
Separar el contexto autorizado de su estado de revalidación; conservar referencia
cuando la identidad y permisos no cambian. Errores secundarios permanecen locales.
Deduplicar eventos del navegador y consultas `/me` concurrentes. Bloquear writes
cuando no se pudo confirmar acceso, incluso desde la frontera HTTP de Session.

Cabecera y navegación de curso compartidas. Libro con tabla principal y diálogos
para ponderaciones/publicación, filtros controlados de auditoría y detalles UUID
secundarios. Datos/paginación/selección siempre aislados por alcance autorizado.
La operación de publicación vive fuera del diálogo y conserva clave/cuerpo.

## Gates

- Tenant explícito: contexto transaccional y predicates institucionales en búsqueda.
- Rol explícito: teacher busca; admin propietario gestiona; student solo propias.
- Integridad: backend autoritativo; ningún cambio al cálculo o historia inmutable.
- Historias independientes y sin abstracciones/dependencias externas innecesarias.
- Permisos reconciliados con capabilities y ADR de ownership existentes.

## Validación

Regresiones unitarias/UI para foco, error local, publicación y filtros.
Integración PostgreSQL runtime para búsqueda, revocación y aislamiento.
Suites existentes para todos los flujos, lint, typecheck, builds y contrato OpenAPI.
Navegador con API real, perfiles y datos vacíos/poblados; guardar evidencia en docs/qa.
Commits convencionales por incremento y PR con resultados y limitaciones reales.
