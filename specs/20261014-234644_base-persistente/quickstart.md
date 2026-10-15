# Quickstart: validar base persistente

Implementados US1/US2 (T001–T024). CI y cierre remoto/recuperación siguen pendientes.
[Contratos](contracts/operations.md) · [Evidencia local](../../docs/backend/base-persistente-validation.md).
Nunca validar con una base de desarrollo operada o producción.

## Preparación local

Requisitos: Node 24, pnpm 9.15.9, Docker Compose y puertos 5432/3001 disponibles.
Conservar `.env` existente; copiar `.env.example` únicamente si falta.
Compose carga `.env`; pnpm/Node en el host requieren variables exportadas.
`DATABASE_URL` debe apuntar a la base de desarrollo para operar el backend local.

Seed viene deshabilitado. Para una demo, definir `DEMO_SEED_ENABLED=true`
y las cinco `DEMO_*_PASSWORD` de `.env.example` en el entorno privado.
Cada contraseña requiere 8–30 caracteres Unicode; sin valores predeterminados.
Argon2id usa memoria 19456 KiB, tiempo 2, paralelismo 1 y sal aleatoria de 16 bytes.
Solo se generan hashes para usuarios faltantes; repetir no rota credenciales.

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend build
docker compose config --quiet
docker compose up --build --wait backend
curl --fail http://localhost:3001/health
curl --fail http://localhost:3001/ready
```

Compose ejecuta migración → seed opt-in → HTTP. Un fallo impide escuchar.
`docker compose up --build -d frontend` inicia frontend después del backend healthy.
Con demo omitida, una base vacía queda con tres tablas de dominio sin filas demo.
Con demo habilitada, una base vacía produce 2 instituciones, 5 usuarios y 6 memberships.
El volumen `postgres_data` conserva datos. No borrar volúmenes para esta prueba.

## CLI e idempotencia

Después de compilar y exportar `DATABASE_URL`, desde la raíz:

```bash
pnpm --dir backend db:migrate
pnpm --dir backend db:seed
```

Equivalentes dentro de la imagen final, sin gestor de paquetes:

```bash
docker compose exec backend node dist/platform/database/migrate.js
docker compose exec backend node dist/platform/database/seed.js
docker compose exec backend node dist/platform/database/seed.js
docker compose restart backend
curl --fail http://localhost:3001/ready
```

El seed conserva IDs, nombres editados, hashes, estados y timestamps.
Resuelve instituciones por slug, usuarios por UUID y memberships por pareja.
Colisiones de identidad fallan con rollback completo; no reutiliza otro usuario.
No existe ruta HTTP de seed, migración o escritura de estas tablas.

## Integración con PostgreSQL 17

Usar una DB exclusiva y descartable terminada en `_test`, nunca la de desarrollo.
El harness borra y reconstruye `public` exclusivamente en ese destino validado.
Las pruebas de indisponibilidad necesitan permiso de operador para modificar
`ALLOW_CONNECTIONS` de esa DB y terminar sus conexiones; usan `/postgres` del
mismo servidor solo como conexión administrativa, sin modificar su esquema/datos.

Crear el destino local solo si no existe; introducir su URL sin eco ni historial:

```bash
docker compose exec postgres sh -c 'createdb -U "$POSTGRES_USER" academix_test'
read -rs TEST_DATABASE_URL
export TEST_DATABASE_URL
pnpm --dir backend test:integration
```

No hay fallback a `DATABASE_URL`. Configuración ausente/insegura falla antes de
limpiar. La suite compila y ejecuta secuencialmente `test/integration/*.test.mjs`.
Genera credenciales aleatorias y compara datos sin imprimirlos.
No ejecutar otro build del backend mientras corre la suite: ambos usan `dist`.
CI todavía no ejecuta integración: se agrega en T025.

```bash
pnpm lint
pnpm test
pnpm build
pnpm docs:api:lint
pnpm exec redocly lint specs/20261014-234644_base-persistente/contracts/readiness.openapi.yaml
python3 .github/scripts/check-doc-length.py
git diff --check
```

`/ready` usa solo 200/503; el warning OpenAPI por ausencia de 4xx es esperado.
Pruebas de configuración/guard sin DB: `pnpm --dir backend test`.

## Imagen Alpine y durabilidad

Ejecutar estos pasos solo con Compose conectado a una DB local de validación.
Construyen la imagen final real y comprueban ubicación independiente del cwd:

```bash
docker compose build backend
docker compose up --wait -d backend
docker compose exec -w /tmp backend node /app/dist/platform/database/migrate.js
docker compose exec backend sh -c 'test "$(id -u)" != 0 && ! command -v npm && ! command -v pnpm && test -f /app/migrations/20261015000100_institutional-foundation.sql'
docker compose exec backend node -e 'const a=require("argon2"); const p=require("node:crypto").randomBytes(12).toString("hex"); (async()=>{const h=await a.hash(p,{type:a.argon2id,memoryCost:19456,timeCost:2,parallelism:1}); require("node:assert/strict").ok(await a.verify(h,p)); console.log("Argon2id OK")})().catch(()=>process.exitCode=1)'
docker compose restart postgres
docker compose up --wait -d postgres
docker compose restart backend
docker compose up --wait -d backend
curl --fail http://localhost:3001/ready
```

En una base demo vacía, ejecutar seed dos veces y concurrentemente; verificar
2/5/6 con consultas de conteo. Comparar snapshots ordenados por ID en memoria,
incluyendo hashes/estados/fechas, sin imprimirlos; la suite automatiza esas comparaciones.
La evidencia registra también esa comparación tras reiniciar ambos contenedores.
Nunca usar `down -v`, truncar una base existente ni versionar dumps/archivos secretos.

## Railway y cierre posterior

`backend/railway.json` configura migración compilada en pre-deploy y `/ready`.
El CMD solo inicia HTTP. Seed Railway es acción explícita del operador
sobre la misma imagen/entorno; no se ejecuta automáticamente en cada deploy.
Una conexión pública exige `sslmode=verify-full`, con CA válida; conexiones locales
privadas y `*.railway.internal` pueden usar transporte privado sin TLS.
No se admite deshabilitar validación de certificados ni opciones URL arbitrarias.
La URL fija sslmode explícitamente; PGSSLMODE no la sustituye. no-verify y
NODE_TLS_REJECT_UNAUTHORIZED=0 se rechazan incluso en el entorno efectivo del proceso.

T025–T030 permanecen pendientes: CI, guía operativa, cierre de checks,
compatibilidad con app anterior, evidencia Railway y recuperación completa.
Seguir [operación](contracts/operations.md#recuperación) para dump/restore aislado,
snapshots/PITR/retención y RPO/RTO reales cuando se autorice el cierre operativo.
