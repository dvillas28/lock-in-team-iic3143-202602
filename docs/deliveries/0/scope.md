# Alcance Del Producto

## Proposito

Este documento consolida las definiciones de la reunion de alcance posterior a la documentacion inicial. Distingue las capacidades fundacionales que no se pueden negociar de las extensiones que dependen del tiempo, la complejidad y los criterios de evaluacion del proyecto.

Los requisitos detallados se mantienen en [requisitos](requirements.md), las historias y sus criterios en [historias de usuario](user-stories.md), y la secuencia tentativa en [roadmap](roadmap.md).

## Principio Rector

La experiencia academica debe estar centralizada para estudiantes y cuerpo docente. Los flujos principales relacionados con un curso deben poder completarse dentro de la plataforma, sin depender de planillas, carpetas, calendarios o canales externos.

Este principio expresa la direccion del producto y sirve para evaluar nuevas funcionalidades; no convierte automaticamente toda interaccion posible en parte del MVP.

Este principio se traduce en dos resultados prioritarios:

- El estudiante puede conocer con claridad sus calificaciones y avance en el curso.
- El cuerpo docente puede configurar y calcular calificaciones dentro de la plataforma.

## Fundaciones Must Have

Las siguientes capacidades son precondiciones del resto del producto:

- Representar cursos universitarios y sus secciones.
- Asociar estudiantes, docentes y ayudantes al curso o seccion que corresponda.
- Mostrar al estudiante el cuerpo docente responsable de su seccion, con nombre y rol.
- Crear y administrar evaluaciones dentro de los cursos.
- Registrar, calcular, publicar y visualizar calificaciones dentro de los cursos.

Esta clasificacion identifica fundaciones no negociables. No reemplaza la priorizacion detallada del MVP ni implica que material, entregas, correccion o dashboard dejen de formar parte del flujo academico planificado.

## Extensiones Nice To Have

Estas capacidades solo se incorporan despues de validar las fundaciones Must Have y si el avance permite absorber su complejidad:

- Carga y publicacion de videos como material academico.
- Resumen de material mediante IA.
- Chat grupal para participantes de una seccion.
- Chat para grupos de estudiantes.
- Calendario visible directamente en el dashboard junto a los cursos.
- Eventos de calendario relacionados con evaluaciones y fechas de entrega.
- Alertas dentro de la plataforma mediante toasts o listas desplegables.

Las alertas por correo se consideran una evolucion posterior por requerir un proveedor de envio, manejo de entregabilidad y preferencias de notificacion.

## Limites Y Dependencias

- El calendario propuesto es interno y visible desde el dashboard; no supone integracion con Google Calendar u Outlook.
- El resumen mediante IA se limita a material publicado y permanece posterior al core funcional.
- El modelo actual considera entregas individuales. Habilitar grupos de estudiantes exige definir membresias de grupo, alcance por curso o seccion y autoria de entregas grupales antes de implementar chat o evaluaciones grupales.
- La carga de videos puede requerir limites de tamano, formatos soportados, almacenamiento y procesamiento adicional; esos detalles deben resolverse en una especificacion propia.
- Toda extension debe respetar aislamiento por tenant, permisos contextuales y auditoria de registros academicos.

## Trazabilidad

- Cursos, secciones y participantes: RF4, RF5, RF21, US5, US6, US7 y US30.
- Evaluaciones: RF9, US13.
- Calificaciones y avance: RF13, RF14, RF15, RF19, RF22, US17, US18, US19 y US20.
- Video, IA, chats, calendario y alertas: RFO1-RFO7 y US25, US31-US37.
