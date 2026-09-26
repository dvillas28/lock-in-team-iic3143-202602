# Arquitectura

## Decision actualizada

Entrega 1 planteaba GCP como plataforma cloud objetivo. Entrega 2 usa Railway
para walking skeleton y primera version funcional porque reduce friccion
operativa, permite evidencia rapida y calza mejor con un equipo real pequeno.

Google Cloud no se elimina: queda como migracion posterior usando el free
tier/creditos de la cuenta asociada cuando el producto requiera mayor control de
red, backups administrados, replicas o escalamiento fino.

## Vista de alto nivel

```txt
Portal Home
  -> /uc o /utfsm
Frontend
  -> Backend API
    -> Tenant Resolver
      -> Registry DB
        -> Tenant DB correspondiente
```

## Despliegue Entrega 2

Plataforma inmediata: Railway.

Destino posterior: Google Cloud con free tier/creditos asociados a la cuenta del
equipo. La migracion no forma parte de Entrega 2, pero debe permanecer viable:
frontend/backend stateless, PostgreSQL estandar y object storage portable.

Servicios esperados:

- `academix-frontend`: UI estudiante/docente.
- `academix-backend`: API HTTP stateless.
- `registry_db`: PostgreSQL central.
- `academix_uc_db`: PostgreSQL tenant UC.
- `academix_utfsm_db`: PostgreSQL tenant UTFSM.
- object storage compatible con Railway/plugin/proveedor simple, si el free
  tier lo permite.

Si Railway limita cantidad de DBs o costo, el ajuste minimo aceptable es
mantener tres bases logicas claramente distinguibles y documentar la diferencia
entre demo y arquitectura objetivo.

## Migracion posterior a Google Cloud

La primera version funcional se monta en Railway. Luego se migra a Google Cloud
para aprovechar creditos/free tier y acercarse a la arquitectura objetivo de
Entrega 1.

Mapeo esperado:

- frontend/backend: Railway services -> Cloud Run;
- registry y tenant DBs: Railway PostgreSQL -> Cloud SQL PostgreSQL;
- archivos: storage Railway/proveedor simple -> Cloud Storage;
- variables/secretos: Railway variables -> Secret Manager o variables Cloud Run.

La migracion no debe cambiar el modelo de tenancy: el registry sigue resolviendo
`slug -> database_url` y cada universidad conserva una DB separada.

## Backend logico

```txt
Auth simple / sesion mock inicial
TenancyModule
  - TenantResolver
  - TenantRegistryRepository
  - TenantConnectionManager
CoursesModule
MaterialsModule
QuizzesModule
GradesModule
```

Se excluyen `AuditModule`, workers, Redis, replicas y load balancer propio.

## Flujo de request

```txt
1. Usuario entra al portal home.
2. Usuario elige UC o UTFSM.
3. Frontend navega a /uc o /utfsm.
4. Frontend deriva el slug desde la ruta.
5. Frontend envia requests al backend con header x-tenant.
6. Backend valida que el header exista.
7. TenantResolver busca el slug en registry_db.
8. TenantConnectionManager obtiene conexion/pool de la DB del tenant.
9. Modulo de dominio ejecuta consulta en la DB del tenant.
10. Backend responde sin mezclar datos entre tenants.
```

Subdominios reales quedan fuera de Entrega 2 porque requieren dominio propio y
wildcard DNS. La ruta por tenant mantiene la UX demostrable en dominios Railway
gratuitos y permite migrar despues a `uc.academix.cl` sin cambiar el registry.

## Multi-tenancy

Estrategia: sharding por universidad.

Consecuencia:

- mejor aislamiento entre instituciones;
- backup/restore por universidad;
- migraciones deben ejecutarse en todas las DB de tenant;
- mayor complejidad que single-database multi-tenant, aceptada por valor
  arquitectonico del proyecto.

## Frontend

El frontend debe tener dos experiencias:

- docente: cursos, secciones, material, quizzes, libro de notas;
- estudiante: cursos, material publicado, quiz, notas publicadas.

Para el walking skeleton basta una pantalla que:

- permite elegir universidad demo en un portal home;
- redirige a `/uc` o `/utfsm`;
- llama al backend;
- muestra respuesta y tenant resuelto.

## Persistencia

Registry DB:

- tabla `tenants`;
- no contiene datos academicos;
- contiene la ruta segura hacia DB de tenant.

Tenant DB:

- contiene usuarios, cursos, secciones, material, quizzes y notas;
- no necesita columna `tenant_id` porque la base completa es el limite del
  tenant;
- puede incluir `tenant_slug` solo en logs o seeds, no como llave funcional.

## Seguridad inicial

- Sesion/auth mock para walking skeleton.
- Validacion obligatoria de tenant en cada request.
- Validacion de rol por seccion antes de operaciones docentes.
- No exponer `database_url` al frontend ni logs.

Auth real queda para un Spec Kit posterior si excede el walking skeleton.

## CI/CD

CI minimo:

- instalar dependencias;
- validar backend;
- validar frontend;
- ejecutar build/test minimo;
- separar stages por frontend y backend.

CD objetivo:

- deploy automatico a Railway desde `main` o tag;
- configuracion versionada por servicio con `railway.toml`;
- en monorepo, cada servicio debe apuntar a su propio `railway.toml` si Railway
  lo requiere;
- si no es viable por limites de cuenta/permisos, CD manual documentado con
  comando y evidencia.

Release:

- tag semantico o de entrega;
- release GitHub con links a CI, despliegue y notas.
