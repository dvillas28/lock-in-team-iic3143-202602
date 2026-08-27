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

Para universidades que necesitan administrar cursos semestrales de forma clara, escalable y segura, nuestra plataforma es un LMS multi-tenant que integra material academico, evaluaciones, entregas y libro de notas en un flujo unico.

A diferencia de plataformas LMS genericas, prioriza la experiencia academica critica y una arquitectura preparada para aislar y escalar instituciones completas.

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
Curso -> Modulos -> Material -> Evaluaciones -> Entregas -> Correccion -> Publicacion de notas -> Libro de clases
```

### Rasgos Y Beneficios

- Curso integrado: centraliza modulos, material, evaluaciones, entregas y notas.
- Libro de notas: reduce dependencia de planillas externas.
- Publicacion controlada: el docente decide cuando liberar notas.
- Roles contextuales: un usuario puede tener distintos roles segun curso o universidad.
- Multi-tenancy: permite aislar y escalar instituciones.
- Arquitectura escalable: considera load balancing, connection pooling, object storage y procesamiento asincronico.

### Suposiciones

- El sistema se orienta inicialmente a universidades.
- El tenant corresponde a una universidad.
- Cada curso corresponde a un ramo semestral concreto.
- Los usuarios deben estar autenticados.
- El idioma principal sera espanol.
- El MVP no busca reemplazar todas las funcionalidades de Canvas.
- La IA se considera funcionalidad experimental posterior al core.

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
- Crear modulos de curso.
- Subir y publicar material academico.
- Crear evaluaciones/tareas con fechas, puntajes y ponderaciones.
- Permitir entregas de estudiantes.
- Corregir entregas y registrar comentarios.
- Liberar notas manualmente.
- Visualizar libro de notas.
- Mostrar dashboard de cursos, pendientes y anuncios.

### Restricciones

- Proyecto desarrollado durante un semestre academico, con construccion efectiva estimada de 10 a 12 semanas.
- Despliegue publico usando servicios cloud y free tiers cuando sea posible.
- MVP acotado al core academico.
- Integraciones externas complejas quedan fuera del alcance inicial.

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

- Next.js para frontend.
- NestJS para backend.
- PostgreSQL para datos relacionales.
- Redis para cache, sesiones o colas.
- Object storage compatible con S3 para documentos y entregas.
- PgBouncer o pool de conexiones para administrar conexiones a base de datos.
- Docker para entorno reproducible.
- Cloud free tier para despliegue publico.

## 9. Arquitectura Inicial

```txt
Cliente Web
-> Load Balancer
-> Reverse Proxy / API Gateway
-> Next.js Frontend
-> NestJS Backend Modular
-> Tenant Resolver
-> Connection Pool por tenant
-> PostgreSQL por tenant
-> Object Storage para archivos
-> Redis para cache/jobs
-> Workers asincronicos
```

El monolito modular permite avanzar rapido sin introducir la complejidad operacional de microservicios. La arquitectura igual considera separacion por modulos, colas, almacenamiento externo y escalamiento horizontal.

## 10. Riesgos

- Sobrealcance funcional: mitigado al limitar el MVP al core de cursos, material, evaluaciones, entregas y notas.
- Complejidad multi-tenant: mitigada con un registry central y esquemas homogeneos por tenant.
- Crecimiento de archivos: mitigado usando object storage.
- Carga en fechas criticas: mitigada con load balancer, connection pool, cache y workers.
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

- [Requisitos](requirements.md)
- [Historias de usuario](user-stories.md)
- [Arquitectura](architecture.md)
- [Roadmap](roadmap.md)

