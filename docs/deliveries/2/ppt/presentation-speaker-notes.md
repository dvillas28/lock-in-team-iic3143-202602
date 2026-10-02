# Punteo de exposición — AcademiX, Entrega 2

15 slides principales. Contenido: **12 min 50 s**. Reservar unos **30 s** para transiciones: **13 min 20 s**. Anexos fuera del tiempo principal y disponibles para preguntas.

La fecha de portada corresponde a la preparación de esta versión, no a una fecha de exposición confirmada. Entrega 1 identifica al equipo como **Equipo Lock In** y no incluye nombres individuales, profesor, ayudante ni logos.

## Slide 1 — AcademiX / Entrega 2

### Objetivo
Presentar al equipo y situar la exposición en Elaboración.

### Punteo para hablar
- “Somos el Equipo Lock In y esta es la segunda entrega de AcademiX.”
- “Nos concentraremos en el diseño refinado y en la base técnica que ya conecta frontend y backend.”
- Señalar el recorrido inferior: ahora el MVP evalúa mediante quizzes autocorregidos.

### Transición
“Primero veamos cómo se conectan las piezas de esta entrega.”

### Tiempo estimado
20 segundos

### Fuentes
`../02-scope.md`; template `../../1/ppt/main.tex`.

## Slide 2 — Qué cubrimos en esta entrega

### Objetivo
Entender el hilo que une los requisitos con la evidencia técnica.

### Punteo para hablar
- Recorrer los cinco bloques de izquierda a derecha.
- “Los casos de uso definen las metas; arquitectura y modelos fijan cómo sostenerlas.”
- “El plan ordena la construcción y CI/CD permite mantener una base desplegable.”
- “Tenemos un walking skeleton implementado; persistencia y aislamiento ejecutable son el siguiente incremento.”

### Transición
“El primer paso es identificar quién realiza cada meta.”

### Tiempo estimado
35 segundos

### Fuentes
`../01-delivery-requirements.md`; `../10-status.md`.

## Slide 3 — Actores y metas del MVP

### Objetivo
Distinguir actores y alcances sin recorrer todas las fichas.

### Punteo para hablar
- “Una identidad autenticada elige una Institution a la que pertenece.”
- El coordinador organiza el curso completo, contenido, ponderaciones e historial.
- El docente crea quizzes y publica notas dentro de sus secciones; el estudiante consume contenido y rinde.
- “El ayudante consulta cursos y libro de su sección, con acceso de solo lectura al libro.”
- “Los roles se pueden acumular. CU-15 permite cancelar intentos al propietario o al coordinador/docente autorizado.” Esa asociación está completa en el anexo.

### Transición
“Dentro de esas metas, seleccionamos el recorrido que conecta evaluación con resultados.”

### Tiempo estimado
50 segundos

### Fuentes
`../03-use-cases-and-requirements.md`, contexto y asociaciones CU-01 a CU-16.

## Slide 4 — Casos que sostienen el recorrido académico

### Objetivo
Entender el ciclo de un quiz desde el contexto autorizado hasta la nota visible.

### Punteo para hablar
- “Entrar a la institución es una precondición del trabajo académico.”
- CU-07 prepara una evaluación válida y separa pauta de vista estudiantil.
- CU-09 calcula la nota al enviar, pero no la revela todavía al estudiante.
- CU-11 comunica los resultados mediante publicación explícita; CU-12 muestra solo notas propias publicadas y su promedio.
- “Esta es una selección para explicar el flujo. La documentación no asigna prioridad individual a los casos.”

### Transición
“Ese ciclo necesita garantías de seguridad e integridad.”

### Tiempo estimado
50 segundos

### Fuentes
`../03-use-cases-and-requirements.md`, CU-01/02/07/09/11/12.

## Slide 5 — Requisitos que condicionan el diseño

### Objetivo
Conectar atributos de calidad con decisiones y comprobaciones concretas.

### Punteo para hablar
- “Aislar implica bloquear lecturas, escrituras y relaciones entre Institutions.”
- “Integridad exige confirmar respuestas, nota e historial juntos cuando cambian en la misma operación.”
- “La recuperación cubre la base completa; restore individual no pertenece al MVP.”
- “La modularidad y las interfaces estándar mantienen el dominio independiente del proveedor.”
- “El healthcheck ya está implementado. Estos controles académicos siguen siendo requisitos por construir y probar.”

### Transición
“Con esas restricciones, esta es la arquitectura vigente.”

### Tiempo estimado
45 segundos

### Fuentes
`../03-use-cases-and-requirements.md`, RNF1–7/RNF9; `../04-architecture.md`.

## Slide 6 — Arquitectura vigente y frontera implementada

### Objetivo
Distinguir los componentes desplegados de la persistencia diseñada.

