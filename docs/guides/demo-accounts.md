# Cuentas y provisión de la demo AcademiX

Revisión documental 2026-10-29. Capacidades existentes en el corte 7f4334a;
no se crearon por este polish. No contiene contraseñas ni acredita carga remota.

## Dataset institucional opt-in

Manifiesto: [demo-manifest.ts](../../backend/src/data-migrations/demo-manifest.ts).
En base vacía: instituciones UC/UTFSM, diez identidades y diez memberships.

| Patrón de correo (slug uc o utfsm) | is_admin inicial | is_super_admin inicial | Matrículas del bootstrap |
| --- | --- | --- | --- |
| superadmin.{slug}@academix.example | true | true | Ninguna |
| admin.{slug}@academix.example | false | false | Ninguna |
| teacher.{slug}@academix.example | false | false | Ninguna |
| assistant.{slug}@academix.example | false | false | Ninguna |
| student.{slug}@academix.example | false | false | Ninguna |

Las etiquetas son nombres de cuenta, nunca concesiones de roles académicos.
Superadmin delega is_admin al futuro creador de curso dentro de su institución.
Crear curso exige ese flag y genera propiedad, sección y teacher inicial.
Profesor/ayudante/estudiante se asignan mediante Enrollment por sección.
Los secretos iniciales se inyectan por entorno protegido según el
[runbook](../backend/demo-tenant-bootstrap.md). No hay contraseñas públicas comunes.

## Seed académico separado

[Seed manual](demo-academic-seed.md): cinco identidades legacy
`demo-uc`, `demo-utfsm`, `demo-multi`, `demo-revocado`, `demo-inactivo`
con sufijo `@academix.example`; conserva sus estados/restricciones.
Opt-in académico crea DEMO-UC-101 y DEMO-UTFSM-101 (periodo DEMO), sección 1,
docentes demo-uc/demo-utfsm y estudiante demo-multi en ambos contextos.
No concede flags admin/superadmin ni inventa notas, material o intentos.
No se confunde este seed con las diez cuentas del bootstrap institucional.

## Nueva institución y nuevas cuentas

Operador/PM realiza onboarding controlado: institución nueva, identidad inicial
nueva o existente y membership con flags explícitos, evento operativo y marcador.
Los comandos y entradas están en el [contrato de onboarding](../../specs/20261014-234844_cursos-roles/contracts/onboarding.md).
Recuperación de superadmin también es operación controlada, sin HTTP global.

No existe alta general de personas, signup ni invitaciones por UI/API en una
institución existente. No se usa onboarding para simular esa capacidad.
Más cuentas generales necesitan una misión que defina autorización, vinculación,
credenciales y auditoría. Este límite responde E6 y no es capacidad entregada.

## Repetición y validación

Bootstrap/onboarding verifican identidad/vínculos y fingerprint; replay no cambia
hashes, datos académicos, estados ni privilegios revocados. No recuperan secretos.
Seed académico conserva IDs e historia y no repone matrículas revocadas.
Validación nueva: [feedback E2](../backend/feedback-e2-validation.md).
La existencia del dataset en código no acredita que esté cargado en un servidor.
