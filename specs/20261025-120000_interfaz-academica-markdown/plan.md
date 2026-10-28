# Plan de implementación

## Decisiones

Reutilizar Next/React/Lucide, tokens y componentes CSS existentes, useResource,
useMutation y clientes OpenAPI. No nuevos servicios ni framework UI.
`react-markdown` 10.1.0 + `remark-gfm` 4.0.1: React >=18, ESM, compatible con
React 19 y Node 24; documentación oficial revisada antes de instalar.
Política de URL pura y centralizada, componentes restringidos y alt textual.
Complejidad justificada: parser mantenido evita parser/sanitizador artesanal.
Formularios en details nativos: contenido montado conserva borrador y operaciones.
Navegación común recibe datos ya cargados, sin consultas para llenar espacios.

## Mapa de referencia

| Mockup | Pantalla real / adaptación |
| --- | --- |
| 03/07 dashboard | /courses, tarjetas con código/período y nombre reales |
| 11 gestión | detalle/secciones/participantes; capabilities vigentes |
| 04 módulos | índice de módulos y filas de recursos; carga lazy |
| 12 editor | encabezado, module-tools/resource y editores desplegables |
| 09 lector | ancho de lectura y contexto, Markdown en lugar de PDF |
| 05/06/08/15/16 | quizzes/notas/libro/auditoría/intentos, composición común |

## Secuencia y verificación

1. Inspeccionar instrucciones, arquitectura, pruebas y referencias visuales.
2. Implementar shell, navegación, densidad y formularios conservando hooks.
3. Integrar renderer; probar semántica, URL/HTML adversarial, padres y sesiones.
4. Ejecutar api:check, typecheck, lint, test:coverage, build y check-doc-length.
5. Comparar navegador con mockups y fixtures aislados, iterar móvil y ambos temas.
6. Revisión lms-reviewer, registrar evidencia y limitaciones; commits locales tras autorización.

Documentación de seguridad y aceptación en docs/guides/frontend-content.md;
actualizar ADR de publicación compartida sin duplicar contratos.
