# Validación local y defectos observados

Corte: 2026-10-31, macOS, Node24.9.0; ejecución en copia aislada.
[Estado y cobertura](IMPLEMENTATION_STATUS.md) · [Instrucciones reproducibles](../E2E_README.md).

## Reanudación autorizada · 31oct2026

PostgreSQL17 y Chromium156.0.8078.4 arrancan al solicitar ejecución con permisos adicionales.
El sandbox ordinario falló primero en el IPC de tsx (`listen EPERM`), sin ejecutar el runner.
La caché predeterminada de Playwright no contenía el binario requerido; se usó el ya descargado:

```bash
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/academix-e2e-browsers \
  pnpm --dir e2e run test --grep E2E-AUTH-001
```

| Run / comprobación | Resultado | Límite |
| --- | --- | --- |
| Chromium independiente, lanzar/cerrar con API Playwright | PASS | Sin página externa |
| afc3407c188ca3e5 | exit1, preparación8,409s | PG funciona; ruta standalone incorrecta del harness |
| fca369872c1f358e | 5/5 PASS; tests14,013s; total21,614s | AUTH-001, Chromium, cinco roles UC |
| 2d52bab34d20749d | 5/5 PASS; tests11,529s; total20,193s | Repetición con cluster/bases nuevos |
| typecheck / lint / test:harness | PASS / PASS / 9 de9 PASS | Unitarios no cuentan como fichas E2E |
| coverage, último run | 248 catálogo; definida1; ejecutada1; aprobada1; pendientes247 | No acepta F1 ni F2 |
| Verificar puertos4320/4321 tras teardown | Ambos libres | No sustituye OPS-005/009 ante fallos |
| Buscar directorios PG de los tres runIds | Ninguno retenido | No se tocaron recursos de otros runs |
| Escanear JSON/XML/HTML de ambos runs por JWT y URL PostgreSQL | Sin coincidencias | Sin trazas de fallo reales para validar sanitización |

Ambos runs verdes parten de e4679a6da952bd238103042803a8e5da04b45773 con `dirty=true`.
Único cambio de código: `e2e/runner/run.ts`, ruta standalone basada en `relativeAppDir`,
assets junto al servidor generado y diagnóstico de Next al fallar readiness.
SHA256 del runner probado: `1c6325cac0fd9e9ca72da4a8624ada6621c9b6f89ebd5a05399e0c43ee34a3f2`.
No cambió frontend/backend, contrato, migraciones ni aserciones del smoke.

HTML, results.json, junit.xml y run.json en `e2e/reports/<runId>/` (ignorados por Git).
Cobertura del último run en su coverage.json; latest.json apunta a 2d52bab34d20749d.
Cinco variantes son una ficha; dos repeticiones no acreditan una ventana de estabilidad.
Seed SQL, migraciones y login real comprobados; ensure/replay y helpers académicos pendientes.
ENV-01/02 quedan resueltos para esta ejecución autorizada. F1 continúa sin aceptación OPS.

## Histórico · 30oct2026

Los siguientes resultados se conservan como evidencia del bloqueo anterior, ya resuelto
para PG/Chromium en ejecución autorizada. Los checks de producto no se repitieron el 31oct.

