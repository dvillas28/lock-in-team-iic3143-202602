# Guion de la presentación de E3

Presentación: [`main.pdf`](main.pdf), 24 diapositivas. Cifras al 01/11.
Tiempo: 15 min de presentación, 4:30 de demo y 0:30 de cierre (pauta: unos 20 min).
Después vienen 10–15 min de preguntas. Quién presenta cada bloque es una propuesta.

## Tiempos

| Bloque | Diapositivas | Tiempo | Acumulado | Presenta (propuesta) |
| --- | --- | --- | --- | --- |
| Apertura | 1–2 | 1:00 | 1:00 | `dvillas28` |
| Proceso | 3–8 | 4:30 | 5:30 | `dvillas28`; `spmasabeu` en la 8 |
| Calidad y testing | 9–10 | 1:45 | 7:15 | `FierroD` |
| CI/CD | 11–13 | 2:00 | 9:15 | `dvillas28` |
| Métricas | 14–16 | 2:00 | 11:15 | `dvillas28` |
| Plan y viabilidad | 17–22 | 3:45 | 15:00 | `spmasabeu` en la 17; `dvillas28` |
| Demo | 23 | 4:30 | 19:30 | `matiaraos`, `Jbcleon` |
| Cierre | 24 | 0:30 | 20:00 | `dvillas28` |

Si el ensayo se pasa de tiempo, se recortan primero la 13 (repite cifras de la 12), la 15 y la 20.

## Apertura

**1. Título (0:15).** Somos Lock In y presentamos AcademiX, un LMS multi-institución.

**2. La respuesta primero (0:45).** Partimos por la pregunta de la entrega.
- Sí alcanzamos el MVP comprometido: quedan 58 h de P0 y P1 en 3 semanas.
- Llevamos 386 de 465 h estimadas (83 %) y el ritmo observado es de 97 h por semana.
- Lo único condicionado es el material en archivos (P2, 21 h).

## Proceso

**3. Ciclo de desarrollo (1:00).** Todo cambio sigue el mismo camino.
- Issue o spec, rama `tipo/nombre`, PR a `dev` y CI obligatorio.
- `dev` integra con squash y genera un tag; `main` recibe merge commit, release y deploy en Render.
- 68 PR integradas desde el 11/10. Solo 23 tuvieron revisión de un par: es lo primero a mejorar.

**4. Una PR real (0:45).** La PR #86 de cursos y roles muestra el ciclo completo.
- Título en conventional commits, enlace al spec y 4 issues que cierra.
- 12 checks en verde; sin `CI result` no se puede integrar.

**5. Prácticas (0:45).** Cada práctica tiene evidencia y un beneficio concreto.
- Destacar ADR (22) y CI como gate: 35 ejecuciones fallidas en PR frenaron el merge.

**6. Cómo se mueve una tarjeta (0:45).** Responde cuándo una tarjeta avanza y cuándo está Done.
- Draft pasa a issue al iniciar su semana; In progress al empezar a trabajarla.
- Done: su PR está en `dev` y la tarjeta tiene horas reales.
- El snapshot diario reconstruye el historial que GitHub Projects no guarda.

**7. Prácticas abandonadas (0:45).** Semgrep salió porque SonarQube y Trivy ya cubren el análisis.
- Los drafts y las horas reales se dejaron de aplicar y los corregimos.
- Railway se abandonó; levantamos todo desde 0 en Render.

**8. Railway a Render (0:45).** El 21/10 Railway tuvo un incidente de seguridad y pausó los despliegues.
- Migramos con un Blueprint; no cambiaron Dockerfiles, CI ni RLS.
- Costos aceptados: arranque en frío y base que expira a los 30 días.

## Calidad y testing

**9. Estrategia de testing (0:45).** Lo más importante es que una institución no acceda a los datos de otra y que las notas no se vean antes de publicarlas.
- Por eso, además de las pruebas con mocks, el backend se prueba contra PostgreSQL real con RLS: 207 tests.
- Frontend: 350 tests. E2E: Playwright con API y base reales.

**10. Qué probamos (1:00).** Seis flujos de usuario, de entrar a la institución a publicar notas.
- Cada flujo tiene E2E, integración y unitarias. Los más cubiertos son el acceso (44 casos E2E) y las notas (42).
- Corrida completa del 31/10: 248 fichas, 512 ejecuciones en tres navegadores, 0 fallos.

## CI/CD

**11. Pipeline (0:45).** Los jobs de CI alimentan `CI result`, el único check obligatorio.
- E2E y el bot de IA corren en la PR, pero no bloquean.
- 137 de 181 ejecuciones exitosas desde el 11/10; 67 de 67 releases.

