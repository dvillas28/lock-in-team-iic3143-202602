# Riesgos actualizados

## Criterio de lectura

Probabilidad e impacto usan escala `Baja`, `Media`, `Alta`. Estado distingue
riesgos abiertos, mitigados por diseño, aceptados o materializados. Cada riesgo
debe validarse con la persona responsable del área antes de cerrarse.

## Planilla de riesgos

| ID | Riesgo | Área | Responsable | Prob. | Impacto | Estado | Mitigación en ejecución | Contingencia si se materializa |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Fuga entre Institutions | Backend/DB | Sebastián Palma | Media | Alta | Abierto | Institution explícita, InstitutionMembership, autorización contextual, queries scoped, FK institution-aware y tests cruzados. | Congelar release, auditar endpoints afectados, corregir scope, agregar regresión y revisar datos expuestos. |
| R-02 | Query sin scope institucional | Backend/DB | Sebastián Palma | Media | Alta | Abierto | Centralizar contexto de aplicación, prohibir `institution_id` desde body y revisar repositorios/servicios por trust boundary. | Bloquear endpoint, corregir query, agregar test UC/UTFSM y revisar logs. |
| R-03 | Relación cruzada accidental | Backend/DB | Sebastián Palma | Media | Alta | Abierto | Unicidades y FK compuestas que incluyen `institution_id`; catálogo de datos revisado antes de migrar. | Crear migración correctiva, reparar datos por Institution y agregar constraint faltante. |
| R-04 | Backfill mezcla Institutions | Backend/DB | Sebastián Palma | Baja | Alta | Aceptado | Backfills idempotentes, scope explícito por Institution y validación de conteos antes/después. | Restaurar desde backup si hay corrupción, ejecutar script de reparación y documentar incidente. |
| R-05 | Mayor radio de impacto de PostgreSQL compartida | Infraestructura | Sebastián Palma | Media | Media | Aceptado | Migraciones revisadas, cambios graduales, backup/PITR completo y observabilidad mínima. | Rollback de release, restauración PITR completa y comunicación de indisponibilidad. |
| R-06 | Restore individual por Institution no disponible | Infraestructura | Sebastián Palma | Baja | Media | Aceptado | Declararlo fuera del MVP; evaluar export/import lógico solo si aparece el requisito. | Restaurar base completa en entorno alterno y extraer datos lógicos si es indispensable. |
| R-07 | Slug tratado como autorización | Backend | Sebastián Palma | Media | Alta | Abierto | Resolver UUID interno y validar membership/roles en cada request; recursos no visibles responden `404`. | Corregir guard/middleware, revisar rutas afectadas y agregar tests negativos. |
| R-08 | Auth mock demasiado largo | Backend/Frontend | Sebastián Palma | Media | Alta | Abierto | Limitar mock al walking skeleton; exigir JWT antes de habilitar datos académicos. | Deshabilitar flujos académicos reales hasta integrar JWT y registrar deuda explícita. |
| R-09 | Railway indisponible o mal configurado | CI/CD | Daniel Villaseñor | Media | Media | Abierto | Healthchecks versionados, Dockerfiles reproducibles, variables documentadas sin secretos y evidencia de despliegue. | Ejecutar local por Docker Compose, corregir variables, redeploy y actualizar evidencia. |
| R-10 | CI/CD no representa el estado real | CI/CD | Daniel Villaseñor | Media | Alta | Abierto | Pipelines de lint/build/test, build de imágenes y release por tag. | Bloquear merge, reproducir local, corregir workflow y repetir corrida. |
| R-11 | Integración de archivos binarios no implementada | Frontend/Backend | Julián Contreras, Matías, Sebastián Palma | Media | Media | Aceptado | Mantener material markdown primero; Railway Bucket queda como object storage objetivo y la integración se activa con una historia que la consuma. | Replanificar archivos como deuda de próxima iteración y conservar material textual. |
| R-12 | Sobrealcance funcional | Gestión | Daniel Villaseñor | Alta | Alta | Abierto | Mantener fuera admin, jerarquías, RLS, IA, chat, calendario, workers, microservicios y features sin Spec Kit. | Recortar alcance al flujo curso-material-quiz-notas y mover lo extra a backlog. |
| R-13 | Auditoría incompleta | Backend/DB | Sebastián Palma | Media | Alta | Abierto | AuditEvent tenant-owned e inmutable en la misma transacción, con snapshots sanitizados. | Congelar publicación de notas hasta reconstruir trazabilidad mínima y agregar test transaccional. |
| R-14 | Contrato OpenAPI diverge de implementación | Backend/Frontend | Sebastián Palma, Julián Contreras, Matías | Media | Media | Abierto | Revisar contrato en iteraciones 1-3 y mantener rutas bajo `/institutions/{institutionSlug}`. | Ajustar contrato o implementación, regenerar documentación y comunicar cambio al equipo. |
| R-15 | Frontend permite acciones fuera de rol | Frontend | Julián Contreras, Matías | Media | Media | Abierto | UI derivada de permisos entregados por backend; backend conserva autorización final. | Ocultar acción, corregir estado de permisos y agregar caso de prueba manual. |
| R-16 | Bot PR reviewer genera ruido o bloquea flujo | Bot | Daniel Fierro | Media | Media | Abierto | Activarlo gradualmente, con reglas acotadas y revisión humana obligatoria. | Dejar bot en modo comentario, ajustar prompts/reglas y no bloquear merge. |
| R-17 | Gestión y planillas quedan desactualizadas | Gestión | Daniel Villaseñor | Media | Media | Abierto | Revisión semanal de plan, riesgos, responsables y evidencia. | Cierre extraordinario de planificación, actualización de tablas y redistribución de tareas. |
| R-18 | Presentación final demasiado densa | Gestión/Presentación | Daniel Villaseñor | Media | Media | Abierto | Preparar PDF didáctico con palabras clave, diagramas, gráficos e imágenes; guion agnóstico al presentador. | Reducir slides, mover detalle al informe/anexos y ensayar relato por secciones. |
| R-19 | Dependencia accidental de proveedor cloud | Infraestructura | Sebastián Palma, Daniel Villaseñor | Baja | Media | Mitigado por diseño | Dominio basado en HTTP, PostgreSQL y contenedores; Railway solo despliega. | Ejecutar stack local por Docker Compose y reemplazar integración propietaria por estándar. |