| Comando / comprobación real | Resultado | Límite |
| --- | --- | --- |
| Instalar paquetes raíz/backend/frontend/e2e con pnpm | Completado | Store temporal separado por permisos locales |
| `pnpm --dir e2e exec playwright install chromium` | Completado | Descargar no acredita arrancar navegador |
| `pnpm --dir e2e typecheck` | PASS | Compilación estática del harness |
| `pnpm --dir e2e lint` | PASS | No verifica flujos |
| `pnpm --dir e2e test:harness` | 9/9 PASS, 0 skip; 251,678ms | Unitarios: 5 guard, 1 sanitizador, 3 reporte |
| `pnpm --dir e2e test:list` | 5 instancias / 1 archivo | AUTH-001, Chromium; no se ejecutaron |
| `pnpm --dir e2e run test --grep E2E-AUTH-001` | exit1 / ENV-01 | 0 tests ejecutados; preparación1194ms |
| `pnpm --dir e2e coverage` | catálogo248, defined1, executed0, passed0, pending247 | Definición no es cobertura efectiva |
| `pnpm --dir backend build` | PASS | Sin integración DB |
| `pnpm --dir frontend build` | PASS | No implica navegación ni backend integrado |
| `pnpm --dir backend lint` | PASS | Archivos productivos intactos |
| `pnpm --dir frontend lint` | PASS | Archivos productivos intactos |
| `pnpm --dir frontend exec tsc --noEmit` | PASS | Archivos productivos intactos |
| `pnpm --dir backend test` | 35/35 PASS; 963,638ms | Unitarios existentes |
| `pnpm --dir frontend test` | 348/349 PASS; 1 FAIL, 0 skip; 11073,058ms | TEST-01 abajo |
| Lectura YAML y estructura básica e2e.yml con PyYAML | PASS | No valida ejecución/expresiones GitHub |
| Lanzar Chromium independiente mediante API Playwright | exit1 / ENV-02 | Check de proceso sin página LMS |

No se ejecutaron tests de integración existentes: requieren PostgreSQL y algunos helpers restablecen schema.
No se dirigieron esos helpers a una base ajena para obtener resultados.
En este corte histórico no hubo ejecución funcional; las repeticiones del 31oct figuran arriba.
No se puede afirmar ausencia de regresiones a partir de los checks estáticos/unitarios.

## Evidencia de entorno

Intento histórico: run9900ff56afef226e, código1074cabe25a8ea96569553353c9332b4af302187,
inicio2026-10-31T00:53:06.736Z, fin00:53:07.930Z (fecha local30oct).
Se conserva run.json y coverage.json bajo `e2e/reports/9900ff56afef226e/` (ignorados por Git).
La preparación falló antes de generar HTML/JUnit/JSON de tests; `report` informa esa ausencia.

```text
ENV-01 initdb: FATAL could not create shared memory segment: Operation not permitted
DETAIL Failed system call was shmget(..., size=56, 03600)
ENV-02 Chromium: FATAL mach_port_rendezvous_mac.cc:159
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)
```

No son defectos funcionales, de autorización ni multi-tenant demostrados del LMS.
El 31oct se autorizaron procesos PG/navegador; no se cambiaron reglas académicas ni RLS.
El workflow puede aportar esa validación después de autorización de push/PR; no se lanzó remotamente.

## TEST-01 — Fallo en test existente de DST

[Test afectado](../../../frontend/test/quiz-form-values.test.ts:33):
`nonexistent DST local time cannot silently normalize to another hour`.
El subprocess Node24.9.0/tsx falla al importar `configuration` como named export desde
[form-values.ts](../../../frontend/src/lib/quizzes/form-values.ts), antes de evaluar la aserción DST:
`SyntaxError: ... does not provide an export named 'configuration'`.
Ese archivo y el test conservan su contenido original; no hay cambio funcional en esta rama.

Clasificación: problema de testing/runtime existente; no demuestra un cálculo DST incorrecto.
Solución separada propuesta: reproducir bajo versión Node24 fijada y revisar la resolución ESM/CJS
que usa el subprocess; validar que la aserción DST realmente se ejecute antes de cambiar el test.
No se eliminó ni relajó la aserción y no se modificó la utilidad productiva para obtener verde.

## Ambigüedades y pendientes

- COURSE-013/Q02: el plan pide aclarar status de metadato NUL; sin aserción inventada.
- La seed SQL pasó contra migraciones reales; sus helpers académicos y ensure/replay siguen pendientes.
- Falta verificar sanitización de trazas reales: solo existe prueba unitaria con ZIP sintético.
- AUTH-001 acredita login inicial UC; no certifica la matriz de permisos, UC↔UTFSM, notas o intentos.
- Bloqueos por funcionalidades inexistentes se clasificarán durante implementación según evidencia;
  no se inventaron funcionalidades ni se marcaron casos como no aplicables para reducir denominador.
