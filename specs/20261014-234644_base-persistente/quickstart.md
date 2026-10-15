# Quickstart: validar base persistente

Estado: guía para después de implementar. Los comandos db:* y test:integration,
el contrato /ready y las variables demo se crearán durante implementación.
No ejecutar migraciones/bootstrap contra producción para validar esta guía.

## Preparar desarrollo

Requisitos: Node 24, pnpm 9.15.9, Docker Compose y puerto 5432 disponible.
Conservar .env existente; si falta, copiar .env.example. Para demo local habilitada,
definir DEMO_BOOTSTRAP_ENABLED=true y las cinco contraseñas indicadas en
[operación](contracts/operations.md); sin valores predeterminados versionados.

Desde la raíz:

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend build
docker compose config --quiet
docker compose up --build -d
curl --fail http://localhost:3001/health
curl --fail http://localhost:3001/ready
```

Esperado: migración antes de HTTP, readiness 200, /health conserva su respuesta.
Demo opt-in crea exactamente el manifiesto en una base previamente vacía.
Si se omite demo, quedan tablas sin usuarios/instituciones demo y la app lista.

## Idempotencia y durabilidad

```bash
docker compose exec backend node dist/platform/database/bootstrap.js
docker compose exec backend node dist/platform/database/bootstrap.js
docker compose restart backend
curl --fail http://localhost:3001/ready
```

Ambas ejecuciones terminan sin duplicados; comparar IDs, hashes, timestamps y
estados en test, sin imprimir secretos. Reinicio conserva volumen y registros.
No usar docker compose down -v: elimina persistencia y no demuestra durabilidad.

## Pruebas automatizadas

Usar únicamente DB descartable academix_test. Crear esa DB dentro del PostgreSQL
local; TEST_DATABASE_URL usa host/credenciales del entorno y nombre academix_test.
El harness rechaza un destino cuyo nombre no termine en _test y nunca usa
DATABASE_URL como fallback. No apuntar tests al dataset de desarrollo/productivo.

Compose carga .env; los comandos pnpm del host no lo cargan automáticamente.
Antes de las pruebas, exportar TEST_DATABASE_URL al entorno del host. En el
comando read siguiente, pegar la URL local de academix_test y pulsar Enter:
la entrada es silenciosa, no se imprime ni se guarda como comando del historial.

```bash
docker compose exec postgres sh -c 'createdb -U "$POSTGRES_USER" academix_test'
pnpm --dir backend lint
pnpm --dir backend test
read -rs TEST_DATABASE_URL
export TEST_DATABASE_URL
pnpm --dir backend test:integration
python3 .github/scripts/check-doc-length.py
```

Crear DB solo si aún no existe; limpiar fixtures solo dentro del destino de test.
node:test mantiene test actuales sin DB; test:integration compila y ejecuta
test/integration/*.test.mjs secuencialmente, con contraseña aleatoria por fixture.
CI configura PostgreSQL 17 como servicio, URL de test exclusiva y ejecuta el mismo
comando; conservar checks Docker, Trivy y SonarQube.

## Matriz mínima de validación

| Escenario | Evidencia esperada |
| --- | --- |
| Migración dos veces | Tres tablas, constraints presentes e historia sin duplicados |
| DDL fallido | No queda esquema parcial ni marca de migración aplicada |
| FK y unicidad inválidas | Rechazo y estado previo intacto |
| Un usuario, UC y UTFSM | Una identidad con dos memberships distintas |
| Bootstrap repetido/concurrente | IDs, hashes y estados estables; sin duplicados |
| Credencial/colisión/fallo intermedio | Salida no cero, sin escrituras parciales ni secretos |
| Revocación seguida de bootstrap | Membership permanece inactiva |
| DB inaccesible al arrancar | Salida no cero ≤30 s; no escucha HTTP |
| DB falla con HTTP iniciado | /ready 503 ≤5 s; /health sigue su contrato |
| Esquema ausente | No listo; /ready 503 si se pierde durante operación |
| Imagen final | Ejecuta migrador y hash/verify con node, sin npm/pnpm |

## Imagen y Railway

Construir la imagen real y ejecutar las mismas CLI usando un entorno DB de
prueba accesible al contenedor. Comprobar /app/migrations y dependencias runtime;
un test solo en el host no verifica el empaquetado Alpine.

En Railway, verificar proyecto/entorno/servicio antes de configurar: una
PostgreSQL compartida, DATABASE_URL por referencia privada, pre-deploy de migración
y healthcheck /ready. Bootstrap solo por acción explícita del operador.
Demostrar primero instalación desde una DB vacía aislada en el entorno Railway
de validación; comprobar migración, bootstrap y manifiesto 2/5/6. Después reiniciar
conservando IDs/relaciones y registrar ambas evidencias de SC-003 por separado.
Usar un destino de validación descartable, sin vaciar la DB existente.
No inventar IDs, nombres de servicio ni URLs. Esta fase no provisiona servicios.

Registrar en la entrega posterior la release, resultado de migración, readiness
y reinicio durable sin incluir secretos. Sin esa evidencia SC-003 sigue pendiente.

## Recuperación y cierre

Ensayar dump/restore completo a DB vacía separada según
[contrato operativo](contracts/operations.md#recuperación).
Verificar snapshots/PITR reales y registrar retención y tiempos medidos.
Restauración/cutover no reemplaza el requisito de compatibilidad con app anterior.
No declarar feature completada hasta pasar matriz local, CI y evidencia Railway.
