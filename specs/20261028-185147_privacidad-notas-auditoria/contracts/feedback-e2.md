# Contract: Respuesta verificable al feedback de E2

Contrato documental y de aceptación. No agrega una interfaz de producto.
Fuente primaria: XLSX, E2, Lock In fila 6. Las reglas de auditoría se detallan
por separado en [audit-visibility.md](audit-visibility.md).

## Trazabilidad y atribución

La matriz vive en `docs/deliveries/2/15-feedback-e2.md` y conserva:

| Campo | Regla |
| --- | --- |
| Origen | E2 y celda; no sustituir por E1 ni por revisión propia |
| Línea base | Fecha/commit/alcance inmutables y evidencia previa localizable |
| Estado previo | Implementado, parcial, ausente o sin verificar; distinguir código y documento |
| Acción | Documentación, validación, funcional o diferida, con motivo |
| Responsable | Referencia al responsable vigente, sin nueva asignación implícita |
| Posterior | Fecha/commit/PR, evidencia y resultado; no sobrescribe corte |
| Limitación | Qué no quedó comprobado o no está soportado; nunca se marca como aprobado |

No afirmar que una capacidad preexistente se implementó por el feedback sin
historia verificable. La fecha del corte no es fecha de recepción del comentario.

## Matriz de aceptación por observación

| ID | Fuente | Cierre mínimo |
| --- | --- | --- |
| E2-ARCH | C6 | Diagrama actual simple contrastado con render.yaml; HAProxy/HA/pool externo diferidos o justificados, sin atribuir despliegue a config |
| E2-DOM | D6 | Cardinalidades/opcionalidad en ambos extremos, reglas contrastadas y mismos conceptos en Markdown, TeX y PDF |
| E2-ROLE | E6 | Dominio teacher/student/assistant explícito; decisión CHECK equivalente frente a enum SQL y rechazo real de valor inválido |
| E2-ADMIN | E6 | Seis actores y matriz de creación de curso/delegación/acceso; campos institucionales visibles en ER; negativos de permisos |
| E2-ACCOUNTS | E6 | Dataset, preparación y provisión inicial declarados; replay seguro; altas generales en institución existente identificadas como no soportadas |
| E2-RISKS | F6 | Valoración positiva conservada; solo actualizar riesgos afectados sin atribuir creación al polish |
| E2-PLAN | G6 | Valoración positiva conservada; backlog/responsables y cambios de estado trazables |

## Matriz administrativa vigente a explicar, no reimplementar

| Actor | Capacidad | Límite |
| --- | --- | --- |
| Operador del producto | Onboarding de institución/identidad inicial y recuperación operativa | Proceso controlado y auditado, no superadmin global HTTP |
| Superadmin institucional | Delegar is_admin en su institución | No delega is_super_admin ni recibe acceso académico ajeno |
| Admin propietario | Crear cursos; administrar los propios | Requiere is_admin y ownership; docencia se valida por separado |
| Teacher | Docencia y seguimiento de sus secciones | Ownership con admin amplía solo donde la operación lo permite |
| Assistant | Seguimiento de sus secciones | Sin autoría ni publicación o auditoría por ese rol |
| Student | Material/quizzes autorizados y notas propias publicadas | Sin pauta ni auditoría por ese rol |

Un User es global, las capacidades administrativas viven en membership y
los roles académicos en Enrollment. Los flags no se infieren de etiquetas demo.
Onboarding de una institución puede crear o reutilizar su identidad inicial;
no es una operación de alta general para una institución ya existente.

## Compatibilidad y formatos

- Conservar modelo vigente y dominio cerrado sin migración física por estética.
- Revisar User/Membership, Course/Section/Enrollment, Quiz/Section opcional y
  AuditEvent operativo con actor/curso opcionales según reglas persistidas.
- Mantener concepto, físico y ciclo de vida diferenciados cuando sus mínimos
  difieren; cada diferencia se explica, no se oculta con un cardinal genérico.
- Markdown, catálogo XLSX, Mermaid/MMD/SVG/PDF y TeX/PDF se revisan juntos;
  guardar comandos/versiones de exportación. No asumir generador inexistente.
- Textos modificados respetan longitud; arquitectura de 362 líneas requiere
  reducir/split antes de pasar CI. Ningún documento modificado puede superar 200.
- Nuevas capacidades encontradas necesarias requieren refinamiento previo.
- Un resultado diferido o herramienta ausente no permite marcar tarea aprobada.

## Evidencia funcional asociada

AUD-PRIV queda separado de las celdas E2. Su aceptación exige corrección y
pruebas reales según contrato de privacidad; no puede darse por satisfecha
mediante cambios de diagramas o declaraciones de diferimiento.
No ejecutar despliegue ni publicar secretos como parte de la revisión documental.