### Punteo para hablar
- Señalar la línea continua: navegador, frontend Next.js y backend NestJS.
- “Railway tiene dos servicios de aplicación y el frontend consulta el backend por HTTP.”
- Señalar la línea discontinua: “El diseño incorpora una sola PostgreSQL compartida, con UC y UTFSM separadas por institution_id.”
- “Compose ya declara esa base local. El backend todavía no consume DATABASE_URL.”
- “La captura Railway no demuestra una base provisionada. Esa conexión pertenece al trabajo siguiente.”

### Transición
“Estas decisiones reemplazan la complejidad operacional del diseño anterior.”

### Tiempo estimado
55 segundos

### Fuentes
`../04-architecture.md`; `../../../../docker-compose.yml`; `../11-cicd-evidence/README.md`; código de health.

## Slide 7 — Decisiones que reducen complejidad del MVP

### Objetivo
Explicar las decisiones actuales y su costo de aislamiento.

### Punteo para hablar
- “La base compartida elimina registry, pools y migraciones repetidas por universidad.”
- “El path solicita una institución y el backend valida pertenencia; el slug no concede permisos.”
- “Railway es la plataforma vigente. Ya no hay una migración planificada a Google Cloud.”
- “RLS se difiere. El MVP debe combinar autorización, scope, constraints y pruebas.”
- “Aceptamos aislamiento lógico y recuperación compartida, por eso los tests cruzados son centrales.”

### Transición
“El modelo de dominio organiza los conceptos que esa arquitectura debe proteger.”

### Tiempo estimado
45 segundos

### Fuentes
`../../../adr/adopt-shared-postgresql-multitenancy.md`; `../04-architecture.md`.

## Slide 8 — Modelo de dominio: del contenido a la nota

### Objetivo
Entender las relaciones conceptuales del recorrido académico.

### Punteo para hablar
- Seguir Course, CourseModule y Material en la fila superior.
- Seguir Quiz, QuizAttempt y Grade en la fila inferior: un quiz puede recibir muchos intentos.
- “GradeItem vincula el quiz con su ponderación. Grade representa la nota vigente de una persona para ese ítem.”
- “Antes de publicar usamos el último intento graded por número, no el mayor puntaje.”
- “Este es un recorte del UML, no clases definitivas de código. Identidad, sección, preguntas y auditoría están completas en los anexos.”

### Transición
“Al llevar esos conceptos a tablas, primero debemos representar identidad y permisos.”

### Tiempo estimado
55 segundos

### Fuentes
`../05-domain-model.md`; `../05-domain-model-uml.md`.

## Slide 9 — Modelo de datos: identidad, cursos y permisos

### Objetivo
Comprender dónde se guarda pertenencia y dónde se asignan roles académicos.

### Punteo para hablar
- “users es global: la misma persona puede pertenecer a UC y UTFSM.”
- “institution_memberships mantiene una relación estable con active; no guarda el rol académico.”
- “course_memberships admite coordinator por curso; enrollments admite teacher, assistant y student por sección.”
- “Las FK a personas verifican la pareja institution_id y user_id contra institution_memberships. La actividad de la pertenencia se comprueba en la autorización.”
- “UUID es el identificador relacional y slug sirve a la URL. El modelo es lógico: todavía no hay migraciones ni ORM elegido.”

### Transición
“El mismo contexto institucional también debe conservarse al calcular una nota.”

### Tiempo estimado
75 segundos

### Fuentes
`../06-data-model.md`, identidad, courses, course_memberships, sections y enrollments; OpenAPI `components/schemas/tenancy.yaml`.

## Slide 10 — Modelo de datos: calificación consistente y trazable

### Objetivo
Entender cómo las relaciones y transacciones conservan el origen de una nota.

### Punteo para hablar
- “questions guarda las alternativas como JSONB. Alternative existe en el dominio, pero no es una tabla.”
- “quiz_attempts conserva estudiante, curso y sección históricos, incluso si cambian las inscripciones.”
- “grades referencia tanto grade_items como quiz_attempts. Las FK compuestas comprueban que quiz, estudiante, sección e Institution coincidan.”
- “El envío inmoviliza respuestas, califica, actualiza la nota no publicada y registra audit_events en una transacción.”
- “Publicar vuelve inmutable la nota y bloquea nuevos intentos. El promedio usa solo resultados publicados y se calcula en backend.”

### Transición
“Estas invariantes explican por qué construimos aislamiento antes de ampliar el flujo académico.”

### Tiempo estimado
75 segundos

### Fuentes
`../06-data-model.md`, questions, quiz_attempts, grade_items, grades, audit_events y transacciones; contrato OpenAPI.

## Slide 11 — Plan de desarrollo: aislamiento antes del flujo académico

### Objetivo
Reconocer el orden de implementación y lo que está pendiente.

