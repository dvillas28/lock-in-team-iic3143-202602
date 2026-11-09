# Implementation Plan: Perfiles y altas institucionales

**Branch**: `docs/perfiles-altas-usuarios` (conservada) | **Date**: 2026-11-07
**Spec**: [spec.md](spec.md) | **Estado**: diseño acordado; implementación y evidencia se registran por tarea.
**Input**: implementar #233–237 en la misma rama; integraciones reales y operación sin credenciales.

## Summary

Extender NestJS/Next.js existentes con perfil propio global, contraseña/foto,
invitaciones institucionales y CSV efímero. Mantener SQL parametrizado, runtime
acotado, permisos vigentes y auditoría atómica. Sin workers ni servicios nuevos.
Matías implementa; Daniel (`dvillas28`) prepara DNS, Resend y S3.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Plataforma | TypeScript 5.9, Node 24, pnpm 9.15.9; NestJS 12 y Next.js 16 existentes |
| Persistencia | PostgreSQL/pg y migraciones SQL existentes; cuatro tablas de soporte |
| Proveedores | SDK AWS v3, Resend; sharp para imágenes y csv-parse para CSV |
| Pruebas | node:test, PostgreSQL descartable, jsdom y aceptación manual; Playwright omitido por instrucción |
| Perfil | Global propio; nombre 1–200, bio ≤500; sin cambio de correo ni flags |
| Credenciales | Argon2id; JWT 900 s con credentialVersion obligatorio |
| Foto | JPEG/PNG/WebP estático ≤2 MiB/16 MP → WebP ≤1024×1024 sin metadatos |
| CSV | UTF-8 name,email; ≤100 filas/256 KiB; preview 24 h; archivo nunca persistido |
| Correo | Código aleatorio 32 bytes/hash SHA-256, 24 h; commit antes de red |
| Despliegue | Sin credenciales externas inicia la aplicación; solo correo/fotos no disponibles |

## Constitution Check

Pre-design: PASS. Post-design: PASS documental; [checklist](checklists/requirements.md).
- Invitaciones/lotes/filas: institution_id, FK compuestas y FORCE RLS; nunca permisos por body/CSV.
- Perfil global solo propio, incluso sin institución. Excepciones de identidad mediante funciones específicas.
- Alta requiere usuario/institución/membership activos e isAdmin OR isSuperAdmin vigente.
- Solo superadmin delega isAdmin; ningún flag concede docencia ni cursos ajenos.
- Auditoría efectiva atómica; conservar notas, intentos, matrículas y eventos anteriores.
- Historias independientes sobre fixtures; CSV reutiliza activación sin duplicar lógica.
- Documentos <150 líneas; proveedores justificados por esta feature; sin colas/RBAC genérico.
- Validación externa pendiente no se presenta como probada mediante mocks.

## Project Structure

- `backend/src/accounts/`: controladores/servicios de cuenta, invitaciones e importaciones.
- `backend/src/accounts/providers/`: almacenamiento local/S3/disabled, mailer Resend/disabled/fake test.
- `backend/migrations/`: columnas, tablas, constraints, funciones/grants y políticas acotadas.
- `frontend/src/app/`: profile, profile/security, admin/users y activate.
- `docs/reference/openapi/`: rutas/esquemas y generación del cliente tipado.
- Este directorio: [research](research.md), [data model](data-model.md), [contratos](contracts/accounts.md),
  [correo/CSV](contracts/onboarding.md), [seguridad SQL](contracts/security.md), [quickstart](quickstart.md), [tasks](tasks.md).
- Operación: [índice para Daniel](../../docs/planning/perfiles/operacion.md).

## Design & Delivery

1. #233: publicar contratos, modelo y tareas; sincronizar fuentes CU/RF/RNF y estados reales.
2. #234: perfil → contraseña/sesiones → foto; cada incremento incorpora sus pruebas.
3. #235: formulario, invitación/activación, correo y recuperación; lista administrativa scoped.
4. #236: preview, confirmación DB atómica, recibo y despacho secuencial desde UI.
5. #237: verificación integrada, regresión y guías; infraestructura real pendiente de Daniel.

Cada avance tiene commit propio en la rama conservada. La PR final apunta a dev;
no incluir archivos locales ajenos ni `.specify/feature.json`. No crear issues nuevas.

## Security & Failure Handling

- DB HTTP sin INSERT/UPDATE arbitrarios de identidad, owner, BYPASSRLS ni credencial de operador.
- Funciones SECURITY DEFINER específicas: dueño NOLOGIN mínimo, search_path fijo,
  EXECUTE fuera de PUBLIC; validan actor/contexto/precondiciones y auditan en transacción.
- expectedUpdatedAt conserva seis microsegundos de PostgreSQL; conflicto devuelve 409.
- Contraseña actual incorrecta: 400 de campo. Nuevo hash+versión+evento juntos;
  JWT anterior/missing claim: 401 y nuevo login. Verificación/hash fuera de locks largos.
- Configuración externa ausente: adaptador disabled, capacidad false, operación 503
  INTEGRATION_NOT_CONFIGURED. Enviar no emite/rota token; alta/CSV quedan pendientes.
- Foto: subir antes de cambiar referencia; fallo de DB intenta compensación; limpieza operativa recuperable.
- Resend: lease/version e idempotencia; accepted no garantiza entrega/activación; unknown exige reenvío explícito.
- Activación: fragmento a memoria y replaceState; solo POST consume; login inline sin perder código.
- CSV confirma de una vez, revalida todas las filas y nunca llama red dentro de la transacción.
- Limpieza 7/30 días mantiene recibos/FK, sin cuentas/notas borradas ni secretos en auditoría.

## Validation & Rollout

[Quickstart](quickstart.md) define checks y recorridos; [tasks](tasks.md) registra evidencia.
Migrar antes del nuevo backend; exigir nuevo login por claim de versión. /ready depende
de DB/seguridad, no de conexión a S3/Resend. Activar proveedores cambiando variables
cuando Daniel complete su guía; sin fallback local/fake en producción.
El 2026-11-08 Matías reporta pruebas manuales de Resend e interfaz y sustituye
Playwright por validación manual. No ejecutar navegador automatizado; registrar
esta procedencia sin atribuir escenarios/dispositivos no informados. S3 real sigue pendiente.

## Complexity Tracking

Sin violaciones. Las cuatro tablas cubren activación, staging/recibos y auditoría
global; adaptadores reales permiten completar código sin infraestructura configurada.
No se agrega buzón local: correo fake solo captura mensajes en tests.
