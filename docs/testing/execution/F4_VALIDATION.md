# F4 — Cursos y contenido validados

Corte: 2026-10-31. **F4 aceptada localmente. Detenerse antes de F5 para revisión del usuario.**
Checkout permanente: `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f4`.
Sin producción, push, despliegue ni merge a `dev` o `main`.

## Evidencia final

| Run | Código limpio | Alcance | Resultado |
| --- | --- | --- | --- |
| f6c3b12f15050a5c | 6db9541 | F4, todas sus variantes requeridas | 126 PASS: 92 Chromium, 17 Firefox, 17 WebKit |
| d014cf0385019d99 | 6db9541 | Regresión F1–F4 y login inválido smoke | 329 PASS: 239 Chromium, 45 Firefox, 45 WebKit |

Ambos runs: exit0, dirtyAtStart=false y dirty=false; cero fail/skip/flaky y sin retries locales.
SHA ejecutado: `6db954174f277f34194ae8a4e39e50a81c7f090e`; seed `academix-e2e-v1`; Playwright 1.64.1.
Clusters y bases nuevos por run y variante; positivos y negativos de F4 repetidos en la regresión.
Los recursos registrados de ambos stacks se eliminaron y sus puertos quedaron cerrados.
Typecheck y lint de E2E/frontend PASS; build y lint backend PASS.
Unitarios: metadatos 1/1, edición/publicación UI 14/14 y harness 11/11 PASS.
Reportes ignorados por Git: `e2e/reports/d014cf0385019d99/`, con HTML, JSON, JUnit, run y coverage.

## Cobertura aceptada

F4: **54 fichas**, COURSE-001…013, SECTION-001…006, ENROLL-001…019 y CONTENT-001…016.
Sus 126 instancias son 122 de navegador y 4 HTTP/SQL de COURSE-013; no confundir variantes con fichas.
Acumulado: **139/248 fichas**, 117 navegador y 22 complementarias; **109 pendientes**.
Las 329 instancias acumuladas son 275 navegador y 54 complementarias HTTP/SQL/operación.
AUTH-002 conservó su caso y se alineó con smoke del catálogo: agrega Firefox/WebKit al acumulado.
Por eso F2 actual tiene 47 Chromium/63 con smoke; su evidencia histórica de 61 no se reescribe.

| Tarea | Comprobaciones ejecutadas |
| --- | --- |
| T01 | Crear curso/sección/teacher atómicos; ownership, PATCH mínimo, límites, no-op, duplicados y NUL |
| T02 | Directorio literal Unicode, caracteres SQL inertes, miembros activos, permisos, páginas y respuestas tardías |
| T03 | Asignar, replay, multirol, sucesor histórico, revocar/confirmar/reactivar, autorrevocación y carreras |
| T04 | Módulos compartidos, orden completo, Markdown, publicación independiente y matriz de cuatro flags por rol |
| T05 | Sesiones nuevas, lecturas persistidas, escritura concurrente y perdida, historial íntegro y sin duplicados |
| T06 | Repetición en stack nuevo, regresión acumulada, motores requeridos, metadatos y teardown |

Cada escritura denegada exige ausencia de efectos; la asignación y creación concurrentes verifican
filas/eventos únicos. Los cambios de rol preservan notas e intentos y se comprueban con otro usuario.
Las respuestas perdidas se descartan después de aplicar la operación real mediante route.fetch;
no se simula éxito de las APIs del producto. El destino HTTPS permitido del Markdown se simula
solo para comprobar apertura, aislamiento de opener y ausencia de credenciales/referer sin salir a Internet.
Las imágenes remotas no generan solicitudes; tabla y código tienen scroll local también a 375px.

## Defectos del producto corregidos aparte

| Defecto reproducido | Rama / commit funcional | Resultado verificado |
| --- | --- | --- |
| Q02: NUL en metadatos devolvía 500 | `fix/e2e-metadata-nul`, `5b9c242` | HTTP400 y ningún curso/sección/evento parcial; Unicode válido conserva sus límites |
| CONTENT-016: publicación habilitada tras edición incierta | `fix/e2e-uncertain-material-publication`, `d5d85b2` | Guardar y publicación bloqueados, incluso tras lectura de reconciliación; borrador conservado y sin POST adicional |

Ambos commits se incorporaron por cherry-pick local. No hay API pública nueva ni dependencia nueva.
La revisión siguió lms-reviewer/lms-ui-ux: tenant, rol, historia, estado incierto y controles accesibles.
No quedan fallos críticos conocidos en las fronteras implementadas. Esto no acredita estabilidad F7.

## Diagnósticos conservados

- 1c94e7e20619fc8b: 4 FAIL de Q02 antes del fix; no se aceptó HTTP500 como resultado correcto.
- ea8a85e3dec0f480: cursos/secciones 22 PASS/10 FAIL; fixture/selección/navegación del harness.
- 34cf4a46b02d882f: 13 PASS tras esperar la ruta, usar nombres accesibles y respetar el curso adicional de T1.
- 472b2d09543d3d90: 27 PASS de ENROLL.
- eebfa126f54397b6: CONTENT 30 PASS/3 FAIL; dos problemas del harness y el defecto CONTENT-016.
- 9049743a5fb712f5: CONTENT-004/010 PASS, CONTENT-016 FAIL; reproducción separada antes del fix.

Los diagnósticos no se suman como cobertura. No se eliminaron casos ni se aumentaron retries/timeouts.
El antecedente de timeout de setup de F3 permanece en[F3_VALIDATION](F3_VALIDATION.md).

## Ejecutar y revisar

```bash
pnpm test:e2e:f4
pnpm test:e2e:f4 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f4 --headed --grep E2E-CONTENT-008
pnpm test:e2e:all
pnpm --dir e2e report
```

F4 sola usa Chromium por defecto; el segundo comando ejecuta todas sus variantes requeridas.
[Guía incremental](E2E_EXECUTION_JOURNAL.md) y[estado por caso](COVERAGE.md).
Siguiente fase: F5, **sin iniciar**. CI remoto, protección de ramas y veinte runs elegibles siguen pendientes.
