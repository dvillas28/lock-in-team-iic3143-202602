# Layout institucional — FE-02 / Issue #53

## Alcance

`/institutions/[institutionSlug]` ofrece la estructura pública del espacio
institucional: marca AcademiX, contexto del slug, navegación Inicio,
breadcrumb y contenido. `/` conserva la salud del walking skeleton y versiones.

Fuente: FE-02 del [workplan detallado](../deliveries/2/08-work-plan-detail/08-work-plan-detail.md).
Apoya el contexto de CU-02 y RF4/RF6; no completa autenticación ni autorización.
La estructura usa los estilos existentes, Inter/EB Garamond e iconos Lucide.

## Rutas y frontera institucional

- `institutionHomePath(slug)` centraliza los enlaces institucionales.
- El patrón `^[a-z0-9]+(?:-[a-z0-9]+)*$` replica InstitutionSlug de OpenAPI.
- Slugs malformados producen la vista de recurso no disponible.
- No hay una lista fija de instituciones: UC/UTFSM son fixtures de pruebas.
- Un slug bien formado solo identifica contexto. No demuestra que la institución
  exista ni que el visitante tenga acceso; esta base no consulta datos protegidos.
- El layout espera `params` y asigna una clave por slug al contenido para
  reiniciar estado local al cambiar de institución. No comparte caché ni sesión.

## Estados reutilizables

`route-states.tsx` contiene carga, vacío, error y recurso no disponible.
La carga tiene `role="status"` y contenido ocupado; el error usa `role="alert"`.
Los botones de reintento llaman al callback del consumidor; el boundary
institucional conecta ese callback con `reset` de Next.js.

`getRouteFeedback(error)` traduce los errores del cliente API a texto seguro:

| Error | Presentación | Reintento |
| --- | --- | --- |
| 401 | Sesión requerida | No |
| 403 | Permisos insuficientes | No |
| 404 | Recurso no disponible | No |
| Otros 4xx | Solicitud no completada | No |
| 5xx | Solicitud no completada | Sí |
| Red / respuesta inválida | Servicio no disponible | Sí |
| Error inesperado | Contenido no disponible | Sí |

Nunca muestra detalles Problem, trazas, causas ni mensajes de errores genéricos.
Un 404 no distingue institución inexistente de institución no visible.
Los errores esperados deben mapearse donde se capturan: Next puede enviar al
boundary de cliente un Error redactado, sin clase ni estado HTTP originales.

## Integraciones siguientes

- FE-03 incorpora sesión y el origen del JWT; FE-04, el selector institucional.
- Antes de mostrar datos privados, consultar `/me` con el cliente tipado y
  sesión de la solicitud; verificar membership en el backend en cada operación.
- FE-05 incorpora identidad/roles contextuales. El slug o un parámetro de URL
  nunca concede permisos; admin es una capacidad de curso por reconciliar.
- FE-06 incorpora cursos y sus estados vacíos reales. El inicio actual expresa
  ausencia de contenido integrado, no el resultado de una consulta de cursos.
- No hay registros académicos ni escrituras en FE-02; no se requiere auditoría
  de dominio para esta estructura pública.

## Verificación

Con Node.js 24, desde la raíz:

```bash
pnpm --dir frontend test
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend api:check
pnpm --dir frontend build
```

`node:test` y `tsx` renderizan fixtures con `react-dom/server`, sin un modo demo
ni parámetros que fuercen fallos en producción. CI usa el mismo loader para
incluir componentes TSX en cobertura; `c8` genera LCOV con sus mapas de origen
(la cobertura nativa emite posiciones `undefined` en los helpers de TSX).
Revisar además teclado, foco del enlace
Saltar al contenido, escritorio/móvil de 375 px y ambos temas. El oscuro se
activa mediante `data-theme="dark"` en `<html>`, como el diseño existente.

Validación de la implementación de #53: 35 pruebas automatizadas, build de
producción, lint, TypeScript y sincronización OpenAPI correctos con Node 24.
En Chromium se comprobaron UC/UTFSM, un slug válido adicional, slugs malformados
y rutas desconocidas con HTTP 404; escritorio de 1280 px y móvil de 375 px,
ambos temas, foco por teclado y movimiento reducido. Un fixture aislado verificó
el callback de reintento y el reinicio de estado local entre instituciones.
El frontend no efectuó consultas académicas protegidas durante esas pruebas.
