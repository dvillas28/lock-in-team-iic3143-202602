# Validación local y defectos observados

Corte: 2026-10-30, macOS, Node24.9.0; ejecución en copia aislada.
[Estado y cobertura](IMPLEMENTATION_STATUS.md) · [Instrucciones reproducibles](../E2E_README.md).

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
No hay medición de flakiness ni tiempo de suite E2E; no hubo ejecución funcional que repetir.
No se puede afirmar ausencia de regresiones a partir de los checks estáticos/unitarios.

## Evidencia de entorno

Último intento: run9900ff56afef226e, código1074cabe25a8ea96569553353c9332b4af302187,
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
Se requiere permitir procesos PG/navegador; no cambiar reglas académicas ni desactivar RLS.
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
- La seed y sus helpers no están validados contra las migraciones en ejecución.
- Falta verificar sanitización de trazas reales: solo existe prueba unitaria con ZIP sintético.
- No existen resultados nuevos que certifiquen permisos, UC↔UTFSM, notas o intentos.
- Bloqueos por funcionalidades inexistentes se clasificarán durante implementación según evidencia;
  no se inventaron funcionalidades ni se marcaron casos como no aplicables para reducir denominador.
