# Tasks: Polish y respuesta al feedback de E2

**Input**: `specs/20261028-185147_privacidad-notas-auditoria/`
**Prerequisites**: [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md), [contrato feedback](contracts/feedback-e2.md), [contrato auditoría](contracts/audit-visibility.md), [quickstart](quickstart.md).
**Estado**: 28/28 ejecutadas y validadas localmente; lms-reviewer y speckit-analyze sin hallazgos pendientes. Evidencias desde la matriz; sin despliegue.
**Owners**: Conservar responsables PREP-05/BE-02/28/30/31, FE-19, DOC-15/16/17/19; no reasignación implícita.

## Format

Checkbox + ID secuencial + [P] si archivos independientes + [USn] en historias.
Cada tarea tiene ruta y requisito. Pruebas obligatorias en permisos/integridad;
no duplicar pruebas existentes ni implementar capacidades ya presentes por su documentación.

## Phase 1: Setup

- [X] T001 Contrastar `specs/20261028-185147_privacidad-notas-auditoria/spec.md` con planilla E2 fila 6 y `docs/deliveries/2/15-feedback-e2.md`; confirmar cinco frentes accionables, dos valoraciones positivas y AUD-PRIV separado de comentarios originales (FR-011/012/020; SC-006).
- [X] T002 Verificar en `docs/deliveries/2/15-feedback-e2.md` fecha/commit/hash y estado previo contra fuentes del corte; conservar cambios ajenos y no atribuir código previo al feedback sin historia comprobada (FR-011/019; SC-006/010).

## Phase 2: Foundation

- [X] T003 Revisar límites, clasificación documental/validación/funcional/diferida y matriz de actores en `specs/20261028-185147_privacidad-notas-auditoria/contracts/feedback-e2.md`; confirmar capacidades existentes y registrar brechas nuevas para refinamiento antes de ampliar producto, sin nuevas dependencias o migraciones (FR-014–017/020).

**Checkpoint**: Corte preservado; cada acción diferencia existente y posterior.

## Phase 3: US1 - Atribución del trabajo previo y posterior (P1)

**Goal**: Equipo/evaluador distingue línea base y respuesta nueva.
**Independent Test**: Matriz contrastable con el commit de corte y un cambio posterior.

- [X] T004 [US1] Completar revisión de siete IDs y acciones POL-01–07 en `docs/deliveries/2/15-feedback-e2.md`: evidencia previa, brecha, clase y responsable vigente; registrar solo en sección posterior cualquier resultado nuevo (FR-011/012/019/020; SC-006/010).
- [X] T005 [US1] Definir en `docs/backend/feedback-e2-validation.md` registro por celda/ID, commit/fecha, alcance y estado; enlazar desde `docs/deliveries/2/15-feedback-e2.md` y su índice sin confundir inspección, prueba histórica, prueba nueva o despliegue (FR-011/012/018/019; SC-006/010).

## Phase 4: US2 - Modelos coherentes y roles cerrados (P1)

**Goal**: Cardinalidades, opcionalidad y roles comprensibles en todos los formatos.
**Independent Test**: Todas las relaciones representadas tienen regla y extremos verificables; role inválido rechazado.

- [X] T006 [US2] Contrastar relaciones en `docs/deliveries/2/05-domain-model-uml.md`, `docs/deliveries/2/06-data-model-erd-1.md` y `docs/deliveries/2/06-data-model-erd-2.md` contra DDL y `specs/20261028-185147_privacidad-notas-auditoria/data-model.md`; registrar tabla relación/mínimo/máximo/regla, incluyendo Quiz opcional y AuditEvent operativo (FR-013/015; SC-007).
- [X] T007 [US2] Corregir relaciones/cardinalidades y capacidades institucionales en `docs/deliveries/2/05-domain-model.md`, `docs/deliveries/2/05-domain-model-uml.md` y `docs/deliveries/2/06-data-model*.md`; distinguir conceptual/físico y reglas al crear; reducir bajo 150 líneas o justificar 150–200, dividir si excede 200 (FR-013/015/018; SC-007).
- [X] T008 [US2] Explicar dominio enumerado y decisión varchar+CHECK en `docs/deliveries/2/06-data-model-part-1.md`; verificar caso role inválido en `backend/test/integration/enrollments.test.mjs`, añadiéndolo solo si falta, sin migración por apariencia ni privilegios nuevos (FR-014/019; SC-008).
- [X] T009 [US2] Alinear roles, flags y relaciones del catálogo en `docs/deliveries/2/data-catalog/academix-data-catalog.xlsx`, `docs/deliveries/2/data-catalog/academix-er.mmd` y `docs/deliveries/2/12-data-catalog*.md`; preservar datos válidos, registrar revisión y preparar exportación según README existente, sin crear generador (FR-013–015/018; SC-007).

## Phase 5: US3 - Administración y cuentas explícitas (P1)

