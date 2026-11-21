# Cierre E4 — Paquete de trabajo

Corte: **21/11/2026**. Base funcional comprobada: **v0.13.1 / 7d4b666**.
Prioridades 1–3 ejecutadas con límites explícitos: alcance/versionado, operación remota y rendimiento.
Fuentes: [enunciado actualizado](../enunciado_e4.pdf) y [feedback E3/Tom](../meeting_feedback.md).

## Material listo para reutilizar

| Documento | Uso en la entrega | Tarjetas relacionadas |
| --- | --- | --- |
| [Alcance y matriz](alcance-final.md) | Compromiso → resultado → evidencia → paso de demo; ampliaciones y exclusiones. | #213, #216 |
| [Operación y riesgos](operacion-demo.md) | Resultados remotos, cuentas por rol sin claves, datos sintéticos y guion del ensayo. | #206, #209 |
| [Rendimiento](rendimiento.md) | Lighthouse público/privado, métricas, capturas para PPT y límites. | #212 |
| [Contenido de calidad](calidad-para-ppt.md) | Texto/tablas para 2 slides: Sonar, Trivy, pruebas y rendimiento. | #212, #208 |
| [Notas de evidencia](notes.md) | Fuentes, observaciones y decisiones del turno. | #205, #216 |
| [Plan de ejecución](task_plan.md) | Qué se hizo y qué queda. | Coordinación |

## Qué se comprobó

- HTTPS/login UC/UTFSM, backend health/ready y CORS institucional.
- Ciclo académico completo **por API real** en ambas instituciones, con datos sintéticos nuevos.
- Nota 7,0, publicación explícita, promedio, auditoría y rechazos de acceso ajeno.
- Archivo TXT subido/publicado/descargado, con bytes idénticos por institución.
- Acceso docente/estudiante por navegador; lectura visual de módulos y nota publicada en UC/UTFSM.
- Lighthouse: login móvil UC (3 muestras), desktop UC, móvil UTFSM y flujo autenticado UC.
- Feedback de Tom agregado al archivo de reunión: commits en un solo idioma; norma vigente español.

## Pendientes concretos para repartir

1. **Dani / operación:** confirmar proveedor DB, referencia deploy frontend y servicios externos que se demostrarán; preparar respaldo local probado.
2. **Equipo / demo:** ensayar la secuencia completa por UI, incluida cancelación, ayudante, tareas/entregas y altas incluidas en el alcance entregado.
3. **Dani + calidad:** revisar mantenibilidad nueva D en el gate SonarCloud de #329; cobertura nueva 90,9 % aprobada. Se guardaron 99 issues de ese corte. La auditoría manual en verde no sustituye ese gate.
4. **Dani + responsables:** conciliar horas confirmadas y tarjetas de semanas 6–7; no registrar aproximaciones como tiempo real medido.
5. **Equipo / retrospectiva:** elegir 3–4 decisiones con efecto de ingeniería verificable.
6. **Editor de PPT:** integrar matriz, diagramas y capturas; respetar 1–2 slides por bloque y 30 minutos totales.
7. **Equipo:** revisar feedback E1–E3, material final, evaluación de pares y envío PPT/PDF.

Las tarjetas #206/#209 requieren revisión de riesgos por el equipo y ensayo: las pruebas
API no sustituyen esos entregables. #213 conserva pendiente la conciliación de esfuerzo.
No se marca E4 completa por tener código y reportes.

## Manejo de evidencia

Los JSON guardan estados, IDs sintéticos y métricas; no guardan claves ni JWT.
HTML/PNG son reportes y capturas reutilizables. Las credenciales proporcionadas por
el usuario se emplean solo en archivos temporales privados fuera del repositorio.
Los cursos `E4-VALID-20261121-UC/UTFSM` permanecen identificados como datos de validación;
no se borró historia ni se sobrescribieron las notas originales de la demo.