**12. SCA, SAST y revisión con IA (0:45).** Lo pide la pauta y lo tenemos en cada PR.
- Trivy y SonarQube bloquean el merge; el bot con Gemini comenta el diff.
- Esta semana corregimos el bug crítico de SonarQube y actualizamos 3 dependencias.

**13. Auditorías del 01/11 (0:30).** Las mismas herramientas, lanzadas a pedido sobre `main`.
- Trivy: 0 críticas y 0 altas. SonarQube: gate OK y 94,1 % de cobertura.

## Métricas

**14. Burnup (0:45).** 83 % de las horas y 78 % de las tarjetas terminadas.
- Los saltos del 21/10 y del 31/10 son actualizaciones del tablero por lotes.
- El tramo ámbar es la conciliación: trabajo ya integrado que el tablero no mostraba.

**15. CFD (0:30).** Entre el 15 y el 20/10 hubo hasta 20 tarjetas en curso a la vez.
- Desde entonces casi nada aparece en In progress; la regla de la 6 apunta a eso.

**16. Tiempos y estimado vs. real (0:45).** Mediana de 3,3 días desde que se crea una tarjeta hasta Done.
- En 68 tarjetas con horas reales gastamos la mitad de lo estimado (0,50).
- Las 28 sin horas son funcionalidades conciliadas de las semanas 5 y 6.

## Plan y viabilidad

**17. Feedback de E2 (0:30).** Respondimos cada observación en la PR #160.
- Cardinalidades, rol como dominio cerrado, actores y cuentas demo.

**18. Completo y pendiente (0:30).** 47 de 49 funcionalidades; faltan las 2 de archivos.
- Pendiente: 79 h, y la mayor parte son entregas y gestión.

**19. ¿Alcanzamos? (0:45).** Necesitamos 26 h por semana y hacemos 97.
- Aun a la mitad del ritmo terminamos el 13/11, nueve días antes del cierre.

**20. Supuestos y riesgos (0:30).** El riesgo es el calendario: 48 h son de la semana 7.
- La base de Render vence cerca del 21/11: se renueva en la semana 5 (#178).

**21. Plan hacia el MVP (0:45).** Semanas 5 a 7 con tarjetas y responsables.
- Semana 5: base de Render y tests de material y quizzes. Semana 6: tests de notas.
- Semana 7: E4, accesibilidad, release y, si hay storage, archivos.

**22. Prioridades y compromiso (0:45).** Si nos atrasamos, sale primero el material en archivos.
- Si el 15/11 no hay ADR de storage, queda fuera del MVP.
- Comprometemos para E4 el flujo completo, aislado y desplegado desde `main`.

## Demo (4:30)

Antes de empezar: abrir la API en Render (tarda cerca de 1 min en despertar).
Respaldo: la misma versión en local con Docker Compose.

1. Docente UC: abre el curso, crea un módulo y publica material (0:45).
2. Docente UC: crea un quiz y lo publica (0:45).
3. Estudiante: rinde el quiz y ve su intento corregido (0:45).
4. Docente: abre el libro de notas y publica (0:45).
5. Estudiante: ve la nota publicada (0:30).
6. Cuenta con acceso a UC y UTFSM: en UTFSM no ve nada de UC (0:30).

El guion detallado con cuentas y datos queda en #165.

## Cierre (0:30)

**24.** Producto: 47 de 49 funcionalidades. Código: CI, E2E, Trivy y SonarQube.
Alcanzamos: 79 h en 3 semanas, con orden de corte definido.

## Preguntas previsibles

- **¿Por qué tan pocas PR con revisión?** No la exige la regla de `dev`; el bot de IA cubre parte. Proponemos exigir una aprobación.
- **¿Por qué el real es la mitad del estimado?** Estimamos con holgura y algunas horas se registraron después. Por eso proyectamos con horas estimadas.
- **¿Cobertura actual y óptima?** Backend 99,5 % de líneas y 95,7 % de ramas; frontend 95,2 % y 88,9 %. El CI de frontend exige 80 %.
- **¿Cuántos defectos?** 6 corregidos desde el 11/10: 3 del deploy en Render, 1 de migraciones (#177) y 2 de producto. 1 bug de SonarQube abierto.
- **¿Deuda técnica?** 11 issues de SonarQube (8 de `tabIndex`), 3 dependencias MEDIUM y lo diferido: HA, pooling externo y storage.
- **¿Quedan drafts?** Quedan drafts históricos de E1 y de la semana 3 ya terminados; los del trabajo vigente son issues.
- **¿Por qué E2E no es obligatorio?** Tarda 13 min; corre en cada PR que lo afecta y pasarlo a obligatorio está pendiente.
- **¿Y si Render falla el día de E4?** Demo local con Docker Compose; la base se renueva antes del 21/11.
