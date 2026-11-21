# Cierre E4 — Índice de evidencias

Corte: **21/11/2026**. Base funcional comprobada: **v0.13.1 / 7d4b666**.
Prioridades 1–3 ejecutadas con límites explícitos: alcance/versionado, operación remota y rendimiento.
Fuentes: [enunciado actualizado](../enunciado_e4.pdf) y [feedback E3/Tom](../meeting_feedback.md).

## Material para evaluación

| Documento | Uso en la entrega | Tarjetas relacionadas |
| --- | --- | --- |
| [Alcance y matriz](alcance-final.md) | Compromiso → resultado → evidencia → paso de demo; ampliaciones y exclusiones. | #213, #216 |
| [Operación y riesgos](operacion-demo.md) | Resultados remotos, cuentas por rol sin claves, datos sintéticos y guion del ensayo. | #206, #209 |
| [Rendimiento](rendimiento.md) | Lighthouse público/privado, métricas, capturas para PPT y límites. | #212 |
| [Contenido de calidad](calidad-para-ppt.md) | Texto/tablas para 2 slides: Sonar, Trivy, pruebas y rendimiento. | #212, #208 |
| [PDF y guion](../ppt/README.md) | Presentación, fuentes, instrucciones de compilación y demo en 30 minutos. | #204, #208 |
| [Correcciones E1–E3](feedback.md) | Feedback y procesos actualizados. | #205 |
| [Gestión](gestion.md) | Conciliación de cortes, esfuerzo y responsables. | #200, #206, #213, #214 |
| [Reviewer](reviewer.md) | Alcance observado y clasificación de comentarios reales. | #173, #203 |
| [Ensayo en producción](ensayo-remoto.md) y [respaldo local](respaldo-local.md) | Recorridos efectivamente ejecutados y límites por entorno. | #209 |

## Registro por corte

| Caso y ubicación en PDF | Entorno, fecha y actor | Procedimiento, resultado y límite |
| --- | --- | --- |
| CU-01–16 · 6, 8, 11 | Producción UC/UTFSM, 21/11, backend 7d4b666, cuentas demo por rol | [Crear, responder y publicar por API](evidencia/remote-cycle.json); [ver módulos y notas en navegador](evidencia/browser-readback.json). Distinción por caso en la matriz. |
| Operación · 2 y 8 | Mismo corte, cliente externo | [Consultar endpoints](evidencia/endpoints.json) y [repetir con CORS](evidencia/warm-cors.json); 200 en health/ready. Muestras puntuales. |
| Frontend · 5 | Producción 21/11, visitante y estudiante UC, SHA frontend sin confirmar | [Navegaciones públicas](evidencia/lighthouse-summary.json) y [flujo privado](evidencia/authenticated-flow-summary.json); método y percentiles de campo fuera de alcance en [rendimiento](rendimiento.md). |
| Sonar y Trivy · 4, 9–10 | Análisis manual/Actions del 15 y 13/11 respectivamente; perfil y SHA por informe | [SonarQube](../sonarqube/README.md) y [Trivy](../trivy/README.md) comparan árboles identificados, con JSON y capturas. |
| SonarCloud · 4 | PR #329, análisis de PR, código nuevo | [Gate fallido](evidencia/sonarcloud-pr329-gate.json) y [99 avisos abiertos](evidencia/sonarcloud-pr329-issues.json). No se atribuyen las diferencias a una regla particular sin comparar perfiles. |
| Pruebas · 4 | CI main 7d4b666, 16/11 | [Run extended](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/43852844221), 527 instancias en tres navegadores. |

## Qué se comprobó

- HTTPS/login UC/UTFSM, backend health/ready y CORS institucional.
- Ciclo académico completo **por API real** en ambas instituciones, con datos sintéticos nuevos.
- Nota 7,0, publicación explícita, promedio, auditoría y rechazos de acceso ajeno.
- Archivo TXT subido/publicado/descargado, con bytes idénticos por institución.
- Acceso docente/estudiante por navegador; lectura visual de módulos y nota publicada en UC/UTFSM.
- Lighthouse: login móvil UC (3 muestras), desktop UC, móvil UTFSM y flujo autenticado UC.
- Feedback de Tom agregado al archivo de reunión: commits en un solo idioma; norma vigente español.

## Pendientes concretos para repartir

1. **Dani / operación:** confirmar proveedor DB, referencia deploy frontend y servicios externos que se demostrarán; validar la conmutación con los presentadores.
2. **Equipo / demo:** ensayar la secuencia completa por UI, incluida cancelación, ayudante, tareas/entregas y altas incluidas en el alcance entregado.
3. **Dani + calidad:** revisar mantenibilidad nueva D en el gate SonarCloud de #329; cobertura nueva 90,9 % aprobada. Se guardaron 99 issues de ese corte. La auditoría manual en verde no sustituye ese gate.
4. **Dani + responsables:** conciliar horas confirmadas y tarjetas de semanas 6–7; no registrar aproximaciones como tiempo real medido.
5. **Equipo / retrospectiva:** elegir 3–4 decisiones con efecto de ingeniería verificable.
6. **Equipo:** aprobar material final, evaluación de pares y envío PPT/PDF.

Las tarjetas #206/#209 requieren revisión de riesgos por el equipo y ensayo: las pruebas
API no sustituyen esos entregables. #213 conserva pendiente la conciliación de esfuerzo.
No se marca E4 completa por tener código y reportes.

## Manejo de evidencia

Los JSON guardan estados, IDs sintéticos y métricas; no guardan claves ni JWT.
HTML/PNG son reportes y capturas reutilizables. Las credenciales proporcionadas por
el usuario se emplean solo en archivos temporales privados fuera del repositorio.
Los cursos `E4-VALID-20261121-UC/UTFSM` permanecen identificados como datos de validación;
no se borró historia ni se sobrescribieron las notas originales de la demo.
