# Métricas del tablero

Snapshots: 45 (2026-10-11 a 2026-11-24).

## Avance

|  | Alcance | Terminado | % |
| --- | --- | --- | --- |
| Tarjetas | 157 | 157 | 100 |
| Horas estimadas | 529.0 | 529.0 | 100 |

## Tiempos (días)

| Métrica | n | Mediana | Promedio | Máximo |
| --- | --- | --- | --- | --- |
| Lead time (creada → Done) | 131 | 1.9 | 6.2 | 23.0 |
| Cycle time (In progress → Done) | 30 | 3.9 | 3.3 | 12.8 |

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
| Semana 5 E4 | 26 | 26 | 116.5 | 23.6 | 0.56 |
| Semana 6 E4 | 42 | 42 | 128.5 | 53.2 | 1.07 |
| Semana 7 E4 | 17 | 13 | 56.0 | 0.2 | 0.05 |

Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.

Tarjetas en Done sin Real (h): 55.

## Por tipo

| Tipo | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| feat | 65 | 63 | 324.0 |
| docs | 33 | 33 | 92.0 |
| ci | 22 | 20 | 48.5 |
| chore | 19 | 15 | 37.0 |
| (vacío) | 10 | 10 | 0.0 |
| fix | 7 | 7 | 19.5 |
| test | 6 | 5 | 27.0 |
| build | 4 | 4 | 11.0 |

## Por área

| Área | Tarjetas | Terminadas | Estimado (h) |
| --- | --- | --- | --- |
| BE | 38 | 36 | 202.0 |
| FE | 37 | 36 | 167.0 |
| DOC | 23 | 21 | 57.0 |
| CI | 21 | 19 | 44.5 |
| PREP | 18 | 18 | 52.0 |
| INF | 13 | 11 | 21.5 |
| (vacío) | 10 | 10 | 0.0 |
| INST | 6 | 6 | 15.0 |

