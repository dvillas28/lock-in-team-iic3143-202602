# Cobertura efectiva al corte

[Estado general](IMPLEMENTATION_STATUS.md) · [Catálogo normativo del trabajo](../E2E_TEST_CATALOG.md).

Las cifras son fichas únicas; cinco variantes de AUTH-001 siguen siendo una sola ficha.
No equivalen a cobertura de código ni a funcionalidades validadas.

| Módulo | Catálogo | Definidas en specs | Ejecutadas | Aprobadas |
| --- | --- | --- | --- | --- |
| A11Y | 8 | 0 | 0 | 0 |
| ADMIN | 11 | 0 | 0 | 0 |
| ATTEMPT | 32 | 0 | 0 | 0 |
| AUDIT | 10 | 0 | 0 | 0 |
| AUTH | 22 | 1 | 0 | 0 |
| CATALOG | 4 | 0 | 0 | 0 |
| CONTENT | 16 | 0 | 0 | 0 |
| COURSE | 13 | 0 | 0 | 0 |
| ENROLL | 19 | 0 | 0 | 0 |
| GRADE | 32 | 0 | 0 | 0 |
| NETWORK | 13 | 0 | 0 | 0 |
| OPS | 9 | 0 | 0 | 0 |
| PUBLIC | 7 | 0 | 0 | 0 |
| QUIZ | 18 | 0 | 0 | 0 |
| RBAC | 13 | 0 | 0 | 0 |
| SECTION | 6 | 0 | 0 | 0 |
| TENANT | 15 | 0 | 0 | 0 |
| **Total** | **248** | **1** | **0** | **0** |

- Definición inicial: 1/248 = 0,40%; navegador: 1/222 = 0,45%. No son porcentajes de aprobación.
- Cobertura efectiva nueva: 0/248 aprobadas = 0%; no hay requisitos verificados por esta ejecución.
- 247 fichas sin spec completo incluyen OPS-008 parcial y COURSE-013 pendiente Q02.
- Roles escritos: SA, AO, T1, AS1, ST1 en UC. Roles validados: ninguno.
- UC/UTFSM: seed escrita; ninguna frontera institucional ejecutada. Pendientes todos los P0 de aislamiento.
- La colección `test:list` reconoce cinco instancias Chromium; colección no es ejecución.
- Estado individual: [01](CASES_01.md), [02](CASES_02.md), [03](CASES_03.md), [04](CASES_04.md).

El reporte por run se genera con `pnpm --dir e2e coverage`, enlaza ficha y archivo y distingue
defined/executed/passed. Una colección o un run bloqueado sin results.json nunca reutiliza resultados
anteriores. Las filas automáticas pending-implementation indican ausencia de spec completo;
consultar el ledger humano para distinguir soporte parcial y ambigüedad normativa.

No hay tests omitidos con skip/fixme ni expected-failure para obtener verde artificial.
Los 9 checks del harness son unitarios; no se suman a las 5 instancias E2E ni acreditan 9 fichas.
