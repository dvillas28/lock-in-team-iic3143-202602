# Métricas del tablero

Snapshots: 22 (2026-10-11 a 2026-11-01).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 123 | 96 | 78 |
| Horas estimadas | 465.0 | 386.0 | 83 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 96 | 1.9 | 5.2 | 27.0 |
| Cycle time (In progress → Done) | 23 | 4.6 | 4.7 | 15.0 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 15 | 37.0 | 25.0 | 0.68 |
| Semana 2 E3 | 14 | 11 | 43.0 | 26.0 | 0.70 |
| Semana 3 E3 | 31 | 30 | 132.0 | 45.6 | 0.35 |
| Semana 4 E3 | 15 | 13 | 48.0 | 22.0 | 0.67 |
| Semana 5 E4 | 18 | 13 | 82.0 | — | — |
| Semana 6 E4 | 19 | 13 | 80.0 | — | — |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 28.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 49 | 47 | 267.0 |
| docs | 32 | 22 | 86.0 |
| ci | 19 | 14 | 46.0 |
| chore | 16 | 5 | 34.0 |
| test | 5 | 2 | 19.0 |
| build | 4 | 3 | 11.0 |
| fix | 4 | 3 | 15.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 34 | 30 | 183.0 |
| FE | 24 | 22 | 120.0 |
| DOC | 22 | 12 | 51.0 |
| PREP | 18 | 12 | 52.0 |
| CI | 18 | 12 | 42.0 |
| INF | 7 | 3 | 15.0 |
| INST | 6 | 5 | 15.0 |

