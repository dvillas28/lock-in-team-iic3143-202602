# Fuentes y evidencia de la presentación

Corte documental: rama `docs/entrega-2-documentation`, commit `72c93a5`, después de actualizar referencias remotas. Trabajo realizado únicamente en `docs/entrega-2-presentation`. Fecha de preparación: 2 de octubre de 2026.

## Fuentes vigentes

Se revisaron los documentos 01 a 10 de Entrega 2, el UML, el índice y la carpeta de evidencia CI/CD. La fuente principal de arquitectura es el ADR [PostgreSQL compartida](../../../adr/adopt-shared-postgresql-multitenancy.md), que reemplaza decisiones de sharding, registry, `x-tenant` y migración a GCP de ADR anteriores. Las decisiones académicas conservadas se contrastaron con los ADR de dominio y cancelación de intentos.

| Slides | Fuente principal | Contraste |
| --- | --- | --- |
| 1–2 | Entrega 1 `ppt/main.tex`, alcance y estado E2 | Formato del PDF de E1 y pauta del curso |
| 3–5 | Casos CU-01–16, RF1–29 y RNF1–10 | OpenAPI, roles y reglas académicas |
| 6–7 | Arquitectura E2 y ADR PostgreSQL compartida | Dockerfiles, Compose y `railway.json` |
| 8 | Modelo de dominio y UML vigentes | Modelo lógico y relaciones de OpenAPI |
| 9–10 | Modelo de datos completo | Dominio, tenancy/quizzes/grades/audit en OpenAPI |
| 11–12 | Plan, riesgos y estado E2 | Alcance y capturas de fallos/despliegues |
| 13–14 | Código, workflows y evidencia versionada | Health, fetch server-side y release por tag |
| 15 | Estado E2 | Implementación efectiva y próximos incrementos |

El contrato OpenAPI 0.2.0 usa JSON camelCase (`inProgress`); el modelo lógico usa nombres de persistencia snake_case (`in_progress`). La presentación conserva el contexto de cada nomenclatura, sin declarar una tercera versión. `Alternative` es concepto anidado del dominio y se persiste en JSONB; no se introduce una tabla `alternatives`.

## Assets reutilizados

- Preámbulo, título institucional, autor colectivo, colores, tamaño, tablas y estilo TikZ de Entrega 1. No hay logos ni archivos de theme externos en ese template.
- Las **11 capturas PNG** de `../11-cicd-evidence/img/` se copiaron sin alterar bytes a `images/` para que la presentación sea portable.
- Las slides principales 13–14 usan recortes de presentación mediante `\includegraphics[trim=...,clip]`. Los archivos originales se mantienen completos. Los recortes no cambian estados, textos ni resultados.
- Cuatro bloques Mermaid fuente se conservan en `images/use-cases-1.mmd`, `domain-1.mmd`, `domain-2.mmd` y `data-model-1.mmd`.

## Diagramas nuevos basados en las fuentes

No se agregó un modelo nuevo. Se adaptó su composición para proyección usando el mismo TikZ ya incluido en E1.

- Flujo de cobertura, agrupación de actores, arquitectura vigente, integración HTTP, CI/CD y estados del intento: editables en `main.tex`.
- `domain-core.tex`: recorte conceptual principal.
- `domain-identity.tex`, `domain-assessment.tex`, `domain-grading.tex`: todas las asociaciones del UML vigente, distribuidas por áreas.
- `data-identity.tex`, `data-evaluation.tex`: vistas principales de tablas y reglas institution-aware.
- `data-complete-1.tex` a `data-complete-4.tex`: todas las tablas, atributos y asociaciones dibujados en el ERD Mermaid fuente, repartidos por áreas. Tablas repetidas en más de un área conservan su significado.
- `diagram-styles.tex`: estilos TikZ derivados del diagrama E1.

El ERD fuente omite atributos y relaciones repetidas para reducir ruido. Su reproducción completa no sustituye las listas de campos/constraints del documento lógico. Las FK a User que exigen pertenencia institucional se explican como la pareja `(institution_id, user_id)` contra `institution_memberships`.

## Walking skeleton y CI/CD

