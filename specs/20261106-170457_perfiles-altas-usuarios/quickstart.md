# Validación: perfiles y altas institucionales

[Plan](plan.md) · [Tasks](tasks.md) · [Operación externa](../../docs/planning/perfiles/operacion.md).
Ejecutar desde la raíz. Usar exclusivamente PostgreSQL descartable `_test` para integración.
No usar una base compartida o producción; no enviar correo real en CI.

## Preparación

1. pnpm install y pnpm --dir backend install / pnpm --dir frontend install.
2. Configurar AUTH_JWT_SECRET y URLs de la base local/descartable según .env.example.
3. Aplicar migraciones con el comando existente db:migrate; runtime HTTP usa academix_runtime.
4. Desarrollo: almacenamiento local persistente; correo disabled. Fake únicamente dentro de tests.
5. Preparar fixtures UC/UTFSM, usuario sin memberships y actores admin/superadmin/multirol.
6. Iniciar frontend/backend con scripts pnpm existentes. No crear credenciales demo por defecto.

## Checks

```bash
python3 .github/scripts/check-doc-length.py
pnpm docs:api:lint
pnpm --dir frontend api:generate
pnpm --dir frontend api:check
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm build
pnpm docs:api:test
pnpm docs:api:build
```

Aplicar únicamente los comandos para los que estén preparadas las bases/fixtures;
registrar faltantes y no presentar una prueba omitida como aprobada.
Desde 2026-11-08 no ejecutar Playwright: el usuario acepta sus pruebas manuales
de interfaz y Resend como validación de recorridos. No sustituirlas por resultados inventados.

## Recorridos de aceptación

- Perfil: usuario sin institución edita nombre/bio; campos extra y escritura ajena fallan.
  Dos ediciones con mismo timestamp: una gana y la otra recibe 409.
- Contraseña: actual errónea devuelve campo 400; cambio correcto invalida JWT de UC/UTFSM;
  no pierde matrículas/notas y permite login nuevo. Auditoría fallida revierte todo.
- Foto local: subir/reemplazar/eliminar; formatos, 2 MiB/16 MP y acceso ajeno se validan;
  fallo de DB/storage conserva anterior; reinicio conserva bytes/referencia.
- Alta: admin o superadmin UC invita; UTFSM ajeno y teacher sin flags fallan.
  Nueva cuenta activa una sola vez; existente exige sesión propia y conserva credenciales.
- Código: usado/vencido/revocado y permisos retirados no amplían acceso; GET no consume.
- Mailer fake en tests: mensajes solo memoria, cuota/rate/timeout/resultados inciertos;
  reenvío invalida enlace anterior y respuesta tardía no pisa nueva versión.
- CSV: BOM/comillas/CRLF y límites; preview no crea altas, fila inválida bloquea todo;
  carrera/rollback/replay no duplica; cierre de pestaña/cuota permiten continuación segura.
- Limpieza: límites de 7/30 días, sin primera emisión, repetición y carreras; recibos/FK
  conservados y PII depurada sin borrar cuentas ni registros académicos.
- Producción sin configuración: proceso y /ready disponibles; foto/mail 503 explícito,
  invitaciones/CSV permanecen pendientes y ninguna integración simula éxito.
- UI: teclado, 375 px, ambos temas, errores y cambios sin guardar; editar perfil no
  desmonta borradores académicos y logout descarta respuestas/Blobs anteriores.

## Validación externa pendiente de Daniel

S3: bucket privado, permisos mínimos y secreto backend; comprobar subida/lectura/
reemplazo/eliminación con cuenta de prueba. Resend: DNS verificado, remitente,
clave de envío y orígenes permitidos: infraestructura confirmada por Daniel y
prueba manual desde AcademiX reportada por Matías el 2026-11-08.
Cada prueba deja fecha, entorno, resultado y responsable sin secretos o enlaces de activación.
Una prueba simulada no cierra esta evidencia de operación real.
