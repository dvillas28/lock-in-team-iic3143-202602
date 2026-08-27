# Glosario

## Tenant

Universidad aislada dentro de la plataforma. Cada tenant tiene sus propios usuarios, cursos, archivos, evaluaciones y notas.

## Usuario

Persona autenticada que usa la plataforma. Puede tener distintos roles segun tenant o curso.

## Administrador Tenant

Usuario responsable de administrar una universidad dentro de la plataforma.

## Docente

Usuario responsable de configurar y administrar uno o mas cursos.

## Ayudante Docente

Usuario que apoya al docente en tareas como correccion, anuncios, material o recorrecciones.

## Estudiante

Usuario inscrito en cursos, con acceso a material, evaluaciones, entregas y notas liberadas.

## Periodo Academico

Intervalo institucional donde se dictan cursos. Ejemplo: `2026-2`.

## Curso

Ramo semestral concreto configurado para un periodo academico.

## Seccion

Grupo especifico de estudiantes dentro de un curso.

## Inscripcion

Relacion entre un usuario y un curso o seccion.

## Modulo

Unidad de organizacion del contenido del curso. Puede representar una semana, tema o bloque.

## Recurso

Material academico publicado en un modulo, como PDF, PPT, link o archivo.

## Evaluacion

Actividad academica que puede recibir entrega, correccion, nota y ponderacion.

## Assignment

Entidad tecnica que representa tareas, pruebas, controles, proyectos o examenes.

## Entrega

Envio realizado por un estudiante para una evaluacion.

## Nota

Calificacion asociada a una evaluacion y estudiante.

## Liberacion De Notas

Accion del docente que hace visibles una o mas notas para los estudiantes.

## Libro De Notas

Vista consolidada de evaluaciones, ponderaciones, notas y promedio de un curso.

## Recorreccion

Solicitud del estudiante para revisar una calificacion o comentario de correccion.

## SLO

Service Level Objective. Meta medible de calidad del sistema, como tiempo de respuesta o disponibilidad.

## Object Storage

Servicio para almacenar archivos binarios como PDFs, presentaciones y entregas.

## Connection Pool

Componente que reutiliza conexiones a la base de datos para evitar saturacion y mejorar rendimiento.

## Sharding

Particionamiento de datos para escalar el sistema. En este proyecto, el sharding natural propuesto es por tenant.

