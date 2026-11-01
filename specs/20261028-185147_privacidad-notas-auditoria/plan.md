# Implementation Plan: Polish y respuesta al feedback de E2

**Branch**: `fix/polish-feedback-e2` | **Revised**: 2026-10-29 | **Spec**: [spec.md](spec.md)
**Input**: `specs/20261028-185147_privacidad-notas-auditoria/spec.md`
**Estado**: Implementación y validación local completadas; revisión final conforme.
[Evidencia](../../docs/backend/feedback-e2-validation.md). Sin despliegue.
Directorio conserva su nombre histórico; rama de implementación fix/polish-feedback-e2.

## Summary

Documentar respuestas ya existentes al corte y ejecutar solo brechas reales:
cardinalidades y roles consistentes, administración/provisión explícitas,
arquitectura simple y formatos finales alineados. La matriz histórica distingue
trabajo previo, verificación nueva, cambio documental y cambio funcional.
Privacidad de notas en auditoría sigue como corrección técnica asociada,
separada del feedback textual; filtro SQL antes de paginar, sin borrar historia.

## Technical Context

| Aspecto | Decisión |
| --- | --- |
| Runtime existente | TypeScript 5.9.3, Node 24, pnpm 9.15.9; NestJS 12.1.0, pg 8.23.1 |
| Datos existentes | PostgreSQL 17 compartida, CHECK role, flags institucionales, RLS y runtime sin bypass |
| Documentos | Markdown/Mermaid, catálogo XLSX editable, fuentes TeX y exportaciones PDF/SVG existentes |
| Operación | render.yaml declara app/API/DB sin HAProxy; no se verifica ambiente remoto al planificar |
| Pruebas | node:test; HTTP/PostgreSQL en DB `_test`, consumidor frontend y validación de diagramas/exportaciones |
| Restricciones | Sin nuevos roles, proveedores, migraciones, UI, servicios, registro de cuentas ni generador de catálogo |
| Rendimiento | Auditoría conserva una consulta paginada, 20 por defecto/100 máximo, sin consultas por evento |
| Evidencia | Commit de corte, fecha, fuente/celda y alcance; archivos locales no versionados no acreditan cierre |

## Constitution Check

Pre-design y post-design: PASS para el alcance revisado; ejecución pendiente.

- Tenant: ruta y membership validadas, institution_id, RLS y runtime intactos;
  probar creación/delegación cruzadas, consultas sin filtro y reuso existente.
- Roles: operador no es superadmin global. is_super_admin delega is_admin solo
  en su institución; is_admin+ownership administra cursos propios; Enrollment
  mantiene teacher/assistant/student y no se deriva de etiquetas de seed o UI.
- Historia: registros académicos append-only/auditados, sin reescritura por polish;
  corte y fuente histórica inmutables, resultados posteriores en sección separada.
- Independencia: cada US produce capacidad/evidencia propia con fixtures existentes;
  cierre de la misión requiere todas. Documentación no depende de desplegar.
- Complejidad: mantener CHECK para role; enum conceptual explícito, sin enum SQL
  nuevo solo por formato. Mantener provisioning acotado, no autoservicio.
- Trazabilidad: CU-01–04/12/13/16, RF1–12/23/25/26/29, RNF1–4/6/7/9/10;
  PREP-05, BE-02/28/30/31, FE-19 y DOC-15/16/17/19, sin reasignar responsables.
- Todos los artefactos <150 líneas; dividir evidencia/anexos si crecen.

## Project Structure

### Documentation (this feature)

```text
specs/20261028-185147_privacidad-notas-auditoria/
  spec.md, plan.md, research.md, data-model.md, tasks.md
  quickstart.md, quickstart-audit.md
  contracts/feedback-e2.md, contracts/audit-visibility.md
  checklists/requirements.md
```

### Source Code and delivery artifacts

