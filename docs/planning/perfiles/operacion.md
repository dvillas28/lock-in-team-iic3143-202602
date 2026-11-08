# Operación de perfiles y altas: entrega a Daniel

Responsables: **Matías (@matiaraos)** integra código; **Daniel (@dvillas28)** prepara
S3, DNS y Resend. Issues: [#234](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/234),
[#235](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/235) y
[validación #237](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/237).
Este documento no acredita infraestructura ni envíos reales realizados.

## Guías

- [Fotos: S3 privado, desarrollo y recuperación](operacion-s3.md).
- [Correo: DNS, Resend, pruebas y recuperación](operacion-resend.md).
- [Retención aprobada de datos derivados](retencion.md).

## Antes de configurar servicios

La aplicación puede funcionar con AVATAR_STORAGE_DRIVER=disabled y
MAIL_DELIVERY_MODE=disabled. No usar local/fake como fallback productivo.
Perfil, contraseña y funciones académicas siguen disponibles; nuevas invitaciones
y lotes pueden registrarse sin enviar correo. Las acciones externas deshabilitadas
responden 503 y mantienen pendientes; no muestran un éxito simulado.
La disponibilidad de S3/Resend no condiciona /ready ni prueba entrega de buzón.

## Configuración segura

Configurar en **Render → academix-backend → Environment**, nunca en frontend,
NEXT_PUBLIC, Git, cuerpos de issues o capturas. `.env.example` muestra los nombres,
sin claves reales. `render.yaml` mantiene S3 deshabilitado y selecciona Resend tras la preparación
confirmada por Daniel. RESEND_API_KEY se declara sync: false y su valor permanece
en el dashboard. Los secretos S3 se agregan cuando estén disponibles.
Si Render vuelve a aplicar el Blueprint, revisar que los modos conserven el valor
operativo deseado; el manifiesto inicial no demuestra integración habilitada.

No se necesita cambiar código para habilitar o deshabilitar los adaptadores.
Cambiar variables y reiniciar el backend; probar cada servicio por separado.
Se usa fake únicamente en tests, capturando mensajes en memoria; no hay buzón local.

## Permiso del operador de migraciones

Las funciones de identidad pertenecen a academix_account_writer, un rol NOLOGIN
sin bypass RLS. PostgreSQL 17 concede ADMIN al creador del rol, pero no SET;
la migración habilita SET únicamente para transferir las funciones y luego restaura
el permiso previo. Nunca concede ese rol al servidor HTTP academix_runtime.
Si el rol ya fue creado por otro administrador, ese administrador debe autorizar
al operador de migraciones con ADMIN, INHERIT FALSE y SET FALSE antes de desplegar.
Un operador que no administra el rol falla de forma cerrada; no ampliar permisos
runtime ni hacer público EXECUTE para resolver el error.

## Mantenimiento de datos temporales

Ejecutar desde un proceso de operador, fuera del servidor HTTP. Configurar
MIGRATION_DATABASE_URL exclusivamente para la base objetivo del mantenimiento;
para huérfanos, agregar la configuración S3 y permisos de enumeración de su guía.
No entregar esta credencial de base de datos al runtime web. Para --apply configurar
ACCOUNT_MAINTENANCE_OPERATOR_REF con una referencia al operador responsable;
la auditoría registra esa referencia y no atribuye la limpieza al usuario invitante.

```bash
pnpm --dir backend build
pnpm --dir backend accounts:cleanup -- --batch=100
pnpm --dir backend accounts:cleanup -- --apply --batch=100
```

La primera ejecución es dry-run; --apply ejecuta la limpieza. --batch admite 1–500,
100 por defecto, por categoría procesada. Usar lotes pequeños y repetir según
los contadores del resultado; no publicar PII o claves en la evidencia.
Se aplican los plazos aprobados de 7/30 días, conservando recibos/FK/auditoría.
Los huérfanos requieren al menos 24 h y comprobación de ausencia de referencias;
si almacenamiento está deshabilitado, se omite esa parte y la limpieza de PII sigue.
No hay worker/cron instalado: Daniel debe programar la ejecución operativa y
registrar el resultado sanitizado. Repetir una limpieza no recrea altas ni envíos.

## Evidencia pendiente de validación externa

- [ ] Daniel entrega región/bucket/política S3 y configura credenciales del backend.
- [ ] Una cuenta de prueba sube, consulta, reemplaza y elimina su foto con S3 real.
- [ ] Otro usuario y otro tenant no pueden leer/modificar la foto ajena.
- [x] Daniel reportó DNS verificado, clave de solo envío en Render y envío recibido (2026-11-08, #235).
- [ ] Una invitación real llega a una cuenta del equipo y se activa una sola vez.
- [ ] Cuenta global existente acepta la pertenencia sin cambiar credenciales.
- [ ] Deshabilitar correo conserva altas/lotes; habilitar permite enviar pendientes.
- [ ] Registrar fecha, entorno, resultado y evidencia sanitizada en #237.

Una aceptación del proveedor no prueba recepción. No copiar el enlace/código,
contraseñas, API keys o datos personales temporales en evidencia o logs.
