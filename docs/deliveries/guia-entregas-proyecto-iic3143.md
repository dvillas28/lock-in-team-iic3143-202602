# Contexto de las entregas del proyecto — IIC3143 Desarrollo de Software

Fuente: “01b-Proyecto (miercoles 12 de agosto).pptx”, 85 diapositivas, Gonzalo Martínez. Las referencias “d.” indican números de diapositiva. Este documento resume lo que el PPT pide para cada entrega; no describe el proyecto concreto de un equipo ni reemplaza las indicaciones posteriores del curso.

## Panorama general

El proyecto se desarrolla en cuatro entregas: E1 Inception (Design Doc), E2 Elaboration (Walking Skeleton), E3 Development y E4 MVP. E1 define el problema y una visión inicial; E2 refina el diseño y establece una base técnica mínima; E3 muestra el avance real y la capacidad de terminar; E4 presenta el producto comprometido funcionando (d. 5, 7).

El equipo puede escoger tecnologías y herramientas, pero debe justificar sus decisiones. Puede gestionar el trabajo con Trello, Jira Cloud u otra plataforma. Todos los repositorios deben compartirse en GitHub con el usuario gmartinezramirez (d. 4, 8).

Se espera mostrar el producto funcionando en producción mediante un proveedor cloud. El PPT señala que no hace falta gastar dinero ni usar tarjeta de crédito y menciona alternativas gratuitas. Si no es posible llegar a producción, hay que avisar al profesor cuanto antes; E3 es la última oportunidad indicada para plantearlo (d. 8). El material de semestres anteriores sirve solo de referencia: puede contener errores y los requisitos cambian (d. 9).

El PPT no incluye fechas exactas de entrega. Indica que el orden de las presentaciones se sorteará una vez inscritos los equipos (d. 7).

## E1 — Inception / Design Doc

### Propósito

Establecer qué problema se resolverá, por qué importa y cómo podría ayudar el software. La visión del producto todavía es aproximada y debe centrarse en el problema, con suficiente flexibilidad para cambiar durante el proyecto (d. 7, 20–21). Una declaración breve de visión puede expresar grupo objetivo, necesidades, características principales del producto o servicio y valor esperado (d. 22).

### Contenido esperado

La entrega presenta la introducción y el contexto, el problema o motivación y el valor de negocio. Identifica a los interesados y posibles usuarios, resume sus necesidades y describe la solución propuesta, sus rasgos, beneficios y suposiciones. También explica el modelo de proceso o enfoque metodológico elegido y los riesgos que pueden afectar tanto al desarrollo como al funcionamiento del producto o negocio (d. 13–16, 23–24).

El detalle de la solución incluye requisitos funcionales y el beneficio que cada uno aporta, restricciones, requisitos no funcionales, tecnologías justificadas, una primera versión de la arquitectura y primeras maquetas de las vistas. El plan de trabajo distribuye actividades por semana o iteración y contempla tanto funcionalidades como tareas de análisis, arquitectura, proceso y deuda técnica. Debe aclarar la duración de las iteraciones y qué se espera completar en cada una. El documento incorpora un glosario de términos del dominio y los anexos pertinentes (d. 14, 24).

### Material y evaluación

Se pide una presentación enviada en PDF y un informe de máximo cinco páginas basado en un template que se menciona, pero que no está incluido en este PPT (d. 18). Las d. 13–14 describen 10 minutos de presentación y 5–10 de preguntas; la d. 18 habla de un resumen de 15 minutos máximo. Conviene confirmar cuál límite rige.

La pauta de E1 promedia cuatro dimensiones por evaluador: razón y justificación, interlocutores, necesidades y requisitos; después se promedian las notas de tres evaluadores (d. 17). La nota individual indicada combina 90 % del trabajo evaluado y 10 % de evaluación de pares (d. 3, 25).

## E2 — Elaboration / Walking Skeleton

### Propósito

Refinar los requisitos y el diseño, reducir riesgos y demostrar una base técnica mínima sobre la cual construir el producto (d. 7, 29–30, 39). No se espera una aplicación completa: la d. 34 dice expresamente que en esta entrega no se evalúa eso.

