# F1 — Validación de infraestructura y datos

Corte 2026-10-31. Rama `test/e2e-f1`, código `05fb1af5326226276d98df8cdce3d66d5bef71e9`.
F1 aceptada localmente; F2–F7 pendientes. Sin cambios funcionales ni push/merge.

## Ejecuciones limpias y repetidas

| Run | Commit limpio | Resultado | Tests / total |
| --- | --- | --- | --- |
| 882298137195cca0 | 05fb1af, dirty=false | 16 PASS; 0 FAIL/skip/flaky | 31,641s / 41,833s |
| c76306a0e684865a | 05fb1af, dirty=false | 16 PASS; 0 FAIL/skip/flaky | 30,769s / 39,241s |

Comando desde raíz, con ejecución local autorizada:

```bash
PLAYWRIGHT_BROWSERS_PATH="$PWD/e2e/.cache/browsers" \
  pnpm --dir e2e run test --grep 'E2E-OPS-|E2E-AUTH-001'
```

Son 10 fichas: AUTH-001 con 5 variantes y OPS-001…009 con 11 variantes.
Por nivel: 7 instancias navegador y 9 complementarias API/SQL/harness.
Coverage del segundo run: catálogo248, definidas10, ejecutadas10, aprobadas10, pendientes238.
Reportes HTML/JSON/JUnit/run/coverage bajo `e2e/reports/<runId>/`, ignorados por Git.
Seed `academix-e2e-v1`; runtime `academix_runtime`, PG17, Chromium; ningún recurso externo.

## Garantías comprobadas

- OPS-001: health/ready, rol runtime sin acceso global y predeploy sin duplicar migraciones.
- OPS-002: caída real del PG propio, health200/ready503/privado503, error UI, recuperación y snapshot intacto.
- OPS-003: startup rechaza owner y tabla sin RLS, sin servir tráfico.
- OPS-004: ensure repetido conserva edición y rol revocado; escritura posterior404 y colisión rechazada.
- OPS-005: material y nota publicada sobreviven al reinicio API, nueva sesión y lectura UI/API/SQL.
- OPS-006: runtime rechaza FK cruzada, write fuera de tenant y cambios/borrados de historia académica.
- OPS-007: lock real fuerza fallo submit500; rollback conserva answers, sin Grade/audit parcial;
  recuperación con misma key produce una calificación/evento, replay idéntico, sin submitted durable.
- OPS-008: rechazo antes de I/O de destinos ajenos; camino permitido con ownership y cleanup que rechaza owner erróneo.
- OPS-009: destrucción de DB propia y baseline nueva sin intentos/notas/recibos previos.
- AUTH-001: cinco perfiles mantienen login/navegación reales y sesión solo en RAM.

ACTIVE/PUBLISHABLE/HISTORY se preparan con helpers API reales; HISTORY incluye intento cancelado.
Typecheck/lint y diez unitarios PASS; evaluación de fichas exige variantes/proyectos declarados,
separa flaky de failed y no acredita proyectos ausentes del reporte.

## Diagnóstico y límites

Runs iniciales c502c69ffc099f09,0183341873b50b08,bff0f73cce106e46 conservaron fallos reales.
Se corrigieron reinicio PG (puerto explícito), cleanup detenido, navegación antes de render y selectores.
El control existente oculta curso sin roles con404; no se cambió a403 ni se alteró el producto.
Traza real sanitizada de bff0f73cce106e46: sin patrones JWT; la prueba unitaria cubre otros secretos.
Los dos runs aprobados no retuvieron directorios PG; directorio detenido del primer fallo fue retirado
solo tras verificar runId y ausencia de postmaster.pid. No se tocó el PostgreSQL local de puerto5432.
Fronteras por las50 operaciones, matrices completas, navegadores adicionales y estabilidad20runs pendientes.
