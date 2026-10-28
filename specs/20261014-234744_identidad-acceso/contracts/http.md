# Contract: HTTP de identidad y contexto

Diseño a integrar durante implementación en docs/reference/openapi/openapi.yaml.
Reusar esquemas tenancy.yaml, common.yaml#/Problem y bearerAuth existentes.
JSON camelCase; application/json en éxito y application/problem+json en errores.
Todos los éxitos protegidos y login usan Cache-Control: no-store.

## POST /api/v1/auth/login (US1, público)

operationId: login. Body exacto {email:string,password:string}; ambos obligatorios,
sin campos adicionales. Validaciones en [modelo](../data-model.md).
Límite JSON 4 KiB; JSON malformado/DTO inválido → 400, cuerpo excesivo → 413,
tipo de contenido diferente de application/json → 415.
No recibir identidad, roles, institutionId ni claims a firmar desde el cliente.

200: {accessToken:string,tokenType:"Bearer",expiresIn:900}.
El accessToken es el único token retornado; no incluirlo en errores ni logs.
401 genérico para contraseña incorrecta, email desconocido o usuario inactivo:
code=UNAUTHORIZED y mismo title/detail, sin informar qué parte falló.
429: cuota excedida; bloqueo de 60 s desde el primer exceso. Retry-After entero
en segundos restantes de bloqueo, sin prolongarlo por nuevos rechazos.
503: DB o verificación de credenciales no disponible; sin detalle interno.
Un hash malformado falla cerrado y se reporta sanitizado, sin stack público.
Headers WWW-Authenticate: Bearer en respuestas 401.

## GET /api/v1/institutions (US1, protegido)

operationId existente: listAccessibleInstitutions.
200: InstitutionListResponse existente, {items:[{id,slug,name,active:true}]}.
Solo instituciones y memberships activas del User activo autenticado.
Orden ascendente por slug, sin paginación; sin memberships: {items:[]}.
401: falta identidad válida/activa. 503: dependencia no disponible.
No incluir emails de otros usuarios, memberships ajenas ni datos académicos.

## GET /api/v1/institutions/{institutionSlug}/me (US2, protegido)

operationId existente: getCurrentUser.
Slug: 1–63 caracteres, patrón ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$; no corregir ni
normalizar slug recibido. Coincide con el CHECK histórico, incluidos guiones consecutivos.
200: CurrentUser existente:

```json
{
  "id": "10000000-0000-4000-8000-000000000003",
  "email": "demo-multi@academix.example",
  "name": "Nombre persistido",
  "institutionMembership": {
    "id": "20000000-0000-4000-8000-000000000003",
    "institution": {"id":"30000000-0000-4000-8000-000000000001","slug":"uc","name":"UC","active":true},
    "active": true
  },
  "sectionMemberships": []
}
```

Los UUID de institución/membership del ejemplo son ilustrativos, no seed estable.
No agregar roles globales ni campo roles: el contrato ya usa sectionMemberships.
Cambiar de contexto significa solicitar otro slug con el mismo JWT; no muta
sesión ni agrega un endpoint de selección de institución.
400: slug malformado tras autenticar. 401: identidad inválida/usuario inactivo.
404 idéntico para slug inexistente, institución inactiva o membership ausente/revocada.
503: DB inaccesible. Contexto se consulta sin caché de permisos.

## Errores y precedencia

Usar todos los campos requeridos de Problem canónico; errors=[] salvo validación,
que identifica campos sin reflejar valores. traceId generado por servidor.
instance contiene solo path, nunca querystring; no repetir headers ni body.
No interpolar slug, email, contraseña, token, hash, SQL ni stack en detail.
Precedencia: límites de transporte → limitador login / autenticación protegida →
validación de parámetros → contexto persistido → permiso de acción.
No autenticado + slug inválido produce 401, salvo rechazo de transporte.

403 se reserva a una acción prohibida sobre un recurso visible. Estas tres
operaciones no requieren roles, por lo que no inventan un caso 403 productivo.
Probar serialización del 403 en el filtro y conservar su semántica para misiones
académicas; 404 oculta siempre contextos ajenos.
No implementar /users ni las rutas académicas declaradas en OpenAPI.
/health y /ready permanecen públicos con su contrato y errores actuales.

## Consumidores afectados

Actualizar paths/auth.yaml, schemas/auth.yaml y path raíz OpenAPI; ampliar
platform.yaml con institución activa y respuestas 400/503 donde corresponda.
Regenerar frontend/src/lib/api/schema.d.ts. En client.ts excluir login, /health
y /ready del envío de Authorization; comprobar que getToken no se llama allí.
Conservar listAccessibleInstitutions/getCurrentUser y DTO actuales.
Sin helper de login ni UI nueva: el cliente tipado ya puede ejecutar POST.
