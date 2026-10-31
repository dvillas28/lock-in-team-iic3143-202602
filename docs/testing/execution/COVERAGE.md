# Cobertura efectiva al corte

[Estado general](IMPLEMENTATION_STATUS.md) · [Catálogo](../E2E_TEST_CATALOG.md) · [Validación F3](F3_VALIDATION.md).

Se cuentan fichas únicas; variantes y motores se informan por separado. No es cobertura de código.

| Módulo | Catálogo | Definidas | Ejecutadas | Aprobadas |
| --- | --- | --- | --- | --- |
| A11Y | 8 | 0 | 0 | 0 |
| ADMIN | 11 | 11 | 11 | 11 |
| ATTEMPT | 32 | 0 | 0 | 0 |
| AUDIT | 10 | 4 | 4 | 4 |
| AUTH | 22 | 22 | 22 | 22 |
| CATALOG | 4 | 4 | 4 | 4 |
| CONTENT | 16 | 0 | 0 | 0 |
| COURSE | 13 | 0 | 0 | 0 |
| ENROLL | 19 | 0 | 0 | 0 |
| GRADE | 32 | 0 | 0 | 0 |
| NETWORK | 13 | 0 | 0 | 0 |
| OPS | 9 | 9 | 9 | 9 |
| PUBLIC | 7 | 7 | 7 | 7 |
| QUIZ | 18 | 0 | 0 | 0 |
| RBAC | 13 | 13 | 13 | 13 |
| SECTION | 6 | 0 | 0 | 0 |
| TENANT | 15 | 15 | 15 | 15 |
| **Total** | **248** | **85** | **85** | **85** |

- Cobertura efectiva:85/248 =34,27%;64 fichas navegador y21 complementarias.
- Regresión final:201 PASS;151 instancias navegador y50 complementarias;0 fail/skip/flaky.
- F3 aporta54 fichas; F1/F2 conservan su evidencia y regresión.
- Pendientes163 fichas de F4–F6; F7 consolida automatización y estabilidad.
- RBAC-009 tuvo un timeout previo de setup; se conserva en F3_VALIDATION. El PASS actual no acredita estabilidad sostenida.
- Estado individual:[01](CASES_01.md),[02](CASES_02.md),[03](CASES_03.md),[04](CASES_04.md).

Fuente:run `5dac3117c5e950ef`, SHA `4d0da34`, checkout limpio al inicio/final.
`pnpm --dir e2e coverage` genera coverage.json para el último run; no combina resultados antiguos.
Una ficha solo aprueba si se ejecutan todas sus variantes/proyectos requeridos.
Colección,skip,bloqueo o flaky nunca cuentan como aprobación.
