# Cliente API del frontend

Ejecuta los comandos de esta guía desde la raíz del repositorio con Node.js 24.

Los tipos versionados en `frontend/src/lib/api/schema.d.ts` se generan desde el
OpenAPI vigente, incluidas sus referencias YAML. Después de cambiar el contrato:

```bash
pnpm --dir frontend api:generate
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
```

Las pruebas usan el runner nativo de Node.js 24. `api:check` verifica que los
tipos estén sincronizados con el contrato sin escribir archivos.

`createApiClient` en `frontend/src/lib/api/client.ts` ofrece los métodos tipados
de `openapi-fetch`: `{ data, response }` en éxito y errores estructurados en
fallos. Acepta `baseUrl`, `fetch` para pruebas y `getToken` para consultar el JWT
actual. En servidor, crear una instancia por solicitud/sesión, sin compartir
tokens entre usuarios. `institutions.ts` ofrece `listAccessibleInstitutions(client)`
y `getCurrentUser(client, institutionSlug)`; requieren backend y autenticación
todavía pendientes. `/health` conserva su consumo público y validación.

El cliente usa `API_URL` en servidor y `NEXT_PUBLIC_API_URL` en navegador, o
`http://localhost:3001` en desarrollo. Producción exige configurar la URL del
entorno correspondiente (o pasar `baseUrl`). El consumo desde navegador a otro
origen requiere CORS del backend, actualmente pendiente.

Los parámetros van en `params.path` / `params.query`; el contexto institucional
se obtiene de `institutionSlug`. Para comprobar propiedades adicionales del
body, usar `body: { name: "Curso" } satisfies components["schemas"]["CourseUpdate"]`,
importando `components` como tipo desde `schema.d.ts`. La autorización sigue
siendo responsabilidad del backend según el [contrato vigente](../reference/openapi/README.md).

Los consumidores pueden capturar `ApiHttpError` de `errors.ts` y consultar
`kind`: `authentication` (401), `authorization` (403), `not-found` (404) o `http`
(otros estados). `status` conserva el estado HTTP incluso con un body vacío,
inválido o de otro media type. `problem` contiene metadatos para diagnóstico;
mostrar `message` en la UI, sin exponer `problem.detail`, `title` o `errors`.
`ApiNetworkError` (`kind: "network"`) conserva la causa de fallos sin respuesta
HTTP. No hay reintentos, redirecciones ni cierre automático de sesión.
