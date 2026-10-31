# Implementación E2E: estado verificable

Corte local **2026-10-31**. **F1 y F2 aceptadas localmente; detenido antes de F3; suite incompleta.**
[Validación F2](F2_VALIDATION.md) · [Validación F1](F1_VALIDATION.md) · [Cobertura](COVERAGE.md) · [Ejecución](../E2E_README.md).

## Conservación y entorno

- Checkout permanente: `/Users/julian/lock-in-team-iic3143-202602`.
- Rama actual `test/e2e-f2`, desde F1 aceptada en `test/e2e-f1`; commits anteriores conservados.
- `dev` conserva90463059015e5045d011eadd12b6403b7b492615; sin push, merge ni producción.
- La copia temporal inicial permanece como respaldo; ejecución y Chromium usan el checkout permanente.
- PostgreSQL17/Chromium requieren ejecución local autorizada; ENV-01/02 resueltos en esa modalidad.
- No se modificaron frontend, backend, migraciones ni contrato durante F1.

## Implementado y ejecutado

- Runner propio: PostgreSQL17, build Next/Nest, standalone con `relativeAppDir` y static correctos.
- DB por caso/retry, migraciones reales, `academix_runtime` sin bypass RLS y cleanup con ownership.
- Seed: 2 instituciones, 23 actores, 7 cursos, 9 secciones, contenido y quizzes sintéticos.
- Perfiles ACTIVE/PUBLISHABLE/HISTORY por API real; helpers de calificación/publicación validados.
- Manifest tipado: actor, tenant, proyecto y nivel; ficha exige todas sus variantes declaradas.
- Reportes SHA/seedversion/dirty al inicio y final, HTML/JSON/JUnit, flaky separado y errores sanitizados.
- AUTH-001: SA/AO/T1/AS1/ST1; OPS-001…009 con pruebas positivas/negativas de infraestructura e integridad.

## Evidencia vigente

Código `23d7ebb6090be10403c2189c8e0ec7c8dc335185`, run c41540ab4f22ea26, checkout limpio y exit0.
**72 PASS, 0 FAIL/skip/flaky**: Chromium 58, Firefox 7, WebKit 7;51 instancias navegador y 21 complementarias.
**31 fichas aprobadas de 248**:21 navegador y 10 complementarias, con actor/tenant/nivel en todos los resultados.
F2 cubre PUBLIC/CATALOG y AUTH básico; comandos separados `pnpm test:e2e:f1` y `pnpm test:e2e:f2`.
Typecheck/lint/once unitarios PASS; cleanup y reportes revisados. Detalle y repetición en F2_VALIDATION.
F1 conserva su evidencia independiente; historial inicial y TEST-01 en [validación anterior](LOCAL_VALIDATION.md).
La petición posterior del usuario cambió el avance autónomo por revisión de cada fase: **F3 no iniciada**.

## Pendiente

- F3 seguridad, F4 contenido, F5 ciclo académico,
  F6 fallos/accesibilidad/compatibilidad, F7 CI/estabilidad, según roadmap e IDs originales.
- Completar matrices UC↔UTFSM/roles por operación, cálculos independientes y carreras académicas.
- Q02 adoptará HTTP400 para NUL, con corrección funcional separada si hace falta.
- Workflow preparado, sin ejecución remota ni branch protection; sin permiso de push/merge.
- 217 fichas aún pendientes; ninguna se declara aprobada por tener documentación o helpers.

Las estimaciones del plan son históricas, no porcentajes de avance ni promesa de duración.
