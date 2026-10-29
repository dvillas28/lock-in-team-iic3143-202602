# Demo con cursos: Docker y producción

Para la presentación completa con las diez cuentas por rol existentes, usar
[DEMO_SEED_RENDER](../DEMO_SEED_RENDER.md). Esta guía conserva la seed legacy
con otras identidades; no es el procedimiento de la presentación actual.

El seed manual puede añadir cursos y matrículas, además de las cinco cuentas básicas.
La [ADR](../adr/demo-academic-seed.md) fija aislamiento, ownership e historia operativa.
No se carga automáticamente al arrancar o desplegar.

## Qué crea

| Universidad | Curso / sección | Docente | Estudiante |
| --- | --- | --- | --- |
| UC | `DEMO-UC-101` / 1 | `demo-uc@academix.example` | `demo-multi@academix.example` |
| UTFSM | `DEMO-UTFSM-101` / 1 | `demo-utfsm@academix.example` | `demo-multi@academix.example` |

Período `DEMO`, capacidad 30 por sección. Las contraseñas son las de
`DEMO_UC_PASSWORD`, `DEMO_UTFSM_PASSWORD` y `DEMO_MULTI_PASSWORD` usadas al crear
esas identidades. Repetir el seed conserva sus hashes; cambiar `.env` no las resetea.
La cuenta multi es estudiante de ambos cursos. Cada docente solo accede a su universidad.
No se otorgan flags admin/superadmin ni se crean notas, intentos o material ficticio.
Las cuentas revocada e inactiva se conservan para pruebas negativas.

## Docker local

Requiere `.env` ya configurado con `AUTH_JWT_SECRET` y las cinco contraseñas legacy
de 8–30 caracteres, incluyendo `DEMO_REVOKED_PASSWORD` y `DEMO_INACTIVE_PASSWORD`.
`MIGRATION_DATABASE_URL` operativa debe apuntar a la misma base que el runtime.
Compose ya la configura desde los valores PostgreSQL del entorno.

Desde la raíz, reconstruir backend con este código y ejecutar la carga explícita:

```bash
docker compose up -d --build --no-deps backend
docker compose exec -T \
  -e DEMO_ACADEMIC_DATA_ENABLED=true \
  -e DEMO_OPERATOR_REF=local-demo-cursos \
  backend node dist/seeds/demo.js
```

Alternativa: configurar ambos valores en `.env`, recrear backend y ejecutar
`docker compose exec -T backend node dist/seeds/demo.js`. El arranque por sí solo
no ejecuta ese seed. Mantener `DEMO_DATA_ENABLED=false` si no se necesita el bootstrap
separado de diez cuentas administrativas; no es requisito de esta carga académica.

Abrir `http://uc.localhost:3000/login` con demo-uc o demo-multi y comprobar el curso UC.
En `http://utfsm.localhost:3000/login`, demo-utfsm o demo-multi ven el curso UTFSM.
No se imprime la contraseña en la respuesta del seed. Usar las originales de `.env`.

## Producción / Render