### Contenido esperado

Los casos de uso relevantes deben actualizarse y documentarse con detalle suficiente para incorporarlos al plan. Para cada caso importante, el PPT propone identificador y nombre, meta o descripción, actores, interesados, precondiciones y poscondiciones, disparador, flujo básico y flujos alternativos pertinentes. La documentación puede comenzar con un contexto funcional y, opcionalmente, un diagrama UML de casos de uso; debe incluir una sección de requisitos no funcionales (d. 40–44).

Se presenta una arquitectura refinada con explicación del contexto, posibles restricciones y un diagrama adecuado al proyecto; un modelo de dominio con conceptos y relaciones importantes; y un modelo de datos (d. 29, 41, 48, 50). El PPT no espera un diseño completamente detallado, sino una idea clara de cómo se implementará la solución (d. 47).

El plan de desarrollo actualizado muestra hitos, calendario e iteraciones, prioridades, estimaciones, responsables y tareas que no corresponden directamente a funcionalidades. Las estimaciones de casos de uso deben considerar codificación, pruebas y correcciones. Los riesgos se actualizan con mitigaciones en ejecución, contingencias, riesgos materializados y cambios de probabilidad o impacto cuando corresponda. La entrega explica qué está completo, qué falta y cómo se atendió el feedback de E1 (d. 29, 52–56).

Los aspectos repetidos de E1 —por ejemplo, arquitectura, riesgos o plan— deben mostrarse corregidos si recibieron observaciones. Si no hubo observaciones, el PPT indica dejarlos en un anexo y no volver a presentarlos oralmente (d. 29, 31).

### Walking Skeleton y evidencia técnica

Deben existir repositorios, un “Hello World” de frontend conectado al backend y CI básico para ambos, con etapas definidas. Se pide evidencia mediante capturas, GIF o demo, junto con tag y release en GitHub. El despliegue continuo a producción se plantea “en lo posible”; si no se automatiza, hay que explicar por qué y efectuarlo manualmente (d. 29–30).

### Material y evaluación

El PPT es obligatorio; el informe PDF es opcional. También se pide una planilla de estimaciones y plan de trabajo, cuyas tablas pueden ir dentro del PPT, del informe o en un archivo aparte (d. 36–37). La exposición dura 10–15 minutos más 5–10 minutos de preguntas (d. 33).

La pauta pondera casos de uso y requisitos (0,50), arquitectura (0,75), modelo de dominio (0,75), modelo de datos (2,00), riesgos (0,50), plan de desarrollo (0,50) y CI/CD del Walking Skeleton (1,00), más un punto base (d. 31). La nota individual indicada combina 80 % del trabajo y 20 % de evaluación de pares (d. 3, 32). La d. 57 menciona un descuento de un punto por cada dos horas de atraso; su aplicación debe confirmarse con el curso.

## E3 — Development

### Propósito

Mostrar el estado real del desarrollo y explicar, con evidencia objetiva, cómo ha trabajado el equipo, cómo asegura la calidad y si alcanzará a completar lo prometido (d. 60, 63). La d. 72 advierte que en la entrega siguiente se exigirá lo comprometido.

### Contenido esperado

La entrega describe el ciclo de desarrollo y las prácticas usadas, los beneficios que aportaron, las prácticas abandonadas y las decisiones tomadas. Se espera evidencia concreta del proceso: tablero, pull requests, revisiones, merges, documentación, diagramas o ADR cuando correspondan. También se explica el manejo de deuda técnica y bugs, las condiciones para que una tarjeta cambie de estado o quede terminada y la estrategia de testing en backend y frontend, incluida la cobertura actual y la meta que el equipo considera razonable (d. 63–64, 70).

Debe mostrarse el estado y la calidad del código, los defectos conocidos, la estabilidad del entorno de desarrollo y el pipeline de CI/CD con sus etapas. El PPT pide capturas y sugiere mostrarlo en vivo (d. 67, 70).

