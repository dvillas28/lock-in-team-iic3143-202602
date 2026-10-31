# F5 — Ciclo académico validado

Corte: 2026-10-31. **F5 aceptada localmente con evidencia por incremento. Detenerse antes de F6.**
Checkout permanente, rama acumulativa `test/e2e-f5`, desde `ec18f1d` (F4).
Por petición del usuario se ejecutaron solamente pruebas nuevas de F5; F1–F4 no se repitieron.

## Evidencia y límite de la aceptación

| Run | SHA | Alcance | Resultado |
| --- | --- | --- | --- |
| 2e26783d10b0fd6b | 1e57418 | F5 completa, variantes y motores requeridos | 114 PASS / 1 FAIL del harness |
| 31cd7b0254fc4196 | 3c709a3 | Solo ATTEMPT-009 corregido | 1 PASS |

Ambos runs tienen dirtyAtStart=false y dirty=false; seed `academix-e2e-v1`, Playwright1.64.1.
El primero ejecutó115 instancias:103 Chromium,6 Firefox,6 WebKit;113 navegador y2 complementarias.
El segundo repitió únicamente la variante fallida. **No hubo un único run de115 PASS**.
El diff entre ambos SHAs modifica solo la petición manual de ATTEMPT-009; los otros114 resultados
se conservan sobre código sin cambios. No se suma el fallo inicial como aprobación ni como flaky.
El fallo415 provenía del transporte sin cuerpo/tipo adecuado: ahora se envía JSON válido `{}`;
dos cabeceras dan400 sin efectos y el mismo transporte con una cabecera da201 y replay correcto.

Aceptación por unión explícita de estas evidencias: **88 fichas nuevas,115 variantes/motores aprobados**.
No acredita regresión completa de F1–F5 ni estabilidad sostenida. El ledger automático de `coverage`
refleja solo el último run dirigido; no fusiona resultados ni debe interpretarse como regresión global.
Reportes locales ignorados por Git: `e2e/reports/<runId>/{results.json,junit.xml,run.json,html/index.html}`.
El artefacto local `e2e/reports/31cd7b0254fc4196/acceptance-F5.json` verifica las88 fichas
contra el manifest y que el diff de código afecta únicamente ATTEMPT-009; conserva el fallo original.
El coverage del run completo conserva87 aprobadas y1 fallida; el del correctivo acredita solo ATTEMPT-009.

## Alcance aceptado

| Tarea | Evidencia implementada |
| --- | --- |
| T01 | QUIZ-001–013: lista por rol, filtros locales, draft, preguntas, UUID, PATCH mínimo, fechas, bytes y creación incierta |
| T02 | QUIZ-014–018 y ATTEMPT-001–010: ítem único peso0, freeze, inmutabilidad, ventanas, límites, claves y arranque simultáneo |
| T03 | ATTEMPT-011–032: guardado completo/vacío, envío manual, recibos, terminales, cancelación, concurrencia y revisión histórica |
| T04 | GRADE-001–013: oráculo entero independiente, redondeo, notas propias, promedio parcial, historia y paginación |
| T05 | GRADE-014–032: pesos exactos, freeze global, selección rectangular, replay, publicación simultánea, incertidumbre y revocación |
| T06 | AUDIT-001/002/006/007/009/010: filtros, scope histórico, páginas, JSON inerte, no-op y rollback real |
| T07 | Cinco fichas smoke nuevas en tres motores; material→quiz→intento→nota→publicación→promedio4 en UC y UTFSM |
| T08 | Aserciones de SQL/API/UI, revisión de integridad/roles/tenant y repetición dirigida en nuevos namespaces |

86 fichas nuevas son de navegador; ATTEMPT-009/022 son complementarias HTTP.
Las22 fichas smoke del catálogo tienen variantes declaradas para Chromium/Firefox/WebKit.
Se verificó esa declaración sin repetir las17 fichas anteriores; su evidencia sigue siendo histórica.
Los115 resultados nuevos y los329 anteriores corresponden a444 instancias configuradas, no a444
resultados de una regresión actual. Cobertura histórica aceptada:227/248 fichas;21 pendientes de F6.

## Integridad y preparación

Los errores del harness se corrigieron sin relajar aserciones ni aumentar retries/timeouts.
No se cambió código del producto ni se añadieron APIs públicas, servicios o dependencias.
Los actores hacen login real; las mutaciones usan la API/runtime con RLS. SQL verifica persistencia.
La fixture masiva del libro crea registros válidos solo para paginación, con ownership comprobado;
no se presenta como prueba de autocorrección. Esta se verifica con operaciones reales y oráculo independiente.
El fallo de auditoría se provoca bloqueando su tabla en la DB exclusiva: la escritura completa revierte.
Las pérdidas de respuestas usan route.fetch para ejecutar realmente la operación antes de descartarla.
Typecheck/lint E2E, unitario nuevo del oráculo y builds reales del runner PASS.
Los clusters y bases de ambos runs finales se eliminaron; puertos locales cerrados tras el correctivo.

## Diagnósticos conservados

- 6895c622d4061e92: quizzes21 PASS/5 FAIL; precargas Next, instrucciones de fixture y selectores ambiguos.
- 0a6bb3a4ec3a9763:35 PASS/2 FAIL; cinco quizzes corregidos, eventos y consulta explícita de cancelación.
- d082b40bc3f1f07e: notas40 PASS/6 FAIL; presupuesto de login, fixtures SQL, decimales y espera de respuesta descartada.
- c31c6ea95bc3d684:14 PASS/2 FAIL; recuperación corregida; errores de selector y representación JSON en auditoría.

Los diagnósticos no se suman como cobertura. Sin producción, push, despliegue ni merge.
Comandos visuales y por fase en [la guía incremental](E2E_EXECUTION_JOURNAL.md).
