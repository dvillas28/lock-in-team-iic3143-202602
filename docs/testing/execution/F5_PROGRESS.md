# F5 — Registro incremental

Rama acumulativa `test/e2e-f5`, desde `ec18f1d` (F4 aceptada).
Autorización del usuario: implementar F5 y ejecutar solamente pruebas nuevas; no repetir F1–F4.
La evidencia anterior conserva su SHA y fecha: no se presenta como regresión de este cambio.

## Alcance

QUIZ-001–018, ATTEMPT-001–032, GRADE-001–032 y AUDIT-001/002/006/007/009/010.
Las operaciones se ejecutan contra Next/Nest/PostgreSQL reales en namespaces exclusivos.
Las fixtures masivas de paginación se identifican en el código; el cálculo se prueba mediante API real
contra un oráculo entero independiente. No se añaden APIs públicas de pruebas.

## Ejecución por incremento

- Quizzes: diagnóstico `6895c622d4061e92`:21 PASS/5 FAIL del harness (precarga, datos y selectores).
- Correcciones de quizzes + intentos: `0a6bb3a4ec3a9763`:35 PASS/2 FAIL del harness.
- Los cinco quizzes fallidos quedaron aprobados; los dos intentos se revisan con nombre del evento
  correcto y consulta explícita tras 204 (la aplicación no hace GET automático).
- Notas y auditoría implementadas; aceptación final en [F5_VALIDATION](F5_VALIDATION.md).

## Comandos

```bash
pnpm test:e2e:f5
pnpm test:e2e:f5 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f5 --headed --grep E2E-GRADE-021
pnpm test:e2e:f5 --debug --grep E2E-ATTEMPT-018
pnpm test:e2e:f5 --grep E2E-QUIZ-014
pnpm --dir e2e report
```

El comando de fase selecciona únicamente los cuatro archivos nuevos de F5.
`--headed` permite observar el recorrido real; `--debug` abre el inspector paso a paso.
El reporte de cobertura automático refleja el último run, no suma artificialmente runs históricos.
No push, merge, producción ni inicio de F6. Cerrar F5 con evidencia y detenerse para revisión.

## Cierre

F5 aceptada por evidencia incremental:88 fichas y115 variantes/motores.
Run completo2e26783d10b0fd6b (SHA1e57418):114 PASS/1 FAIL del transporte manual de ATTEMPT-009.
Correctivo3c709a3, únicamente ese test modificado; run31cd7b0254fc4196:1 PASS.
No se repitieron los114 aprobados ni F1–F4. Ambos runs finales tuvieron checkout limpio.
Los22 smoke están declarados; los cinco nuevos se ejecutaron en los tres motores.
Detenerse antes de F6. No declarar regresión completa ni estabilidad F7.
