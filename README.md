# Métricas del tablero

Snapshots: 29 (2026-10-11 a 2026-11-08).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 129 | 99 | 77 |
| Horas estimadas | 526.0 | 393.0 | 75 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 73 | 3.7 | 5.4 | 23.0 |
| Cycle time (In progress → Done) | 21 | 3.9 | 3.8 | 5.9 |

El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.

Tarjetas conciliadas o registradas después de hechas (26): cuentan en el avance, pero no en lead ni cycle time.

## Por semana

| Semana | Tarjetas | Terminadas | Estimado (h) | Real (h) | Real / estimado |
| --- | --- | --- | --- | --- | --- |
| Semana 1 E3 | 15 | 15 | 37.0 | 25.0 | 0.68 |
| Semana 2 E3 | 14 | 11 | 43.0 | 26.0 | 0.70 |
| Semana 3 E3 | 31 | 30 | 132.0 | 45.6 | 0.35 |
| Semana 4 E3 | 15 | 13 | 48.0 | 22.0 | 0.67 |
| Semana 5 E4 | 24 | 16 | 143.0 | 6.5 | 0.93 |
| Semana 6 E4 | 19 | 13 | 80.0 | — | — |
| Semana 7 E4 | 17 | 1 | 56.0 | — | — |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 28.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 52 | 47 | 313.0 |
| docs | 33 | 22 | 92.0 |
| ci | 19 | 15 | 46.0 |
| chore | 17 | 7 | 35.0 |
| test | 6 | 2 | 27.0 |
| build | 4 | 3 | 11.0 |
| fix | 4 | 3 | 15.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 36 | 30 | 197.0 |
| FE | 26 | 22 | 160.0 |
| DOC | 23 | 12 | 57.0 |
| PREP | 18 | 12 | 52.0 |
| CI | 18 | 13 | 42.0 |
| INF | 8 | 5 | 16.0 |
| INST | 6 | 5 | 15.0 |

