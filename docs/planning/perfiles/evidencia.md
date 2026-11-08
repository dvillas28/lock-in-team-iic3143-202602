# Evidencia de perfiles y altas institucionales

Registro: 2026-11-08. Rama: `docs/perfiles-altas-usuarios`; destino previsto: `dev`.
[Tareas](../../../specs/20261106-170457_perfiles-altas-usuarios/tasks.md) ·
[Backlog e issues #233–237](backlog.md) · [Guía para Daniel](operacion.md).
Este registro distingue pruebas ejecutadas, implementación y operación externa.
No acredita despliegue ni cierre remoto de issues.

## Resultado comprobado

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| Contratos OpenAPI | Aprobado | Lint sin errores; tres advertencias previas de localhost/health/ready |
| Cliente generado | Aprobado | api:generate y api:check desde frontend |
| Nuevos escenarios DB/HTTP de cuentas | 16 aprobados | PostgreSQL 17 descartable y runtime restringido; primera ejecución integrada |
| Suite completa backend, primera ejecución | 179 aprobados / 12 fallidos, 191 total | Conserva el resultado inicial anterior a correcciones |
| Regresión dirigida tras correcciones | 48 aprobados / 1 fallido, 49 total | Repite cuentas y archivos afectados; único fallo restante en snapshot de login-email |
| Login-email corregido, ejecución separada | 1 aprobado / 0 fallidos | Conserva columnas previas y verifica defaults de perfil |
| Tests legacy modificados | Aprobados en DB | Attempt, content, course, gradebook y persistence; sintaxis/ESLint aprobados |
| Catálogo de rutas y documentación | Aprobado | 68 rutas implementadas cubiertas; cuatro pruebas del catálogo aprobadas |
| Backend unitario y lint | Aprobados | 20 pruebas unitarias; lint final aprobado; proveedor y mantenimiento revalidados tras el cursor |
| Mantenimiento con cursor acotado y permisos | 3 pruebas aprobadas | Dos casos de limpieza y permiso antes de 503; avance entre objetos referenciados, recientes y huérfanos |
| Frontend DOM y dominio | 61 aprobados / 0 fallidos | Cobertura: 94,79 % líneas, 87,11 % ramas; incluye protección del borrador al cambiar foto |
| Navegador | Validación final pendiente | Ver T035/T036 y catálogo ACCOUNTS |
| Resend: infraestructura | Confirmada por Daniel | Dominio verificado, clave Render y correo recibido; [evidencia #235](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/235#issuecomment-6717211571) |
| S3 y recorrido Resend desde AcademiX | Pendientes | Provisionar S3 y probar envío/activación opt-in; registrar evidencia sin secretos |

La primera suite completa se ejecutó antes de actualizar expectativas históricas
de migraciones y permisos, y antes de corregir compatibilidad strip-only de Node 24.
Las doce fallas iniciales quedaron resueltas mediante la ejecución dirigida y
la comprobación separada de login-email. Estos resultados corresponden a corridas
distintas; no se reporta una suite completa única sin fallas. El ajuste posterior
de cursor y el permiso antes de 503 se comprobaron en tres casos adicionales.

## Cobertura nueva aprobada en PostgreSQL real

- `accounts.test.mjs`: cinco escenarios; perfil sin institución, precisión de
  timestamps, conflicto de edición, rollback de auditoría, contraseña y revocación
  UC/UTFSM, límites SQL, foto local privada y producción sin configuración externa.
- `account-invitations.test.mjs`: nueve escenarios; admin/superadmin, aislamiento,
  activación nueva/existente, idempotencia/reenvío/revocación, cuotas y resultados
  inciertos, CSV de 100 filas, atomicidad y limpieza de PII a 7/30 días.
- `account-runtime.test.mjs`: rechaza políticas globales ampliadas, EXECUTE público
  y bypass institucional del rol propietario de las funciones.
- `account-cleanup.test.mjs`: dry-run y repetición segura, objetos huérfanos,
  protección de referencias activas y período de gracia de 24 horas.

Los adaptadores de proveedores usan dobles controlados en tests. Ninguna prueba
simulada acredita acceso al bucket productivo ni entrega de un correo real.
No se guardan el CSV original, tokens de activación ni secretos como evidencia.

## Regresión de migraciones

Los escenarios históricos Down usan copias temporales de las once migraciones
anteriores a esta feature. Las cinco migraciones nuevas de cuentas se aplican
como upgrade, hasta dieciséis, sin agregar rollback destructivo de credenciales.
Los snapshots preservan columnas previas, identidades y registros académicos;
las tres columnas nuevas verifican sus valores iniciales null/null/0.
Persistence comprueba además tipos, nulabilidad, tablas y constraints nuevos.

## Pendientes para cierre

- [x] T034: regresión académica, migraciones pobladas y runtime integrado aprobados
  mediante las corridas complementarias registradas y la revalidación del mantenimiento.
- [ ] T035: recorridos completos, teclado, 375 px y ambos temas en Playwright.
- [ ] T036: reunir lint, compilación, tests, documentación y catálogo definitivos.
- [ ] T037: conciliar evidencia y cierre de las cinco issues con sus criterios.
- [ ] T038: comprobación S3/Resend real con Daniel, según [operación](operacion.md).

La evidencia externa debe indicar fecha, entorno, responsable y resultado de
subir/leer/reemplazar/eliminar foto y enviar/activar una invitación opt-in.
Configurar un secreto o verificar DNS por sí solo no completa esos recorridos.

## Checkpoint de publicación

El usuario solicita guardar la implementación en commits de la rama actual.
#233 cumple sus criterios documentales y se marca completada en GitHub/Project.
#234–237 conservan estado en progreso: código preparado, validación de navegador
y/o servicios reales pendiente según cada issue. No se acredita merge o despliegue.
