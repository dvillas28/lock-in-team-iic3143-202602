# Walking skeleton: estado y continuidad

Revisión 2026-10-29. El plan original está en Git; esta actualización conserva
objetivo, validaciones y límites sin presentar capacidades ya existentes como futuras.

## Objetivo y estado de código

Frontend Next.js → backend NestJS → PostgreSQL compartida. Dockerfiles,
Compose, CI y release por tag ya existen. Render es plataforma configurada
según [ADR](../../adr/deploy-on-render.md) y [Blueprint](../../../render.yaml).
`/health` informa versión; `/ready` valida runtime. Presencia versionada no
acredita workflow aprobado, tag publicado ni despliegue efectivo.

Persistencia pg/node-pg-migrate, JWT, Institution/User/Membership, bootstrap,
resolución institucional por path, FK compuestas, roles y RLS ya están
implementados al corte 7f4334a. El MVP académico también tiene contenido,
quizzes, intentos, publicación, libro y auditoría. [Estado](10-status.md).

## Recorridos y límites

1. Login global y listado autenticado `/api/v1/institutions`.
2. Selección `/api/v1/institution/{institutionSlug}/...`; membership activa,
   institución/usuario activos y roles persistidos deciden acceso.
3. Superadmin delega is_admin dentro de su institución; admin crea curso propio
   con sección/teacher inicial; Enrollment asigna roles académicos por sección.
4. Docente publica material/quiz; estudiante rinde sin permiso de pauta.
5. Docente publica notas y estudiante consulta solo propias publicadas.
6. Auditoría inmutable conserva administrativos owner; grade exige docencia.

No hay URL, pool o base por tenant. Host/Origin no sustituyen pertenencia.
Cuentas demo y onboarding inicial: [guía](../../guides/demo-accounts.md).
Altas generales en institución existente requieren otra misión.

## Comprobaciones locales reproducibles

[Quickstart del polish](../../../specs/20261028-185147_privacidad-notas-auditoria/quickstart.md):
base exclusiva `_test`, credenciales operativa/runtime separadas y suites en serie.
Comprobar positivos UC/UTFSM, cruces 404, privilegio insuficiente 403,
JWT inválido 401, escrituras atómicas, replays y revocaciones con misma sesión.
Runtime sin contexto no puede leer datos tenant-owned ni omitiendo filtro SQL.
Consumidor y contrato deben coincidir; no enviar institution_id en bodies.

## Operación pendiente de comprobar remotamente

Comparar versión efectiva, settings, predeploy, DNS/TLS, health/readiness y
recorridos de ambas instituciones. No se ejecuta como parte de este polish.
CI/CD y documentación en Git no constituyen evidencia de disponibilidad.
Render free no implica HA ni backups/PITR; ver límites del ADR.
No agregar HAProxy, réplicas, PgBouncer externo, Redis o workers sin métricas.
Binarios, sharding, jerarquías y restore individual siguen fuera del MVP.

## Evidencia

[Registro posterior](../../backend/feedback-e2-validation.md) separa inspección,
pruebas nuevas, exportaciones y limitaciones. Mantener responsables y tareas
operativas abiertas: corregir AUD-PRIV no cierra aceptación de otras misiones.
