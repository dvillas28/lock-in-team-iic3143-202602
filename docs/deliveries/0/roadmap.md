# Roadmap

## Enfoque

El proyecto se organiza en iteraciones semanales. La prioridad es construir primero las fundaciones Must Have y el core academico, y luego sumar extensiones Nice to Have si el avance lo permite.

## Hitos De Alcance

- Must Have: cursos y secciones con estudiantes y cuerpo docente, evaluaciones y calificaciones gestionadas dentro de la plataforma.
- Resultado estudiante: claridad sobre sus calificaciones, promedio parcial y avance en el curso.
- Resultado cuerpo docente: configuracion y calculo de calificaciones sin depender de planillas externas.
- Nice to Have: videos, resumen de material mediante IA, chats, calendario visible en el dashboard y alertas internas.
- Evolucion posterior: alertas por correo y funciones grupales que requieran cambiar el modelo de entregas.

## Plan Tentativo 10-12 Semanas

### Semana 1

- Vision del producto.
- Modelo de dominio inicial.
- Arquitectura inicial.
- Mockups principales.
- Backlog priorizado.

### Semana 2

- Setup monorepo.
- Next.js y NestJS base.
- Autenticacion inicial.
- Resolucion de tenant.
- Modelo de usuarios y roles.

### Semana 3

- Periodos academicos.
- Cursos semestrales.
- Secciones.
- Inscripciones.
- Visibilidad del cuerpo docente por seccion.

### Semana 4

- Modulos de curso.
- Material academico.
- Publicacion/ocultamiento de contenido.
- Object storage inicial.

### Semana 5

- Evaluaciones/tareas.
- Categorias.
- Fechas.
- Puntajes.
- Ponderaciones.

### Semana 6

- Entregas de estudiantes.
- Estado de entrega.
- Validaciones basicas.
- Vista estudiante de pendientes.

### Semana 7

- Correccion.
- Comentarios.
- Registro de notas.
- Liberacion manual.

### Semana 8

- Libro de notas docente.
- Vista de notas estudiante.
- Promedio actual.
- Auditoria basica de cambios.

### Semana 9

- Dashboard estudiante/docente.
- Anuncios.
- Segun avance, calendario visible en el dashboard, alertas internas o recorrecciones.

### Semana 10

- Despliegue publico.
- Connection pool.
- Redis o workers.
- Configuracion base de observabilidad.

### Semana 11

- Hardening de permisos.
- Mejoras UX.
- Correccion de deuda critica.
- Pruebas de flujos principales.

### Semana 12

- Demo final.
- Documentacion final.
- Preparacion de presentacion.
- Validacion del caso de negocio y arquitectura.

## Orden De Prioridad

1. Multi-tenancy, usuarios y permisos contextuales.
2. Cursos, secciones, inscripciones y cuerpo docente visible.
3. Evaluaciones.
4. Calificaciones, calculo, liberacion y libro de notas.
5. Material.
6. Entregas y correccion.
7. Dashboard y anuncios.
8. Infraestructura.
9. Videos, calendario, alertas y chats, segun avance.
10. IA experimental.

## Mapeo De Requisitos Por Iteracion

| Semana | Foco | RF/RNF asociados | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Vision, dominio, arquitectura y mockups | RNF3, RNF4, RNF5, RNF7 | Documentacion base, alcance, modelo de dominio y decisiones iniciales. |
| 2 | Setup, autenticacion y tenancy | RF1, RF2, RNF3, RNF4 | Usuarios autenticados y tenant resuelto para cada request. |
| 3 | Cursos, secciones e inscripciones | RF3, RF4, RF5, RF21 | Cursos con secciones, participantes y cuerpo docente visible. |
| 4 | Modulos y material | RF6, RF7, RF8, RF20, RNF8 | Curso con contenido publicado u oculto y material asociado. |
| 5 | Evaluaciones | RF9, RF10 | Evaluaciones configuradas y visibles como pendientes. |
| 6 | Entregas | RF11 | Estudiantes pueden entregar evaluaciones y registrar recepcion. |
| 7 | Correccion y notas | RF12, RF13, RF16 | Correccion guardada con comentarios, sin publicar automaticamente. |
| 8 | Libro de notas y promedios | RF14, RF15, RF19, RF22, RNF5 | Notas liberadas, promedio calculado y auditoria basica. |
| 9 | Dashboard y anuncios | RF18 | Dashboard usable para estudiantes y cuerpo docente. |
| 10 | Despliegue y operacion base | RNF1, RNF2, RNF6, RNF8, RNF10 | Despliegue publico con observabilidad y decisiones de rendimiento justificadas. |
| 11 | Hardening y pruebas | RNF3, RNF4, RNF5, RNF9 | Permisos revisados, flujos criticos probados y deuda critica cerrada. |
| 12 | Demo y cierre documental | RF principales, RNF principales | Presentacion final, documentacion actualizada y validacion del caso de negocio. |
