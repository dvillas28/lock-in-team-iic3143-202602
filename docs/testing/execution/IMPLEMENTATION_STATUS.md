# Implementación E2E: estado verificable

Corte local **2026-10-31**. **F1 aceptada localmente; F2 en implementación; suite incompleta.**
[Validación F1](F1_VALIDATION.md) · [Cobertura](COVERAGE.md) · [Ejecución](../E2E_README.md).

## Conservación y entorno

- Checkout permanente: `/Users/julian/lock-in-team-iic3143-202602`.
- Rama F1 `test/e2e-f1`, desde `test/e2e-implementation`; commits anteriores conservados.
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

Código `05fb1af5326226276d98df8cdce3d66d5bef71e9`, dos ejecuciones con checkout limpio:
882298137195cca0 y c76306a0e684865a. Ambas **16 PASS, 0 FAIL/skip/flaky**.
Son **10 fichas aprobadas de248**, distribuidas en3 de navegador y7 complementarias.
Typecheck/lint/diez unitarios PASS. Ningún directorio PG retenido por los dos runs aprobados.
Los reportes están en `e2e/reports/<runId>/` (ignorados); el detalle durable está en F1_VALIDATION.
El historial inicial y TEST-01 se conservan en [validación anterior](LOCAL_VALIDATION.md).

## Pendiente

- F2: PUBLIC/CATALOG y AUTH básico; luego F3 seguridad, F4 contenido, F5 ciclo académico,
  F6 fallos/accesibilidad/compatibilidad, F7 CI/estabilidad, según roadmap e IDs originales.
- Completar matrices UC↔UTFSM/roles por operación, cálculos independientes y carreras académicas.
- Q02 adoptará HTTP400 para NUL, con corrección funcional separada si hace falta.
- Workflow preparado, sin ejecución remota ni branch protection; sin permiso de push/merge.
- 238 fichas aún pendientes; ninguna se declara aprobada por tener documentación o helpers.

Las estimaciones del plan son históricas, no porcentajes de avance ni promesa de duración.
