# Métricas del tablero

Snapshots: 31 (2026-10-11 a 2026-11-10).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 136 | 112 | 82 |
| Horas estimadas | 505.5 | 436.5 | 86 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 86 | 2.4 | 5.1 | 23.0 |
| Cycle time (In progress → Done) | 23 | 3.9 | 3.5 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

Tarjetas conciliadas o registradas después de hechas (26): cuentan en el avance, pero no en lead ni cycle time.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 15 | 37.0 | 25.0 | 0.68 |
| Semana 2 E3 | 14 | 11 | 43.0 | 26.0 | 0.70 |
| Semana 3 E3 | 31 | 30 | 132.0 | 45.6 | 0.35 |
| Semana 4 E3 | 14 | 13 | 46.0 | 22.0 | 0.67 |
| Semana 5 E4 | 26 | 24 | 116.5 | 23.6 | 0.56 |
| Semana 6 E4 | 26 | 16 | 92.0 | 6.5 | 1.63 |
| Semana 7 E4 | 17 | 3 | 56.0 | 0.2 | 0.05 |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 28.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 56 | 51 | 293.0 |
| docs | 33 | 24 | 92.0 |
| ci | 21 | 17 | 47.5 |
| chore | 19 | 10 | 37.0 |
| test | 6 | 3 | 27.0 |
| build | 4 | 4 | 11.0 |
| fix | 4 | 3 | 15.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 38 | 32 | 202.0 |
| FE | 28 | 25 | 135.0 |
| DOC | 23 | 14 | 57.0 |
| CI | 20 | 15 | 43.5 |
| PREP | 18 | 14 | 52.0 |
| INF | 10 | 6 | 18.0 |
| INST | 6 | 6 | 15.0 |

