# Base persistente: evidencia local US1/US2

Fecha: 2026-10-15. Alcance: T001–T024 de
[base-persistente](../../specs/20261014-234644_base-persistente/tasks.md).
No cierra el spec. T025–T030 permanecen pendientes.

## Versión y cambios comprobados

Poda sobre `1175a21`: siete archivos TypeScript productivos, sin platform,
DatabaseModule, schema.ts ni controlador separado de readiness.
Un DatabaseService registrado en AppModule mantiene el Pool; un controlador
expone /health y /ready. Comandos de migración y seed en carpetas propias.
El seed está en src/seeds/demo.ts, sin bandera ni ejecución al arrancar.
Validaciones del manifiesto constante salen del runtime; contraseñas, TLS,
colisiones, transacción, lock y preservación de datos se mantienen.

Arranque/readiness resuelven tablas y columnas requeridas sin leer filas.
No comprueban drift manual de tipos/defaults/índices/constraints: esas garantías
se definen en SQL y se verifican con integración. Contratos/ADR actualizados.

## Entorno y aislamiento de esta pasada

- Node 24, pnpm 9.15.9; Docker disponible.
- PostgreSQL 17 Alpine nuevo, credenciales aleatorias y puerto local efímero.
- TEST_DATABASE_URL exclusiva terminada en _test, sin fallback a DATABASE_URL.
- Harness rechaza destino ausente/malformado, protocolo ajeno, sufijo incorrecto
  y opciones que pueden cambiar destino/search_path antes de limpiar.
- Fixtures recrean public solo en esa DB descartable. La prueba de caída usa
  /postgres del mismo servidor como conexión administrativa, sin alterar sus datos.
- Compose usa proyecto separado y volumen nuevo; no se vacían bases existentes.
- Secretos solo en memoria/archivo temporal privado; no se imprimen ni versionan.
- Builds de backend y suites se ejecutan secuencialmente para no invalidar dist.

## Checks de esta pasada

| Check | Resultado |
| --- | --- |
| pnpm lint | Frontend y backend OK |
| pnpm --dir backend test | 5/5, sin DB |
| pnpm --dir backend test:integration | 9/9, PostgreSQL 17 real; ~25,3 s |
| pnpm build | Frontend y backend OK |
| pnpm --dir backend audit --audit-level=high | Sin vulnerabilidades conocidas |
| docker compose config --quiet | OK |
| docker build -t academix-pr63-prune:local backend | Alpine final construida |
| CLI/Argon2id en imagen final | Migración, demo concurrente y verify de los cinco usuarios OK |
| pnpm docs:api:lint y contrato readiness independiente | Válidos; un warning 4xx cada uno |
| Longitud documental y enlaces locales modificados | OK |
| Spec Kit con SPECIFY_FEATURE_DIRECTORY explícita | Directorio correcto y artefactos disponibles |
| git diff --check | OK |

OpenAPI conserva exclusivamente 200/503 en /ready; no se inventa un 4xx para
silenciar lint. Next advierte múltiples lockfiles; pnpm emite DEP0169 sobre
url.parse durante instalación/audit. Ambos terminan correctamente.

## Qué comprueban las pruebas

- Migración repetida: tres tablas de dominio y una historia; sin email único.
- Catálogo: las 19 columnas con tipos, NOT NULL y defaults del modelo.
- Unicidades, checks, longitudes, FK RESTRICT, clave compuesta tenant-aware,
  índice user/active/institution e identidad multiinstitución.
- Lote pendiente fallido revierte DDL/historia; lock concurrente rechaza otro runner.
- Arranque inválido no escucha y falla antes de 30 s; no carga datos demo.
- /ready 200/503 con cuerpos exactos, pérdida de columna/DB y recuperación.
  Saturación del Pool y consulta lenta fallan antes de 5 s; máximo 5 conexiones.
- /health conserva sus cinco campos y funciona con DB caída; SIGTERM cierra Pool.
- Cinco contraseñas obligatorias, límites Unicode 8–30 y cero conexiones con
  entradas inválidas, también al repetir sobre datos existentes.
- Dataset exacto 2/5/6, usuario inactivo, membership revocada y multiinstitución.
- Argon2id: 19456 KiB, tiempo 2, paralelismo 1, sal 16 bytes; verify de cinco hashes.
- Repetición/concurrencia conserva IDs, nombres, hashes, estados y timestamps;
  solo repone faltantes, sin intentar insertar instituciones/memberships existentes.
- Colisiones UUID/email normalizado y fallo inducido revierten todo; reintento OK.
- Advisory lock ocupado: timeout limpio (~10 s), cero inserts y reintento OK.
- Logs/assertions no exponen secretos, emails, hashes ni SQL con valores.
- No hay endpoints de seed/bootstrap; migraciones y HTTP no importan el seed.

## Imagen y Compose

- SQL y dependencias productivas presentes; usuario no privilegiado, sin npm/pnpm.
- Ruta nueva del migrador ejecutada desde /tmp con node: OK.
- Compose inicia migración → HTTP con 0/0/0, aunque haya contraseñas demo configuradas.
- Seed manual concurrente crea 2/5/6; hash/verify y sal comprobados en Alpine.
- Repetir conserva instituciones editadas y memberships revocadas.
- La primera prueba de reinicio usó tmpfs, que descarta datos al detener PostgreSQL;
  se descartó como evidencia de durabilidad y se repitió con volumen nuevo persistente.
- Con ese volumen: snapshot completo idéntico tras reiniciar PostgreSQL y backend,
  incluidas instituciones editadas, hashes, fechas y todas las memberships revocadas.
- Se eliminaron únicamente contenedores/redes nuevos. El volumen de validación
  academix-prune-durable-cbcf0a4c_postgres_data se conserva; no se borran volúmenes.

## Evidencia histórica y límites

Los commits `a22e204` y `1175a21` documentaron verificaciones anteriores, con
nombres y contratos previos. No acreditan automáticamente la poda actual.
La pasada anterior detuvo PostgreSQL realmente: /ready 503 en 2,026 s y /health
200; recuperación 200. Esta pasada prueba además pérdida de conexión mediante SQL.
TLS se comprueba con política efectiva del driver/rechazo de configuración y CA
inexistente; no se ensayó un PostgreSQL público con cadena CA válida.

El último análisis remoto anterior a esta poda falló por cobertura nueva 65,6%
frente a 80% en Sonar. Sus logs importaron cobertura frontend, sin reporte backend;
la ejecución local de tests no sustituye ese reporte ni el resultado remoto nuevo.
T025 sigue pendiente: PostgreSQL 17/integración en CI y cobertura backend conectada.
No se modifica el umbral ni se excluye código productivo para aprobarlo.

Faltan T026–T030: guía operativa, cierre formal de checks/compatibilidad anterior,
instalación/reinicio Railway y dump/restore aislado, snapshots/PITR/retención,
RPO/RTO medidos. No se despliega ni modifica infraestructura remota en esta pasada.
No se declara satisfecho SC-003 Railway ni recuperación del spec completo.
