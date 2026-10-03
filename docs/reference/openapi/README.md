# Contrato OpenAPI de AcademiX

El punto de entrada es [`openapi.yaml`](openapi.yaml). El contrato usa OpenAPI
3.1, JSON con propiedades `camelCase`, paths separados por dominio y componentes
reutilizables bajo `components/`.

## Seguridad y contexto institucional

La API usa una identidad global mediante JWT Bearer. El claim `sub` identifica
al User y los permisos se obtienen desde memberships persistidas.

Los endpoints académicos declaran la Institution en el path:

```txt
/api/v1/institutions/{institutionSlug}/...
```

El slug solicita un contexto; no autentica ni autoriza. Antes de ejecutar una
operación, el backend resuelve la Institution, valida una
InstitutionMembership activa y luego aplica Enrollment y los
permisos del recurso.

`GET /health` es público. `GET /api/v1/institutions` requiere autenticación y
retorna únicamente Institutions accesibles para el User. No existe un endpoint
público de provisioning.

Política de errores:

- `401`: JWT ausente, inválido o expirado;
- `404`: Institution inexistente/no visible o recurso inexistente/fuera del
  scope institucional;
- `403`: Institution y recurso visibles, pero falta el rol requerido.

Los bodies académicos no aceptan `institutionId`; el contexto proviene del path
y se valida server-side.

## Visualización y validación local

```bash
pnpm install
pnpm docs:api
pnpm docs:api:lint
```

Redocly usa `openapi.yaml` y sus referencias relativas. La configuración vive
en `redocly.yaml`.

## Decisiones pendientes de implementación

- Emisor, audiencia, expiración y provisioning de identidades JWT.
- Capa de persistencia y herramienta de migraciones.
- Límite máximo de archivos y proveedor de object storage.
- Bootstrap idempotente de las Institutions demo `uc` y `utfsm`.

RLS, provisioning dinámico de Institutions, jerarquías institucionales y
restore lógico individual están fuera del MVP.
