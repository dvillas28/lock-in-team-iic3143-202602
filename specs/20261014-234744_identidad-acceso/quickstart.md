# Quickstart: Validación de identidad y acceso

Guía de ejecución de [tasks.md](tasks.md). Evidencia local en
[validación](../../docs/backend/identity-access-validation.md).

## Prerrequisitos

Node 24, pnpm 9.15.9, Docker/PostgreSQL 17; base-persistente operativa.
Instalar dependencias con pnpm en raíz, backend y frontend.
Configurar DATABASE_URL y las cinco DEMO_*_PASSWORD de .env.example en el entorno
local; no usar credenciales reales ni pegarlas en comandos o evidencia.
Exportar explícitamente SPECIFY_FEATURE_DIRECTORY=specs/20261014-234744_identidad-acceso.
Configurar AUTH_JWT_SECRET con un secreto aleatorio base64 de ≥32 bytes y
TEST_DATABASE_URL exclusiva cuyo nombre termine en _test. Nunca apuntar tests
a la base demo: el helper de integración borra su schema public.
La validación local usa un contenedor PostgreSQL 17 separado, puerto 55439,
base academix_identity_test; no reutiliza volúmenes de desarrollo.

```bash
docker compose up -d postgres
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend build
pnpm --dir backend db:migrate
pnpm --dir backend db:seed
pnpm --dir backend start
```

Comandos pnpm no cargan .env automáticamente: exportar variables previamente.
Crear la DB de test con el cliente PostgreSQL antes de ejecutar integración.
No guardar secretos ni respuestas de login en archivos versionados o screenshots.
Compose exige AUTH_JWT_SECRET sin default. Migración aplica índice único
normalizado: ante colisiones aborta sin tocar usuarios; resolver datos fuera
de esta misión y reintentar, sin borrar/fusionar automáticamente.
`node backend/test/compose-smoke.mjs` construye imagen y crea un proyecto/volumen
Compose exclusivo con secretos en memoria y puertos dinámicos locales; verifica
migraciones, seed repetido, sondas y tres operaciones. Limpia sus recursos al salir.

## Validación automatizada

```bash
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir backend test:coverage
pnpm docs:api:lint
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
python3 .github/scripts/check-doc-length.py
```

Tests secuenciales reutilizan helpers.mjs y seed; credenciales generadas por test.
La suite debe capturar logs sin mostrarlos ante un fallo de sanitización.
CI backend-coverage ya proporciona PostgreSQL 17 y TEST_DATABASE_URL exclusiva.
Dar secreto efímero a procesos HTTP de pruebas; sin secreto de producción en CI.

## US1: login y descubrimiento

1. POST /api/v1/auth/login con demo-multi@academix.example y contraseña local:
   200 con tokenType=Bearer, expiresIn=900 y Cache-Control:no-store.
2. Conservar token solo en memoria y pedir GET /api/v1/institutions:
   UC y UTFSM, ordenadas por slug, sin hashes, secretos ni otras cuentas.
3. Login demo-uc solo lista UC; demo-utfsm solo UTFSM; demo-revocado lista vacía.
4. Contraseña incorrecta, usuario inexistente e inactivo: mismo 401 sanitizado.
5. Sin Bearer, firma/claims alterados o expiración: 401 sin datos protegidos.
6. JSON/campos inválidos: 400; tamaño excesivo 413; tipo no JSON 415.
7. Cinco solicitudes en ventana admitidas; sexta 429 con Retry-After. Encabezados
   X-Forwarded-For diferentes no eluden la cuota; tras 60 s de bloqueo se admite.
8. Inicio sin secreto o con secreto corto: falla sin exponer configuración.
9. Antes de cerrar US1: lint OpenAPI y frontend api:check/typecheck/test verdes;
   login/listado presentes en contrato canónico y tipos generados actualizados.

## US2: contexto y revocación con sesión existente

1. JWT multi: GET /api/v1/institutions/uc/me y /utfsm/me conserva el mismo id
   global y devuelve institutionMembership distinta, sectionMemberships=[].
2. JWT UC pidiendo /utfsm/me, slug inexistente, institution inactiva y membership
   revocada: mismo 404 sin revelar recursos. Slug malformado autenticado: 400.
3. Fixture SQL en DB exclusiva desactiva membership multi/UC y confirma COMMIT.
   Reutilizar JWT: UC desaparece del listado, /uc/me da 404 y UTFSM sigue accesible.
4. Restaurar fixture, desactivar Institution: mismo aislamiento en siguiente
   consulta; desactivar User: ambas operaciones dan 401 con JWT aún no expirado.
5. Simular DB caída en fixture dedicado: 503 sin datos anteriores ni SQL.
6. Peticiones alternadas/concurrentes UC y UTFSM nunca mezclan contexto.
7. Repetir login/GET no modifica usuarios, hashes, memberships ni timestamps.
8. Antes de cerrar US2: contrato /me actualizado, tipos regenerados y checks
   OpenAPI/frontend verdes, conservando CurrentUser y su operationId.

## Cierre

Verificar /health y /ready públicos, sin Bearer enviado desde el cliente tipado.
Probar DTO y operationIds existentes del frontend sin crear UI de login.
Registrar comandos, resultados y límites en docs/backend/identity-access-validation.md;
no declarar validación de despliegue ni escenarios que no se ejecutaron.
Contrato: [HTTP](contracts/http.md), [seguridad](contracts/security.md),
[modelo](data-model.md). La comprobación local no cierra pendientes operativos
Railway de base-persistente ni acredita una política multiinstancia.
