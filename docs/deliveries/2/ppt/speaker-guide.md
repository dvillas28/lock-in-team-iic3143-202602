# Guía de presentación Entrega 2

## Objetivo del relato

Presentar Entrega 2 en 10 a 15 minutos, usando la PPT como apoyo visual y este
punteo como guía oral. La idea no es leer las slides, sino explicar las
decisiones y demostrar que el equipo conoce el diseño, los riesgos y el plan de
implementación.

## Distribución sugerida

| Bloque | Slides | Tiempo |
| --- | ---: | ---: |
| Apertura y pauta | 1-2 | 2 min |
| Alcance y casos de uso | 3-6 | 3 min |
| Arquitectura y fallas | 7-9 | 3-4 min |
| Dominio, datos y evidencia | 10-12 | 2-3 min |
| Plan, riesgos y cierre | 13-15 | 2-3 min |
| Anexos / preguntas | 16-17 | solo si preguntan |

## Guía slide por slide

### Slide 1 — AcademiX

- Abrir con una frase simple: AcademiX es un LMS universitario multi-tenant
  enfocado en el flujo académico crítico.
- Nombrar el flujo que queremos resolver: curso, material, evaluación, nota y
  auditoría.
- Aclarar que Entrega 2 no busca vender una app terminada, sino demostrar que
  el diseño está estable para pasar a implementación.

### Slide 2 — Qué se debía demostrar

- Explicar que la pauta pide dos tipos de evidencia: diseño del producto y
  capacidad real de construcción.
- Diseño: casos de uso, arquitectura, dominio y datos.
- Construcción/gestión: plan, riesgos, walking skeleton y CI/CD.
- Mencionar que separamos “documentación de diseño” de “prueba técnica” para
  no confundir MVP funcional con walking skeleton.

### Slide 3 — Alcance MVP

- Explicar que simplificamos a dos flujos: docente y estudiante.
- Docente: administra secciones, material, quizzes, libro de notas y
  publicación.
- Estudiante: entra a una institución, ve cursos, consume material, responde
  quizzes y consulta notas.
- Recalcar lo que queda fuera: admin institucional, IA, chat, calendario,
  microservicios y RBAC completo.
- El punto fuerte es el foco: preferimos un flujo académico core completo antes
  que muchas features incompletas.

### Slide 4 — Qué cambió frente a Entrega 1

- Decir que Entrega 1 era más ambiciosa e infra-heavy: GCP, DB por tenant,
  Tenant Registry y pools por tenant.
- Explicar que el feedback llevó a una arquitectura más mantenible:
  PostgreSQL compartida y multi-tenancy lógico.
- Aclarar que no se perdió robustez; se sacó complejidad prematura.
- Frase útil: “menos piezas, pero garantías más explícitas”.

### Slide 5 — Casos de uso por flujo

- No leer todos los CU; recorrer el flujo de izquierda a derecha.
- Acceso: elegir institución y contexto autorizado.
- Cursos: ver cursos, secciones y gestionar roles.
- Material: publicar, consultar y ordenar módulos.
- Quizzes: crear, responder, enviar/corregir y cancelar intentos.
- Notas: configurar libro, publicar y revisar resultados.
- Auditoría cierra el circuito porque registra los cambios sensibles.

### Slide 6 — RNF clave

- Presentar los RNF como garantías, no como lista suelta.
- Aislamiento: cada operación se scopea por Institution.
- Seguridad: JWT, membership y roles académicos.
- Integridad: constraints y FK evitan cruces inválidos.
- Auditoría: cambios sensibles deben quedar trazables.
- Operación: Docker, CI/CD y HA hacen que el sistema sea reproducible y
  defendible ante fallas.

### Slide 7 — Arquitectura objetivo

- Explicar el flujo general: usuarios → Railway edge → frontend/backend →
  PgBouncer → PostgreSQL HA.
- Railway edge representa balanceo de tráfico hacia réplicas sanas.
- PgBouncer protege la base frente a demasiadas conexiones desde réplicas del
  backend.
