# Design Doc Entrega 1

## 1. Introduccion Y Contexto

Las universidades utilizan plataformas LMS para centralizar cursos, material academico, evaluaciones, entregas y comunicacion. Sin embargo, en la practica, muchas actividades clave terminan distribuidas entre multiples herramientas: LMS institucional, hojas de calculo, correos, calendarios externos y carpetas de archivos.

Este proyecto propone un LMS universitario multi-tenant, orientado a instituciones de educacion superior, con foco en integrar el flujo academico critico de un curso semestral.

## 2. Problema Y Motivacion

Las plataformas LMS genericas suelen cubrir una gran cantidad de casos, pero no siempre optimizan los flujos mas frecuentes para estudiantes, docentes y ayudantes.

Problemas observados:

- Dificultad para visualizar rapidamente que estudiar, que entregar y que notas han sido publicadas.
- Gestion de notas y ponderaciones fuera de la plataforma, usualmente en planillas externas.
- Material academico almacenado como archivos pasivos, sin integracion clara con evaluaciones.
- Experiencia fragmentada entre modulos, tareas, entregas, correccion y libro de notas.
- Riesgo de indisponibilidad en momentos criticos, como cierres de tareas o pruebas.
- Necesidad institucional de aislar datos y escalar por universidad.

## 3. Vision Del Proyecto

Para universidades que necesitan administrar cursos semestrales de forma clara, escalable y segura, nuestra plataforma es un LMS multi-tenant que integra cursos, secciones, material academico, evaluaciones, entregas y libro de notas en un flujo unico.

A diferencia de plataformas LMS genericas, prioriza la experiencia academica critica y una arquitectura preparada para aislar y escalar instituciones completas.

La experiencia debe estar centralizada: estudiantes y cuerpo docente deben poder resolver dentro de la plataforma los flujos principales relacionados con un curso. En particular, el estudiante debe comprender sus calificaciones y avance, mientras el cuerpo docente debe poder configurar y calcular calificaciones sin recurrir a planillas externas.

## 4. Grupo Objetivo

El producto esta dirigido a instituciones de educacion superior, especialmente universidades que administran multiples cursos, docentes, ayudantes y estudiantes por periodo academico.

Compradores o responsables posibles:

- Universidades.
- Facultades.
- Departamentos academicos.
- Direcciones de docencia o tecnologia educativa.

Usuarios directos:

- Estudiantes.
- Docentes.
- Ayudantes docentes.
- Administradores institucionales.

## 5. Interesados Y Usuarios

### Interesados

- Universidad: requiere continuidad operacional, seguridad, escalabilidad y control institucional.
- Departamento academico: necesita administrar cursos, secciones, docentes y estudiantes.
- Equipo docente: necesita organizar material, evaluaciones, correccion y notas.
- Estudiantes: necesitan claridad sobre su avance academico, entregas pendientes y notas.
- Equipo tecnico: necesita una arquitectura mantenible, observable y desplegable.

### Usuarios

- Administrador tenant: gestiona usuarios, cursos, periodos academicos e inscripciones dentro de una universidad.
- Docente: configura cursos, material, evaluaciones, ponderaciones y liberacion de notas.
- Ayudante docente: apoya en correccion, gestion de material, anuncios y recorrecciones segun permisos.
- Estudiante: revisa cursos, consume material, entrega evaluaciones y consulta notas liberadas.

## 6. Descripcion Del Producto

La solucion es un LMS multi-tenant centrado en cursos universitarios semestrales. Cada universidad opera como un tenant aislado, con sus propios usuarios, cursos, archivos, evaluaciones y datos academicos.

El flujo principal es:

```txt
Curso -> Modulos -> Material -> Evaluaciones -> Entregas -> Correccion -> Publicacion de notas -> Libro de notas
```

### Valor De Negocio

La plataforma entrega valor al integrar en un solo lugar el flujo academico completo de un curso: administracion de estudiantes, publicacion de material, evaluaciones, entregas, correccion, calculo de calificaciones y publicacion de notas.

Hoy ese flujo suele fragmentarse entre LMS institucionales, planillas, carpetas, correos y procesos manuales. Esa fragmentacion aumenta el trabajo artesanal del cuerpo docente, dificulta la trazabilidad de notas y hace que los estudiantes no siempre tengan claridad sobre su avance.

El valor principal del producto es reducir esa carga operativa y manual, especialmente la dependencia de planillas externas y cargas duplicadas, consolidando el flujo critico del curso dentro de una plataforma institucional, auditable y multi-tenant.

### Rasgos Y Beneficios

- Curso integrado: centraliza modulos, material, evaluaciones, entregas y notas.
- Libro de notas: reduce dependencia de planillas externas.
- Cuerpo docente visible: permite identificar docentes y ayudantes responsables de cada seccion.
- Publicacion controlada: el docente decide cuando liberar notas.
- Roles contextuales: un usuario puede tener distintos roles segun curso o universidad.
- Multi-tenancy: permite aislar y escalar instituciones.
- Arquitectura escalable: parte con frontend, backend, tenant resolver, PostgreSQL por tenant y object storage; incorpora load balancing, connection pooling, cache o workers cuando la carga lo justifique.

