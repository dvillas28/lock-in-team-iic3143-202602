# Quickstart focalizado: Privacidad de notas (US4)

Estado: guía reproducible; pruebas nuevas implementadas y ejecutadas localmente.
[Evidencia antes/después](../../docs/backend/audit-grade-privacy-validation.md). Sin despliegue.

## Preparación

Node 24, pnpm 9.15.9 y PostgreSQL 17. Reutilizar preparación de la base descartable
del [quickstart institucional](../20261020-211552_demo-aislamiento-dominios/quickstart.md).
Inyectar TEST_DATABASE_URL operativa y TEST_RUNTIME_DATABASE_URL del rol
academix_runtime en la misma base exclusiva cuyo nombre termina en `_test`.
El operador debe poder migrar y provisionar runtime; el harness genera secretos.
Las fixtures recrean public: no usar base local compartida ni producción.
No ejecutar builds backend simultáneos: Nest reemplaza dist durante las pruebas.

Desde la raíz, si no están instaladas las dependencias:

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
```

## 1. Demostrar la regresión US4 privacidad

Tras crear los casos previstos en tasks.md, antes de corregir AuditService:

```bash
pnpm --dir backend build
pnpm --dir backend exec node --test --test-concurrency=1 test/integration/gradebook-audit-privacy.test.mjs
```

Esperado antes del fix: falla la aserción de ausencia de eventos grade para
owner+student sin teacher. Guardar solo resultado sanitizado, nunca tokens o URLs.
Después del fix debe aprobar sin omitir ese caso ni cambiar el resultado esperado.

Matriz US4 privacidad:

1. Revocar teacher del owner+student antes de iniciar/enviar un intento; obtener
   Grade no publicada. Para cursor previo, usar otro escenario con historia ya creada.
2. Con el mismo token, comparar intento, my-grades y audit-events sin filtros:
   no nota, porcentaje, puntaje o evento grade; sí eventos administrativos.
3. Repetir con resourceType=grade, acciones grade.created/updated/published,
   resourceId, actor, fechas y sección. Colección autorizada vacía conserva 200.
4. Publicar mediante otro docente autorizado; estudiante ve su nota propia en
   my-grades, pero no obtiene eventos grade por auditoría.
5. Dataset solo grade: items=[], hasMore=false, nextCursor=null.
6. Dataset mixto y limit=1: recorrer páginas de eventos administrativos completos,
   sin duplicados ni continuación provocada exclusivamente por filas prohibidas.
7. Obtener cursor como teacher, revocar docencia y continuar con la misma sesión:
   ningún evento de nota vuelve a aparecer.
8. Student/assistant sin owner: auditoría prohibida. Superadmin aislado no accede
   a cursos ajenos. Desactivación de usuario/membership/institución retira acceso.

## 2. Comprobar continuidad US4 continuidad

```bash
pnpm --dir backend exec node --test --test-concurrency=1 test/integration/gradebook-audit-scope.test.mjs test/integration/gradebook-audit-read.test.mjs test/integration/course-audit.test.mjs test/integration/tenant-isolation.test.mjs
```

- Teacher de sección 1 ve sus eventos de notas históricos y no los de sección 2.
- Owner+teacher ve ambos y eventos históricos sin sección; owner sin teacher,
  ninguno de grade. Teacher ordinario tampoco ve grade sin sección.
- Revocar is_admin conservando teacher reduce alcance a sus secciones vigentes.
- Revocar matrícula del estudiante no elimina la sección histórica del evento.
- UC/UTFSM: token/slug/recurso cruzados y headers falsos no amplían contexto.
- Runtime sin contexto sigue sin leer filas institucionales aunque falte filtro SQL;
  verificar la suite existente de RLS y reuso de conexiones.
- Antes/después de consultas: misma cantidad y contenido de notas, intentos,
  eventos y ponderaciones. Comparar solo después de preparar las fixtures.
- Payload legacy: credenciales/respuestas/pauta no salen; resultados incrustados
  en recursos no grade no sobreviven a la allowlist de lectura.

## 3. Checks de cierre

Ejecutar en serie una vez aprobados los casos focalizados:

```bash
pnpm --dir backend lint
pnpm --dir backend test:coverage
pnpm docs:api:lint
pnpm docs:api:test
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend exec node --import tsx --test test/audit-api.test.ts test/audit-ui.test.ts test/gradebook-capabilities.test.ts
python3 .github/scripts/check-doc-length.py --self-test
python3 .github/scripts/check-doc-length.py
git diff --check
```

Coverage incluye build, unitarias e integración. Contratos recompila backend:
terminar coverage antes de iniciarlo. No recrear esquema en paralelo.
Sin cambio de DTO, cliente generado no debe presentar un diff estructural.
No se exige rediseño UI ni suite visual nueva para corregir autorización de lectura.

## Evidencia y criterio de cierre

Registrar en `docs/backend/audit-grade-privacy-validation.md`: commit, fecha,
comandos/resultados, regresión antes/después y matriz FR-001–010 / SC-001–005.
No publicar secretos ni copiar dumps. Enlazar evidencia desde intentos y notas,
actualizando solo el estado del hallazgo; otras tareas conservan sus pendientes.
No marcar completado por generar este plan o porque las suites antiguas pasen.
No ejecutar despliegue ni smoke contra producción como parte de esta guía.