El análisis de avance debe apoyarse en medidas objetivas y responder si el equipo alcanzará a terminar. Entre los ejemplos del PPT están lead time, touch time, eficiencia, tarjetas terminadas frente al backlog, tipos de tarjetas, spikes, tiempo por tarjeta, tiempo disponible e invertido, burnup y burndown. Se espera interpretar las métricas y hacer una proyección, no solo listarlas (d. 65–66).

El plan actualizado compara trabajo completo y pendiente, explica cambios y decisiones y fija el camino hacia el MVP. Si el alcance comprometido ya no es realista, el equipo debe justificarlo con datos, repriorizar y replantear el trabajo en esta entrega. También se muestra una demo breve del software funcionando, ya sea localmente o en producción (d. 68–73).

### Material y evaluación

El PPT es obligatorio; el informe PDF es opcional. Se pide además la planilla de estimaciones y plan, integrada en la presentación o informe o enviada por separado (d. 74–75). La d. 61 indica aproximadamente 20 minutos de presentación y demo, más 10–15 minutos de preguntas.

La pauta considera proceso de desarrollo, métricas objetivas, prácticas y estado del código, CI/CD y tests, plan y avances, y demo/revisión del repositorio: un punto por dimensión más un punto base (d. 61). La nota individual indicada combina 70 % del trabajo y 30 % de evaluación de pares (d. 3, 62).

## E4 — MVP final

### Propósito

Entregar el MVP terminado y demostrar en vivo todas las funcionalidades o casos de uso comprometidos. Además del producto, la entrega debe cerrar el proyecto con una revisión técnica y una reflexión objetiva sobre el proceso (d. 7, 78–80).

### Contenido esperado

La presentación incluye arquitectura final y modelo de datos en una o dos diapositivas, dejando diagramas de proceso corregidos en anexos. Dedica una o dos diapositivas a prácticas, tests, calidad y estado del código; una o dos al plan final, con lo completado, lo pendiente y las decisiones tomadas; y una o dos a un análisis retrospectivo del trabajo (d. 78).

La retrospectiva debe explicar aciertos, errores, decisiones que no repetirían y aprendizajes concretos de ingeniería, relacionados con sus efectos en el proyecto. El PPT rechaza conclusiones genéricas y recomienda hacer una reunión de retrospectiva final (d. 80). La demo en vivo cubre todas las funcionalidades comprometidas. Se entrega también todo el material producido durante el curso con las correcciones y el feedback incorporados (d. 78–79).

### Material y evaluación

Se envía una presentación en PPT o PDF el mismo día de la exposición, incluso al momento de presentar (d. 84). La duración aproximada indicada es 30 minutos (d. 81).

La pauta de la presentación asigna arquitectura (0,25), prácticas/calidad/estado del código (0,50), plan de trabajo (0,25), conclusión del proceso (2,00) y demo/revisión del repositorio (3,00), más un punto base (d. 81).

**Hay una contradicción en el PPT sobre la ponderación individual de E4:** las d. 3 y 82 señalan 50 % trabajo evaluado + 50 % evaluación de pares; una tabla incrustada en la d. 81 señala 40 % presentación + 60 % promedio de evaluación de pares. La fórmula vigente requiere confirmación del profesor.

## Contexto de evaluación del curso

La d. 3 expresa la nota final como 0,05·Control + 0,20·Interrogación + 0,25·Examen + 0,05·E1 + 0,10·E2 + 0,15·E3 + 0,20·E4: 50 % evaluaciones y 50 % proyecto. Indica examen obligatorio y condiciones de aprobación: promedio de Control/Interrogación/Examen de al menos 4,0; trabajo de E4 de al menos 5,0; y promedio de evaluaciones de pares de todas las entregas de al menos 5,0. La evaluación de pares se realiza por formulario y califica a los compañeros de 1 a 7; la nota que uno se asigna a sí mismo no tiene efecto (d. 83).

Los ejemplos y capturas del PPT son ilustrativos. Para usar este documento como contexto de Codex, hay que complementarlo con la descripción y los artefactos reales del proyecto del equipo. Las fechas, el template de E1 y las contradicciones de tiempo o ponderación deben confirmarse con las comunicaciones oficiales del curso.