### Suposiciones

- El sistema se orienta inicialmente a universidades.
- El tenant corresponde a una universidad.
- Cada curso corresponde a un ramo semestral concreto.
- Los usuarios deben estar autenticados.
- El idioma principal sera espanol.
- El MVP no busca reemplazar todas las funcionalidades de Canvas.
- La IA se considera funcionalidad experimental posterior al core.

### Supuestos De Escala Inicial

Estos supuestos se usan para orientar arquitectura y requisitos no funcionales. No implican que el primer MVP deba demostrar toda la escala en produccion.

- La plataforma debe poder proyectarse a 5 universidades.
- Cada universidad puede tener hasta 30.000 estudiantes, para un total potencial de 150.000 estudiantes.
- La carga normal se distribuye entre cursos, secciones, material, evaluaciones, entregas y consultas de notas.
- La carga critica ocurre cerca de ventanas de evaluacion, entregas y publicacion de notas.
- En una ventana critica pueden existir spikes aproximados de 1.000 estudiantes concurrentes consultando una evaluacion, subiendo entregas o revisando resultados.
- Los archivos principales del MVP son PDFs, presentaciones, links y entregas de estudiantes. Videos e IA se mantienen como extensiones condicionadas.
- El diseno debe priorizar aislamiento por tenant, autorizacion contextual y continuidad del flujo academico sobre funcionalidades accesorias.

## 7. Modelo De Proceso

Se propone un modelo iterativo liviano, tipo Scrum/Kanban hibrido, con iteraciones semanales.

Este enfoque permite:

- Priorizar riesgos tecnicos temprano.
- Ajustar alcance segun avance real.
- Entregar incrementos funcionales cada semana.
- Mantener visibilidad del backlog.
- Evitar sobrealcance.

## 8. Detalle De La Solucion Propuesta

### Requisitos Funcionales Principales

- Gestionar universidades como tenants aislados.
- Autenticar usuarios.
- Administrar roles por tenant y por curso.
- Crear periodos academicos.
- Crear cursos semestrales y secciones.
- Inscribir estudiantes, docentes y ayudantes.
- Mostrar a cada estudiante los docentes y ayudantes responsables de su seccion.
- Crear modulos de curso.
- Subir y publicar material academico.
- Crear evaluaciones/tareas con fechas, puntajes y ponderaciones.
- Permitir entregas de estudiantes.
- Corregir entregas y registrar comentarios.
- Calcular calificaciones y promedios segun ponderaciones configuradas.
- Liberar notas manualmente.
- Visualizar libro de notas.
- Mostrar dashboard de cursos, pendientes y anuncios.

### Restricciones

- Proyecto desarrollado durante un semestre academico, con construccion efectiva estimada de 10 a 12 semanas.
- Despliegue publico usando servicios cloud y free tiers cuando sea posible.
- MVP acotado al core academico.
- Integraciones externas complejas quedan fuera del alcance inicial.
- Video, resumen mediante IA, chats, calendario y alertas son extensiones condicionadas al avance.
- Las alertas por correo y el modelo de grupos de estudiantes quedan fuera de la base inicial.

### Requisitos No Funcionales Principales

- Disponibilidad en fechas criticas.
- Escalabilidad horizontal.
- Aislamiento de datos entre tenants.
- Seguridad mediante autenticacion y autorizacion contextual.
- Auditabilidad de cambios academicos relevantes.
- Rendimiento en dashboards y vistas de curso.
- Mantenibilidad mediante monolito modular.
- Persistencia de archivos fuera de la base de datos relacional.
- Recuperabilidad mediante backups por tenant.
- Observabilidad con logs y metricas basicas.

### Tecnologias Tentativas

Estas tecnologias forman la propuesta inicial. Su incorporacion definitiva debe validarse en el plan tecnico o en ADRs cuando el proyecto pase de documentacion a implementacion.

