# Balance de esfuerzo y riesgos

## Del compromiso E3 al cierre E4

El snapshot del 01/11 contenía 27 issues pendientes estimadas en 79 h. Una pertenecía a la semana 4 de E3: **#166, ensayo de E3, 2 h**. Filtrar por semanas 5–7 de E4 deja **26 tarjetas y 77 h** (14 + 15 + 48). Esta es la línea base del compromiso. [Snapshot original](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/530a4866c962eec4c3a74930efdb614d394968a8/snapshots/2026-11-01.csv) · [plan E3](../../3/ppt/dvillas28/10-plan-mvp/frames.tex).

Al consultar las issues el 21/11, antes de publicar esta revisión, había 13 cerradas y 13 abiertas dentro de esas 26. Las cerradas sumaban 43 h **estimadas originalmente** y las abiertas, 34 h. En la base original estaban #218–220, que ya no aparecen en el CSV del 21/11. El TXT comprobado en ambos tenants respalda la inclusión de archivos P2. [Snapshot del 21/11, 08:58 UTC](https://github.com/dvillas28/lock-in-team-iic3143-202602/blob/530a4866c962eec4c3a74930efdb614d394968a8/snapshots/2026-11-21.csv) · [alcance](alcance-final.md).

## Horas-persona estimadas por entregable

Presupuesto orientativo solicitado para completar cada entregable completo, incluido lo ya preparado. Se conservan los totales de la estimación E3 y se distribuyen entre responsables de las issues según área. La tabla no registra dedicación medida ni permite deducir horas restantes. Las cifras decimales reparten trabajo compartido. Daniel V. es dvillas28, Sebastián es spmasabeu, Matías es matiaraos, Julián es Jbcleon y Daniel F. es FierroD.

| Issue y entregable | Daniel V. | Sebastián | Matías | Julián | Daniel F. | Total h |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| #173 Calibrar alertas | — | — | — | — | 2 | 2 |
| #200 Gestión semana 6 | 2 | — | — | — | — | 2 |
| #203 Medir alcance del reviewer | — | — | — | — | 2 | 2 |
| #204 Arquitectura y modelo | — | 3 | — | — | — | 3 |
| #205 Conciliar feedback | 1 | 0,5 | 0,5 | 0,5 | 0,5 | 3 |
| #206 Revisar riesgos | 0,4 | 0,4 | 0,4 | 0,4 | 0,4 | 2 |
| #207 Realizar retrospectiva | 0,6 | 0,6 | 0,6 | 0,6 | 0,6 | 3 |
| #208 Preparar PDF y guion | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
| #209 Ensayar y probar respaldo | 0,5 | 0,75 | 0,5 | 1 | 0,25 | 3 |
| #212 Explicar tests y gates | 1 | — | — | — | 1 | 2 |
| #213 Conciliar esfuerzo y alcance | 2 | — | — | — | — | 2 |
| #214 Gestión semana 7 | 2 | — | — | — | — | 2 |
| #216 Indexar evidencias | 4 | — | — | — | — | 4 |
| **Total** | 14,5 | 6,25 | 2,5 | 3,5 | 7,25 | 34 |

## Horas registradas y campos del tablero

- El CSV tiene `Real (h)` en seis de las 13 issues cerradas de la línea base: #172 (0,5), #174 (0,1), #178 (5), #199 (0,1), #215 (0,1) y #217 (0,1). Son **5,9 h registradas**; la fuente no especifica un método de cronometraje. Las siete restantes carecen de valor consultable en ese snapshot.
- Los comentarios de cierre de [#185](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/185), [#194](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/194), [#210](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/210) y [#211](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/211) aportan aproximaciones retrospectivas de 4, 4, 4 y 0,5 h respectivamente. No hay un total efectivo auditable para las 26 tarjetas.
### Revisión directa del Project · 21/11

Con la autorización renovada se consultó y editó [lock-in-LMS, Project 3](https://github.com/users/dvillas28/projects/3). El corte de las 19:09 UTC incluye las 55 issues presentes en las semanas 6 y 7, también las incorporadas después de E3. Cada fila conserva estado, estimación, horas registradas y aproximación retrospectiva si existe. [Planilla comparativa por issue](evidencia/project-semanas-6-7.csv).

| Semana | Issues | Estimación disponible | Real (h) registrado | Issues sin Real (h) | Aproximaciones de cierre aparte |
| --- | ---: | --- | --- | ---: | --- |
| 6 | 42 | 128,5 h en 39 issues | 53,2 h en 21 issues | 21 | #194 · 4 h |
| 7 | 13 | 37 h en 13 issues | 0,2 h en 2 issues | 11 | #210 · 4 h y #211 · 0,5 h |

Las 50 issues ya cerradas de estas semanas figuraban en Done. Las cinco abiertas eran #200, #207, #213, #214 y #216. La conciliación de gestión usa este corte, el reparto estimado y los riesgos aceptados. Los 32 valores ausentes de Real (h) quedan identificados por tarjeta; impiden calcular un desvío global. No se trasladaron estimaciones a ese campo. [Reglas del tablero](../../../guides/board-metrics.md).

Tras la conciliación se verificaron [#200](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/200#issuecomment-7067826226), [#213](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/213#issuecomment-7067827672) y [#214](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/214#issuecomment-7067826929) cerradas y en Done. El CSV conserva el corte previo para que los cambios sean trazables.

## Revisión operativa de riesgos · #206

Responsables derivados del registro E2 y de las asignaciones de E4. El 21/11 el equipo confirmó la revisión por los responsables y su aceptación de las acciones de esta tabla. [Registro de riesgos](../../2/07-risks.md) · [pruebas y contingencias](operacion-demo.md).

| Riesgo y observación | Responsable de revisión | Acción comprobable |
| --- | --- | --- |
| R-09/19 · Despertar API de ~27 s, alias DNS fallido, Render y Neon confirmados, despliegues registrados en 7d4b666 | Daniel Villaseñor, Sebastián Palma | Precalentar ambos dominios y verificar health/ready; identificar despliegues en consola y conmutar a local si falla. |
| R-01/13 · Aislamiento e historial | Sebastián Palma | Usar solo datos nuevos, comprobar separación UC/UTFSM, publicación y evento de auditoría. |
| R-11/15 · Acceso por rol y descarga | Julián Contreras, Matías Araos, Sebastián Palma | Verificar vistas de estudiante y ayudante, descarga autorizada y bytes en nuevos datos de ensayo. |
| R-10/16 · Gate de mantenibilidad y falsas alarmas del reviewer | Daniel Villaseñor, Daniel Fierro | Exponer los cortes por separado y validar alertas contra contrato; mantener revisión humana. |
| R-17/18 · Tablero, coordinación y tiempo de exposición | Daniel Villaseñor | Conciliar estados y tiempos con responsables, cronometrar cambios de sesión y confirmar el envío y los pares. |

La retrospectiva (#207) queda para la sesión del equipo. La estimación asignada reserva tiempo para realizarla y documentar sus conclusiones.
