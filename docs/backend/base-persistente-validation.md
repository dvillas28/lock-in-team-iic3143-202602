# Base persistente: evidencia local US1/US2

Fecha: 2026-10-15. Alcance: T001–T024 de
[base-persistente](../../specs/20261014-234644_base-persistente/tasks.md).
No cierra el spec. T025–T030 permanecen pendientes.

## Entorno y aislamiento

- Host: Node 24.14.0, pnpm 9.15.9; Docker disponible.
- Integración: PostgreSQL 17.10 (`postgres:17-alpine`), contenedor nuevo
  `academix-persistence-test`, puerto efímero local y credenciales aleatorias.
- `TEST_DATABASE_URL` exclusiva, nombre terminado en `_test`, sin fallback.
- Harness rechaza URL ausente, malformada, protocolo ajeno, DB sin sufijo y
  opciones de conexión que puedan alterar el destino/search_path.
- Fixtures limpian únicamente `public` del destino validado. Prueba de pérdida
  de DB usa conexión administrativa a `/postgres` del mismo servidor aislado,
  sin modificar datos/esquema de esa base administrativa.
- Compose usa proyecto separado `academix-persistence-validation`, sin publicar
  puertos del host y con volumen nuevo `academix_persistence_validation_pg`.
- No se vaciaron bases de desarrollo/producción ni se borraron volúmenes.
  Secretos de pruebas solo en memoria/archivos temporales privados, no versionados.
  Al terminar se detuvieron los contenedores creados, se conservaron los volúmenes
  y se eliminaron los archivos temporales de credenciales.

## Validación inicial: comandos y resultados

| Check ejecutado | Resultado |
| --- | --- |
| `pnpm --dir backend install --frozen-lockfile` | Dependencias fijadas; imagen confirma lockfile |
| `pnpm lint` | Frontend y backend OK |
| `pnpm test` / `pnpm --dir backend test` | 2 tests existentes OK, sin DB |
| `pnpm --dir backend test:integration` | 10 tests OK, secuenciales, PostgreSQL 17 real |
| `pnpm build` | Frontend y backend OK |
| `pnpm --dir backend audit --audit-level=high` | Sin vulnerabilidades conocidas |
| `docker compose config --quiet` | OK |
| `docker build -t academix-persistence-validation backend` | Imagen Alpine final construida |
| CLI dentro de la imagen final | Migración y bootstrap OK con `node` |
| `pnpm docs:api:lint` | Válido; warning esperado de 4xx en `/ready` |
| Lint contrato readiness independiente | Válido; warnings documentales esperados |
| `python3 .github/scripts/check-doc-length.py` | Documentos modificados dentro del límite |
| `git diff --check` | OK |

Comandos reproducibles y requisitos en [quickstart](../../specs/20261014-234644_base-persistente/quickstart.md).
Next advierte sobre múltiples lockfiles existentes; build termina correctamente.
Una corrida con builds host simultáneos invalidó `dist`; se descartó y se repitió
la suite secuencialmente: 10/10 OK (~22,5 s), sin builds host competidores.

## US1: persistencia y disponibilidad

- Migración inicial aplicada dos veces: una entrada de historia, tres tablas
  de dominio; sin unicidad global de email. Un usuario tiene dos memberships.
- Slug/pareja duplicados, FK inexistentes, borrados/updates restringidos,
  NOT NULL, longitudes y checks rechazan operaciones sin alterar snapshots.
- FK/clave compuesta tenant-aware e índice user/active/institution presentes.
- Lote pendiente con DDL válido seguido de SQL fallido: sin DDL parcial ni nueva
  historia. Lock del migrador ocupado: segunda ejecución falla sin deshabilitarlo.
- Arranque rechaza URL/TLS inseguros, DB ausente o esquema incompleto antes de
  escuchar HTTP y en menos de 30 s. No ejecuta migración desde hooks HTTP.
- `/ready`: cuerpos exactos `{status: ok}` y `{status: unavailable}`, 200/503.
  Columna perdida o DB que rechaza conexiones produce 503 en menos de 5 s;
  recuperación vuelve a 200. Una columna aditiva no invalida el esquema mínimo.
- Pool compartido: máximo 5; saturar conexiones/cola falla dentro de 5 s;
  consulta `pg_sleep(10)` queda acotada por timeout de 2 s.
- SIGTERM cierra conexiones HTTP; Pool finaliza sin conexiones pendientes.
- `/health` conserva sus cinco campos y sigue 200 durante la caída de DB.
  `/bootstrap` y `/db/bootstrap` responden 404.

## US2: bootstrap demo