| Tecnologia | Uso | Justificacion | Riesgo / Mitigacion |
| --- | --- | --- | --- |
| Next.js | Frontend web | Permite construir dashboards, vistas de curso, material, evaluaciones y libro de notas con rutas claras, componentes reutilizables y buen soporte TypeScript. Facilita despliegue web y una experiencia fluida para estudiantes y cuerpo docente. | Puede mezclar responsabilidades de frontend y backend si se usa como fullstack. Mitigacion: usarlo como cliente web principal que consume una API backend. |
| NestJS | Backend API | Encaja con un monolito modular organizado por dominios como Auth, Tenancy, Courses, Materials, Assignments, Submissions y Grades. Usa TypeScript igual que el frontend y entrega estructura para controladores, servicios, guards y validacion. | Puede agregar ceremonia innecesaria si se sobredimensiona. Mitigacion: mantener modulos acotados al flujo academico actual y evitar microservicios. |
| PostgreSQL | Datos relacionales | El dominio academico requiere relaciones consistentes entre tenants, usuarios, cursos, secciones, entregas, notas y auditoria. PostgreSQL permite restricciones, transacciones y consultas confiables para registros academicos. | La estrategia multi-tenant aumenta complejidad operacional. Mitigacion: documentar tenancy, migraciones y backups antes de implementar. |
| Object storage compatible con S3 | Material y entregas | PDFs, presentaciones, videos y entregas no deben guardarse como binarios en la base relacional. La base mantiene metadatos y referencias; los archivos viven en almacenamiento especializado. | Requiere permisos por tenant, curso y recurso. Mitigacion: asociar cada objeto a metadatos de tenant y validar acceso desde backend. |
| PgBouncer o pool de conexiones | Acceso a base de datos | Reduce riesgo de saturar PostgreSQL cuando existan multiples tenants y usuarios concurrentes en fechas criticas. | Puede ser prematuro en desarrollo local. Mitigacion: dejarlo como decision de despliegue, no como dependencia para el primer prototipo. |
| Redis | Cache, sesiones o trabajos asincronicos | Puede ayudar en dashboards frecuentes, sesiones o colas de tareas que no deben bloquear requests. | No es parte obligatoria del MVP. Mitigacion: incorporarlo solo si un plan justifica cache, colas o sesiones externas. |
| Workers | Procesos fuera del request principal | Sirven para previews, procesamiento de archivos, notificaciones o recalculos cuando esas tareas superen el tiempo aceptable de una request. | Agregan complejidad operacional. Mitigacion: partir sin workers y habilitarlos solo para tareas lentas identificadas. |
| Docker | Entorno reproducible | Facilita alinear desarrollo local, CI y despliegue entre integrantes del equipo. | Puede sumar configuracion innecesaria si se usa antes de elegir stack final. Mitigacion: crear configuracion minima cuando existan servicios reales. |
| Cloud free tier | Despliegue publico | Permite demostrar el producto con URL publica y costos controlados durante el semestre. | Los limites gratuitos pueden afectar disponibilidad o rendimiento. Mitigacion: explicitar limites y priorizar demo estable sobre escala artificial. |

## 9. Arquitectura Inicial

```txt
Cliente Web
-> Next.js Frontend
-> NestJS Backend Modular
-> Tenant Resolver
-> PostgreSQL por tenant
-> Object Storage para archivos
```

Componentes condicionados por carga o despliegue:

```txt
Load Balancer
Reverse Proxy / API Gateway
Connection Pool por tenant
Redis para cache/jobs
Workers asincronicos
```

El monolito modular permite avanzar rapido sin introducir la complejidad operacional de microservicios. La arquitectura considera separacion por modulos, almacenamiento externo y escalamiento horizontal. Cache, colas, workers y balanceo se incorporan cuando los supuestos de carga, despliegue o procesamiento de archivos los justifiquen.

## 10. Riesgos

- Sobrealcance funcional: mitigado al limitar el MVP al core de cursos, material, evaluaciones, entregas y notas.
- Grupos de estudiantes: mitigado al mantener entregas individuales hasta especificar membresias, permisos y autoria grupal.
- Complejidad multi-tenant: mitigada con un registry central y esquemas homogeneos por tenant.
- Crecimiento de archivos: mitigado usando object storage.
- Carga en fechas criticas: mitigada primero con consultas eficientes y escalamiento horizontal; load balancer, connection pool, cache y workers se incorporan cuando el plan tecnico los justifique.
- IA demasiado costosa: mitigada dejandola como funcionalidad experimental despues del core.
- Competencia con LMS existentes: mitigada al enfocar la propuesta en experiencia integrada y arquitectura institucional.

## 11. Plan De Trabajo

El plan tentativo considera 10 a 12 semanas de trabajo efectivo.

Resumen:

- Semanas 1-2: vision, arquitectura, setup, autenticacion y tenancy.
- Semanas 3-4: cursos, periodos, secciones, inscripciones, modulos y material.
- Semanas 5-7: evaluaciones, entregas, correccion y notas.
- Semanas 8-9: dashboard, libro de notas, anuncios, calendario interno o recorrecciones.
- Semanas 10-11: infraestructura, despliegue, permisos, auditoria y observabilidad.
- Semana 12: demo final, documentacion y presentacion.

## 12. Mockups Iniciales Sugeridos

- Dashboard estudiante.
- Inicio de curso.
- Modulos y material.
- Evaluaciones y entregas.
- Libro de notas docente.
- Vista de notas estudiante.
- Admin tenant/cursos.
- Diagrama de arquitectura cloud.

## 13. Glosario

Ver [glosario](glossary.md).

## 14. Anexos

- [Alcance del producto](scope.md)
- [Requisitos](requirements.md)
- [Historias de usuario](user-stories.md)
- [Arquitectura](architecture.md)
- [Roadmap](roadmap.md)
- [Checklist Entrega 1](checklist.md)