### Punteo para hablar
- “La iteración 1 representa la base existente que debemos mantener desplegable.”
- “El próximo bloque elige persistencia, implementa identidad y contexto, y prueba UC contra UTFSM.”
- “Luego vienen cursos, roles y material, con markdown primero.”
- “JWT debe estar listo antes de habilitar los endpoints académicos. Después siguen quizzes, publicación y auditoría.”
- “Las iteraciones se sugieren semanales. No presentamos estas filas como fechas comprometidas ni inventamos responsables o estimaciones que aún no están asignados.”

### Transición
“El orden del plan responde a los riesgos que siguen abiertos.”

### Tiempo estimado
55 segundos

### Fuentes
`../08-work-plan.md`; `../10-status.md`; `../09-walking-skeleton-plan.md`.

## Slide 12 — Riesgos actuales y controles previstos

### Objetivo
Reconocer los riesgos vigentes sin confundir mitigaciones diseñadas con implementadas.

### Punteo para hablar
- “El riesgo de fuga combina una query sin scope con relaciones cruzadas. Aplicación y constraints se complementan.”
- “Una base compartida aumenta el radio de impacto operacional. Backup y PITR cubren la base completa.”
- “La auditoría debe entrar junto con las transacciones académicas.”
- “Railway ya tiene fallos de build registrados por directorios raíz ausentes y un despliegue posterior exitoso. Conservamos ambos en el anexo.”
- “La lista vigente no cuantifica probabilidades ni estados individuales. Storage y sobrealcance se controlan con markdown primero y el recorte del MVP.”

### Transición
“Veamos ahora la evidencia concreta de la base que ya funciona.”

### Tiempo estimado
50 segundos

### Fuentes
`../07-risks.md`; capturas `07-railway-backend-deploys.png`, `08-railway-frontend-deploys.png` y `09-railway-deploy-log.png`.

## Slide 13 — Walking skeleton: conexión real frontend–backend

### Objetivo
Demostrar integración HTTP usando captura real y código reproducible.

### Punteo para hablar
- Mostrar “Backend: ok (v0.1.0)” en la captura versionada del frontend Railway.
- “El servidor de Next usa API_URL para consultar GET /health; la petición no parte directamente del navegador.”
- “getHealth usa no-store y valida status, version y timestamp. Si falla, la página informa que no pudo conectar.”
- “El controlador Nest genera la respuesta real. No contiene datos académicos ni consulta PostgreSQL.”
- “Esto cumple la integración mínima; no demuestra todavía autenticación ni multi-tenancy ejecutable.”

### Transición
“CI y el despliegue sostienen esa integración cuando cambia el código.”

### Tiempo estimado
60 segundos

### Fuentes
Captura `images/02-frontend-portal.png`; `frontend/src/lib/api/health.ts`; `frontend/src/app/page.tsx`; `backend/src/platform/health/health.controller.ts`.

## Slide 14 — CI/CD: validación, despliegue y release

### Objetivo
Entender qué automatiza cada sistema y cuál es la evidencia disponible.

### Punteo para hablar
- “CI corre en PR hacia main/dev, push a main y ejecución manual.”
- “La matriz de checks ejecuta backend lint/test y frontend lint/build. Los Docker builds son otros dos jobs en paralelo; no forman una etapa serial posterior.”
- “Railway despliega desde main con Wait for CI según el documento de evidencia. El workflow de Actions no invoca un comando de deploy.”
- “Las capturas muestran cuatro jobs exitosos y un deployment backend exitoso. Los healthchecks versionados son / para frontend y /health para backend.”
- “Release es un flujo separado: el equipo crea y empuja un tag SemVer; Actions comprueba que el commit está en main y genera la release. Existe evidencia histórica de v0.1.0.”

### Transición
“Con esa evidencia podemos cerrar distinguiendo lo listo de la siguiente construcción.”

### Tiempo estimado
65 segundos

### Fuentes
`.github/workflows/ci.yml`; `.github/workflows/release.yml`; `backend/railway.json`; `frontend/railway.json`; `../11-cicd-evidence/README.md` y capturas originales.

## Slide 15 — Estado al cierre de Elaboración

### Objetivo
Cerrar con una conclusión verificable y el próximo incremento.

### Punteo para hablar
- “Está listo el diseño documentado: casos de uso, arquitectura, dominio y modelo lógico de datos.”
- “La base tiene frontend/backend conectados, Docker, CI, despliegues y release con evidencia.”
- “Construcción empieza por seleccionar la persistencia, conectarla y demostrar aislamiento UC/UTFSM.”
- “JWT y el flujo académico siguen pendientes. Los anexos respaldan las preguntas técnicas.”

### Transición
“Abrimos las preguntas; podemos profundizar en relaciones, permisos o evidencia.”

### Tiempo estimado
35 segundos

### Fuentes
`../10-status.md`; `../08-work-plan.md`.
