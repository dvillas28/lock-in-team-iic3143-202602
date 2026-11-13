# Métricas del tablero

Snapshots: 34 (2026-10-11 a 2026-11-13).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 153 | 134 | 88 |
| Horas estimadas | 517.5 | 466.5 | 90 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 108 | 1.1 | 4.2 | 23.0 |
| Cycle time (In progress → Done) | 28 | 3.9 | 3.0 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

Tarjetas conciliadas o registradas después de hechas (26): cuentan en el avance, pero no en lead ni cycle time.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| (sin semana) | 7 | 7 | 0.0 | — | — |
| Semana 1 E3 | 15 | 15 | 37.0 | 25.0 | 0.68 |
| Semana 2 E3 | 14 | 11 | 43.0 | 26.0 | 0.70 |
| Semana 3 E3 | 31 | 30 | 132.0 | 45.6 | 0.35 |
| Semana 4 E3 | 14 | 13 | 46.0 | 22.0 | 0.67 |
| Semana 5 E4 | 26 | 24 | 116.5 | 23.6 | 0.56 |
| Semana 6 E4 | 37 | 31 | 114.0 | 43.1 | 1.27 |
| Semana 7 E4 | 17 | 3 | 56.0 | 0.2 | 0.05 |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 38.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 63 | 61 | 314.0 |
| docs | 33 | 24 | 92.0 |
| ci | 22 | 18 | 48.5 |
| chore | 19 | 11 | 37.0 |
| (vacío) | 10 | 10 | 0.0 |
| test | 6 | 3 | 27.0 |
| build | 4 | 4 | 11.0 |
| fix | 4 | 3 | 15.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 38 | 34 | 202.0 |
| FE | 34 | 32 | 155.0 |
| DOC | 23 | 14 | 57.0 |
| CI | 21 | 16 | 44.5 |
| PREP | 18 | 14 | 52.0 |
| INF | 11 | 8 | 19.0 |
| (vacío) | 10 | 10 | 0.0 |
| INST | 6 | 6 | 15.0 |

