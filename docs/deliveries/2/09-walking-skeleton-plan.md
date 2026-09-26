# Plan Walking Skeleton

## Objetivo

Probar que AcademiX puede desplegar frontend y backend en Railway, conectar
ambos, ejecutar CI/CD automatizado con `railway.toml` y resolver tenancy hacia
bases separadas.

No implementa todavia el flujo LMS completo.

## Alcance tecnico

Frontend:

- pantalla Hello World AcademiX;
- portal home para elegir universidad demo;
- rutas `/uc` y `/utfsm`;
- llamada a backend;
- muestra tenant resuelto y mensaje backend.

Backend:

- `GET /health`;
- `GET /api/hello`;
- lectura de `x-tenant` enviado por el frontend;
- consulta a registry;
- respuesta con tenant activo.

Datos:

- `registry_db` con tenants `uc` y `utfsm`;
- DBs `academix_uc_db` y `academix_utfsm_db`;
- tabla minima de prueba por tenant o migracion inicial del schema.

## CI propuesto

Stages minimos:

```txt
install
validate
test
build
```

Backend:

- instalar dependencias con `pnpm`;
- revisar tipos/lint si existen scripts;
- test minimo de health/hello o unidad de tenant resolver;
- build.

Frontend:

- instalar dependencias con `pnpm`;
- revisar tipos/lint si existen scripts;
- test minimo o build;
- build.

## CD propuesto

Opcion preferida:

- Railway conectado al repo;
- deploy automatico desde `main` o tag;
- `railway.toml` versionado para definir build/deploy;
- si el repo queda como monorepo, cada servicio debe usar su propio
  `railway.toml` o ruta de configuracion equivalente;
- variables de entorno configuradas en Railway;
- release GitHub incluye URL de produccion.

Opcion fallback:

- deploy manual Railway CLI o dashboard;
- comando/procedimiento documentado;
- evidencia con fecha, commit, URL y captura/log.

El fallback manual solo es aceptable si free tier, limites de cuenta o permisos
impiden CD automatico confiable.

## Migracion posterior

Railway es el destino de la primera version funcional. Despues de validar el
walking skeleton y el flujo academico minimo, el proyecto debe migrarse a Google
Cloud usando el free tier/creditos disponibles en la cuenta asociada.

La migracion esperada es:

- servicios Railway -> Cloud Run;
- PostgreSQL Railway -> Cloud SQL;
- object storage inicial -> Cloud Storage;
- variables Railway -> Secret Manager o variables Cloud Run.

## Variables esperadas

Backend:

- `REGISTRY_DATABASE_URL`;
- `NODE_ENV`;
- `ALLOWED_ORIGINS`;

Frontend:

- `NEXT_PUBLIC_API_URL` o equivalente segun stack elegido.

No se deben commitear secretos.

## Criterios de aceptacion

- CI corre para frontend y backend.
- Frontend desplegado muestra respuesta real del backend.
- Backend desplegado responde `/health`.
- Portal permite elegir UC y UTFSM.
- `/uc` envia `x-tenant: uc` y resuelve UC.
- `/utfsm` envia `x-tenant: utfsm` y resuelve UTFSM.
- Request sin tenant o con tenant invalido falla de forma controlada.
- Existe tag y release de GitHub para la entrega.

## Evidencia a guardar

- Link a workflow CI exitoso.
- Link a release/tag.
- URL frontend.
- URL backend healthcheck, si es publica.
- Captura o log de Railway deploy.
- `railway.toml` versionado.
- Nota breve si CD fue manual.

## Preparacion para Spec Kit

El Spec Kit siguiente debe pedir solo esto:

- crear monorepo minimo si falta;
- crear frontend y backend Hello World;
- crear portal home con rutas `/uc` y `/utfsm`;
- crear tenant resolver por header;
- crear migraciones registry/tenant;
- configurar CI;
- configurar CD Railway con `railway.toml` o fallback documentado;
- crear release por tag.
