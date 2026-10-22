# Research: Módulos y material frontend

Fecha: 2026-10-22. Evidencia: checkout local, CodeGraph, OpenAPI y ADR del repositorio.
Las versiones provienen de frontend/package.json; no se seleccionan versiones nuevas.
Investigaciones delegadas: contratos backend y reutilización UI/seguridad de lectura.

## 1. Stack y fronteras

- Decision: conservar Next/React, Session.request y tipos OpenAPI generados.
- Rationale: frontend existente; Session invalida identidades anteriores y maneja 401.
  El dominio selecciona slug solicitado; path, membership y RLS autorizan en backend.
- Alternatives considered: BFF, fetch directo, caché global; complejidad innecesaria.
- Evidencia: frontend/src/lib/auth/session.ts y frontend/src/lib/api/client.ts.

## 2. Permisos reconciliados

- Decision: autoría requiere membership institucional activa y sectionMemberships
  con teacher para el curso actual, independiente de flags administrativos.
- Rationale: contentScope permite teacher de cualquier sección; contenido común al curso.
  capabilities.manage incluye administración y exige sección: no sirve para autoría compartida.
- Alternatives considered: ownership o rol demo de URL; contradicen FR-004.
- Evidencia: backend/src/content/content-access.ts, servicios modules/materials y
  docs/adr/shared-markdown-publication.md.

## 3. Lectura markdown segura mínima

- Decision: mostrar fuente markdown como texto escapado, con espacios y saltos conservados;
  sin interpretar HTML ni generar enlaces, imágenes remotas o URLs activas.
- Rationale: FR-009 y ADR permiten consumidor textual; no se exige formato enriquecido
  ni existe renderer instalado. Etiquetar «Contenido markdown» y ajustar líneas a 375 px.
- Alternatives considered: parser propio, innerHTML o renderer/sanitizer nuevo; innecesarios.
- Evidencia: ADR compartido, spec FR-009 y frontend/package.json.

## 4. Validación y orden

- Decision: títulos recortados, 1–200 caracteres Unicode, sin NUL; markdown no blanco,
  sin NUL, ≤10000 caracteres, espacios conservados. JSON completo ≤4096 bytes UTF-8.
- Rationale: esquema y límite HTTP son acumulativos; escapes y metadatos también pesan.
  PUT exige todos los moduleIds únicos; crea posiciones 1..N. Alta usa max(position)+1,
  no length+1, porque posiciones existentes pueden tener huecos; vacío empieza en 1.
- Alternatives considered: maxlength solo o PATCH position; no satisfacen contrato.
- Evidencia: esquemas courses/materials y backend/src/content/content-validation.ts.

## 5. Mutaciones, historial e incertidumbre

- Decision: sin retry automático, autosave o persistencia de borradores. Tras respuesta
  perdida consultar lista/recurso; bloquear repetición mientras el resultado sea ambiguo.
- Rationale: POST sin clave idempotente, PATCH sin versión; confirmación real obligatoria.
  Publicación independiente, no-op y auditoría atómica corresponden al backend existente.
- Alternatives considered: éxito optimista, repetir altas o merge local; sin contrato.
- Evidencia: ModulesService, MaterialsService y spec FR-007/010–013.

## 6. UI y validación

- Decision: reutilizar tokens/app.css, Field, estados, useResource y useMutation.
  Orden con botones y publicación Lucide + texto, aria-pressed y foco conservado.
- Rationale: mockups 04/12 orientan estructura, sin conceder permisos ni ofrecer binarios.
  Cargar material al expandir evita traer todos los cuerpos al abrir el curso.
  Ajustar breadcrumb de InstitutionShell, que hoy asume detalle salvo ruta sections.
- Alternatives considered: PDF demo, drag exclusivo o nuevo sistema visual; fuera de alcance.
- Evidencia: DESIGN.md, mockups/README.md y docs/guides/frontend-styles.md.

## Resolución

Sin NEEDS CLARIFICATION pendientes, APIs nuevas ni dependencia sobre /users.
Pruebas futuras FR-016 requeridas; la investigación documental no certifica runtime.

## Implementación: revalidación 2026-10-22

T001: controllers/services de modules/materials y contentScope coinciden con contrato.
Sin diferencias API; MarkdownMaterial es el nombre del tipo generado.
Sin endpoints, dependencias ni cambios backend. Ignoradores existentes cubren outputs/secrets; paquete privado.
