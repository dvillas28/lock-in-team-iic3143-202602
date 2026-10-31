# Cobertura efectiva al corte

[Estado](IMPLEMENTATION_STATUS.md) · [Catálogo](../E2E_TEST_CATALOG.md) · [Validación F4](F4_VALIDATION.md).

Se cuentan fichas únicas; variantes y motores se informan por separado. No es cobertura de código.

| Módulo | Catálogo | Definidas | Ejecutadas | Aprobadas |
| --- | --- | --- | --- | --- |
| A11Y | 8 | 0 | 0 | 0 |
| ADMIN | 11 | 11 | 11 | 11 |
| ATTEMPT | 32 | 0 | 0 | 0 |
| AUDIT | 10 | 4 | 4 | 4 |
| AUTH | 22 | 22 | 22 | 22 |
| CATALOG | 4 | 4 | 4 | 4 |
| CONTENT | 16 | 16 | 16 | 16 |
| COURSE | 13 | 13 | 13 | 13 |
| ENROLL | 19 | 19 | 19 | 19 |
| GRADE | 32 | 0 | 0 | 0 |
| NETWORK | 13 | 0 | 0 | 0 |
| OPS | 9 | 9 | 9 | 9 |
| PUBLIC | 7 | 7 | 7 | 7 |
| QUIZ | 18 | 0 | 0 | 0 |
| RBAC | 13 | 13 | 13 | 13 |
| SECTION | 6 | 6 | 6 | 6 |
| TENANT | 15 | 15 | 15 | 15 |
| **Total** | **248** | **139** | **139** | **139** |

- Cobertura efectiva:139/248 =56,05%;117 fichas navegador y22 complementarias.
- Regresión final:329 PASS;275 instancias navegador y54 complementarias;0 fail/skip/flaky.
- F4 aporta54 fichas y126 ejecuciones requeridas; F1–F3 conservan su evidencia y regresión.
- Pendientes109 fichas de F5–F6; F7 consolida automatización y estabilidad.
- Q02 y CONTENT-016 corregidos por commits funcionales separados; ver F4_VALIDATION.
- El timeout previo de setup de RBAC-009 permanece en F3_VALIDATION; el PASS actual no acredita estabilidad sostenida.
- Estado individual:[01](CASES_01.md),[02](CASES_02.md),[03](CASES_03.md),[04](CASES_04.md).

Fuente:run `d014cf0385019d99`, SHA `6db9541`, checkout limpio al inicio/final.
`pnpm --dir e2e coverage` genera el ledger del último run y no combina resultados antiguos.
Una ficha solo aprueba con todas sus variantes/proyectos requeridos; skip/bloqueo/flaky no cuentan.
