# Métricas del tablero

Snapshots: 21 (2026-10-11 a 2026-10-31).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 124 | 87 | 70 |
| Horas estimadas | 464.0 | 357.0 | 77 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 87 | 6.9 | 10.4 | 27.0 |
| Cycle time (In progress → Done) | 23 | 4.6 | 4.7 | 15.0 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 15 | 37.0 | 10.0 | 0.63 |
| Semana 2 E3 | 14 | 10 | 43.0 | — | — |
| Semana 3 E3 | 31 | 29 | 132.0 | 4.0 | 0.50 |
| Semana 4 E3 | 14 | 6 | 42.0 | 2.0 | 1.00 |
| Semana 5 E4 | 18 | 13 | 82.0 | — | — |
| Semana 6 E4 | 19 | 13 | 80.0 | — | — |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 75.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 49 | 47 | 263.0 |
| docs | 32 | 16 | 86.0 |
| ci | 18 | 13 | 44.0 |
| chore | 16 | 4 | 34.0 |
| test | 5 | 1 | 19.0 |
| build | 4 | 3 | 11.0 |
| fix | 4 | 3 | 15.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 34 | 29 | 183.0 |
| FE | 24 | 22 | 116.0 |
| DOC | 22 | 7 | 51.0 |
| PREP | 18 | 10 | 52.0 |
| CI | 17 | 11 | 40.0 |
| INF | 7 | 3 | 15.0 |
| INST | 6 | 5 | 15.0 |

