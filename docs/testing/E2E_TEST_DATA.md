# Datos y seed E2E propuestos

Diseño futuro, sin ejecutar seed ni cambiar datos en esta rama.
[Actores/entidades](data/ACTORS_ENTITIES.md) · [Perfiles por caso](data/SCENARIOS.md).
Todas las variables de fichas se resuelven desde un manifest generado por preparación.

## Destino aislado obligatorio

Baseline: PostgreSQL17 efímera por job/shard; Next y Nest locales; ningún recurso productivo.
Hosts: PORTAL=`http://localhost:3000`, UC=`http://uc.localhost:3000`,
UTFSM=`http://utfsm.localhost:3000`; API=`http://127.0.0.1:3001` del stack propio.
HOST-UNKNOWN usa desconocida.localhost. Validar resolución en tres motores durante F1;
si requiere /etc/hosts, aprovisionarlo solo en runner efímero. No asumir DNS externo.
`NEXT_PUBLIC_INSTITUTION_ORIGINS` y portal se fijan antes del build; CORS exacto UC/UTFSM.
No portal en CORS institucional. Backend usa `NODE_ENV=test`, frontend compilado producción.
No NODE_ENV production backend local sin ajustar política CORS: exige dominios HTTPS productivos.

Preflight futuro debe rechazar antes de conectar o arrancar:

- URL de frontend/API distinta a allowlist loopback local; resolver también IP y puertos propiedad runId.
- Cualquier dominio `academix.dvillasc.me`, `onrender.com`, Railway o URL externa en modo escritura.
- Base sin nombre `academix_e2e_<run>_<shard>_test`, o host no propio/URL runtime y operador discordantes.
- `DATABASE_URL` ambiente heredada como fallback; variables E2E deben ser explícitas.
- Manifest runId/ownership/sentinel que no corresponda al contenedor/base creada para ese job.

Tres barreras acumulativas: allowlist destino + ownership de infraestructura + DB *_test.
Un boolean `E2E=true` o sufijo `_test` por sí solo no autoriza tocar una base existente.
No se propone smoke productivo: queda excluido hasta autorización explícita separada de solo lectura.

## Seed propia, no demo

`backend/src/seeds/demo*` y presentación son referencia de restricciones, no fixtures mutables.
Bootstrap demo tiene IDs globales y flags, ensure preserva cambios; presentación añade cursos
ya frozen y estudiantes ficticios con preimagen password inutilizable. No resuelve E2E independientes.
Proponer `e2e/data/seed.ts` fuera del código de producto, ejecutado solo con credencial operador efímera.
No usar funciones de integración `reset` que hacen DROP SCHEMA sobre una DB ambiental.

1. Crear recurso infra/base nueva y registrar runId fuera de datos académicos; verificar ownership.
2. Compilar backend, ejecutar migraciones existentes y provision-runtime sobre esa base vacía.
3. Crear UC/UTFSM e identidades por inserción controlada en fixture, con passwords argon2id efímeras.
4. Crear memberships y relaciones válidas por actor. No desactivar constraints/triggers/RLS.
5. Entidades de ciclos críticos preferentemente por API real: publish, start, save, submit, weights, publication.
   Directorio/identidades y estados no construibles por API se preparan por operador, auditando procedencia.
6. Generar manifest y verificar tenant/parents/roles, conteos, últimos intentos, pesos y publishedAt.
7. Separar servidor HTTP de credencial operacional: start.js ya elimina MIGRATION/DEMO/ONBOARD/SUPERADMIN env.
8. Ejecutar cada test con namespace propio; al final destruir solo infraestructura propiedad runId.

## Identificadores, colisiones y repetición

runId aleatorio por ejecución; namespace=`runId/shard/project/testId/variant/retry`.
UUID determinista por hash(version+namespace+entidad+alias), manteniendo formato UUID válido.
Slug `uc`/`utfsm` fijos dentro de DB de job; users/courses de cada caso usan IDs y correos únicos
`e2e.<hash>.<actor>@example.test`. Code<=32, term<=16; no incrustar UUID completo en campo corto.
Manifest: IDs de institución, usuario, membership, course, section, módulos, materiales, quizzes,
question/alternative IDs, gradeItem, attempts, Grades y claves sintéticas por test; no passwords/tokens.
Question IDs creados por API se descubren de respuesta; no enviar UUID inventado como pregunta nueva.
Las claves de operación viven en runner/memoria y cada operación usa una diferente salvo replay explícito.

Seed modo `ensure` valida versión/identidad/ownership, crea lo ausente del namespace inicial y
rechaza colisión de IDs/clave natural no administrada. No reescribe progreso, Grade, flags o passwords.
Repetir ensure sobre un namespace ya usado no restaura baseline: nueva variante/retry usa namespace nuevo.
Reseeding parcial que produciría historia incoherente debe fallar y pedir stack nuevo, no «reparar» filas.

## Mínimos, extendidos y preparación

BASE contiene dos tenants, todos los actores implementados, dos secciones C1, cursoC2 compartido
y C3 ajeno, Markdown en cuatro combinaciones, quizzes draft/publicados con GradeItems, notas de
lectura publicadas/no publicadas y al menos dos estudiantes para fronteras de identidad.
Para tests de escritura, usar copias limpias COPEN/CNEW y actores propios, no mutar baseline de lectura.
Extendido agrega 21+ resultados por colección paginada, historial de secciones, multirol,
valores límite, quizzes temporales y concurrencia. Crear solo el perfil que el test necesita.
Datos inválidos son payloads, no filas persistidas que incumplen constraints.
Time anchor T se registra desde reloj DB al preparar; escenarios largos usan márgenes minutos,
tests de frontera exacta se separan de navegador; no modificar clocks de la DB global.

## Workers y limpieza

Inicialmente un worker por stack; DB/API/frontend exclusivos de shard. Más shards duplican stack.
No ejecutar node:test integración junto al navegador en la misma DB: borra schema e inicia otros servidores.
Dentro de shard, namespace por caso/variante/retry. Reiniciar API entre casos resetea cuota login,
sin tocar DB o cambiar throttler. Máximo cinco login/proceso salvo test RATE explícito.
Dos actores concurrentes del mismo test usan mismo stack y curso intencionalmente para probar carrera.
No rollback transaccional externo alrededor de UI: las conexiones API tienen sus propias transacciones.

Teardown cierra browser/context/process y elimina solo contenedor/DB/volumen guardados en manifest infra.
No DELETE/TRUNCATE sobre tablas de historia. Si teardown falla, marcar recurso propiedad runId para
recolección posterior con TTL y verificación; no barrer por prefijo sin comprobar ownership.
Restaurar significa crear una base nueva migrada/seed, no reactivar privilegios silenciosamente.

## Credenciales y evidencia

Generar passwords y AUTH_JWT_SECRET por ejecución (base64 canónico>=32bytes), solo memoria/env privado.
No credenciales productivas, cuentas demo modificables, valores reales en Git ni comandos con secretos literales.
Operador solo en preparación/teardown y oráculo SQL controlado; navegador nunca conoce DATABASE_URL.
Enmascarar env en CI; no registrar login bodies, Authorization, hashes, storage dumps o HAR sin redacción.
Trazas login deshabilitadas; ver tratamiento específico en [arquitectura](TEST_ARCHITECTURE.md).
