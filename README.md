# Métricas del tablero

Snapshots: 12 (2026-10-11 a 2026-10-22).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 120 | 50 | 42 |
| Horas estimadas | 457.0 | 185.0 | 40 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 50 | 4.0 | 4.1 | 17.0 |
| Cycle time (In progress → Done) | 19 | 4.6 | 4.7 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 13 | 37.0 | 10.0 | 0.63 |
| Semana 2 E3 | 14 | 9 | 45.0 | — | — |
| Semana 3 E3 | 19 | 9 | 73.0 | — | — |
| Semana 4 E3 | 20 | 6 | 88.0 | — | — |
| Semana 5 E4 | 17 | 7 | 79.0 | — | — |
| Semana 6 E4 | 18 | 5 | 79.0 | — | — |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 42.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 46 | 22 | 259.0 |
| docs | 32 | 13 | 86.0 |
| ci | 17 | 6 | 42.0 |
| chore | 14 | 4 | 30.0 |
| test | 5 | 1 | 19.0 |
| build | 4 | 3 | 11.0 |
| fix | 2 | 1 | 10.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 33 | 21 | 180.0 |
| DOC | 22 | 6 | 51.0 |
| FE | 21 | 3 | 112.0 |
| PREP | 18 | 8 | 52.0 |
| CI | 15 | 4 | 36.0 |
| INST | 6 | 5 | 15.0 |
| INF | 5 | 3 | 11.0 |

