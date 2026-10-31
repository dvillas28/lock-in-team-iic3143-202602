# F6 — Red, accesibilidad y compatibilidad validadas

Corte:2026-10-31. **F6 aceptada localmente por incrementos. Detenerse antes de F7.**
Rama acumulativa `test/e2e-f6`, desde `83d9fd7` (F5). Código final `7db63b0`; último run sobre `8bb038b` (incluye checkpoint documental).
Solo se ejecutaron variantes nuevas, correcciones y el caso afectado por protección de trazas;
F1–F5 no se repitieron.

## Evidencia por incremento

| Run | SHA | Alcance | Resultado |
| --- | --- | --- | --- |
| c5e6893301dac070 | 77e3b56 | 21 fichas iniciales, tres motores | 27 PASS/5 FAIL del harness |
| 9857b799abf6aba6 | efb5e26 | Solo las cinco variantes corregidas | 5 PASS |
| 3d3df7e4ea93af21 | c687c8b | Cuatro variantes nuevas con barreras/timing | 3 PASS/1 FAIL del harness |
| 8a7a6c9ab9edbfa1 | 96f704c | Solo barrera de publicación corregida | 1 PASS |
| cfc1c51117db3bf8 | 96f704c | Cuatro variantes nuevas375px/temas en Firefox/WebKit | 4 PASS |
| 600966c85750d479 | a1384ea | Nueve cruces nuevos en tres motores | 27 PASS |
| a8da79e3e69bd6aa | a1384ea | 401 tardío en WebKit, variante nueva | 1 PASS |
| 711e5956b8000d6f | 8bb038b | Solo NETWORK-008 Chromium/WebKit tras excluir el segundo login de trazas | 2 PASS |

Todos los runs tuvieron dirtyAtStart=false y dirty=false, seed `academix-e2e-v1`, retries locales0.
**21 fichas,68 combinaciones variante/motor aprobadas**:41 Chromium,13 Firefox y14 WebKit.
Son66 instancias de navegador y2 complementarias HTTP (NETWORK-010/012).
Hubo76 ejecuciones:68 PASS distintos,6 fallos diagnósticos corregidos y2 repeticiones dirigidas
de NETWORK-008 por el cambio de protección de trazas. Las otras aprobadas no se repitieron.
**No hubo un único run68 PASS ni regresión completa F1–F6.** Los resultados originales se conservan.
El verificador local `e2e/reports/711e5956b8000d6f/acceptance-F6.json` contrasta las observaciones
más recientes de cada variante/motor con el manifest y conserva también los seis fallos originales.
`coverage` del último run acredita solo NETWORK-008, con sus dos motores; no acredita las otras20
fichas de F6 ni una regresión global. La aceptación completa requiere las ocho evidencias citadas.

## Tareas cerradas

| Tarea | Verificación |
| --- | --- |
| T01 | 401 real retira sesión/datos;403/404 locales conservan contexto;503 bloquea escritura; DTO incoherente,500,timeout15s,offline y401 viejo tienen recuperación segura |
| T02 | 400/409/422 conservan borrador;4096/4097 bytes,415 y gzip; PATCH incierto sin reenvío; Problem real sanitizado,rollback y CORS de UC/UTFSM |
| T03 | Login por teclado, radios, foco contenido/retorno, Escape, revocación,375px, temas, reflow200%, reduced-motion y expiración de avisos sin perder recibos/bloqueos |
| T04 | Recorrido académico en tres motores;375px/temas por rol; cruces obligatorios y pares trazados en F6_COMBINATIONS |
| T05 | Barrera en dos navegadores para crear módulo; barrera SQL con dos publicaciones esperando; revocación durante revalidación y respuesta tardía en otro curso |
| T06 | Tiempos reales de fixture/login/cleanup, diagnósticos por causa y eliminación de los ocho stacks propios verificada |

Las barreras no asumen quién gana. La publicación exige un200, un409 y un solo recibo/evento.
Los fallos sintéticos de UX se identifican en el código; no se presentan como errores reales del servidor.
CORS usa navegador y API reales; no sustituye autorización. El transporte sin Origin sigue autorizado.
El timeout usa el límite real15s y el caso offline vuelve a una vista cuyo código ya está cargado.
Los fixtures siguen usando runtime con RLS; no se añadieron servicios, dependencias ni APIs públicas.
No se cambió código funcional del producto. Typecheck/lint E2E, builds Next/Nest y control documental PASS.
La instrumentación de tiempos agrega anotaciones sin cambiar setup, cleanup, límites ni reintentos.

## Diagnósticos conservados

- Cinco fallos iniciales: selectores esperaban un heading donde había un strong dentro de alert;
  el foco se comparaba con el texto del body, que cambia al expirar feedback; offline intentaba
  descargar una vista no cargada y acababa en la página de error del navegador.
- Correcciones: mismo texto de error sobre el elemento real, foco sobre botón identificable,
  aserción explícita de expiración y navegación offline mediante historial con vista ya cargada.
- Barrera fallida: contaba también una lectura de fondo del libro y observaba3 conexiones bloqueadas.
  Se aislaron los dos escritores antes de abrir el libro; no se relajó el requisito de dos esperas.
- El segundo login SPA de NETWORK-008 se excluyó de las trazas mediante stopTrace/trace;
  sus dos motores se repitieron con código actualizado y checkout limpio. No hubo un fallo de producto.
- No se aumentaron timeouts/retries ni se ocultaron fallos con skip/quarantine.

## Mediciones locales

| Medida | Muestras | p50 | p95 | Máximo |
| --- | --- | --- | --- | --- |
| Duración Playwright por variante | 68 | 1683ms | 5644ms | 16342ms |
| Setup, anotación incorporada al final | 37 | 742ms | 1135ms | 1381ms |
| Login UI real | 41 | 247ms | 713ms | 2264ms |
| Cleanup DB/API | 37 | 33ms | 57ms | 60ms |

Los tamaños de muestra difieren: la instrumentación se añadió después de los primeros incrementos.
El máximo incluye el timeout deliberado15s; no es un fallo de infraestructura. No son veinte runs
comparables ni acreditan estabilidad F7. Sin recursos propios huérfanos; puertos4320/4321 cerrados.
Contraste total, lectores de pantalla y certificación WCAG requieren auditoría complementaria.

## Estado y continuidad

El catálogo tiene **248/248 fichas implementadas y aceptadas históricamente por incrementos**,
222 de navegador y26 complementarias. Configuradas512 instancias; no ejecutadas juntas tras F6.
F7 sigue pendiente: consolidación de automatización/runbook, veinte runs elegibles y CI remoto.
Sin producción, push, despliegue ni merge. [Guía incremental](E2E_EXECUTION_JOURNAL.md).
