# Cierre E4 — Índice de evidencias

Corte: **21/11/2026**. Base funcional comprobada: **v0.13.1 / 7d4b666**.
El [PDF de exposición](../ppt/main.pdf) contiene ocho láminas principales y seis anexos. El [guion](../ppt/guion.md) reserva veinte minutos para la demostración y el cierre.
Fuentes: [enunciado actualizado](../enunciado_e4.pdf) y [feedback E3/Tom](../meeting_feedback.md).

## Material para evaluación

| Documento | Uso en la entrega | Tarjetas relacionadas |
| --- | --- | --- |
| [Alcance y matriz](alcance-final.md) | Compromiso → resultado → evidencia → paso de demo; ampliaciones y exclusiones. | #213, #216 |
| [Operación y riesgos](operacion-demo.md) | Resultados remotos, cuentas por rol sin claves, datos sintéticos y guion del ensayo. | #206, #209 |
| [Rendimiento](rendimiento.md) | Lighthouse público/privado, Core Web Vitals, reporte por PR, capturas para PPT y límites. | #212 |
| [Contenido de calidad](calidad-para-ppt.md) | Texto/tablas para 2 slides: Sonar, Trivy, pruebas y rendimiento. | #212, #208 |
| [PDF y guion](../ppt/README.md) | Presentación, fuentes, instrucciones de compilación y demo en 30 minutos. | #204, #208 |
| [Correcciones E1–E3](feedback.md) | Feedback y procesos actualizados. | #205 |
| [Preguntas para la retrospectiva](retrospectiva.md) | Decisiones por sprint, efecto observado y preguntas para acordar conclusiones. | #207 |
| [Gestión](gestion.md) | Conciliación de cortes, esfuerzo y responsables. | #200, #206, #213, #214 |
| [Reviewer](reviewer.md) | Alcance observado y clasificación de comentarios reales. | #173, #203 |
| [Ensayo en producción](ensayo-remoto.md) y [respaldo local](respaldo-local.md) | Recorridos efectivamente ejecutados y límites por entorno. | #209 |

## Registro por corte

| Caso y ubicación en PDF | Entorno, fecha y actor | Procedimiento, resultado y límite |
| --- | --- | --- |
| CU-01–16 · 6, 8, 11 | Producción UC/UTFSM, 21/11, backend 7d4b666, cuentas demo por rol | [Crear, responder y publicar por API](evidencia/remote-cycle.json); [ver módulos y notas en navegador](evidencia/browser-readback.json). Distinción por caso en la matriz. |
| Operación · 2 y 8 | Mismo corte, cliente externo | [Consultar endpoints](evidencia/endpoints.json) y [repetir con CORS](evidencia/warm-cors.json); 200 en health/ready. Muestras puntuales. |
| Frontend · 5 | Producción 21/11, visitante y estudiante UC, deploy frontend 7d4b666 | [Navegaciones públicas](evidencia/lighthouse-summary.json) y [flujo privado](evidencia/authenticated-flow-summary.json); metodología y límites de las mediciones de laboratorio en [rendimiento](rendimiento.md). |
| Core Web Vitals · 6 | CI del PR #333 y sesión local, 22/11; visitante y estudiante UC | [Comparación dev/PR](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/333#issuecomment-7082528370), [mediciones CI](evidencia/cwv-ci-pr.json) y [sesión](evidencia/cwv-sesion-local.json). Laboratorio; método en [rendimiento](rendimiento.md#core-web-vitals-y-reporte-por-pr). |
| Sonar y Trivy · 4, 9–10 | Análisis manual/Actions del 15 y 13/11 respectivamente; perfil y SHA por informe | [SonarQube](../sonarqube/README.md) y [Trivy](../trivy/README.md) comparan árboles identificados, con JSON y capturas. |
| SonarCloud · 4 | PR #329, análisis de PR, código nuevo | [Gate fallido](evidencia/sonarcloud-pr329-gate.json) y [99 avisos abiertos](evidencia/sonarcloud-pr329-issues.json). No se atribuyen las diferencias a una regla particular sin comparar perfiles. |
| Pruebas · 4 | CI main 7d4b666, 16/11 | [Run extended](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/43852844221), 527 instancias en tres navegadores. |
| Ensayo UI · 6, 8, 11 | Producción UC/UTFSM, 21/11, v0.13.1; administración, docencia, ayudante y estudiante | [Recorrido de 6:48 y capturas](ensayo-remoto.md): quiz 7,0, tarea 5,5 y promedio 6,3 en ambos cursos. Incluye el reintento de acceso; falta cronometrar la exposición oral. |
| Respaldo · demo | Compose aislado, 21/11, árboles backend/frontend de 7d4b666 | [Conmutación en 0,85 s](respaldo-local.md), tarea publicada y TXT idéntico sin red externa. Correo desactivado. |

## Qué se comprobó

- HTTPS/login UC/UTFSM, backend health/ready y CORS institucional.
- Ciclo académico completo **por API real** en ambas instituciones, con datos sintéticos nuevos.
- Nota 7,0, publicación explícita, promedio, auditoría y rechazos de acceso ajeno.
- Archivo TXT subido/publicado/descargado, con bytes idénticos por institución.
- Acceso docente/estudiante por navegador; lectura visual de módulos y nota publicada en UC/UTFSM.
- Lighthouse: login móvil UC (3 muestras), desktop UC, móvil UTFSM y flujo autenticado UC.
- Feedback de Tom agregado al archivo de reunión: commits en un solo idioma; norma vigente español.

## Acciones pendientes del equipo

- **Operación**. El equipo confirmó Render y PostgreSQL en Neon. GitHub registra ambos [despliegues exitosos en 7d4b666](evidencia/deploys-render.json). Usar el dominio Render comprobado de la API.
- **Presentadores**. Cronometrar la exposición con cambios de rol y conmutación al respaldo. La medición automática de un recorrido excluye explicaciones y coordinación entre personas.
- **Calidad**. Mantener visible el gate fallido de #329 y revisar la [corrección del reviewer](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/332) y observar sus comentarios tras la integración.
- **Planilla**. El [balance conciliado](gestion.md) conserva los campos sin registro. Para calcular esfuerzo real total harían falta datos adicionales de los responsables.
- **Equipo**. Realizar retrospectiva, enviar el PDF el día de exposición y completar evaluación de pares.

## Manejo de evidencia

Los JSON guardan estados, IDs sintéticos y métricas; no guardan claves ni JWT.
HTML/PNG son reportes y capturas reutilizables. Las credenciales proporcionadas por
el usuario se emplean solo en archivos temporales privados fuera del repositorio.
Los cursos `E4-VALID-20261121-UC/UTFSM` permanecen identificados como datos de validación;
no se borró historia ni se sobrescribieron las notas originales de la demo.
