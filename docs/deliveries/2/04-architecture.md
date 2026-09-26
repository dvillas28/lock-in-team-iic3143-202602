# Arquitectura

## Decisión actualizada

Entrega 1 planteaba GCP como plataforma cloud objetivo. Entrega 2 usa Railway
para walking skeleton y primera versión funcional porque reduce fricción
operativa, permite evidencia rápida y calza mejor con un equipo real pequeño.

Google Cloud no se elimina: queda como migración posterior usando el free
tier/créditos de la cuenta asociada cuando el producto requiera mayor control de
red, backups administrados, réplicas o escalamiento fino.

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

Destino posterior: Google Cloud con free tier/créditos asociados a la cuenta del
equipo. La migración no forma parte de Entrega 2, pero debe permanecer viable:
frontend/backend stateless, PostgreSQL estándar y object storage portable.

Servicios esperados:

- `academix-frontend`: UI estudiante/docente.
- `academix-backend`: API HTTP stateless.
- `registry_db`: PostgreSQL central.
- `academix_uc_db`: PostgreSQL tenant UC.
- `academix_utfsm_db`: PostgreSQL tenant UTFSM.
- object storage compatible con Railway/plugin/proveedor simple, si el free
  tier lo permite.

Si Railway limita cantidad de DBs o costo, el ajuste mínimo aceptable es
mantener tres bases lógicas claramente distinguibles y documentar la diferencia
entre demo y arquitectura objetivo.

## Migración posterior a Google Cloud

La primera versión funcional se monta en Railway. Luego se migra a Google Cloud
para aprovechar créditos/free tier y acercarse a la arquitectura objetivo de
Entrega 1.

Mapeo esperado:

- frontend/backend: Railway services -> Cloud Run;
- registry y tenant DBs: Railway PostgreSQL -> Cloud SQL PostgreSQL;
- archivos: storage Railway/proveedor simple -> Cloud Storage;
- variables/secretos: Railway variables -> Secret Manager o variables Cloud Run.

La migración no debe cambiar el modelo de tenancy: el registry sigue resolviendo
`slug -> database_url` y cada universidad conserva una DB separada.

## Backend lógico

```txt
Auth simple / sesión mock inicial
TenancyModule
  - TenantResolver
  - TenantRegistryRepository
  - TenantConnectionManager
CoursesModule
MaterialsModule
QuizzesModule
GradesModule
```

Se excluyen `AuditModule`, workers, Redis, réplicas y load balancer propio.

## Flujo de request

```txt
1. Usuario entra al portal home.
2. Usuario elige UC o UTFSM.
3. Frontend navega a /uc o /utfsm.
4. Frontend deriva el slug desde la ruta.
5. Frontend envía requests al backend con header x-tenant.
6. Backend valida que el header exista.
7. TenantResolver busca el slug en registry_db.
8. TenantConnectionManager obtiene conexión/pool de la DB del tenant.
9. Módulo de dominio ejecuta consulta en la DB del tenant.
10. Backend responde sin mezclar datos entre tenants.
```

Subdominios reales quedan fuera de Entrega 2 porque requieren dominio propio y
wildcard DNS. La ruta por tenant mantiene la UX demostrable en dominios Railway
gratuitos y permite migrar después a `uc.academix.cl` sin cambiar el registry.

## Multi-tenancy

Estrategia: sharding por universidad.

Consecuencia:

- mejor aislamiento entre instituciones;
- backup/restore por universidad;
- migraciones deben ejecutarse en todas las DB de tenant;
- mayor complejidad que single-database multi-tenant, aceptada por valor
  arquitectónico del proyecto.

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
- no contiene datos académicos;
- contiene la ruta segura hacia DB de tenant.

Tenant DB:

- contiene usuarios, cursos, secciones, material, quizzes y notas;
- no necesita columna `tenant_id` porque la base completa es el límite del
  tenant;
- puede incluir `tenant_slug` solo en logs o seeds, no como llave funcional.

## Seguridad inicial

- Sesión/auth mock para walking skeleton.
- Validación obligatoria de tenant en cada request.
- Validación de rol por sección antes de operaciones docentes.
- No exponer `database_url` al frontend ni logs.

Auth real queda para un Spec Kit posterior si excede el walking skeleton.

## CI/CD

CI mínimo:

- instalar dependencias;
- validar backend;
- validar frontend;
- ejecutar build/test mínimo;
- separar stages por frontend y backend.

CD objetivo:

- deploy automático a Railway desde `main` o tag;
- configuración versionada por servicio con `railway.toml`;
- en monorepo, cada servicio debe apuntar a su propio `railway.toml` si Railway
  lo requiere;
- si no es viable por límites de cuenta/permisos, CD manual documentado con
  comando y evidencia.

Release:

- tag semántico o de entrega;
- release GitHub con links a CI, despliegue y notas.
