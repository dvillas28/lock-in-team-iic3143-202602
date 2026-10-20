# Plan: Catálogo de endpoints

**Branch**: `docs/catalogo-endpoints-plan` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)
**Feature**: `SPECIFY_FEATURE_DIRECTORY=specs/20261019-121536_catalogo-endpoints`

## Summary

Publicar Swagger UI con formato y estilos oficiales, assets locales y OpenAPI descargable.
Generar un sitio estático navegable y OpenAPI 3.1 JSON descargable desde el contrato
canónico; Redocly valida y resuelve referencias. Disponibilidad calculada desde
controllers registrados en AppModule, nunca desde el estado declarado de un spec.
Sin consola, servicios nuevos, consultas a PostgreSQL ni cambios al backend.

## Technical Context

- Lenguaje: JavaScript ESM, Node 24, pnpm 9.15.9.
- Dependencias: Redocly 1.25.11 existente; swagger-ui-dist 5.34.0 fijado; Nest y TypeScript existentes en backend para compilar e inspeccionar metadatos.
- Storage: archivos estáticos en `dist/api-catalog/releases/<revision>/`.
- Tests: node:test, comprobaciones del contrato y Playwright local.
- Plataforma: hosting estático, navegación sin backend ni scripts externos.
- Rendimiento: HTML y assets locales; sin llamadas académicas al abrir.
- Scope: todas las operaciones del contrato, estados implementada/planificada.
- Revisión: Git HEAD y SHA-256 de entradas relevantes, incluyendo cambios locales.

## Constitution Check

PASS antes y después del diseño:
- Tenant: solo documentación pública sintética; slug no autoriza.
- Roles: permisos por operación; admin requiere propiedad, superadmin solo delega.
- Integridad: no modifica registros ni auditoría; clientes externos conservan controles.
- US1 consulta, US2 ejemplos externos y US3 publicación se verifican por separado.
- Markdown <150 líneas; trazabilidad CU/RF/RNF y DOC-* heredada de spec.md.
- ADR admin/non-admin respetado; ninguna capacidad nueva.
- Complejidad justificada: Swagger UI sustituye fichas HTML propias por solicitud explícita (FR-013).
- Estilos del visor son oficiales; excepción de diseño solicitada por el usuario. Solo ajustes de accesibilidad y cabecera.

## Project Structure

- `scripts/api-catalog.mjs`: extracción de metadatos, cobertura, revisión y publicación local.
- `scripts/api-catalog-render.mjs`: ejemplos/Markdown del contrato y shell mínimo para Swagger UI.
- `scripts/api-catalog-init.js`: carga local, error explícito y configuración de solo lectura.
- `scripts/api-catalog.test.mjs`: cobertura, referencias, rollback y ejemplos.
- `docs/reference/openapi/`: contrato, permisos y ejemplos canónicos.
- `docs/reference/api-catalog.md`: operación, publicación y evidencia.
- `docs/adr/static-api-catalog.md`: decisión de generación y promoción estática.
- `.github/workflows/ci.yml`: validación, generación y artefacto revisable.
- `dist/api-catalog/index.html`: entrada estable a release validada.
- `specs/20261019-121536_catalogo-endpoints/contracts/catalog.md`: salida pública.

## Delivery

1. Contrastar rutas y completar metadatos del contrato.
2. Generar ejemplos y estados en el contrato; Swagger UI agrupa, filtra y expande fichas.
   JavaScript local obligatorio para el visor; descarga OpenAPI disponible sin JavaScript.
3. Validar todo en staging; promover mediante rename atómico de entrada estable.
4. CI entrega artefacto. Despliegue externo requiere aprobación del resultado local.

## Complexity Tracking

Swagger UI añade una dependencia de distribución para cumplir FR-013; elimina el renderer
de fichas propio. Sin visor remoto ni inventario manual de disponibilidad.
