# Catálogo CONTENT

Evidencia común: [modules.service.ts](../../../backend/src/modules/modules.service.ts); [materials.service.ts](../../../backend/src/materials/materials.service.ts); [content-access.ts](../../../backend/src/content/content-access.ts); [modules-panel.tsx](../../../frontend/src/components/content/modules-panel.tsx); [academic-markdown.tsx](../../../frontend/src/components/content/academic-markdown.tsx).

B: navegador; M: navegador con API/SQL; H: HTTP integración; O: operación/SQL.
Todas las fichas están propuestas; no implementadas. Las variantes enumeradas se parametrizan sin reducir aserciones.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-CONTENT-001 — Teacher crea renombra y ordena módulo](content-01.md#e2e-content-001) | FL-CONTENT-01 | P1 | regression | B |
| [E2E-CONTENT-002 — Docente otra sección ve contenido compartido](content-01.md#e2e-content-002) | FL-CONTENT-01 | P1 | regression | B |
| [E2E-CONTENT-003 — Publicar ocultar republicar módulo](content-01.md#e2e-content-003) | FL-CONTENT-01 | P0 | regression | B |
| [E2E-CONTENT-004 — Orden incompleto duplicado ajeno y obsoleto](content-01.md#e2e-content-004) | FL-CONTENT-01 | P1 | extended | M |
| [E2E-CONTENT-005 — Posición límite y colisión](content-01.md#e2e-content-005) | FL-CONTENT-01 | P2 | extended | M |
| [E2E-CONTENT-006 — No-op de módulo orden y publicación](content-02.md#e2e-content-006) | FL-CONTENT-01 | P2 | regression | M |
| [E2E-CONTENT-007 — Módulos vacíos y visibilidad staff](content-02.md#e2e-content-007) | FL-CONTENT-01 | P1 | regression | B |
| [E2E-CONTENT-008 — Crear editar y leer Markdown persistido](content-02.md#e2e-content-008) | FL-CONTENT-02 | P1 | smoke | B |
| [E2E-CONTENT-009 — Cuatro combinaciones módulo e ítem](content-02.md#e2e-content-009) | FL-CONTENT-02 | P0 | smoke | M |
| [E2E-CONTENT-010 — Ocultar material retira lectura directa](content-02.md#e2e-content-010) | FL-CONTENT-02 | P0 | regression | M |
| [E2E-CONTENT-011 — Body Markdown vacío Unicode y bytes](content-03.md#e2e-content-011) | FL-CONTENT-02 | P2 | extended | M |
| [E2E-CONTENT-012 — HTML y enlaces peligrosos no ejecutan](content-03.md#e2e-content-012) | FL-CONTENT-02 | P0 | regression | B |
| [E2E-CONTENT-013 — Imágenes externas y tablas anchas](content-03.md#e2e-content-013) | FL-CONTENT-02 | P1 | extended | B |
| [E2E-CONTENT-014 — No publicar con cuerpo ni borrar material](content-03.md#e2e-content-014) | FL-CONTENT-02 | P2 | regression | M |
| [E2E-CONTENT-015 — Edición concurrente y orden de confirmación](content-03.md#e2e-content-015) | FL-CONTENT-02 | P2 | extended | M |
| [E2E-CONTENT-016 — Respuesta perdida en edición no habilita reenvío ciego](content-04.md#e2e-content-016) | FL-CONTENT-02 | P1 | regression | B |
