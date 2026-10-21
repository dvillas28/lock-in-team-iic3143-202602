# Quickstart: Validar acceso por dominio

Ejecución local en curso, 2026-10-21; evidencia y límites al final.
Contratos: [access.md](contracts/access.md), [modelo](data-model.md), [tareas](tasks.md).

## Prerrequisitos y configuración local

Node 24, pnpm 9.15.9, Docker Compose y navegador. Puertos 3000/3001 libres.
Reutilizar preparación de secretos y seed de [guía local](../../docs/guides/login-session-testing.md);
no borrar volúmenes ni exponer valores. La guía describe ambos hosts y la sesión en memoria.
Usar `.env` ignorado; configurar antes de construir:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_INSTITUTION_ORIGINS={"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}
CORS_ALLOWED_ORIGINS=["http://uc.localhost:3000","http://utfsm.localhost:3000"]
```

API_URL del contenedor frontend sigue `http://backend:3001`, independiente del browser.
En host directo usar API_URL=http://localhost:3001 y exportar las variables públicas
al proceso frontend; Next en frontend/ no carga automáticamente el `.env` raíz.
Comprobar resolución de `uc.localhost` y `utfsm.localhost` a loopback. Si falta,
añadir `127.0.0.1 uc.localhost utfsm.localhost` al archivo hosts del equipo.
Este paso operativo no se ejecuta automáticamente ni afecta DNS de producción.

```bash
pnpm --dir frontend install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
docker compose up --build -d --wait
docker compose exec -T backend node dist/seeds/demo.js
```

Usar cuentas UC, UTFSM, multi, revocada e inactiva de la guía; respetar cuota de login.
No reutilizar la base manual para integración. Configurar TEST_DATABASE_URL y
TEST_RUNTIME_DATABASE_URL hacia la misma base descartable `_test`, con roles separados.

## Checks automatizados tras implementar

```bash
pnpm --dir frontend test
pnpm --dir frontend test:coverage
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend api:check
pnpm --dir frontend build
pnpm --dir backend test:integration
node backend/test/compose-smoke.mjs
python3 .github/scripts/check-doc-length.py
git diff --check
```

Las pruebas nuevas viven en los archivos existentes; no se incorpora runner browser.
La suite de integración debe ejecutar los casos, sin tratarlos como aprobados si faltan DB/roles.

## US1 — Contexto del dominio (FR-001–005/015/017/018)

1. En `http://uc.localhost:3000/login`, ingresar UC: `/courses`, badge UC y `/me` UC.
2. En UTFSM ingresar multi: `/courses` UTFSM sin selector obligatorio.
3. UC-only en UTFSM: rechazo sin contenido/identidad institucional y sin fallback UC.
4. Host desconocido, puerto no configurado y sufijo engañoso: cero envío de credenciales.
5. Localhost desnudo: orientación a hosts configurados, sin inferir tenant desde path.
6. `/courses` inicialmente solo muestra integración pendiente tras `/me`, no cursos falsos.

## US2 — Sesión recuperable (FR-005–008/015/018/020)

1. Navegar internamente conserva memoria; recargar, nueva pestaña y cambio de dominio piden login.
2. Reloj controlado: exp/900 s y pestaña suspendida; 401 limpia DOM y conserva retorno seguro.
3. Logout con red caída borra contexto; atrás/bfcache no restaura contenido anterior.
4. Diferir login, directorio, `/me` y cuerpos: logout/nuevo usuario impiden su reaparición.
5. Forzar 400/401/403/404/413/415/429/503, red e inválidos: feedback seguro; Retry-After
   impide repetir antes del plazo; doble submit envía una vez; errores viejos no cierran sesión nueva.
6. Revocar fixture entre consulta y respuesta y luego revalidar: no recuperar contexto obsoleto.
7. Inspección automatizada de URLs/storage/cookies y salida sanitizada: cero JWT/contraseñas persistidos.

## US3 — Dominio y enlaces (FR-009–014/016)

Corrección explícita de producto (2026-10-21): no hay selector de instituciones.

1. `/institutions` redirige a `/courses`, sin listado ni enlace para elegir institución.
2. Abrir otro dominio exige login independiente; ningún token se transporta.
3. Abrir `/courses` sin sesión retorna ahí después de autenticar y validar `/me`.
4. `next=/institutions` se acepta por compatibilidad y termina en `/courses`.
   Retornos externos, repetidos, encoding residual, query/hash y legacy caen en `/courses`.
5. En UC `/institutions/uc` redirige a `/courses`; `/institutions/utfsm` rechaza sin adoptar tenant.
6. Repetir CORS con ambos origins locales y HTTPS en configuraciones separadas.
7. Directorio vacío no sustituye `/me`; tenant inactivo o revocado no muestra datos privados.
8. `/` sigue pública; otra ruta devuelve 404. No inventar homes académicos por perfil.

### CORS: comprobación concreta sin escrituras

- API real: enviar OPTIONS al path de intentos del contrato con UUIDs de fixture,
  método solicitado POST y headers Authorization, Content-Type, Idempotency-Key.
  Afirmar que los tres están permitidos; un header ajeno no debe aparecer autorizado.
  No enviar el POST. Separadamente comprobar exposición Location/Retry-After en API real.
- T028 debe levantar un servidor de prueba efímero con node:http en puerto 3002,
  accesible como `http://localhost:3002`, solo durante validación local. Permitir
  exactamente los origins locales de este documento, Vary: Origin, sin credentials.
  Responder 200 con Location: /cors-fixture y Retry-After: 2; sin datos ni tokens reales.
- `/exposed` incluye Access-Control-Expose-Headers: Location, Retry-After; `/hidden`
  devuelve los mismos headers sin exposición. Desde DevTools de UC y UTFSM ejecutar
  fetch de ambos con credentials: omit: headers.get debe dar `/cors-fixture` y `2`
  en exposed, y null para ambos en hidden. jsdom/Node no sustituyen esta comprobación.
- Desde una página de origin denegado, el fetch al servidor de prueba falla por CORS;
  suprimir Access-Control-Allow-Origin para ese origin, sin cambiar el estado HTTP.
  Detener el servidor al terminar; no agregar rutas ni modificar lógica backend.
  Esta prueba controlada no acredita headers de una respuesta académica real.
- En HTTPS validar la configuración API real por separado; no hacer fetch HTTP
  desde HTTPS ni marcar la prueba local como evidencia productiva.

## Accesibilidad y evidencia (FR-019, SC-001–004)

Recorrer login, error, retorno y logout solo por teclado a 375 px y escritorio;
ambos temas, foco al error/visible, lector de pantalla y reduced motion.
Medir contraste ≥4.5:1 y ausencia de scroll horizontal no previsto.
Registrar comando/escenario, resultado, fecha y limitaciones aquí al implementar;
capturas sin credenciales ni HAR autenticado. No marcar pendiente como aprobado.

## Ejecución 2026-10-21

- Baseline frontend: 96/96; lint, typecheck y api:check PASS antes de cambios.
- Primera integración backend: 124/126; dos `HTTP readiness deadline` al arrancar
  durante builds concurrentes. Archivo afectado repetido 4/4 PASS; no se alteran timeouts.
  La segunda ejecución tuvo un deadline y una conexión de demo concurrente: repetir
  con frontend/backend de Compose detenidos y solo PostgreSQL activo.
- Evidencia previa al retiro de selector: frontend 128/128, 87,36% líneas / 89,44% ramas;
  Chromium móvil/escritorio/temas y CORS reales PASS. No acredita la última revisión.
- HTTPS público: UC/UTFSM sin resolución DNS (`curl` código 6); API `/health` 200 TLS,
  OPTIONS público de login 404. Sin credenciales remotas ni despliegues autorizados.
- Resultados finales y trazabilidad: [validación](validation.md). T028 pendiente hasta
  verificar ambos frontend HTTPS y CORS público; local no equivale a producción.

Cierre local: frontend **130/130**, cobertura **86,98% líneas / 89,98% ramas**;
backend aislado **126/126**, cero omisiones. Builds, lint, tipos, API y documentos PASS.
**32/33 tareas verificadas; T028 pendiente.** SC-001–004 PASS local; HTTPS público no validado.
