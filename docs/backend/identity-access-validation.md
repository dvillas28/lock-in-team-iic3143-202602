# Identidad y acceso: evidencia local

Fecha: 2026-10-15. Validación local previa al stack de PRs; sin despliegue.
Alcance: T001–T028, US1 y US2; FR-001–FR-008, SC-001–SC-003.
Checks técnicos de T027 PASS; checkboxes conservados sin actualizar.
Auditoría frontend adicional seguida por separado; no bloquea el alcance original de T027.

## Entorno y aislamiento

- Node 24.14.0; pnpm 9.15.9; PostgreSQL 17 real, Docker Compose 5.3.0.
- Revalidación: contenedor nuevo `academix-findings-20261015`, puerto local dinámico,
  base nueva `academix_findings_20261015_test`. TEST_DATABASE_URL exportada solo a comandos
  de prueba; helpers rechazan destinos que no terminan `_test` antes de conectar.
- SPECIFY_FEATURE_DIRECTORY=specs/20261014-234744_identidad-acceso explícita
  en check-prerequisites; FEATURE_DIR y artefactos resueltos correctamente.
- Credenciales, JWT y secretos efímeros en memoria; assertions sobre datos
  sensibles usan booleanos y mensajes fijos. No se conserva respuesta de login.
- JWT 12.0.3 y Throttler 6.7.1 exactos; pnpm add --save-exact sin overrides nuevos
  ni advertencias de peers incompatibles. Argon2 y DatabaseService reutilizados.
- requirements.md: 16/16 PASS. Hooks opcionales de commit omitidos por instrucción.

## US1: pruebas ejecutables

- Tests escritos primero: fallo inicial por módulos ausentes; frontend público
  falla antes de corregir getToken para /ready y login. Después pasan.
- `backend/test/auth.test.mjs`: configuración obligatoria/canónica, DTO estricto,
  email de 254 caracteres y password Unicode de 128 bytes; rechazo al excederlos.
  Spy verifica hash real en inactivos/password errónea y dummy reutilizado para
  desconocidos. Hash malformado y DB caída producen 503 sanitizado.
- JWT firmado verificable HS256, iss/aud/sub/iat/exp obligatorios, 900 segundos;
  rechazos de none, firma/algoritmo/issuer/audience/claims/exp inválidos.
  Guard rechaza Bearer múltiple/excesivo y JWT inválido antes de consultar DB.
- `login-email.test.mjs`: migración vacía/poblada/repetida, colisión normalizada
  revierte DDL/historia sin cambiar filas; inserciones concurrentes equivalentes
  admiten solo una. Seed repetido conserva datos, hashes y timestamps.
- `auth.test.mjs` de integración: HTTP real, éxitos, mismo 401 genérico para
  desconocido/inactivo/password errónea; JSON/DTO/media type/tamaño inválidos;
  no-store, WWW-Authenticate y logs sanitizados; lecturas sin mutaciones.
- `institution-list.test.mjs`: UC solo UC, UTFSM solo UTFSM, multi ambas ordenadas,
  revocado vacío, solo estados activos, sin identidad 401 y fallo SQL 503.
  Cliente frontend tipado prueba health/ready/listado contra HTTP real.
- `login-limit.test.mjs`: registro Throttler de AppModule y guard/storage reales, cinco admisiones concurrentes,
  sexto 429, Retry-After 60/10/1, bloqueo sin extensión, desbloqueo y TTL con reloj
  controlado, sin sleeps. Ráfaga HTTP confirma cinco admisiones y un 429;
  X-Forwarded-For diferente no elude cuota. Éxitos/errores consumen cuota.
- `problem.filter.test.mjs`: Problem completo 400/401/403/404/413/415/429/500/503,
  traceId servidor, instance sin query, campos seguros y headers preservados.
- Readiness prueba arranque sin secreto/inválido/corto sin escuchar HTTP;
  sondas públicas conservan sus contratos incluso durante fallo de DB.

## US2: pruebas ejecutables

- `institutions.test.mjs` escrito antes de /me: inicialmente 404 donde se exige
  200; después pasa. CurrentUser explícito, roles vacíos, sin hashes/tokens,
  slug inválido 400 después del guard y JWT inválido 401 antes de validar slug.
  Contexto ajeno/inexistente produce el mismo Problem 404; sin mutaciones.
- `access-revocation.test.mjs`: veinte consultas UC/UTFSM concurrentes conservan
  contexto. Una transacción no confirmada no altera acceso; rollback conserva
  acceso. Tras COMMIT de revocación de membership o Institution, mismo JWT omite
  UC y devuelve 404 en UC; UTFSM conserva 200. Fixtures restauradas.