| Evidencia | Qué demuestra | Límite |
| --- | --- | --- |
| `02-frontend-portal.png` | Frontend Railway mostrando `Backend: ok (v0.1.0)` | Captura versionada; no es una comprobación del estado remoto de hoy |
| Código `getHealth`, página Next y HealthController | Fetch real server-side, sin caché, validación del JSON y respuesta health | Solo integración HTTP, sin persistencia ni JWT |
| `03-ci-run.png`, `04-ci-job-steps.png`, `05-ci-pr-checks.png` | Ejecución histórica CI y cuatro jobs/checks exitosos | No prueba que esta rama documental haya ejecutado CI remoto |
| `06-railway-project.png` | Ambos servicios Online | No demuestra PostgreSQL provisionada |
| `07/08-railway-*-deploys.png` | Fallos de build por directorios raíz ausentes y despliegue posterior exitoso | No se deduce el cambio exacto que resolvió cada fallo |
| `09-railway-deploy-log.png` | Build y deployment backend exitosos | Captura original incluye historial de fallo |
| `10-release-run.png`, `11-github-release.png` y tag Git local | Workflow y release `v0.1.0` | Release histórica del skeleton, no de esta presentación |
| `ci.yml` | PR hacia main/dev, push a main, dispatch y cuatro jobs en paralelo | Docker builds no esperan a la matriz de checks |
| `release.yml` | Tag SemVer, commit en main y release automática | El equipo crea/empuja el tag; no existe generación automática del tag |
| `railway.json` y README de evidencia | Dockerfiles, healthchecks, autodeploy desde main y Wait for CI documentado | Wait for CI/branch son ajustes de Railway descritos, sin captura de Settings |

## Capturas que el equipo puede completar

La evidencia existente alcanza para ilustrar el skeleton y las ejecuciones históricas. Se deja identificado un respaldo pendiente específico de configuración:

1. **`images/12-railway-wait-for-ci.png` (pendiente, no sustituido por imagen inventada).** En Railway, abrir cada servicio → Settings → Source. Capturar rama `main`, autodeploy y “Wait for CI” activado, sin variables/secrets. Si un único screenshot no cubre los dos servicios, usar sufijos `-backend` y `-frontend`. Sirve para respaldar visualmente el ajuste descrito en el README de evidencia. Hoy el deck lo atribuye explícitamente a esa documentación.
2. **Opcional: `images/13-backend-health.png`.** Ejecutar el backend local y capturar `http://localhost:3001/health` con `status`, `version`, `timestamp` y URL visibles. El backend Railway figura como servicio no expuesto en la captura, por lo que no se inventa una URL pública. No hace falta publicar el backend para tomar esta captura.
3. **Opcional: captura actualizada de frontend/CI/deploy** asociada al commit que el grupo expondrá. Mantener la evidencia original como antecedente y registrar fecha, commit y URL del run si se reemplaza en el deck.

No hay placeholder de imagen rota en el PDF. La ausencia de una captura de Settings no se presenta como prueba visual de ese ajuste.

## Diferencias, inconsistencias y límites encontrados

- **Histórico frente a vigente:** Entrega 1 y ADR antiguos incluyen DB por universidad, registry, `x-tenant`, GCP y otras capacidades retiradas. El ADR del 29 de septiembre y Entrega 2 los reemplazan explícitamente. Se reutilizó solo el formato de E1.
- **UML/ERD frente a implementación:** los módulos académicos, tablas, constraints y endpoints institucionales son diseño/contrato. El código efectivo implementa PlatformModule y `/health`. Compose provee una base local, pero el backend no la consume.
- **Plan frente a pauta:** `08-work-plan.md` fija orden e iteraciones sugeridas semanales, pero no fechas de calendario, responsables ni estimaciones de codificación/pruebas/correcciones por caso. La presentación no las inventa.
- **Riesgos frente a pauta:** `07-risks.md` no asigna probabilidades ni estados individuales. Las capturas muestran fallos de build previos que la lista no registra explícitamente como materializados; se menciona solo lo visible.
- **CD:** el documento de evidencia describe autodeploy y Wait for CI. La configuración versionada define build/healthcheck/restart, pero no esos ajustes de Source. Se identifica la captura pendiente anterior.
- **Puntaje de pauta:** las filas de `01-delivery-requirements.md` suman **6,0** y su total dice **7,0**. La guía del curso indica **6,0 más un punto base**. La presentación no muestra una suma contradictoria ni modifica la documentación original.
- **Autores/fecha:** la presentación E1 solo incluye Equipo Lock In. No se deducen nombres desde usuarios GitHub ni se inventa fecha de exposición.

No se encontraron diferencias de roles entre los modelos vigentes y OpenAPI: coordinator de curso y teacher/assistant/student de sección. No se modificaron decisiones funcionales ni documentos fuente.

## Verificación de esta preparación

- PDF compilado con pdfLaTeX, sin mensajes Overfull ni warnings de referencias en la compilación final, y revisado visualmente en sus 65 páginas.
- Capturas copiadas con igualdad de bytes respecto de las fuentes.
- Se intentó repetir el test local de backend y arrancar el servicio para una captura adicional. Los procesos no completaron su ejecución y se interrumpieron; el runner reportó una prueba cancelada por una promesa pendiente. No se obtuvo un healthcheck local nuevo ni se afirma que el código haya sido revalidado exitosamente en esta sesión. La evidencia de CI del deck es la captura versionada, identificada como histórica.
- CodeGraph se intentó antes de inspeccionar el flujo de código, pero el comando no está instalado en este entorno. Se recurrió a los archivos de implementación.
