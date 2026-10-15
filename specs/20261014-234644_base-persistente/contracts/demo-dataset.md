# Contract: Dataset demo y seed

Datos iniciales exclusivamente demostrativos, sin roles académicos.
Usuarios identificados por UUID estable, no por email.
Nombres, emails .example y UUID son públicos; contraseñas provienen del entorno.

## Manifiesto versionado

UUID de usuario: 10000000-0000-4000-8000-00000000000N, sustituyendo N por la fila.
Nombres de institución: UC (uc) y UTFSM (utfsm).

| N | Usuario/email | UC | UTFSM | User activo | Variable secreta |
| --- | --- | --- | --- | --- | --- |
| 1 | demo-uc / demo-uc@academix.example | activa | ausente | sí | DEMO_UC_PASSWORD |
| 2 | demo-utfsm / demo-utfsm@academix.example | ausente | activa | sí | DEMO_UTFSM_PASSWORD |
| 3 | demo-multi / demo-multi@academix.example | activa | activa | sí | DEMO_MULTI_PASSWORD |
| 4 | demo-revocado / demo-revocado@academix.example | inactiva | ausente | sí | DEMO_REVOKED_PASSWORD |
| 5 | demo-inactivo / demo-inactivo@academix.example | activa | ausente | no | DEMO_INACTIVE_PASSWORD |

Base vacía al terminar: 2 institutions activas, 5 users y 6 memberships.
No asignar teacher/student/assistant en nombres ni crear Enrollment todavía.
El dataset crece en futuras specs sin reemplazar estas identidades.

## Reglas de identidad

Institutions: buscar por slug; conservar ID y campos de una fila existente.
Si falta, generar UUID e insertar. Validar después cualquier conflicto concurrente
sin asumir que ON CONFLICT DO NOTHING equivale a una operación correcta.

Users: usar UUID fijo. Si existe con email compatible, conservar todos sus
campos, hash, estado y fechas; nombres editados no se sobrescriben.
Si UUID corresponde a otro email, o el email demo corresponde a otro UUID,
rechazar íntegramente. Comparar emails demo normalizados sin cambiar la regla
de unicidad global del modelo. No crear segundo usuario para resolver colisión.

Memberships: buscar por institution_id/user_id; insertar solo pareja faltante con
UUID nuevo y estado inicial del manifiesto. Conservar IDs, estados y fechas de
parejas existentes, aunque difieran del fixture inicial.

Estas reglas no sincronizan una base operada con la demo; solo completan faltantes.
No reclamar permiso institucional ni curso por tener una identidad demo.

## Algoritmo observable

1. Si demo=false/ausente, terminar como omitido sin tocar DB.
2. Validar variables, longitudes y formato del manifiesto antes de cualquier cambio.
3. Abrir cliente y transacción; tomar advisory xact lock con clave fija de seed.
4. Verificar esquema; resolver instituciones y validar identidad de usuarios.
5. Para usuarios faltantes, producir PHC Argon2id con sal aleatoria por usuario.
6. Insertar instituciones, usuarios y memberships faltantes dentro de la transacción.
7. Ante cualquier error: rollback total, resumen sanitizado y salida 1.
8. En éxito: commit, resumen de cantidades y salida 0; cerrar el Client.

Hash nuevo solo para usuario nuevo. Cambiar variables de contraseña en un segundo
seed no rota credenciales ni actualiza hashes.
No imprimir contraseñas, hashes, emails o SQL con parámetros, incluso en errores.

## Pruebas de aceptación que deja la implementación

- Ejecutar dos veces: mismos IDs, cantidades, hashes, estados y timestamps.
- Ejecutar concurrentemente: mismo resultado final que una ejecución; si vence
  lock_timeout, una falla limpiamente y su reintento termina sin duplicados.
- Cambiar un nombre o desactivar membership después del primer seed; repetir
  conserva el cambio manual, incluso si ahora el fixture dice activa.
- Preinsertar colisión de UUID/email: salida 1 y ninguna inserción parcial.
- Forzar fallo intermedio mediante fixture/test, sin flag productivo de inyección.
- Contraseña ausente o inválida con demo=true falla antes de escribir.
- Con URL válida, observar cero intentos de conexión para flag/contraseñas inválidos;
  repetir esos negativos sobre demo existente y comparar snapshots sin cambios.
- Ninguna assertion fallida puede incluir hashes o la salida sensible original.
- Verificar PHC mediante argon2.verify sin registrar hash ni credencial.
- Usuario inactivo y membership inactiva siguen persistidos; no inventar
  pruebas HTTP 401/403/404 antes de implementar autenticación.
