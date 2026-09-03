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

## Cuerpo Docente

Conjunto de docentes y ayudantes asignados a un curso o seccion, cada uno con un rol y alcance contextual.

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

## Grupo De Estudiantes

Agrupacion opcional de estudiantes dentro de un curso o seccion. No forma parte del modelo base y debe definir membresias, permisos y autoria de entregas antes de habilitar funciones grupales.

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

Particionamiento de datos para distribuir carga y escalar el sistema. En este proyecto el sharding está implementado desde el inicio: cada tenant (universidad) es un shard con su propia base de datos PostgreSQL independiente. No es una decisión futura — es la estructura base del sistema. Si en el futuro una universidad creciera tanto que una sola instancia no la sostuviera, se aplicaría sub-sharding interno dentro de ese tenant.
