# Catálogo ACCOUNTS

Trazabilidad: [spec de perfiles y altas](../../../specs/20261106-170457_perfiles-altas-usuarios/spec.md)
y issues #233–237. Implementaciones en [accounts.spec.ts](../../../e2e/specs/accounts.spec.ts).
Las pruebas usan PostgreSQL y backend locales descartables; Resend está deshabilitado.
La activación prepara un código de prueba en la DB propiedad del runner, sin envío real.
Estado 2026-11-08: no ejecutar Playwright por instrucción del usuario. Matías
acepta los recorridos manualmente y reporta Resend real; no se acredita ejecución
automática ni cada variante descrita abajo. S3 real continúa pendiente.

| Caso y ficha | Flujo | Prioridad | Suite | Nivel |
| --- | --- | --- | --- | --- |
| [E2E-ACCOUNT-001 — Perfil propio global](#e2e-account-001) | CU-17 | P1 | regression | M |
| [E2E-ACCOUNT-002 — Contraseña y sesiones anteriores](#e2e-account-002) | CU-18 | P0 | regression | M |
| [E2E-ACCOUNT-003 — Altas individuales por administración institucional](#e2e-account-003) | CU-19 | P1 | regression | M |
| [E2E-ACCOUNT-004 — CSV efímero y confirmación atómica](#e2e-account-004) | CU-20 | P1 | regression | M |
| [E2E-ACCOUNT-005 — Activación nueva y aceptación existente](#e2e-account-005) | CU-19 | P0 | regression | M |
| [E2E-ACCOUNT-006 — Foto privada y persistencia local](#e2e-account-006) | CU-21 | P1 | regression | M |

## E2E-ACCOUNT-001

- ST1 edita nombre/bio a 375 px en tema oscuro, guarda con teclado y conserva identidad/relaciones.
- NONE, sin memberships, entra directamente al perfil en tema claro y edita su descripción.
- Los campos de privilegios permanecen fuera del formulario y del contrato de edición.

## E2E-ACCOUNT-002

- Cambio propio requiere contraseña actual y nueva confirmación.
- Los JWT anteriores reciben 401; la nueva contraseña permite iniciar sesión.
- Los inputs de contraseña se limpian y no se graban traces durante el cambio.

## E2E-ACCOUNT-003

- Admin crea alta pendiente sin User/membership ni privilegios implícitos.
- Correo deshabilitado conserva pendiente; miembros sin permiso no dan altas.
- Ningún administrador puede leer invitaciones de otra institución.

## E2E-ACCOUNT-004

- CSV inválido bloquea confirmación; corregir exige nueva vista previa.
- CSV válido confirma invitaciones de una vez y conserva recibo al consultar.
- Se comprueba que correo deshabilitado no dispara envíos.

## E2E-ACCOUNT-005

- GET del enlace no consume; código sale del fragmento hacia memoria.
- Nuevo titular confirma contraseña y crea una pertenencia sin flags.
- Titular existente inicia sesión dentro de activación sin perder el código.
- Cuenta/credenciales existentes y otras pertenencias se preservan.

## E2E-ACCOUNT-006

- Imagen válida se normaliza y se consulta solo con autenticación.
- Archivo local sobrevive al reinicio del backend de prueba; eliminar devuelve inicial.
- S3 real requiere evidencia opt-in posterior con configuración de Daniel.
- Resend real fue reportado manualmente por Matías; no se probó desde este runner.
