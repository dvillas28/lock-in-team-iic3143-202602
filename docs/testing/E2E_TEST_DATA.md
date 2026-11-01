# Datos y seed E2E

[Seed](../../e2e/data/seed.ts) y helpers validados contra PostgreSQL 17 real.
[Actores y entidades](data/ACTORS_ENTITIES.md) · [Perfiles por caso](data/SCENARIOS.md).
La [evidencia](execution/VALIDATION.md) registra las ejecuciones; no quedan bloqueos históricos de PG/Chromium activos.

## Entorno aislado

El runner crea su cluster PostgreSQL 17 y DB exclusiva por caso, variante y retry.
Por defecto usa portal `localhost:4320`, instituciones `uc.localhost:4320` y `utfsm.localhost:4320`,
y API `127.0.0.1:4321`. Los origins de Next se fijan antes del build.
Nest usa configuración de test y credenciales runtime restringidas; no se desactivan RLS ni constraints.

Preflight rechaza URLs E2E de servicios/bases existentes y elimina credenciales operacionales heredadas.
Las operaciones sobre DB exigen destino local, ownership del run y nombre de prueba.
El marker del directorio o label Docker debe coincidir antes de limpiar recursos.
Un sufijo `_test` por sí solo no autoriza tocar otra base. No se usa producción ni cuentas demo.

## Preparación

1. Registrar el runId y crear la base vacía propia.
2. Aplicar migraciones y provision-runtime del backend existente.
3. Crear instituciones UC/UTFSM, usuarios sintéticos, memberships y relaciones válidas.
4. Preparar el perfil necesario y verificar tenant, relaciones, estados, pesos e invariantes.
5. Realizar publicación, rendición, envío y otras transiciones académicas mediante APIs reales cuando corresponde.
6. Devolver un manifest de IDs para la prueba; las credenciales y tokens no se publican.

Directorio/identidades o estados no construibles por API usan SQL operador controlado.
El runtime HTTP no recibe la credencial operador. Las conexiones SQL de verificación son oráculos, no sustitutos de la acción UI.
Los datos inválidos se envían como payload; no se fabrican filas que incumplan constraints.

## Namespaces y repetibilidad

Cada ejecución tiene runId aleatorio; el namespace incluye proyecto, test, variante y retry.
Los UUID se derivan de versión, namespace y alias; las respuestas API resuelven IDs creados dinámicamente.
Correos, cursos y claves sintéticas son propios del caso; las operaciones usan claves diferentes salvo replay explícito.
La seed contiene roles institucionales/académicos, multirol, cursos, secciones, matrículas, módulos,
Markdown y quizzes draft/publicados. Los helpers preparan ACTIVE, PUBLISHABLE, HISTORY y escenarios de cada fase.

`ensure` valida versión, identidad y ownership. No restaura progreso, passwords, flags ni privilegios modificados.
Una nueva variante/retry usa otra base; no se borra historial para recuperar la fixture inicial.
Los tiempos académicos se anclan al reloj DB. Las fronteras exactas se prueban en el nivel que permite controlarlas.

## Limpieza y credenciales

Un worker por stack. No compartir la DB con tests de integración que reinician schemas.
Se reinicia Nest entre casos para aislar su cuota; el escenario de rate-limit conserva el proceso deliberadamente.
Una carrera dentro de un caso comparte los recursos necesarios y verifica integridad después.

Teardown cierra conexiones/contextos/procesos y elimina solo DB, cluster o contenedor/volúmenes propios.
No hace DELETE/TRUNCATE de historia académica. Si falla, conserva diagnóstico de ownership para recuperación.
No barrer recursos por prefijo ni terminar procesos ajenos.

Passwords y JWT secret son efímeros; no se incorporan a Git, comandos literales ni artifacts públicos.
No publicar Authorization, cuerpos de login, hashes, dumps de entorno o HAR.
El tratamiento del diagnóstico está en [arquitectura](TEST_ARCHITECTURE.md).