## Riesgos aceptados

- El aislamiento es lógico, no físico; exige disciplina de scope y tests.
- Backup y PITR recuperan la PostgreSQL compartida completa.
- RLS queda fuera del MVP; FK y constraints no reemplazan la autorización.
- Institution se expresa mediante slug en el path por legibilidad, mientras UUID
  permanece como identificador relacional.
- Railway es la plataforma de despliegue; el dominio no depende de sus APIs.
- UC y UTFSM se crearán por bootstrap idempotente cuando exista persistencia.
- La integración con Railway Bucket se implementa cuando exista una historia de
  archivos binarios que la consuma.

## Riesgos materializados

No hay riesgos materializados registrados al cierre documental de esta versión.
Si alguno se materializa durante las siete semanas, se debe mover desde la
planilla principal a esta sección con fecha, responsable, contingencia aplicada
y evidencia.

## Señales de alerta

- Una tabla académica nueva no incluye `institution_id`.
- Una FK tenant-owned referencia solo `id` sin justificar por qué no incluye
  Institution.
- Una query recibe Institution desde el body en vez del contexto validado.
- Un endpoint académico no está bajo `/institutions/{institutionSlug}`.
- Un recurso de otra Institution produce una respuesta que confirma su existencia.
- Un test usa una sola Institution y no prueba IDs cruzados.
- Una migración o backfill itera datos sin scope institucional explícito.
- Se promete restore por Institution sin un diseño de export/import lógico.
- Se agrega un servicio, proveedor u ORM antes de que un plan lo necesite.

## Riesgos retirados del diseño vigente

- coordinación de migraciones entre múltiples PostgreSQL;
- agotamiento de conexiones por pools por Institution;
- indisponibilidad de una base individual resuelta mediante registry;
- divergencia de schema entre UC y UTFSM;
- mantenimiento de URLs y credenciales de DB por tenant.

Estas referencias pueden permanecer en entregables y ADRs históricos, pero no
describen la arquitectura vigente.
