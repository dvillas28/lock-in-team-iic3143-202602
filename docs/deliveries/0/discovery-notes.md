# Notas De Descubrimiento

## Contexto

El proyecto corresponde a un ramo de Desarrollo de Software con foco no solo en funcionalidades, sino tambien en decisiones de diseno, escalabilidad, infraestructura y arquitectura.

La idea inicial es construir un LMS universitario inspirado en necesidades reales observadas al usar Canvas.

## Observaciones Sobre Canvas Y LMS Existentes

- Canvas resuelve muchos casos, pero puede sentirse pesado para cursos que usan solo una parte de la plataforma.
- El calendario no siempre es usado porque no se integra naturalmente al flujo real del curso; su valor depende de estar visible en el dashboard y vinculado con evaluaciones y entregas.
- La gestion de notas suele terminar en hojas de calculo externas.
- El material academico queda como archivos pasivos.
- La experiencia entre material, evaluaciones, entregas y notas se percibe fragmentada.

## Direccion Recomendada

No conviene vender el producto como "Canvas pero mas bonito". Es mas defendible posicionarlo como:

> LMS multi-tenant universitario enfocado en integrar el flujo academico critico de cursos semestrales.

## Decisiones Iniciales

- El tenant representa una universidad.
- Un curso representa un ramo semestral concreto.
- Un usuario puede tener distintos roles segun tenant y curso.
- El core funcional debe resolverse antes de incorporar IA.
- El sistema de notas es parte central del valor del producto.
- El despliegue publico debe ser considerado desde el diseno, usando servicios cloud y free tiers cuando sea posible.

## Definiciones Posteriores De Alcance

- La experiencia centralizada pasa a ser el principio rector del producto.
- Cursos, secciones, participantes, evaluaciones y calificaciones son fundaciones Must Have.
- El estudiante debe poder identificar por nombre y rol al cuerpo docente responsable de su seccion.
- Video, resumen mediante IA, chats, calendario y alertas son extensiones Nice to Have condicionadas al avance.
- Los limites y la trazabilidad de estas definiciones se consolidan en [alcance del producto](scope.md).

## Funcionalidades Postergadas

- Quizzes interactivos.
- Google Calendar y Outlook.
- IA sobre todo el material del curso.
- Planificacion docente avanzada.
- Analitica academica avanzada.
