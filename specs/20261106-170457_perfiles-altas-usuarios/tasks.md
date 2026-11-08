# Tasks: Perfiles y altas institucionales

**Input**: [plan](plan.md), [spec](spec.md), [modelo](data-model.md), [contratos](contracts/accounts.md).
**Rama**: docs/perfiles-altas-usuarios; cinco issues existentes, Semana 5 E4.
`[P]`: archivos distintos y dependencia resuelta. Cada implementación incorpora sus pruebas.
Una casilla marcada acredita el entregable indicado; no acredita despliegue ni proveedor real.

## Phase 1: Preparación — USR-01 / #233

- [x] T001 Completar diseño, investigación y modelo en specs/20261106-170457_perfiles-altas-usuarios/plan.md (FR-001–025).
- [x] T002 [P] Publicar contratos en docs/reference/openapi/paths/accounts.yaml y schemas/accounts.yaml; lint validado (FR-001–025).
- [x] T003 Revisar permisos/constraints y aprobar checklist en specs/20261106-170457_perfiles-altas-usuarios/checklists/requirements.md (#233).

## Phase 2: Base compartida

- [x] T004 Agregar columnas/tablas/índices/FK y funciones SQL acotadas en backend/migrations/ para User y altas (FR-021/022/025).
- [x] T005 Extender comprobación de FORCE RLS/grants/funciones en backend/src/database/runtime-check.ts y database.service.ts (FR-022).
- [x] T006 Registrar controladores, tipos HTTP/multipart y errores seguros en backend/src/app.module.ts y backend/src/main.ts (FR-024).
- [x] T007 [P] Agregar capacidades y selección disabled/local/S3/Resend/test a backend/src/accounts/providers/ (FR-005/012).

## Phase 3: US1 Perfil propio — USR-02 / #234

**Objetivo:** cuenta activa sin institución consulta/edita únicamente su perfil global.
**Prueba independiente:** fixtures existentes, sin alta/CSV/foto ni cambio de contraseña.

- [x] T008 [P] [US1] Probar campos propios, rechazo ajeno y concurrencia en backend/test/integration/accounts.test.mjs (SC-001/002/009).
- [x] T009 [US1] Implementar GET/PATCH /me y auditoría atómica en backend/src/accounts/accounts.service.ts y accounts.controller.ts (FR-001/002/021).
- [x] T010 [US1] Agregar protección global, estado propio y actualización sin remount en frontend/src/lib/auth/session.ts (FR-001/002).
- [x] T011 [US1] Implementar /profile y validación accesible en frontend/src/app/profile/ y frontend/test/accounts-ui.test.ts (US1.1/2).

## Phase 4: US2 Contraseña — USR-02 / #234

**Objetivo:** titular cambia contraseña y revoca todas las sesiones anteriores.
**Prueba independiente:** cuenta con sesiones UC/UTFSM, sin alta ni foto.

- [x] T012 [P] [US2] Probar cambio, carreras y rollback en backend/test/integration/accounts.test.mjs (SC-003/009).
- [x] T013 [US2] Validar actual/nueva y actualizar hash+versión+evento en backend/src/accounts/accounts.service.ts (FR-003/004).
- [x] T014 [US2] Emitir/verificar credentialVersion y rechazar JWT antiguos en backend/src/auth/auth.service.ts y auth.guard.ts (FR-004).
- [x] T015 [US2] Implementar /profile/security y logout efectivo en frontend/src/app/profile/security/ (US2.1/2).

## Phase 5: US3 Foto — USR-02 / #234

**Objetivo:** subir/reemplazar/eliminar foto privada propia con persistencia local/S3.
**Prueba independiente:** cuenta y almacenamiento de prueba, sin correo/CSV.

- [x] T016 [P] [US3] Probar formatos, identidad, fallos y persistencia en backend/test/account-providers.test.mjs (SC-008).
- [x] T017 [US3] Implementar local/S3/disabled e imagen WebP acotada en backend/src/accounts/providers/avatar-storage.ts y image.ts (FR-005/006).
- [x] T018 [US3] Integrar upload, referencia auditada y compensación en backend/src/accounts/accounts.service.ts (FR-005/006/021).
- [x] T019 [US3] Mostrar Blob privado y liberar URLs en frontend/src/components/accounts/ y frontend/src/app/profile/ (US3.1/2).

## Phase 6: US4 Invitación/activación — USR-04 / #235

**Objetivo:** admin o superadmin da alta por formulario y el titular activa/acepta.
**Prueba independiente:** institución y administrador preparados; mailer test, sin UI CSV/perfil.

- [x] T020 [P] [US4] Probar UC/UTFSM, revocación, identidad existente y concurrencia en backend/test/integration/account-invitations.test.mjs (SC-002/004).
- [x] T021 [US4] Implementar creación/listado/revocación idempotentes en backend/src/accounts/invitations.service.ts (FR-007–009/022).
- [x] T022 [US4] Implementar dispatch/version/lease/reenvío y Resend fuera de DB en backend/src/accounts/invitations.service.ts y providers/mailer.ts (FR-010–013/020).
- [x] T023 [US4] Implementar activación nueva y aceptación autenticada mediante backend/src/accounts/invitations.controller.ts (FR-009–011).
- [x] T024 [US4] Ampliar solo lectura administrativa en backend/src/institutions/membership-admin.service.ts (FR-007; delegación sin ampliar).
- [x] T025 [US4] Implementar formulario/listado/acciones en frontend/src/app/admin/users/ y activación en frontend/src/app/activate/ (US4.1–3).
- [x] T026 [US4] Implementar limpieza de invitaciones a 30 días en backend/src/commands/account-cleanup.ts con auditoría/recibos mínimos (FR-025/SC-010).

## Phase 7: US5 CSV — USR-05 / #236

**Objetivo:** validar lista efímera, confirmar todo el lote y recuperar envíos pendientes.
**Prueba independiente:** operaciones US4 preparadas; no necesita su formulario individual.

- [x] T027 [P] [US5] Probar UTF-8/BOM/comillas/límites, atomicidad y replay en backend/test/integration/account-invitations.test.mjs (SC-005/006).
- [x] T028 [US5] Implementar parsing efímero y preview de 24 h en backend/src/accounts/imports.service.ts (FR-014–016/019).
- [x] T029 [US5] Implementar confirmación atómica e idempotente, recibo y GET en backend/src/accounts/imports.service.ts y imports.controller.ts (FR-017/018).
- [x] T030 [US5] Implementar preview/confirmación/progreso y continuación segura en frontend/src/app/admin/users/ (FR-020/SC-007).
- [x] T031 [US5] Limpiar PII/fingerprint a 7 días conservando recibos/FK en backend/src/commands/account-cleanup.ts (FR-025/SC-010).

## Phase 8: Integración y operación — USR-08 / #237

- [x] T032 Verificar tipos generados y catálogo desde docs/reference/openapi/openapi.yaml; generar frontend/src/lib/api/schema.d.ts.
- [x] T033 [P] Completar guías para Daniel en docs/planning/perfiles/operacion.md, operacion-s3.md y operacion-resend.md.
- [x] T034 Verificar migración poblada, runtime real y regresión académica en backend/test/integration/ (SC-001–010).
- [x] T035 Registrar aceptación manual de recorridos por Matías en docs/planning/perfiles/evidencia.md; Playwright omitido por instrucción del 2026-11-08 (FR-024/SC-008).
- [x] T036 Ejecutar checks de lint/tests/build/API/documentación de specs/20261106-170457_perfiles-altas-usuarios/quickstart.md y registrar resultados.
- [x] T037 Actualizar evidencia y cierre real por issue en docs/planning/perfiles/backlog.md; excluir archivos ajenos y secretos.
- [ ] T038 Completar S3 real con Daniel mediante docs/planning/perfiles/operacion.md; Resend manual confirmado por Matías el 2026-11-08.

## Dependencies & Execution Order

#233 → base → US1/US2/US3/US4; US5 reutiliza US4; integración reúne todas.
US1/2/3/4 se prueban con fixtures propios; no dependen de la UI de otra historia.
Modelo/migraciones y archivos compartidos se editan secuencialmente. Proveedores,
contratos/documentación y frontend pueden avanzar en paralelo con interfaces acordadas.

## Implementation Strategy

Una rama conservada y commits por avance. Perfil → contraseña/foto → alta individual
→ CSV → integración. Pruebas por incremento; #237 no pospone seguridad/integridad.
Configuración faltante no bloquea arranque; tampoco acredita correo/foto enviados.
T038 permanece pendiente por S3 real; Resend cuenta con aceptación manual del usuario.
No se ejecuta Playwright por instrucción expresa. Teclado/375 px/temas no tienen
resultados manuales desglosados; no se presentan como comprobados individualmente.