- Inactivar User produce 401 en listado y ambos contextos. DB con conexiones
  deshabilitadas y pool terminado produce 503 sin fallback; recuperación da 200.
- Cada operación posterior al COMMIT usa permisos persistidos vigentes. No se
  promete cancelar consultas que ya habían empezado antes del COMMIT.
- CurrentUser y operationIds existentes conservados; contrato /me y tipos
  regenerados dentro de US2. No hay selección de institución global en servidor.

## Comandos y resultados finales

| Comando | Resultado |
| --- | --- |
| pnpm --dir backend lint | PASS |
| pnpm --dir backend test | PASS: 11/11 |
| pnpm --dir backend test:integration | PASS: 16/16, PostgreSQL 17 |
| pnpm --dir backend test:coverage | PASS: 27/27 |
| pnpm docs:api:lint | PASS; advertencia histórica /ready sin 4xx |
| pnpm --dir frontend api:check | PASS |
| pnpm --dir frontend typecheck | PASS |
| pnpm --dir frontend test | PASS: 21/21 |
| pnpm --dir frontend lint | PASS |
| pnpm --dir frontend build | PASS |
| python3 .github/scripts/check-doc-length.py | PASS |
| git diff --check | PASS |
| pnpm --dir backend audit --audit-level high | PASS |
| pnpm --dir frontend audit --audit-level high | FAIL preexistente; ver límites |
| node backend/test/compose-smoke.mjs | PASS |

Cobertura c8: líneas/statements 99,13%; ramas 94,53%; funciones 97,77%.
Auth tiene 100% líneas/ramas/funciones; instituciones 100% líneas/funciones.
No hay umbral c8 local configurado. Evidencia histórica de base-persistente
registra gate remoto Sonar de 80% en código nuevo; esta cobertura total no
sustituye ese cálculo. Estos resultados locales no acreditan Sonar ni CI remoto.
CI incluye glob unitario/integración secuencial y PostgreSQL 17; instala cliente
frontend para su integración real, publica LCOV y ejecuta smoke Compose aislado.
Job contracts incondicional ejecuta lint OpenAPI, api:check y typecheck; CI result lo requiere.

## Imagen/Compose y revisión

Smoke construyó imagen backend con lockfile congelado y usuario node; levantó
solo backend/PostgreSQL con proyecto, volumen, DB y secretos exclusivos. Verificó
PostgreSQL 17, dos migraciones repetibles, seed 2 instituciones/5 usuarios/6
memberships y segunda ejecución sin crear ni modificar filas. Sondas públicas,
JWT verificable, listado y /me UC/UTFSM/multi/revocado pasan; huella de las tres
tablas no cambia tras HTTP y logs no contienen secretos. Contenedores y volumen
Compose eliminados en finally. Contenedor de integración también eliminado.
Script repetible; no usa DB demo/desarrollo.

Revisión lms-db-design/lms-reviewer: índice en DB, queries parametrizadas,
JOIN con tres estados activos, proyección explícita, sin cachear permisos ni
roles desde JWT/URL. Sin registros académicos mutables ni endpoints de escritura.

## Regresiones de auditoría A01–A06

- Terminación HTTP restringida a current_database(); conexión de mantenimiento
  con igual application_name en otra DB permanece utilizable en ambas pruebas de caída.
- Filtro e integración preservan JSON 503 para /ready, /ready/, /READY y querystring.
- Slugs HTTP/OpenAPI usan el CHECK histórico: legacy--campus se lista y /me da 200;
  no se modifica la migración aplicada ni se renombran datos.
- Cuota usa registro productivo con reloj controlado: TTL comprobado en 59999/60000 ms.
  Mutar solo en memoria ttl=60001 o blockDuration=59000 hace fallar la prueba conductual.
- Unitario readiness falló con el filtro anterior; pasa tras la corrección.
- YAML CI parseado localmente; ejecución del workflow remoto no acreditada.
- Modelo corregido: traceId solo en Problem; no se promete correlación de logs HTTP.

## Límites y pendientes externos

Cuota en memoria por instancia: reiniciar restablece contadores. Proxy/NAT puede
compartir cuota entre usuarios. trust proxy deshabilitado: X-Forwarded-For no
modifica IP observada. Revisar política antes de exposición pública o escalado.
Auditoría frontend adicional reporta GHSA-vfj7-8cjw-p6xm en braces 3.0.3,
transitivo de eslint-config-next → fast-glob → micromatch; severidad alta,
sin versión corregida según pnpm audit. Lockfile frontend no modificado.
No se oculta con overrides; requiere corrección upstream/seguimiento separado.
Sin despliegue, Trivy ni gate Sonar remoto ejecutados. No se cierran pendientes
operativos Railway/proxy de base-persistente ni se acredita política multiinstancia.
