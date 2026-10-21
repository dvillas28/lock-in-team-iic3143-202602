# Quickstart: Demo y backend con institución por path

Comandos locales implementados; no acreditan cambios desplegados. Ver [runbook](../../docs/backend/demo-tenant-bootstrap.md).
Nunca ejecutar suites de fixtures contra producción: borran esquema. Las dos URLs de test deben
apuntar a la misma base descartable terminada en _test, con credenciales operativa/runtime separadas.

## Preparación local

Node 24, pnpm 9.15.9 y PostgreSQL 17/18; conexión operativa con capacidad de migrar/provisionar rol.
Inyectar DATABASE_URL runtime, MIGRATION_DATABASE_URL operativa y AUTH_JWT_SECRET por entorno seguro.
Al primer bootstrap inyectar los diez passwords de [demo-deployment](contracts/demo-deployment.md).
No guardar secretos en esta guía, argumentos, Git ni logs.

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
export CORS_ALLOWED_ORIGINS='["http://localhost:3000"]'
export DEMO_DATA_ENABLED=true
export DEMO_OPERATOR_REF=local-demo-v1
pnpm --dir backend build
pnpm --dir backend db:predeploy
```

Primera carga vacía: 2 instituciones, 10 users y 10 memberships. Tres replays no cambian
IDs, contraseñas, estados ni permisos; ya aplicada no exige los passwords iniciales.
Adopción legacy usa DEMO_ADOPT_LEGACY=true solo con fixtures reconocidos; conservar cuentas antiguas.

## API local sin subdominios

```bash
pnpm --dir backend start
```

En otra terminal:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl -i http://localhost:3001/api/v1/institution/uc/courses
curl -i http://localhost:3001/api/v1/institution/utfsm/courses
```

Esperado: salud/ready 200; cursos sin token 401. No requiere DNS, hosts locales ni curl --resolve.
Login: POST /api/v1/auth/login con JSON email/password del manifiesto, por Postman o STDIN protegido.
Guardar accessToken de 900 segundos en variable privada del cliente, sin imprimirlo en evidencia.
Con token UC: GET /api/v1/institution/uc/me devuelve contexto; el path UTFSM devuelve 404 si no pertenece.
Una identidad con membresías en ambas puede elegir cualquiera por path, con sus permisos propios.
GET /api/v1/institutions conserva listado global autenticado, en plural.
GET /api/v1/courses sin contexto no es un endpoint académico disponible.
El prefijo plural antiguo /api/v1/institutions/uc/courses no es un alias del singular acordado.

## CORS

```bash
curl -i -X OPTIONS http://localhost:3001/api/v1/institution/uc/courses -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: authorization,content-type'
```

Esperado: 204, origen exacto, métodos/headers permitidos y Vary: Origin, sin JWT.
Origin=https://evil.example no recibe Access-Control-Allow-Origin; request real sin token sigue 401.
Curl sin Origin sigue validando JWT, slug y pertenencia. Host/Forwarded/Origin no cambian el path elegido.

## Recorrido por institución

Todas las rutas siguientes parten de /api/v1/institution/{institutionSlug}:

1. Login superadmin UC; GET /memberships; PUT /memberships/{id}/course-admin con isAdmin=true al futuro admin.
2. Login admin; POST /courses con code/name/term/initialSection; capturar IDs de curso/sección.
3. Asignar teacher, assistant y student por /sections/{id}/enrollments, usando personas del manifiesto.
4. Docente publica material y quiz válidos; usar schemas del catálogo para horarios, pauta y pesos.
5. Estudiante inicia/guarda/envía intento; docente publica notas; estudiante consulta my-grades.
6. Repetir con slug UTFSM; cruzar IDs y tokens para comprobar 404/403 y ausencia de cambios cruzados.
7. Revocar isAdmin y reejecutar predeploy: no restaura el flag ni modifica notas o credenciales.

Roles académicos por sección; las etiquetas del manifiesto no son permisos globales.
Conservar auditoría; capturar tokens/IDs en memoria, nunca en una colección versionada con secretos.

## Validación automatizada

Con TEST_DATABASE_URL operativa y TEST_RUNTIME_DATABASE_URL en la misma base _test:

```bash
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir backend test:coverage
pnpm docs:api:lint
pnpm docs:api:test
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
python3 .github/scripts/check-doc-length.py
```

No ejecutar suites que reinicializan esquema en paralelo sobre la misma DB.
Assertions RLS usan runtime real: queries sin filtro, 100 operaciones alternadas y 20 reusos tras error.

## Railway y consumidor

Backend público: https://api.dvillasc.me. Validar su CNAME/TXT/TLS y predeploy efectivo.
CORS producción: https://uc.academix.dvillasc.me y https://utfsm.academix.dvillasc.me.
Probar preflight permitido con ambos Origin sobre API central y solicitudes reales autenticadas.
Ejemplo UC: https://api.dvillasc.me/api/v1/institution/uc/courses; UTFSM usa el mismo origen y su slug.
Cliente generado: baseUrl=https://api.dvillasc.me; ruta ya incluye /api/v1 e institutionSlug.
El operador suministra DEMO_*_PASSWORD vigentes y SMOKE_ALLOWED_ORIGIN al smoke, no al runtime.
`node scripts/postdeploy-demo.mjs` prueba salud/login/me/CORS; `--workflow` habilita mutaciones explícitas.
La carga idempotente no recupera secretos ni permisos revocados para hacer pasar el smoke.
Workflow requiere admin delegado; solo SMOKE_DELEGATE_ADMIN=true autoriza delegarlo explícitamente.
Registrar commit/versión, readiness/RLS y pruebas por ambos paths; documentos no equivalen a despliegue.
