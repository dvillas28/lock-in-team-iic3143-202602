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
| AUTH | 22 | 1 | 1 | 1 |
| CATALOG | 4 | 0 | 0 | 0 |
| CONTENT | 16 | 0 | 0 | 0 |
| COURSE | 13 | 0 | 0 | 0 |
| ENROLL | 19 | 0 | 0 | 0 |
| GRADE | 32 | 0 | 0 | 0 |
| NETWORK | 13 | 0 | 0 | 0 |
| OPS | 9 | 9 | 9 | 9 |
| PUBLIC | 7 | 0 | 0 | 0 |
| QUIZ | 18 | 0 | 0 | 0 |
| RBAC | 13 | 0 | 0 | 0 |
| SECTION | 6 | 0 | 0 | 0 |
| TENANT | 15 | 0 | 0 | 0 |
| **Total** | **248** | **10** | **10** | **10** |

- Cobertura efectiva: 10/248 aprobadas = 4,03%; 3 fichas navegador y 7 complementarias.
- [F1](F1_VALIDATION.md): dos runs limpios,16 instancias aprobadas por run, sin fallos/omitidos/flaky.
- AUTH-001 valida login/visibilidad inicial de SA/AO/T1/AS1/ST1 en UC.
- OPS comprueba runtime, seed/ensure, caída/recuperación, rollback, historia y cleanup reales.
- Aún pendientes238 fichas; fronteras tenant/roles completas y motores adicionales no acreditados.
- Estado individual: [01](CASES_01.md), [02](CASES_02.md), [03](CASES_03.md), [04](CASES_04.md).

El reporte por run se genera con `pnpm --dir e2e coverage`, enlaza ficha y archivo y distingue
defined/executed/passed. Una colección o un run bloqueado sin results.json nunca reutiliza resultados
anteriores. Las filas automáticas pending-implementation indican ausencia de spec completo;
consultar el ledger humano para distinguir soporte parcial y ambigüedad normativa.

No hay tests omitidos con skip/fixme ni expected-failure para obtener verde artificial.
Los10 unitarios del harness se reportan aparte; no se suman a las instancias del catálogo.
