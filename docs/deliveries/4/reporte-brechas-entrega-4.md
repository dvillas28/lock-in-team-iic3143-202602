# Entrega 4 — Diagnóstico de brechas

Corte histórico del diagnóstico: **16/11/2026**, commit `7d4b666`. Base: [E3](../3/ppt/guion.md), avances locales E4 y [checklist de la pauta](checklist-entrega-4.md).

**Diagnóstico:** existe una base funcional y evidencia de calidad; el cierre E4 todavía no está acreditado. Priorizar demo completa y retrospectiva: concentran **5 de los 6 puntos evaluables**.
«Parcial» indica evidencia reutilizable; «pendiente», entregable no localizado; «por verificar», operación sin confirmación suficiente.

## Actualización comprobada del 21/11

- [Paquete de cierre](cierre/README.md): matriz de alcance, operación real y Lighthouse con capturas.
- v0.13.1/7d4b666 confirmado por health; ready 200. Ciclo académico y archivos TXT pasaron en ambos tenants.
- E2E extended sobre main, run [43852844221](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/43852844221), terminó aprobado el 16/11: 527 instancias, tres navegadores. Actualiza el resultado parcial citado abajo; no prueba ausencia permanente de flakiness.
- [PDF y guion](ppt/README.md), [ensayo remoto](cierre/ensayo-remoto.md), [respaldo probado](cierre/respaldo-local.md) y [esfuerzo estimado por responsable](cierre/gestion.md) incorporados. Quedan la exposición cronometrada con el equipo, la retrospectiva, los campos del Project y la aceptación de riesgos por sus responsables.

## Brechas históricas al 16/11 y condición de cierre

| Frente | Evidencia disponible | Brecha concreta para cerrar |
| --- | --- | --- |
| **Alcance y plan · Parcial** | [E3](../3/ppt/dvillas28/10-plan-mvp/frames.tex) compromete cursos/secciones, módulos/material Markdown, quizzes/corrección, notas/publicación/libro, auditoría, aislamiento y release en Render. | Conciliar compromiso → resultado → evidencia; actualizar horas y pendientes. E3 muestra 79 h/27 tarjetas en el guion y 77 h/26 en el plan: no reutilizar como cifras finales. |
| **Demo · Parcial** | [Guion E3](../3/ppt/guion.md): recorrido de 4:30 min; [README](../3/ppt/README.md) mantiene guion detallado y ensayo pendientes. | Cubrir todos los casos comprometidos, incluida auditoría; preparar cuentas/datos y registrar ensayo sobre la release final. |
| **Arquitectura/datos · Parcial** | [Arquitectura E4](arquitectura.md) y [modelo E4](modelo-datos.md) contrastados con código, configuración y 23 migraciones; diagramas y reglas actualizados. | Incorporar los dos diagramas al PPT y revisar anexos de procesos. La configuración documentada no acredita despliegue remoto. |
| **Calidad · Parcial** | [SonarQube](sonarqube/README.md): 0 issues, 91,7 % cobertura; [Trivy](trivy/README.md): 0 hallazgos en el alcance auditado. | Integrar resultados por commit y sus límites. Sonar registra E2E-TENANT-007 inestable (265/266); cerrar o documentar resultado y riesgo. Trivy excluye dependencias de desarrollo con hallazgos. |
| **Operación · Por verificar** | [Guía](../../guides/render-deploy.md) declara Neon; [ADR](../../adr/neon-database.md) aún dice migración pendiente. | Acreditar base efectiva, `/ready`, login y flujo académico en la release desplegada; reconciliar documentos. No dar por resuelta la expiración de Render solo por la guía. |
| **Archivos P2 · Parcial** | E3 los condicionó al ADR antes del 15/11. Hay [ADR e implementación del 09/11](../../adr/s3-for-academic-files.md); prueba S3 real pendiente. | Aclarar inclusión final: la condición de ausencia de ADR ya no justifica excluirlos. Si se incluyen, acreditar carga, lectura y descarga remotas con permisos. |
| **Retrospectiva · Pendiente** | E3 aporta métricas, prácticas abandonadas y decisiones. No se localizó retrospectiva final. | Reunión breve; elegir 3–4 conclusiones «decisión → efecto observado → aprendizaje», en 1–2 diapositivas. |
| **Material y exposición · Pendiente** | PPT E3 y [respuesta al feedback E2](../2/15-feedback-e2.md); E4 contiene auditorías. | Preparar PPT/PDF E4, índice de material corregido E1–E3 y anexos; verificar feedback E3 disponible, ensayar 30 min y enviar. |

## Orden de trabajo propuesto

1. **Equipo:** conciliar alcance y tablero; asignar responsable a cada pendiente y fijar versión de entrega.
2. **Producto/operación:** comprobar despliegue, base y demo completa; resolver E2E inestable y S3 si entra en alcance.
3. **Equipo:** cerrar retrospectiva y plan; incorporar diagramas E4 y evidencias a la presentación, ensayar y entregar.

**Criterio de cierre:** cada compromiso tiene resultado demostrable o incumplimiento explícito; cada requisito del checklist tiene evidencia final.
**Límite:** revisión documental local; no confirma disponibilidad actual de producción ni estado remoto de tablero/CI. Ausencia de evidencia no prueba ausencia de implementación.