- PostgreSQL HA significa High Availability: primary, réplica y failover.
- Railway Bucket se usa para PDFs, presentaciones y adjuntos; PostgreSQL guarda
  metadatos, no binarios.
- Las Institutions viven en la misma base, separadas por `institution_id`,
  autorización y FK.

### Slide 8 — Preguntas de falla

- Esta slide está pensada para preguntas del profesor.
- Diferenciar fallas de aplicación, fallas de base, errores lógicos y fallas de
  proveedor.
- Si cae una réplica, Railway puede enviar tráfico a otra.
- Si cae el primary de PostgreSQL, HA promueve una réplica y HAProxy redirige.
- Si hay corrupción o mala migración, HA no ayuda: se necesita backup/PITR.
- Si cae Railway completo, lo declaramos como riesgo aceptado del MVP; no
  prometemos multi-cloud.

### Slide 9 — Multi-tenancy lógico

- Explicar que el usuario es global y puede pertenecer a varias instituciones.
- `InstitutionMembership` habilita acceso a una institución.
- `Enrollment` define el rol académico en curso/sección: docente, ayudante o
  estudiante.
- El path selecciona contexto, pero no autoriza por sí solo.
- Las defensas reales son membership, enrollment, `institution_id`, queries
  scopeadas y FK compuestas.

### Slide 10 — Modelo de dominio

- Presentar tres zonas: identidad/institución, curso/contenido y evaluación/notas.
- Institution → Course → Section ordena el contexto académico.
- CourseModule organiza Material y Quiz.
- QuizAttempt representa el intento del estudiante.
- GradeItem es la columna del libro de notas; Grade es la nota concreta del
  estudiante.
- AuditEvent registra cambios sensibles, especialmente notas, publicación y
  acciones académicas relevantes.

### Slide 11 — Modelo de datos

- Explicar que esta slide resume el catálogo de datos.
- Global: institutions y users no dependen de un curso específico.
- Acceso: institution_memberships controla visibilidad institucional.
- Curso: courses, sections y enrollments son el core académico.
- Contenido/evaluación/notas aterrizan material, quizzes y gradebook.
- Auditoría es tenant-owned, porque cada evento debe pertenecer a una
  Institution.
- Mencionar que el catálogo completo está en XLSX/CSV con columnas, tipos,
  PK/FK y descripciones.

### Slide 12 — Walking skeleton y evidencia

- Decir que el walking skeleton no intenta probar todo el dominio.
- Lo que prueba es integración técnica: frontend, backend, Docker, CI,
  Railway y release.
- Mencionar que esta evidencia reduce riesgos de despliegue y coordinación del
  equipo.
- Si preguntan por funcionalidad académica, responder que queda planificada
  para las siete semanas y respaldada por casos de uso/modelos.

### Slide 13 — Plan de desarrollo: 7 semanas

- Explicar que el plan parte el lunes 5 de octubre de 2026.
- Semanas 1-3: base técnica, DB compartida, identidad y aislamiento.
- Semana 4: cursos, secciones, roles y shell frontend.
- Semana 5: módulos, material y quizzes.
- Semana 6: notas, publicación, auditoría y PR reviewer.
- Semana 7: hardening, release, documentación y ensayo.
- Nombrar responsables por área: Fierro bot, Palma backend/infra,
  Contreras/Matías frontend, Villaseñor CI/CD y gestión.

### Slide 14 — Riesgos principales

- Explicar que elegimos mostrar los riesgos más relevantes, no toda la planilla.
- Riesgo más crítico: fuga o query sin scope institucional.
- Otro riesgo alto: sobrealcance funcional; por eso recortamos a flujo core.
- Auditoría incompleta se vigila porque notas y publicación son registros
  académicos sensibles.
- Bot PR reviewer es útil, pero no debe bloquear el flujo ni generar ruido.
- Cada riesgo tiene dueño, mitigación y contingencia en `07-risks.md`.

### Slide 15 — Cierre