- Ausente/false: salida 0 omitida incluso con URL inválida; sin conexión.
- Flag ajeno, cualquiera de las cinco contraseñas ausente o longitud 7/31:
  salida 1/config antes de conectar. Se aceptan límites Unicode 8 y 30.
- Desde vacío: exactamente 2 instituciones, 5 usuarios, 6 memberships;
  un usuario inactivo, una membership inactiva y un usuario multiinstitución.
- Argon2id PHC: memoria 19456 KiB, tiempo 2, paralelismo 1, sal aleatoria 16 bytes.
  Hash/verify comprobado para los cinco usuarios, también dentro de Alpine.
- Repetición y dos procesos concurrentes conservan snapshots completos.
  Triggers de test confirman que repetir no intenta insertar filas ya existentes.
  Cambiar contraseñas de entrada no rota hashes ni reactiva memberships.
- Nombre/estado institucional y de usuario editados, email normalizado compatible,
  IDs y timestamps conservados. Solo se repone una membership faltante.
- UUID con otro email o email normalizado de otro UUID: error/conflict y rollback.
- Trigger de test fuerza error tras inserciones iniciales: rollback completo;
  sin flag productivo de inyección. Reintento posterior funciona.
- Advisory lock de bootstrap retenido: timeout limpio (~10 s), cero inserciones;
  liberar y reintentar crea el dataset sin duplicados.
- Logs finales de CLI/contenedor sin credenciales, hashes, emails ni SQL con valores.
  Harness sanitiza también errores inesperados de PostgreSQL antes de reportarlos.

## Imagen y Compose

- Runner conserva SQL en `/app/migrations`, dependencias productivas y usuario
  no privilegiado. No dispone de npm/pnpm/npx/corepack/yarn.
- Migrador ejecutado desde `/tmp` con ruta absoluta al JS: OK.
- Bootstrap omitido ejecutado sin DATABASE_URL dentro de imagen: salida 0.
  Otra DB vacía aislada: migración + bootstrap false + HTTP ready con 0/0/0.
- Compose ejecutó migración → bootstrap → HTTP hasta healthy.
  Dos bootstrap concurrentes en el contenedor: misma identidad/dataset 2/5/6.
- Comparación en memoria de snapshots completos antes/después de repetir bootstrap
  y reiniciar PostgreSQL/backend con el volumen nuevo: igualdad exacta.
- Nombres editados y memberships revocadas sobreviven bootstrap y ambos reinicios.
- PostgreSQL detenido de verdad: readiness 503 en menos de 5 s; health 200.
  Arranque de PostgreSQL y reinicio del backend recuperan readiness 200.
- Frontend depende declarativamente del backend healthy; no se modificó su código.

## Límites y cierre pendiente

T025–T030 no se ejecutaron ni se marcaron completas. Falta integrar PostgreSQL
con CI, guía operativa y cierre formal de checks/compatibilidad con app anterior.
No hubo despliegues ni cambios de recursos remotos, commits, push o merges.
Faltan instalación vacía y reinicio durable en Railway, checks remotos,
dump/restore aislado, snapshots/PITR/retención y medición real de RPO/RTO.
TLS se verifica aquí mediante rechazo de configuración insegura/CA inexistente;
no se ensayó un endpoint PostgreSQL público con una cadena CA válida.
No se declara satisfecho SC-003 Railway ni recuperación del spec completo.

## Correcciones posteriores a la auditoría

- La política TLS queda fijada explícitamente en la URL entregada a pg.
  Se rechazan PGSSLMODE=no-verify y NODE_TLS_REJECT_UNAUTHORIZED=0 tanto del
  entorno recibido como del proceso; otros modos ambientales no sustituyen la URL.
- Pruebas sin DB comprueban las opciones efectivas del driver y que una assertion
  fallida de sanitización no adjunta su entrada sensible al error.
- Negativos de flag/las cinco contraseñas usan URL válida: un listener observa
  cero conexiones. Incluyen ausencia, vacío y longitudes ASCII/Unicode 7/31.
  Se repiten sobre demo existente y conservan el snapshot completo.
- Assertions de hashes/salida usan booleanos y mensajes constantes; errores de
  parseo/verificación tampoco incluyen la entrada original.
- Nueva corrida local: lint, 4 tests sin DB, 10 de integración con PostgreSQL 17
  aislado, build frontend/backend, OpenAPI y checks documentales satisfactorios.
- Imagen reconstruida: ambos CLI con node, migración desde /tmp, Argon2id verify
  de los cinco usuarios, repetición y rechazo del override TLS inseguro correctos.
- T025–T030 siguen pendientes; estos resultados no acreditan operación remota,
  compatibilidad con app anterior ni recuperación. Warnings previos sin cambios.
