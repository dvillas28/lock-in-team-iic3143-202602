# Cómo probar la PR de login — Issue #80

Desde la raíz del repositorio, con Docker Compose, Python 3 y puertos 3000/3001 libres.
Esta guía prepara cuentas locales; no conecta ni modifica Railway.
La rama es `feat/issue-80-login-session`.
El revisor puede hacer `git fetch origin` y `git switch feat/issue-80-login-session`.

## 1. Preparar configuración y claves locales

Las cinco cuentas vienen de `backend/src/seeds/demo.ts`; definirlas no las crea en la DB.
En esta revisión se generaron sus claves con `secrets.token_hex(12)` de Python:
12 bytes aleatorios → 24 caracteres hexadecimales, distintos por cuenta.
Se guardaron solo en `.env`, ignorado por Git; el seed guarda hashes Argon2id en PostgreSQL.
`AUTH_JWT_SECRET` es otra clave: firma tokens, no es la contraseña de ningún usuario.

Este bloque crea `.env` desde el ejemplo si falta y completa únicamente secretos vacíos.
Conserva los valores existentes y no imprime secretos. No modifica contraseñas en la DB.

```bash
python3 - <<'PY'
import base64, os, re, secrets
from pathlib import Path
p = Path('.env')
text = p.read_text() if p.exists() else Path('.env.example').read_text()
keys = ['AUTH_JWT_SECRET'] + [f'DEMO_{name}_PASSWORD' for name in
        ['UC', 'UTFSM', 'MULTI', 'REVOKED', 'INACTIVE']]
for key in keys:
    match = re.search(r'(?m)^' + re.escape(key) + r'=(.*)$', text)
    if match and match.group(1).strip().strip('"\x27'):
        continue
    value = (base64.b64encode(secrets.token_bytes(32)).decode()
             if key == 'AUTH_JWT_SECRET' else secrets.token_hex(12))
    line = key + '=' + value
    text = text[:match.start()] + line + text[match.end():] if match else text.rstrip() + '\n' + line + '\n'
os.umask(0o077)
p.write_text(text)
p.chmod(0o600)
print('Configuración local lista en .env; claves ocultas.')
PY
```

Para localhost, comprobar `NEXT_PUBLIC_API_URL=http://localhost:3001` y
`CORS_ALLOWED_ORIGINS=["http://localhost:3000"]` en `.env`; el ejemplo ya contiene ambos.
Usar `http://localhost:3000`, no otro origen sin añadirlo explícitamente a CORS.
Si 5432 está ocupado, cambiar solo el puerto host PostgreSQL de Compose a `5433:5432`.

## 2. Levantar y crear las cuentas

```bash
docker compose up --build -d --wait
docker compose exec -T backend node dist/seeds/demo.js
```

El arranque ejecuta predeploy (migraciones, provisión runtime y validación RLS) y start.
Con `DEMO_DATA_ENABLED=false`, las cinco cuentas legacy requieren el segundo comando.
Compose conserva credenciales separadas: `MIGRATION_DATABASE_URL` operativa y
`DATABASE_URL` de `academix_runtime`, con contraseña local `RUNTIME_PASSWORD`.
En una DB vacía, seed reporta 2 instituciones, 5 usuarios y 6 membresías.
Repetir preserva claves, estados y permisos; cambiar `.env` no resetea usuarios existentes.
Si el volumen ya contenía esas cuentas, se necesitan sus claves originales.
Si cambió `.env` con contenedores encendidos, `docker compose up -d --force-recreate --wait backend`
aplica sus variables nuevas antes del seed. No hace falta borrar volúmenes.

## 3. Ingresar desde el navegador

Abrir [login local](http://localhost:3000/login). Copiar solo el valor de la variable,
sin su nombre ni `=`. `.env` es privado: no adjuntarlo a la PR ni a capturas.

| Correo | Contraseña en `.env` | Resultado |
| --- | --- | --- |
| demo-multi@academix.example | DEMO_MULTI_PASSWORD | UC y UTFSM |
| demo-uc@academix.example | DEMO_UC_PASSWORD | Solo UC |
| demo-utfsm@academix.example | DEMO_UTFSM_PASSWORD | Solo UTFSM |
| demo-revocado@academix.example | DEMO_REVOKED_PASSWORD | Login válido, sin membresías activas |
| demo-inactivo@academix.example | DEMO_INACTIVE_PASSWORD | Login rechazado |

## 4. Casos para el revisor

1. Multi: ingresar, abrir UC, volver al selector y abrir UTFSM; cada vista muestra su institución.
2. UC: abrir manualmente `/institutions/utfsm`; no aparece identidad/contenido UTFSM.
3. UTFSM: probar `/institutions/uc`; mismo rechazo. Cerrar sesión entre cuentas.
4. Revocado: estado sin membresías; inactivo o contraseña incorrecta: mensaje genérico.
5. Hacer doble clic en Continuar: solo un POST de login, botón ocupado mientras responde.
6. Cerrar sesión y volver a una ruta institucional: redirige al login sin mostrar datos anteriores.
7. Recargar una vista autenticada: pide login porque el JWT estaba en memoria.

Todos los intentos de login, exitosos o fallidos, consumen cuota; la sexta solicitud
por IP en un minuto puede devolver 429. Esperar el tiempo indicado antes de continuar.
En Network verificar método, path y estado: login 200 → listado 200 → `/me` 200;
contexto no autorizado 404. No compartir bodies, Authorization, JWT ni archivos HAR.
Un 401 no aparece en logs normales: el filtro existente registra errores ≥500.

### Entrada directa a una institución en localhost

Cerrar sesión y abrir `http://localhost:3000/institutions/uc`: pide login y luego abre UC,
sin pasar por el selector, incluso con `demo-multi@academix.example`.
Repetir con `/institutions/utfsm` para abrir UTFSM. Con `demo-uc@academix.example`,
la entrada a UTFSM debe rechazarse. `/login` sin destino muestra el selector al ingresar.
Esto verifica el destino y la membresía; no reproduce la restricción por hostname.
`uc.localhost` y `utfsm.localhost` todavía no están habilitados en esta implementación.

## 5. Verificación automatizada y diagnóstico

`pnpm --dir frontend test:coverage` incluye casos negativos, concurrencia y pruebas DOM.
La integración usa `TEST_DATABASE_URL` operativa y `TEST_RUNTIME_DATABASE_URL` de
`academix_runtime`, hacia la misma base descartable terminada en `_test`;
no apuntarlas a la demo manual. Ver [verificación](login-session.md#verificación).

- 401: revisar cuenta creada y clave vigente; el campo se limpia después de enviar.
- Red/CORS: verificar API disponible, origen exacto y URL del bundle; reconstruir si cambió NEXT_PUBLIC_API_URL.
- Seed `config`: falta alguna de las cinco claves o no tiene 8–30 caracteres.
- Seed creó 0 usuarios: ya existían; no reemplazó sus contraseñas.

Para detener los servicios: `docker compose down` conserva el volumen.
La prueba pública por dominios requiere pasos distintos: [guía de producción](login-session-production.md).
