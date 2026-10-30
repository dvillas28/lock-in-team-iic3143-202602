# Feedback de Entrega 1 para preparar Entrega 2

Compilado para el equipo Lock In, extraído el 28 de octubre de 2026.
Fuente: `01- 2026-02 Alumnos Proyecto, Notas y Presentaciones.xlsx`,
pestaña **E1**, fila **7** (Lock In). La copia consultada está en `tmp/`,
fuera del paquete documental de la entrega.

Este documento resume los seis comentarios de esa fila y propone acciones
para responderlos en E2. No certifica que las acciones estén implementadas;
las casillas pendientes requieren revisión y evidencia del equipo.

## Evaluación registrada

| Bloque | Celda | Nota |
| --- | --- | --- |
| Razón y justificación | E7 | 7,0 |
| Interlocutores | H7 | 7,0 |
| Necesidades | L7 | 7,0 |
| Requisitos | S7 | 6,25 |
| Nota final | V7 | 6,8125 |

Los criterios con descuento fueron requisitos no funcionales, plan de trabajo
y tecnología/arquitectura: **0,75 cada uno**. Los demás criterios obtuvieron
1,0. U7 no registra descuento adicional.

## Comentarios por criterio

Los siguientes textos son síntesis del feedback, no transcripciones literales.

| Celda | Criterio / puntaje | Feedback recibido |
| --- | --- | --- |
| I7 | Resumen de rasgos / 1,0 | Confirma que el contenido estaba en el informe y agradece su envío. Sin corrección solicitada. |
| M7 | Riesgos / 1,0 | Valora los riesgos y sus mitigaciones. Observa que el aislamiento multi-tenant puede resolverse en la BD sin separar las bases de datos. |
| P7 | Requisitos no funcionales / 0,75 | Pide concretar cómo se implementarán los logs y el redespliegue: telemetría u otra solución, y si los redespliegues serán automáticos. |
| Q7 | Plan de trabajo / 0,75 | Falta explicar metodología, reparto del trabajo y revisión de PR. Considera el plazo corto para tantos RF/RNF y pide dejar alcance fuera. Cuestiona multi-tenancy en la primera iteración y espera ver el modelo de BD. |
| R7 | Tecnología y arquitectura / 0,75 | Valora la arquitectura, pero cuestiona una BD por tenant por escalabilidad y complejidad de migraciones y backfills. Sugiere aislamiento mediante reglas en una BD compartida y evaluar sharding solo ante crecimiento. |
| R7 | Mismo comentario, continuación | Advierte dependencia de GCP, dificultad potencial para probar localmente y costo de portar la solución. Sugiere Compose con emuladores de GCP o S3 si esas opciones se mantienen. Menciona Canvas como referencia de modelado y Cassandra/Discord como ejemplo de alternativas de rendimiento. |

## Acciones para esta entrega

Las prioridades siguientes son una propuesta del compilado, no una nueva pauta.
M7 y R7 se agrupan porque cuestionan la misma decisión multi-tenant.

### 1. Justificar el aislamiento multi-tenant (M7, Q7, R7)

- [ ] Explicar la decisión de BD compartida frente al diseño de una BD por tenant.
- [ ] Mostrar cómo cada entidad académica se asocia a su institución y cómo
  permisos y restricciones impiden lectura o escritura entre instituciones.
- [ ] Adjuntar evidencia de acceso cruzado rechazado y explicar cómo se aplican
  migraciones y cambios de datos sin multiplicar operaciones por tenant.

Referencias para revisar: [arquitectura](04-architecture.md),
[modelo de datos](06-data-model.md) y
[ADR de PostgreSQL compartida](../../adr/adopt-shared-postgresql-multitenancy.md).

### 2. Mostrar un alcance realizable (Q7)

- [ ] Separar RF/RNF incluidos, excluidos y diferidos, justificando el recorte.
- [ ] Alinear backlog y planificación con el plazo y capacidad del equipo.
- [ ] Preparar una demostración del flujo académico comprometido y explicar
  qué parte de multi-tenancy se entrega y qué queda fuera.

Referencias para revisar: [alcance](02-scope.md),
[requerimientos](03-use-cases-and-requirements.md) y [estado](10-status.md).

### 3. Explicitar cómo trabaja el equipo (Q7)

- [ ] Describir metodología, responsables y reparto del trabajo. Si se usa
  Scrum, explicar su aplicación concreta.
- [ ] Acordar revisión de PR, criterios de término y seguimiento del avance.
- [ ] Respaldar el proceso con tareas y PR reales del equipo.

Referencias para revisar: [plan de trabajo](08-work-plan.md) y
[reglas de trabajo](08-work-plan-detail/reglas-de-trabajo.md).

### 4. Concretar logs, despliegue y redespliegue (P7)

- [ ] Precisar qué eventos y errores se registran, dónde se consultan y cómo
  se evita registrar credenciales u otros datos sensibles.
- [ ] Indicar si hay telemetría y con qué herramienta, o justificar el mecanismo
  de observación elegido para el MVP.
- [ ] Describir qué dispara despliegues y redespliegues, qué pasos son
  automáticos o manuales y cómo se verifica que el servicio quedó operativo.
- [ ] Adjuntar evidencia del procedimiento y de la consulta de logs.

Referencias para revisar: [walking skeleton](09-walking-skeleton-plan.md)
y [evidencia CI/CD](11-cicd-evidence/README.md).

### 5. Demostrar ejecución local y explicar portabilidad (R7)

- [ ] Verificar instrucciones reproducibles desde un checkout limpio:
  configuración de ejemplo, servicios, arranque y comprobación básica.
- [ ] Identificar dependencias del proveedor y explicar cómo se prueban
  localmente y qué implicaría reemplazarlas.
- [ ] Si se requieren emuladores, documentar cómo se levantan; si ya no se usa
  GCP, explicar la decisión actual en informe y presentación.

Referencias para revisar: [arquitectura](04-architecture.md)
y [walking skeleton](09-walking-skeleton-plan.md).

## Cómo presentar la respuesta al feedback

Para cada punto, mostrar **observación de E1 → decisión de E2 → evidencia**.
La revisión pide reducir complejidad, ajustar alcance y concretar la operación.
Canvas, Cassandra, sharding y emuladores son referencias o sugerencias del
evaluador; no son tecnologías exigidas ni compromisos adicionales del MVP.

Antes de cerrar una casilla, contrastar documento, implementación y demo.
Este compilado no reemplaza la pauta de E2 ni audita el estado actual del código.