**Goal**: Explicar y demostrar capacidades existentes, sin inventar altas generales.
**Independent Test**: Seis actores, creación/delegación de dos instituciones y provisión/replay con restricciones vigentes.

- [X] T010 [US3] Publicar matriz operador/superadmin/admin/teacher/assistant/student en `docs/deliveries/2/05-domain-model.md` y enlazar `docs/adr/institution-admin-and-course-ownership.md`: quién crea cursos, delega, administra instituciones y conserva límites de ownership/Enrollment (FR-015/018; SC-008).
- [X] T011 [US3] Ejecutar `backend/test/integration/courses-write.test.mjs`, `backend/test/integration/membership-admin.test.mjs` y `backend/test/integration/onboarding.test.mjs`; añadir solo casos faltantes de creación/delegación autorizadas, cruces y privilegio insuficiente, registrando que la funcionalidad ya estaba presente al corte (FR-001/015/019; SC-008).
- [X] T012 [US3] Documentar en `docs/guides/demo-accounts.md` cuentas/dataset sin secretos, flags iniciales, matrículas, provisión inicial y seed académico separado; distinguir nueva institución de altas generales en institución existente y declarar estas últimas fuera del MVP; enlazar desde `docs/backend/demo-tenant-bootstrap.md` (FR-015/016/018; SC-009).
- [X] T013 [US3] Ejecutar `backend/test/integration/demo-migration.test.mjs` y `backend/test/integration/onboarding.test.mjs` con DB exclusiva `_test`; verificar replay, identidades/hash, revocaciones y datos previos; registrar resultados/limitaciones nuevos en `docs/backend/feedback-e2-validation.md` sin publicar credenciales (FR-001/016/019; SC-009).

## Phase 6: US4 - Privacidad de auditoría asociada (P1)

**Goal**: Corregir AUD-PRIV sin atribuirlo al comentario del evaluador.
**Independent Test**: Historia existente, owner+student sin teacher y docentes de dos secciones; no depende del polish de modelos.

- [X] T014 [US4] Crear `docs/adr/grade-audit-visibility.md` y acotar referencias de `docs/adr/institution-admin-and-course-ownership.md` y `docs/adr/grade-publication-and-weight-freeze.md`; conservar administrativos owner y seguimiento assistant sin ampliar roles; preparar DB exclusiva según quickstart (FR-002/004/006/007).
- [X] T015 [US4] Crear `backend/test/integration/gradebook-audit-privacy.test.mjs`: revocar teacher antes de rendir como owner+student, obtener nota no publicada y demostrar fuga previa; probar publicadas/no, propias/ajenas, filtros/solo grade/páginas mixtas, cursor tras revocar, identidades inactivas y sanitización; no forzar rendición con permiso de pauta (FR-002–006/008–010; SC-001/003/005).
- [X] T016 [P] [US4] Crear `backend/test/integration/gradebook-audit-scope.test.mjs` con fixtures existentes: teacher sección 1/2, owner+teacher, pérdida de admin, sección histórica con alumno revocado, eventos sin sección, UC/UTFSM y snapshot inmutable antes/después; preparar historia independiente del test de rendición (FR-001/002/005/007/009/010; SC-002–004).
- [X] T017 [US4] Corregir solo list en `backend/src/audit/audit.service.ts`: exigir teacher para recurso grade antes de ORDER/LIMIT conservando scope/DTO/snapshot; precisar `backend/test/integration/gradebook-audit-read.test.mjs` para owner sin teacher con 200 administrativos y cero grade, sin cambiar courseScope ni RLS (FR-001–009; SC-001–005).
- [X] T018 [US4] Ejecutar regresión antes/después y suites de `specs/20261028-185147_privacidad-notas-auditoria/quickstart-audit.md`; actualizar descripción `docs/reference/openapi/paths/audit.yaml`, comprobar consumidor y registrar evidencia/commit en `docs/backend/audit-grade-privacy-validation.md` (FR-001–010/019; SC-001–005).
- [X] T019 [US4] Enlazar resolución real de AUD-PRIV desde `docs/backend/attempts-grading-validation.md`, `docs/backend/gradebook-validation.md` y sus specs/planes afectados; actualizar solo ese hallazgo y conservar otras tareas abiertas, enlazándolo como funcional en la sección posterior de `docs/deliveries/2/15-feedback-e2.md` (FR-010/012/019/020).

## Phase 7: US5 - Arquitectura mínima y verificable (P2)

**Goal**: Responder C6 con topología real, sin infraestructura especulativa.
**Independent Test**: Documentos coinciden con configuración y separan estado local/remoto.

