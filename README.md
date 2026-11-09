# Métricas del tablero

Snapshots: 30 (2026-10-11 a 2026-11-09).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 131 | 106 | 81 |
| Horas estimadas | 496.5 | 425.5 | 86 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 80 | 1.9 | 5.0 | 23.0 |
| Cycle time (In progress → Done) | 22 | 3.9 | 3.7 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

Tarjetas conciliadas o registradas después de hechas (26): cuentan en el avance, pero no en lead ni cycle time.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 15 | 37.0 | 25.0 | 0.68 |
| Semana 2 E3 | 14 | 11 | 43.0 | 26.0 | 0.70 |
| Semana 3 E3 | 31 | 30 | 132.0 | 45.6 | 0.35 |
| Semana 4 E3 | 15 | 13 | 48.0 | 22.0 | 0.67 |
| Semana 5 E4 | 25 | 22 | 114.5 | 22.5 | 0.58 |
| Semana 6 E4 | 21 | 14 | 83.0 | 1.5 | 1.50 |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 28.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 53 | 50 | 286.0 |
| docs | 33 | 23 | 92.0 |
| ci | 20 | 16 | 46.5 |
| chore | 17 | 7 | 35.0 |
| test | 6 | 3 | 27.0 |
| fix | 5 | 4 | 16.0 |
| build | 4 | 3 | 11.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 36 | 32 | 197.0 |
| FE | 27 | 24 | 133.0 |
| DOC | 23 | 13 | 57.0 |
| CI | 19 | 14 | 42.5 |
| PREP | 18 | 12 | 52.0 |
| INF | 9 | 6 | 17.0 |
| INST | 6 | 5 | 15.0 |

