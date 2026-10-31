# Implementación E2E: estado verificable

Corte local **2026-10-31**. **F1, F2 y F3 aceptadas localmente; suite del catálogo incompleta.**
[Validación F3](F3_VALIDATION.md) · [F2](F2_VALIDATION.md) · [F1](F1_VALIDATION.md) · [Cobertura](COVERAGE.md).

## Conservación y entorno

- Checkout permanente:`/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f3`.
- Commits anteriores conservados; código validado `4d0da34409031ce0ffdab2d7b8deb66996fe0bc8`.
- `dev` conserva90463059015e5045d011eadd12b6403b7b492615; `main` conserva294eb5b4642479772a921ce56ce860c2f329abb6.
- Sin push, merge, despliegue ni producción; no se requieren archivos de la copia temporal inicial.
- ENV-01/02 resueltos con ejecución local autorizada de PostgreSQL17 y navegadores.
- Next/Nest y migraciones reales; DB por caso/retry, runtime sin bypass RLS y cleanup con ownership.
- Seed repetible de dos instituciones y23 actores; helpers académicos y operativos aislados.

## Evidencia vigente

Run `5dac3117c5e950ef`, SHA `4d0da34`, seed `academix-e2e-v1`, checkout limpio al inicio/final, exit0.
**201 PASS,0 FAIL/skip/flaky**:Chromium147,Firefox27,WebKit27.
Son151 instancias navegador y50 complementarias, con actor/tenant/nivel en los resultados.
**85/248 fichas aprobadas**:64 navegador y21 complementarias; **163 pendientes**.
F3 cierra sus54 fichas AUTH/TENANT/RBAC/ADMIN/AUDIT; detalle de tareas y repetición en[F3_VALIDATION](F3_VALIDATION.md).
Typecheck/lint y11 tests del harness PASS; reportes y limpieza revisados.
No se modificó producto ni se agregaron endpoints; no se conocen fronteras críticas fallidas en este alcance.

## Continuidad y pendiente

- **F4 autorizada como siguiente fase**,desde este estado validado.
- Retomar desde `test/e2e-f3`, crear `test/e2e-f4` y seguir[roadmap F4](../roadmap/F4.md).
- [Guía incremental de ejecución](E2E_EXECUTION_JOURNAL.md):comandos por fase,todas,visible e inspector.
- F4 cursos/contenido; F5 ciclo académico y22 smoke; F6 errores/accesibilidad/compatibilidad; F7 CI/estabilidad.
- Q02 conserva la decisión de rechazo HTTP400 para NUL, con corrección funcional separada si hace falta.
- Workflow preparado; ejecución remota,protección de ramas y20 runs elegibles no acreditados.
- Sin autorización de push/merge. No presentar los201 resultados como248 fichas ni como suite completa.

Las estimaciones del plan son históricas; no representan porcentajes de avance ni duración garantizada.
