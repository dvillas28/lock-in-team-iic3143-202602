# Retrospectiva de ingeniería · preguntas para el equipo

Material para discutir en [#207](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/207). Las decisiones y los efectos se pueden comprobar antes de la reunión. El equipo aún debe elegir sus conclusiones, explicar el costo que asumió en cada decisión y decir qué cambiaría. Las semanas corresponden a las [iteraciones del semestre](../../2/08-work-plan.md#plan-por-iteración).

## 1. ¿Dónde conviene probar quién ve una nota?

**Decisión.** Ante la preocupación de E1 por mantener una base por universidad, se implementó aislamiento institucional en esquema compartido. En la semana 3 se incorporaron pruebas de aislamiento y la publicación explícita de notas. La semana 6 añadió publicación gradual. [Feedback E1](../../2/14-e1-feedback.md) · [aislamiento, #125](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/125) · [libro, #98](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/98) · [publicación gradual, #252](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/252).

**Efecto observado.** En ambos tenants la misma operación tuvo tres resultados observables según el actor. El estudiante vio el libro vacío antes de publicar y 7,0 después. El ayudante pudo leer el libro sin control de publicación. La ruta de un curso ajeno mostró «Recurso no disponible». [Ensayo remoto, 5:25–6:22](ensayo-remoto.md#recorrido-observado).

**Pregunta.** Si volviéramos a implementar el libro, ¿qué par de verificaciones haríamos desde la primera iteración y en qué capa? ¿Qué fallo pasaría inadvertido comprobando únicamente que el cálculo devuelve 7,0?

## 2. ¿Qué hicimos cuando una regla de calidad chocó con el teclado?

**Decisión.** En la semana 6 se agruparon 13 regiones desplazables en un componente común que conserva el acceso mediante teclado. La auditoría documentó la excepción de la regla que objetaba su foco y otras tres supresiones por semántica de tabla. [Corrección, #324](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/324) · [informe y prueba de accesibilidad](../sonarqube/README.md#dos-excepciones-justificadas).

**Efecto observado.** Los dos cortes manuales pasaron de 25 avisos a 0 con 91,7 % de cobertura en ambos. En otro análisis, la PR de integración falló por mantenibilidad del código nuevo D y conservó 99 avisos abiertos. Desde la semana 6, el resumen obligatorio de CI y los análisis de Sonar y Trivy tienen estados independientes. [Cambio de CI, #257](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/257) · [gate de #329](evidencia/sonarcloud-pr329-gate.json) · [avisos de ese corte](evidencia/sonarcloud-pr329-issues.json).

**Pregunta.** ¿Qué evidencia de uso exigiríamos para aceptar otra excepción? ¿Quién debería revisar un gate fallido de mantenibilidad antes de decidir si una versión se presenta?

## 3. ¿Qué dato habría faltado midiendo solo la portada?

**Decisión.** La semana 3 incorporó el manejo de sesión en el frontend. Para responder al feedback E3 se midió en semana 7 el login con navegaciones independientes y el recorrido privado sin recargar la pestaña. [Sesión, #124](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/124) · [feedback E3](../meeting_feedback.md) · [cierre, #331](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/331).

**Efecto observado.** La mediana de tres navegaciones móviles UC dio LCP de 1,05 s. Dentro de una sesión activa, cursos → módulos tomó 1,63 s hasta red inactiva. Al ensayar el acceso remoto la primera autenticación falló en ambos dominios y el segundo envío permitió continuar. Cada observación mide una condición distinta de la demo. [Método y mediciones](rendimiento.md) · [ensayo, primer ingreso](ensayo-remoto.md#recorrido-observado).

**Pregunta.** ¿Qué combinación mínima de login frío, navegación autenticada y conmutación local repetiríamos antes de cada exposición? ¿Cuál de esas comprobaciones habría detectado el problema de arranque?

## 4. ¿Qué hacía falta registrar al terminar una tarjeta?

**Decisión.** En E2 se definió el seguimiento semanal. En la semana 1 se automatizó el snapshot diario y en E3 se conciliaron tarjetas cuyo historial estaba incompleto, excluyéndolas del cálculo de tiempos de transición. [Snapshots, #46](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/46) · [conciliación E3](../../3/conciliacion-tablero-e3.md).

**Efecto observado.** El snapshot permitió identificar las 2 h del ensayo E3 que explicaban la diferencia entre 79 h y las 77 h del compromiso E4. Al revisar las 13 tarjetas cerradas de ese compromiso al corte inicial, solo seis tenían horas en el campo de esfuerzo real. Las estimaciones retrospectivas se pudieron identificar por separado. [Balance con snapshots fechados](gestion.md).

**Pregunta.** ¿Qué registro mínimo habría permitido comparar estimación y esfuerzo al cierre sin reconstruir fechas o completar horas de memoria? ¿Qué parte del seguimiento semanal conservaríamos?
