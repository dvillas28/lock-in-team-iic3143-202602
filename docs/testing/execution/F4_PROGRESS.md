# F4 — Registro incremental

**F4 aceptada localmente.** Cierre y evidencia en [F4_VALIDATION](F4_VALIDATION.md).
Rama `test/e2e-f4`, desde `8bd5d8f` (F3 aceptada). Detenerse antes de F5 para revisión.

## Historial de los incrementos

| Incremento | Evidencia |
| --- | --- |
| Cursos y secciones | 19 fichas, creación atómica, límites, ownership, capacidad, persistencia y carreras |
| Directorio y matrículas | 19 fichas; run `472b2d09543d3d90`: 27 PASS |
| Módulos y Markdown | 16 fichas, publicación independiente, lector seguro y escrituras inciertas |
| Revisión y repetición | F4 completa y regresión F1–F4 desde el mismo commit limpio |

## Diagnósticos y correcciones

- `1c94e7e20619fc8b`: 4 FAIL de Q02; NUL devolvía 500 en lugar del 400 acordado.
- Fix `5b9c242`, rama `fix/e2e-metadata-nul`; unitario, build y lint backend PASS.
- `ea8a85e3dec0f480`: cursos/secciones 22 PASS/10 FAIL por expectativas y selectores del harness.
- `34cf4a46b02d882f`: 13 PASS tras corregir scope de T1, esperas de navegación y nombres accesibles.
- `eebfa126f54397b6`: contenido 30 PASS/3 FAIL; dos problemas del harness y un defecto funcional.
- `9049743a5fb712f5`: CONTENT-004/010 PASS y CONTENT-016 FAIL, antes del fix.
- Fix `d5d85b2`, rama `fix/e2e-uncertain-material-publication`; typecheck, lint y 14 unitarios UI PASS.
- Ambos fixes se incorporaron por cherry-pick local. No se relajaron aserciones ni aumentaron retries.
- AUTH-002 se alineó con smoke del catálogo y ahora exige también Firefox/WebKit.

## Cierre

Código `6db9541`, seed `academix-e2e-v1`, checkout limpio al inicio y final:

- `f6c3b12f15050a5c`: **126 PASS**, F4 completa con sus motores requeridos.
- `d014cf0385019d99`: **329 PASS**, regresión F1–F4; 139 fichas aprobadas de 248.
- Cero fail/skip/flaky en los runs finales; reportes y eliminación de recursos verificados.

Comandos y alternativas visuales en [la guía incremental](E2E_EXECUTION_JOURNAL.md).
No push, merge ni producción. F5 no iniciada.
