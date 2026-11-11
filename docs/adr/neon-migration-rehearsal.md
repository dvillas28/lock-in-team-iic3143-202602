# ADR: Ensayo de migraciones en una rama de Neon antes de cada release

Fecha: 2026-11-11. Estado: aceptada; requiere configurar el environment `neon-rehearsal`.
Complementa [PostgreSQL en Neon](neon-database.md) y [Desplegar en Render](deploy-on-render.md).

## Contexto

CI migra una base vacía, así que nunca prueba el paso real del deploy: migrar el esquema y los
datos de producción. Render corre `predeploy` al arrancar el backend, después del merge a `main`.
Si una migración falla con datos reales (un `NOT NULL` o un `CHECK` sobre filas existentes), el
release ya está mergeado y el backend nuevo no arranca. En la PR #278 este ensayo se hizo a mano
con una rama de Neon y conviene que deje de depender de alguien.

## Decisión

- Job `Migration rehearsal (Neon)` en `.github/workflows/ci.yml`. Corre en PRs hacia `main` desde
  este repositorio cuando cambia `backend/**`, y en ejecuciones manuales del workflow CI.
- Es obligatorio sin tocar el ruleset: está en `needs` de `CI result`, el único check requerido.
  Fuera de las PRs a `main` queda *skipped*, y `CI result` lo cuenta como aprobado.
- Pasos: crea una rama de Neon desde la rama por defecto del proyecto (producción), le pone a
  `academix_runtime` una contraseña aleatoria solo en esa rama, ejecuta `pnpm db:predeploy` con
  `DEMO_DATA_ENABLED=false` y borra la rama aunque algo falle. La rama además expira a las 2 horas.
- El job se niega a seguir si Neon devuelve una rama ya existente (`created != true`), y solo
  borra ramas creadas por la misma ejecución. Nunca toca la rama de producción.
- La contraseña de runtime de producción sigue solo en Render: Neon no guarda contraseñas de roles
  creados por SQL, y copiarla a GitHub ampliaría quién puede leerla.

## Configuración (una vez)

En GitHub, Settings → Environments → `neon-rehearsal`:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `NEON_API_KEY` | API key de Neon con acceso al proyecto |
| Variable | `NEON_PROJECT_ID` | ID del proyecto (Settings del proyecto en Neon) |
| Variable | `NEON_DATABASE` | Nombre real de la base de la app |
| Variable (opcional) | `NEON_OWNER_ROLE` | Owner de la base; por defecto `neondb_owner` |

Sin esa configuración el job falla con un mensaje que nombra lo que falta. Debe estar lista antes
de que este job llegue a `dev`, porque la PR de release `dev` → `main` lo ejecuta.

Para probarlo sin abrir una PR a `main`: Actions → CI → *Run workflow* sobre la rama deseada.

## Consecuencias

- Un release con una migración que no aplica sobre los datos actuales queda bloqueado en la PR.
- No es garantía total: los datos pueden cambiar entre el check y el merge. Si el deploy falla,
  Render mantiene la versión anterior porque las migraciones corren en una sola transacción.
- Los datos de producción no salen de Neon; el job solo imprime la categoría del error. La API key
  controla todo el proyecto Neon (incluida la rama de producción): vive solo en el environment y
  solo este job la recibe. Rotarla si se sospecha exposición.
- Cada PR muestra un *deployment* a `neon-rehearsal`, efecto de usar un environment.
- Consume ramas y horas de cómputo del plan free de Neon: unos 2-3 minutos por ejecución. La
  concurrencia del workflow cancela la corrida anterior de la misma PR, y la rama se borra igual.
- Errores: `config` es URL o variables; `schema`/`conflict` es una migración (reproducir con una
  rama manual y revisar los datos); `lock` y `connection` se reintentan.
