# Guia de estudio presentacion AcademiX

## Idea central

AcademiX es un LMS universitario multi-tenant enfocado en integrar el flujo academico critico:

```txt
curso -> modulos -> material -> evaluaciones -> entregas -> correccion -> notas -> libro de notas
```

El punto no es competir con Canvas o Moodle por cantidad de funciones. El punto es reducir la fragmentacion entre LMS, planillas, correos, carpetas y calendarios externos.

Frase corta:

> AcademiX centraliza el flujo academico critico de un curso, dando claridad al estudiante, control al cuerpo docente y aislamiento de datos a cada institucion.

## Mapa completo de la presentacion

### Parte 1: problema, valor y usuarios

Lo que debes entender:

- El problema es la fragmentacion del trabajo academico.
- El estudiante no ve rapido que estudiar, que entregar y que notas salieron.
- El docente suele manejar ponderaciones, notas y publicacion fuera del LMS.
- La institucion necesita seguridad, continuidad y separacion entre universidades.

Argumento:

> La necesidad no nace de que falten botones en los LMS actuales, sino de que el flujo completo del curso no siempre queda integrado en una sola plataforma.

### Parte 2: necesidades y procesos

Lo que debes entender:

- Las necesidades principales son dashboard, cuerpo docente visible, material organizado, evaluaciones trazables, notas transparentes y aislamiento institucional.
- El estudiante debe poder consultar actividad, entregar y ver notas liberadas.
- La entrega solo se confirma cuando archivo y metadatos quedan persistidos.
- La correccion queda oculta hasta que el docente decide liberar la nota.

Argumento:

> El sistema no solo guarda informacion; modela el ciclo academico con estados claros: pendiente, entregado, corregido y publicado.

### Parte 3: riesgos, alcance y decisiones tecnicas

Lo que debes entender:

- El mayor riesgo de producto es el sobrealcance.
- El mayor riesgo tecnico es mezclar datos entre tenants.
- Por eso se priorizan fundaciones: cursos, secciones, participantes, evaluaciones y calificaciones.
- IA, video, chats, calendario avanzado y correo quedan condicionados.
- El stack elegido es Next.js, NestJS modular, PostgreSQL, Docker y GCP.

Argumento:

> Se prioriza construir primero el nucleo academico demostrable. Las extensiones entran solo si el core ya esta validado.

## Tu parte: arquitectura, maquetas, plan y cierre

### Diapositiva 13: arquitectura

Mensaje principal:

> La arquitectura busca resolver dos cosas desde el inicio: separar bien los datos por institucion y soportar el flujo academico sin sobrecomplicar el primer MVP.

Guion sugerido:

> En esta primera version usamos una arquitectura simple pero preparada para crecer. Los usuarios entran por el frontend en Next.js, que consume un backend NestJS organizado como monolito modular. El backend autentica, resuelve el tenant y consulta el Tenant Registry para saber a que base de datos corresponde cada universidad.
>
> La decision importante es que cada tenant, es decir cada universidad, tiene su propia base PostgreSQL. Eso reduce el riesgo de mezcla de datos y permite backups o restores por institucion. Los archivos, como materiales y entregas, no se guardan directamente en la base, sino en Cloud Storage.
>
> El resto de componentes se incorporan solo cuando haya necesidad real: balanceador si hay varias replicas, PgBouncer si las conexiones presionan la base, y Redis con workers si aparecen tareas pesadas como procesamiento de archivos, recalculo de promedios o notificaciones.

Frase clave:

> Monolito modular primero; tenant aislado desde el inicio.

### Diapositiva 14: maquetas

Mensaje principal:

> Las maquetas muestran que el alcance no es abstracto: ya esta aterrizado en vistas concretas para estudiante y docente.

Guion sugerido:

> Estas primeras maquetas validan los flujos principales. El dashboard del estudiante concentra cursos, pendientes y actividad reciente. La vista de evaluaciones permite entender que hay que entregar, en que estado esta y cual es la fecha limite. El libro de notas docente concentra evaluaciones, ponderaciones, correccion y publicacion.
>
> No buscamos explicar cada boton, sino mostrar que las historias de usuario principales ya tienen una forma concreta: el estudiante gana claridad y el docente gana control sobre evaluaciones y notas.

Frase clave:

> Las maquetas validan el flujo antes de programar.

### Diapositiva 15: plan de 12 semanas

Mensaje principal:

> El roadmap reduce riesgo porque construye primero la base multi-tenant y luego el ciclo academico.

Guion sugerido:

> El plan esta ordenado en 12 iteraciones semanales. Primero se construyen las bases: monorepo, autenticacion, resolucion de tenant, usuarios y roles. Luego vienen cursos, secciones, participantes y material. Despues se implementa el ciclo de evaluaciones: crear tareas, recibir entregas, corregir y liberar notas.
>
> En las semanas 8 y 9 se consolida el libro de notas, promedios, auditoria, dashboard y anuncios. Hacia el final se trabaja el despliegue en GCP, observabilidad, permisos y pruebas de los flujos criticos. Las extensiones entran solo si el avance del core lo permite.

Frase clave:

> Primero fundaciones, despues extensiones.

