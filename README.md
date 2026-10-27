# Métricas del tablero

Snapshots: 17 (2026-10-11 a 2026-10-27).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 123 | 64 | 52 |
| Horas estimadas | 461.0 | 255.0 | 55 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 64 | 4.4 | 6.2 | 23.0 |
| Cycle time (In progress → Done) | 21 | 3.9 | 3.8 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 14 | 37.0 | 10.0 | 0.63 |
| Semana 2 E3 | 14 | 9 | 45.0 | — | — |
| Semana 3 E3 | 29 | 25 | 126.0 | 3.0 | 1.50 |
| Semana 4 E3 | 13 | 3 | 39.0 | 2.0 | 1.00 |
| Semana 5 E4 | 17 | 7 | 79.0 | — | — |
| Semana 6 E4 | 18 | 5 | 79.0 | — | — |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 54.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 49 | 34 | 263.0 |
| docs | 32 | 15 | 86.0 |
| ci | 17 | 6 | 42.0 |
| chore | 14 | 4 | 30.0 |
| test | 5 | 1 | 19.0 |
| build | 4 | 3 | 11.0 |
| fix | 2 | 1 | 10.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 33 | 26 | 180.0 |
| FE | 24 | 10 | 116.0 |
| DOC | 22 | 7 | 51.0 |
| PREP | 18 | 9 | 52.0 |
| CI | 15 | 4 | 36.0 |
| INST | 6 | 5 | 15.0 |
| INF | 5 | 3 | 11.0 |