```text
docs/deliveries/2/15-feedback-e2.md                       # corte inmutable + registro posterior
docs/deliveries/2/{02-scope,04-architecture,05-domain-model,05-domain-model-uml}.md
docs/deliveries/2/06-data-model*.md, 12-data-catalog*.md
docs/deliveries/2/data-catalog/academix-data-catalog.xlsx # catálogo editable existente
docs/deliveries/2/data-catalog/academix-er.{mmd,svg,pdf}
docs/deliveries/2/{README,10-status}.md
docs/deliveries/2/domain-overview.tex                 # figura conceptual compartida
docs/deliveries/2/report/main.{tex,pdf}
docs/deliveries/2/ppt/main.{tex,pdf}, ppt/speaker-guide.md
backend/src/audit/audit.service.ts                       # único cambio productivo previsto
backend/test/integration/gradebook-audit-{privacy,scope}.test.mjs # nuevos
backend/test/integration/{gradebook-audit-read,course-audit,tenant-isolation}.test.mjs
backend/test/integration/{courses-write,membership-admin,onboarding,demo-migration,enrollments}.test.mjs
frontend/test/{audit-api,audit-ui,gradebook-capabilities}.test.ts
```

**Structure Decision**: Reutilizar fuentes/formatos existentes; no tocar otras
entregas ni incorporar borrados ajenos del workspace. Contratos OpenAPI de cursos,
memberships y auditoría se contrastan; solo auditoría cambia semántica de lectura.
Evidencia nueva prevista: `docs/backend/feedback-e2-validation.md` y
`docs/backend/audit-grade-privacy-validation.md`, enlazadas desde la matriz.
Decisión de privacidad: futuro `docs/adr/grade-audit-visibility.md` acota ADR previos.

## Design & Delivery

1. US1: congelar corte ya documentado y contrastar siete IDs de feedback con
   código del commit y evidencias históricas. Añadir resultados posteriores sin
   editar lo previo. No inferir que preexistente significa anterior a la evaluación.
2. US2: revisar relaciones y opcionalidad, incluida auditoría operativa sin
   actor/curso y Quiz con Section opcional. Corregir vínculos obsoletos, no solo
   rotular flechas. Separar invariantes persistidas y reglas al crear recursos.
3. US2: representar role como dominio enumerado teacher/student/assistant;
   conservar varchar+CHECK y validar rechazo real. Sin migración ni nuevo RBAC.
4. US3: matriz operador/superadmin/admin/teacher/assistant/student. Documentar
   quién crea curso, delega, hace bootstrap y qué altas no existen. No convertir
   onboarding de institución/identidad inicial en alta general para tenant existente.
5. US4: añadir condición resource_type distinto de grade o teacher activo en
   AuditService.list, conservando owner/secciones/tenant antes de ORDER/LIMIT.
   Mantener snapshot, DTO, page/paginated y revalidación por consulta/cursor.
6. US4: revocar teacher antes de rendir como estudiante; usar fixtures históricas
   separadas para probar cursor obtenido como docente y luego revocado. Probar
   ownership sin docencia, todos los filtros, positivos y ausencia de escrituras.
7. US5: diagramar Render/app/API/PostgreSQL según configuración y clasificar lo
   no verificado remotamente. HAProxy, HA y pooling externo quedan diferidos;
   no remover configuraciones productivas sin evidencia de uso/alcance.
8. Integración: actualizar Markdown, TeX, catálogo y exportaciones; registrar
   comandos/herramientas y revisión visual de PDF/SVG. No asumir que editar
   Mermaid actualiza automáticamente TeX o que el catálogo tiene generador.

## Validation & Rollout

[Quickstart](quickstart.md) verifica el feedback y enlaza [auditoría](quickstart-audit.md).
Línea base registra inspección, no resultados nuevos. Pruebas de código requieren
DB descartable exclusiva `_test`, dos credenciales y ejecución backend en serie.
Modelos: revisar todas las relaciones representadas y formatos, con snapshot de
fuentes/exportaciones previo a cambios. Los archivos históricos del corte siguen
accesibles por commit; no editar la evaluación original ni sus comentarios.
Registrar matriz FR-001–020/SC-001–010 y siete IDs más AUD-PRIV. Cierre requiere
pruebas reales o limitación/deferimiento explícito; no prometer despliegue ejecutado.
No cerrar T031/T036 heredadas sin revisar todos sus criterios adicionales.

## Complexity Tracking

Sin violaciones: corrección localizada, documentación/evidencia y capacidades ya
implementadas. Nuevas cuentas generales, enum SQL nativo y servicios HA quedan
fuera. Una necesidad funcional adicional obliga a refinar el spec antes de codificar.