### Diapositiva 16: cierre

Mensaje principal:

> AcademiX integra el flujo academico critico con foco en claridad, control y aislamiento.

Guion sugerido:

> En resumen, AcademiX propone un LMS universitario multi-tenant enfocado en el ciclo academico esencial. Para el estudiante, entrega claridad sobre cursos, pendientes, entregas y notas. Para el cuerpo docente, entrega control sobre evaluaciones, correccion, ponderaciones y publicacion. Para la institucion, entrega aislamiento de datos por universidad y una arquitectura que puede crecer sin partir sobrediseniada.
>
> Por eso el proyecto se construye con fundaciones primero: cursos, secciones, participantes, evaluaciones y calificaciones. Luego, segun avance, pueden entrar extensiones como calendario, IA, videos o chats.

Frase final:

> La propuesta es partir simple, pero con las decisiones importantes tomadas desde el inicio.

## Preguntas probables y respuestas

### Por que no microservicios desde el inicio?

Porque para un semestre agregan complejidad operacional sin ser necesarios para validar el flujo academico. Un monolito modular permite separar dominios internamente y moverse rapido. Si algun modulo luego necesita escalar o desplegarse aparte, se puede extraer con mas evidencia.

### Como evitan mezclar datos entre universidades?

Cada request resuelve el tenant mediante el Tenant Registry y opera contra la base correspondiente. Ademas, los permisos se validan por TenantMembership y CourseMembership. La separacion por base de datos reduce el riesgo de acceso cruzado.

### Que significa que el tenant sea el shard?

Que la particion principal de datos es la universidad. Cada tenant tiene su propia base PostgreSQL, por lo que una universidad puede escalar, respaldarse o restaurarse sin afectar a las otras.

### Por que guardar archivos en Cloud Storage y no en PostgreSQL?

Porque PDFs, presentaciones y entregas son binarios. PostgreSQL guarda mejor los datos transaccionales y metadatos; object storage esta hecho para archivos grandes y recuperables.

### Por que Redis y workers estan "en veremos"?

Porque no son necesarios para el primer flujo si el procesamiento puede ser sincronico. Entran cuando una historia los justifique: procesamiento pesado de archivos, recalculo de promedios o notificaciones.

### Que pasa si muchos estudiantes entregan al mismo tiempo?

El backend es stateless, por lo que puede escalar con replicas. Los archivos van a object storage, y si el procesamiento bloquea la request se mueve a workers. Ademas, se puede usar connection pool si PostgreSQL queda presionado.

### Como se asegura la trazabilidad de notas?

Con auditoria de cambios relevantes: actor, fecha, accion, valor anterior y valor nuevo en notas, ponderaciones, entregas y liberaciones.

### Que pasa si falla una subida de entrega?

La entrega solo queda confirmada cuando archivo y metadatos fueron persistidos. Si falla, se muestra un error recuperable y se permite reintento, sin crear una entrega o nota invalida.

### Por que no incluir IA desde el inicio?

Porque distrae del core academico y puede traer costo variable. La IA queda como extension posterior, acotada al material publicado o documento abierto, idealmente con citas verificables.

### Cual es el MVP real?

El MVP real es que una universidad aislada tenga cursos, secciones, participantes, material, evaluaciones, entregas, correccion, liberacion de notas, libro de notas y dashboard basico.

## Conceptos que debes decir con seguridad

- Multi-tenant: varias universidades usan la plataforma, pero cada una opera aislada.
- Tenant Registry: componente central que resuelve que base corresponde a cada universidad.
- Monolito modular: una aplicacion backend unica, separada internamente por dominios.
- Stateless: frontend y backend no dependen de estado local de una instancia, por eso pueden replicarse.
- Object storage: almacenamiento de archivos fuera de la base relacional.
- Auditoria: historial de cambios importantes para reconstruir que paso.
- Liberacion manual: una nota corregida no se publica automaticamente al estudiante.

## Mini pitch de 30 segundos

AcademiX es un LMS universitario multi-tenant que busca integrar el flujo academico critico de un curso: material, evaluaciones, entregas, correccion y notas. La propuesta prioriza claridad para estudiantes, control para docentes y aislamiento para cada institucion. Tecnologicamente parte con Next.js, NestJS modular y PostgreSQL por tenant, evitando microservicios y componentes innecesarios hasta que una historia concreta los justifique.

## Version corta de tu parte

> Nuestra arquitectura parte simple, pero con las decisiones criticas resueltas. Usamos Next.js para el frontend y NestJS como monolito modular para mantener velocidad de desarrollo. El backend resuelve el tenant en cada request y usa un Tenant Registry para dirigir la operacion a la base PostgreSQL de la universidad correspondiente. Los archivos van a Cloud Storage, no a la base.
>
> Las maquetas aterrizan los flujos principales: dashboard de estudiante, evaluaciones y libro de notas docente. El plan de 12 semanas prioriza primero tenancy, cursos y roles; luego material, evaluaciones, entregas, correccion y notas; y al final despliegue, pruebas y ajustes. El cierre es que AcademiX no intenta ser un LMS gigante desde el dia uno: se enfoca en integrar bien el flujo academico esencial.