- Cerrar con tres mensajes:
  - Diseño estable: el MVP está acotado y trazado.
  - Arquitectura defendible: se responde qué pasa ante fallas.
  - Ejecución lista: hay plan de siete semanas y responsables.
- Frase final sugerida: “La siguiente fase no es rediseñar; es implementar y
  validar el flujo académico core”.

### Slide 16 — Anexo: responsables

- Usarla si preguntan quién se hace cargo de cada área.
- Sirve para defender riesgos y plan: cada área técnica tiene un owner.
- Recordar que los riesgos asociados a una funcionalidad deben validarse con
  la persona responsable.

### Slide 17 — Anexo: paquetes documentales

- Usarla si preguntan dónde está respaldada una decisión.
- Mostrar que la entrega no depende solo de la PPT.
- Conectar documentos: casos de uso, arquitectura, dominio, datos, riesgos,
  plan, evidencia CI/CD y catálogo.

## Preguntas y respuestas posibles

### 1. ¿Por qué abandonaron DB por tenant?

Porque aumentaba mucho la complejidad operativa: migraciones por tenant,
backfills, credenciales, pools, registry y restores parciales. Para el MVP es
más defendible una PostgreSQL compartida con `institution_id`, constraints,
FK compuestas y tests de aislamiento. Sharding puede evaluarse después con
métricas reales.

### 2. ¿Una base compartida no aumenta el riesgo de fuga?

Sí, cambia el tipo de riesgo, por eso el aislamiento no depende de una sola
capa. Se combina autorización contextual, `InstitutionMembership`, `Enrollment`,
queries scopeadas, `institution_id`, FK compuestas, constraints y pruebas
cruzadas UC/UTFSM.

### 3. ¿Qué pasa si cae el backend?

El backend es stateless y puede ejecutarse con réplicas. Si cae una réplica,
Railway puede enviar tráfico a otra. Si fallan todas por un bug, la respuesta
operativa es rollback o fix; el healthcheck por sí solo no corrige errores de
aplicación.

### 4. ¿Qué pasa si cae PostgreSQL?

La topología objetivo usa PostgreSQL HA: un primary, una réplica y HAProxy para
redirigir al primary vigente. Si cae el primary, se promueve una réplica. Puede
haber interrupción breve y conexiones en vuelo deben reintentar.

### 5. ¿HA reemplaza backups?

No. HA ayuda ante caída de infraestructura, pero también propaga errores
lógicos. Si hay una mala migración, corrupción o borrado accidental, se
necesitan backups y point-in-time recovery.

### 6. ¿Por qué usar object storage?

Porque PDFs, presentaciones y adjuntos no deberían vivir como binarios dentro
de PostgreSQL. La base guarda metadatos, ownership y `storage_key`; el binario
queda en Railway Bucket/S3-compatible.

### 7. ¿Por qué no usar RBAC completo?

Porque para el MVP basta con dos flujos y roles académicos acotados. El docente
con rol `teacher` administra su curso/secciones; `assistant` y `student` tienen
permisos más limitados. Un RBAC completo agrega complejidad que no es necesaria
para Entrega 2.

### 8. ¿Cuál es la diferencia entre GradeItem y Grade?

`GradeItem` es la columna o ítem evaluativo del libro de notas, por ejemplo
“Quiz 1, 20%”. `Grade` es la nota concreta de un estudiante para ese ítem, por
ejemplo “Ana obtuvo 6.2 en Quiz 1”.

### 9. ¿Por qué las preguntas del quiz son JSONB?

Para simplificar el MVP. Las preguntas viven anidadas en `quizzes.questions`,
lo que evita tablas y endpoints extra para una estructura que no necesitamos
consultar de forma independiente todavía.

### 10. ¿Qué demuestra realmente el walking skeleton?

Demuestra que el equipo puede integrar frontend, backend, Docker, CI, Railway y
release. No pretende demostrar todo el flujo académico; ese flujo está cubierto
por casos de uso, modelos y plan de siete semanas.