- [X] T020 [US5] Reescribir `docs/deliveries/2/04-architecture.md` a <150 líneas con Render/app/API/PostgreSQL y límites reales; retirar/diferir HAProxy/HA/PgBouncer sin necesidad y conservar decisiones vigentes mediante referencias a `docs/adr/deploy-on-render.md`; no desplegar ni eliminar infraestructura por suposición (FR-017/018; SC-010).
- [X] T021 [US5] Alinear plataforma, RLS, alcance existente/pendiente y provisión en `docs/deliveries/2/02-scope.md`, `docs/deliveries/2/10-status.md` y `docs/deliveries/2/README.md`; distinguir código/configuración y validación desplegada, sin atribuir las capacidades anteriores al polish (FR-011/015–019; SC-006/010).
- [X] T022 [US5] Revisar contradicciones de los cinco frentes en `docs/deliveries/2/03-use-cases-and-requirements.md` y `docs/deliveries/2/09-walking-skeleton-plan.md`; actualizar reglas afectadas, dividir todo Markdown modificado >200 como índice y anexos bajo 150 líneas conservando enlaces/IDs, y registrar decisiones diferidas sin prometerlas (FR-015/017/018/020; SC-010).

## Phase 8: Integration and delivery

- [X] T023 Conservar valoraciones F6/G6 y responsables en `docs/deliveries/2/07-risks.md`, `docs/deliveries/2/08-work-plan.md` y `docs/deliveries/2/15-feedback-e2.md`; actualizar solo riesgos/estado afectados y justificar diferencias, sin reinventar planificación (FR-012/020; SC-006/010).
- [X] T024 Alinear cardinalidades, roles/admin, cuentas y arquitectura actual en `docs/deliveries/2/report/main.tex`, `docs/deliveries/2/ppt/main.tex` y `docs/deliveries/2/ppt/speaker-guide.md`; incluir explicación de lo previo y del polish sin causalidad retroactiva (FR-011–018/020; SC-006–010).
- [X] T025 Regenerar/revisar `docs/deliveries/2/report/main.pdf`, `docs/deliveries/2/ppt/main.pdf` y `docs/deliveries/2/data-catalog/academix-er.svg`/`academix-er.pdf`; comprobar legibilidad/cortes y correspondencia con fuentes/XLSX, registrar comandos/versiones en `docs/backend/feedback-e2-validation.md` sin versionar auxiliares (FR-013/018/019; SC-007/010).
- [X] T026 Ejecutar checks backend/contratos/consumidor del `specs/20261028-185147_privacidad-notas-auditoria/quickstart.md` en serie, controles de longitud y enlaces de documentos modificados; registrar resultados reales, bloqueos y cobertura FR-001–020/SC-001–010 en las dos evidencias sin omitir negativos (FR-010/018/019; SC-001–010).
- [X] T027 Completar solo el registro posterior de `docs/deliveries/2/15-feedback-e2.md` con commit/PR, clase, prueba/revisión, resultado y limitación de cada ID/POL; mantener sección/columnas iniciales y hash intactos; una exclusión no se marca como capacidad aprobada (FR-011/012/019/020; SC-006/010).
- [X] T028 Reanalizar `specs/20261028-185147_privacidad-notas-auditoria/spec.md`, `plan.md` y `tasks.md` contra evidencias; actualizar estados/casillas solo de trabajo comprobado y preparar resumen existente/cambiado/diferido, sin cerrar otras misiones ni hacer merge/despliegue automático (FR-010/011/019/020; SC-001–010).

## Dependencies & Execution Order

- T001 → T002 → T003 → US1 (T004 → T005).
- US2: T006 → T007 → T008 → T009. US3: T010 → T011 → T012 → T013.
- US4: T014 → T015/T016 (archivos distintos) → T017 → T018 → T019.
- US5: T020 → T021 → T022. Tras US1, las otras historias son comprobables
  con fixtures existentes sin exigir implementación de otra; integrar secuencialmente
  las ediciones compartidas de modelo, matriz y evidencia.
- Todas las historias → T023 → T024 → T025 → T026 → T027 → T028.
- T015/T016 pueden prepararse en paralelo tras T014; pruebas PostgreSQL y
  builds backend se ejecutan en serie sobre una misma base descartable.

## Parallel Execution Examples

- US2: revisión de multiplicidades independiente de preparar casos de US4.
- US3: preparar guía de cuentas mientras US4 escribe tests en archivos distintos.
- US4: T015/T016 usan archivos propios; integración en AuditService tiene un dueño.
- US5: comparar configuración sin editar documentos compartidos durante US2.

## Implementation Strategy

1. US1 fija trazabilidad; US2/US3 responden descuentos de dominio/datos.
2. US4 corrige el riesgo propio de permisos; US5 simplifica el relato arquitectónico.
3. Documentar y validar lo ya presente; implementar solo la corrección funcional descrita.
4. Cierre requiere cinco frentes y positivos trazados, formatos coherentes y negativos
   de seguridad aprobados. Diferido/bloqueado permanece explícitamente pendiente.
