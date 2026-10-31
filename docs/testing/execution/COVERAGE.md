# Cobertura efectiva por evidencia incremental

[Estado](IMPLEMENTATION_STATUS.md) · [Catálogo](../E2E_TEST_CATALOG.md) · [F6](F6_VALIDATION.md).
Se cuentan fichas únicas aceptadas históricamente; no es cobertura de código ni regresión actual.

| Módulo | Catálogo | Definidas | Aceptadas por incremento |
| --- | --- | --- | --- |
| A11Y | 8 | 8 | 8 |
| ADMIN | 11 | 11 | 11 |
| ATTEMPT | 32 | 32 | 32 |
| AUDIT | 10 | 10 | 10 |
| AUTH | 22 | 22 | 22 |
| CATALOG | 4 | 4 | 4 |
| CONTENT | 16 | 16 | 16 |
| COURSE | 13 | 13 | 13 |
| ENROLL | 19 | 19 | 19 |
| GRADE | 32 | 32 | 32 |
| NETWORK | 13 | 13 | 13 |
| OPS | 9 | 9 | 9 |
| PUBLIC | 7 | 7 | 7 |
| QUIZ | 18 | 18 | 18 |
| RBAC | 13 | 13 | 13 |
| SECTION | 6 | 6 | 6 |
| TENANT | 15 | 15 | 15 |
| **Total** | **248** | **248** | **248** |

- 248/248 fichas históricas:222 navegador y26 complementarias. Estabilidad/automatización F7 pendiente.
- F1–F4:139 fichas, run histórico d014cf0385019d99, SHA6db9541;329 PASS.
- F5:88 fichas nuevas,86 navegador y2 complementarias;115 variantes/motores.
- Run completo2e26783d10b0fd6b, SHA1e57418:114 PASS/1 FAIL del harness.
- Solo ATTEMPT-009 cambió después; correctivo31cd7b0254fc4196, SHA3c709a3:1 PASS.
- Por petición del usuario no se repitieron variantes aprobadas ni fases antiguas.
- Ambos runs finales F5 tuvieron checkout limpio y cleanup; no hubo un único run115 PASS.
- F6:21 fichas/68 variantes-motores, siete runs;68 PASS distintos y6 fallos diagnósticos corregidos.
- Configuradas512 instancias acumuladas; no se afirma haberlas ejecutado juntas después de F6.
- Declaradas las22 fichas smoke en tres motores; F6 agrega compatibilidad sin repetir el smoke antiguo.
- Reportes de diagnóstico y el timeout histórico de F3 permanecen visibles; estabilidad F7 pendiente.

Estado individual:[01](CASES_01.md),[02](CASES_02.md),[03](CASES_03.md),[04](CASES_04.md).
`pnpm --dir e2e coverage` muestra solo el último run:NETWORK-008/WebKit queda parcial en ese run.
La aceptación histórica de248 requiere las fuentes citadas; no se fusionan los reportes originales.