Integrar y desplegar el commit actualizado mediante el proceso habitual. Confirmar
que `/ready` funciona, el esquema está migrado y la base destino es la prevista.
El `render.yaml` del repositorio usa Free: ese plan no incluye Shell/SSH ni jobs
puntuales ([limitaciones oficiales](https://render.com/docs/free#other-limitations)).
La instrucción de shell de la versión anterior de esta guía solo aplica a un plan compatible.

### Opción para Render Free: desde el equipo del operador

Usar el mismo commit del backend desplegado. En Render Postgres → Connect, obtener
la **External Database URL del propietario**, no la URL interna ni la de academix_runtime.
Render distingue [conexiones internas y externas](https://render.com/docs/postgresql-creating-connecting#connect-to-your-database).
La conexión externa debe estar autorizada desde la IP del operador.

Crear en la raíz `.env.seed-production`, ignorado por Git, y restringirlo con
`chmod 600 .env.seed-production`. Incluir solo estas variables con valores reales:

```dotenv
MIGRATION_DATABASE_URL=<URL externa del propietario con sslmode=verify-full>
DEMO_ACADEMIC_DATA_ENABLED=true
DEMO_OPERATOR_REF=release-demo-cursos
DEMO_UC_PASSWORD=<clave de 8–30 caracteres>
DEMO_UTFSM_PASSWORD=<clave de 8–30 caracteres>
DEMO_MULTI_PASSWORD=<clave de 8–30 caracteres>
DEMO_REVOKED_PASSWORD=<clave de 8–30 caracteres>
DEMO_INACTIVE_PASSWORD=<clave de 8–30 caracteres>
```

Los marcadores `<...>` se reemplazan; no son valores para ejecutar. Usar las claves
originales si esas cuentas ya existen. No copiar la conexión PostgreSQL local.
El código exige `verify-full` en hosts públicos: agregar ese parámetro o sustituir
el sslmode existente, sin duplicarlo. Nunca desactivar la verificación de TLS.
No usar secretos, datos personales ni URLs como `DEMO_OPERATOR_REF`.

Desde la raíz, construir y ejecutar un contenedor puntual, sin arrancar la aplicación:

```bash
docker build -t academix-seed ./backend
docker run --rm --env-file .env.seed-production \
  academix-seed node dist/seeds/demo.js
```

El contenedor se conecta a la base remota; no usar `docker compose exec` contra el
backend local para este paso. La ejecución no requiere añadir secretos al frontend.

### Alternativa si el plan ofrece Shell/SSH

Proporcionar por el entorno operativo las cinco contraseñas y `MIGRATION_DATABASE_URL`
interna del propietario. En una shell del backend actualizado, ejecutar:

```bash
DEMO_ACADEMIC_DATA_ENABLED=true DEMO_OPERATOR_REF=release-demo-cursos \
  node dist/seeds/demo.js
```

En ambas opciones, confirmar `outcome: ok` y `academic.outcome: applied`.
Repetir informa `alreadyApplied` y conserva datos y revocaciones.
Probar los accesos institucionales HTTPS UC/UTFSM y los cursos de la tabla con sus
cuentas autorizadas. CORS y dominios del frontend permanecen iguales.

La imagen producción incluye `dist/seeds/`; no requiere pnpm en el contenedor.
No dejar la carga en un comando de arranque ni usar una cuenta runtime para ejecutarla.
La incorporación no ejecuta comandos remotos ni modifica las variables de Render.

## Repetición y errores

- Flag ausente/false: sigue funcionando el seed básico, sin cursos.
- Flag distinto de true/false o referencia ausente/inválida: `config`, antes de conectar.
- Cuenta, institución o membership inactiva en primera carga: `conflict`, sin activarla.
- UUID/código ocupado, marcador distinto o vínculos inconsistentes: `conflict`; no se
  adopta ni repara silenciosamente. Revisar el estado sin borrar historia.
- Fallo a mitad de carga: rollback de identidades nuevas y de ambos árboles académicos.
- Repetir después de editar cursos, revocar acceso o desactivar matrículas conserva
  esos cambios. El seed no sirve para recuperar contraseñas, permisos o datos borrados.

## Validación

Pruebas en una base PostgreSQL 17 exclusiva terminada en `_test`: configuración,
opt-in, recursos y roles, concurrencia, replay, colisiones, inactividad, rollback y
login/API real con aislamiento UC/UTFSM. La procedencia se registra en
`demo_data_runs`; las operaciones posteriores mantienen auditoría académica normal.
Resultado local: 167/167 pruebas backend con integración y cobertura, build y lint PASS.
Cobertura global: 99,53 % líneas / 95,46 % ramas; helper académico: 100 % / 95,83 %.
Se comprobaron también seed básico, bootstrap institucional y permisos existentes.
Compose propaga el flag con default false; longitud documental y diff limpios.
Revisión `lms-reviewer`: sin hallazgos pendientes de aislamiento o autorización.
No se ejecutó esta carga en la base local del usuario ni en producción.
